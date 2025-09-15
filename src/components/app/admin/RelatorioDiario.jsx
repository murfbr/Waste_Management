import React, { useMemo, useState, useContext } from "react";
import { sheetsWebAppUrl, sheetsWebAppToken } from "../../../firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import AuthContext from "../../../context/AuthContext";

function toLocalYMD(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString("sv-SE"); // YYYY-MM-DD
}

export default function RelatorioDiario({
  lancamentos,
  empresasColeta,
  clienteData,
  startDate,
  endDate,
}) {
  const { db } = useContext(AuthContext);
  const [exportandoSheets, setExportandoSheets] = useState(false);
  const [mensagemOk, setMensagemOk] = useState("");

  const empresasMap = useMemo(
    () => new Map((empresasColeta || []).map((e) => [e.id, e])),
    [empresasColeta]
  );

  const linhasInea = useMemo(() => {
    const acc = new Map();
    for (const it of lancamentos || []) {
      const dia = toLocalYMD(it.timestamp);
      const tipo = it.wasteType || "-";
      let sub = it.wasteSubType || "-";
      if (tipo === 'Orgânico') {
        sub = "-";
      }
      // +++ Adicionamos o ID da empresa de coleta diretamente na chave de agrupamento
      const empresaColetaId = it.empresaColetaId || 'N/A';
      const transp = empresasMap.get(empresaColetaId)?.nomeFantasia || "-";
      
      const key = `${dia}|${tipo}|${sub}|${empresaColetaId}`;
      
      if (!acc.has(key)) {
        // +++ Incluímos o ID no objeto para uso posterior
        acc.set(key, { dia, tipo, sub, transp, empresaColetaId, totalKg: 0 });
      }
      acc.get(key).totalKg += Number(it.peso) || 0;
    }
    return Array.from(acc.values()).sort((a, b) => {
      if (a.dia !== b.dia) return a.dia.localeCompare(b.dia);
      if (a.tipo !== b.tipo) return a.tipo.localeCompare(b.tipo);
      if (a.sub !== b.sub) return a.sub.localeCompare(b.sub);
      return (a.transp || "").localeCompare(b.transp || "");
    });
  }, [lancamentos, empresasMap]);

  const totalPeriodoKg = useMemo(
    () => (linhasInea || []).reduce((s, r) => s + r.totalKg, 0),
    [linhasInea]
  );

  const handleExportSheets = async () => {
    if (!sheetsWebAppUrl) { alert("A URL do Web App do Google Sheets não está configurada."); return; }
    if (!clienteData?.id) { alert("Selecione um cliente válido."); return; }

    setMensagemOk("");
    setExportandoSheets(true);
    try {
      // A lógica para criar a tabela de dados continua a mesma e está funcionando bem.
      const mapaModelosInea = new Map(
        (clienteData.mapeamentoInea || []).map(m => [`${m.tipoResiduoApp}|${m.empresaColetaId}`, m])
      );
      const headers = ["Data", "Tipo", "Subtipo", "Transportador", "Nº do Modelo INEA", "Nome do Modelo INEA", "Destinação Sugerida", "Total_kg"];
      const rows = (linhasInea || []).map((r) => {
        const modelo = mapaModelosInea.get(`${r.tipo}|${r.empresaColetaId}`) || {};
        const empresa = empresasMap.get(r.empresaColetaId);
        const destinosDaEmpresa = empresa?.destinacoes?.[r.tipo] || [];
        const destincaoSugerida = destinosDaEmpresa[0] || 'Não especificada';
        return [r.dia, r.tipo, r.sub, r.transp, modelo.numeroModeloInea || 'Não Mapeado', modelo.nomeModeloInea || 'Não Mapeado', destincaoSugerida, Number(r.totalKg || 0).toFixed(2)];
      });

      // --- NOVA LÓGICA AQUI ---
      // Montamos o painel de controle diretamente no frontend.
      const infoBlock = [
        ['Cliente:', clienteData.nome || ''],
        ['CNPJ:', clienteData.cnpj || 'Não informado'],
        ['Período do Relatório:', `${toLocalYMD(startDate)} a ${toLocalYMD(endDate)}`],
        ['', ''], // Espaçador
        ['Login INEA (CPF):', clienteData.configINEA?.ineaLogin || 'Não configurado'],
        ['Código da Unidade INEA:', clienteData.configINEA?.ineaCodigoDaUnidade || 'Não configurado'],
        ['Responsável pela Emissão:', clienteData.configINEA?.ineaResponsavel || 'Não configurado']
      ];

      const sheetName = (startDate || new Date().toISOString().slice(0, 10)).slice(0, 7);
      const uniqueTitle = `INEA_${clienteData.id}_${clienteData?.nome || "Cliente"}`;
      
      const payload = {
        token: sheetsWebAppToken || undefined,
        spreadsheetId: clienteData?.planilhaRelatorioDiarioId || null,
        sheetName,
        headers,
        rows,
        infoBlock: infoBlock, // Enviamos o painel já pronto.
        metadata: { 
          title: uniqueTitle,
        },
      };

      const res = await fetch(sheetsWebAppUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
      const data = await res.json().catch((err) => ({ ok: false, error: `Erro de parse: ${err}`}));

      if (!data || data.ok !== true) {
        console.error("Sheets export error:", data);
        alert(`Falha ao exportar para o Google Sheets. Erro: ${data.error}`);
        return;
      }

      setMensagemOk(`Totais exportados com sucesso para a aba ${data.sheetName}.`);
      if (db && data.spreadsheetId) {
        await updateDoc(doc(db, "clientes", clienteData.id), { planilhaRelatorioDiarioId: data.spreadsheetId });
      }
    } catch (err) {
      console.error(err);
      alert("Erro inesperado ao exportar para o Google Sheets.");
    } finally {
      setExportandoSheets(false);
    }
  };

  if (lancamentos.length === 0) {
    return null;
  }

  return (
    // ... O restante do JSX do componente permanece o mesmo ...
    <div className="mt-8 border-t border-gray-200 pt-6">
      <h3 className="text-lg font-lexend font-semibold text-gray-700">2. Totais para INEA</h3>
      <p className="text-sm text-gray-500 mb-4">Dados agrupados para preenchimento do MTR. Os subtipos de 'Orgânico' são consolidados.</p>
      
      {mensagemOk && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm">
          {mensagemOk}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr className="text-left">
              <th className="px-4 py-3 font-lexend uppercase tracking-wide text-rich-soil">Data</th>
              <th className="px-4 py-3 font-lexend uppercase tracking-wide text-rich-soil">Tipo</th>
              <th className="px-4 py-3 font-lexend uppercase tracking-wide text-rich-soil">Subtipo</th>
              <th className="px-4 py-3 font-lexend uppercase tracking-wide text-rich-soil">Transportador</th>
              <th className="px-4 py-3 font-lexend text-right uppercase tracking-wide text-rich-soil">Total (kg)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {linhasInea.map((r, idx) => (
              <tr key={`${r.dia}-${r.tipo}-${r.sub}-${r.transp}-${idx}`}>
                <td className="px-4 py-3">{r.dia}</td>
                <td className="px-4 py-3">{r.tipo}</td>
                <td className="px-4 py-3">{r.sub}</td>
                <td className="px-4 py-3">{r.transp}</td>
                <td className="px-4 py-3 text-right font-semibold">{String(r.totalKg.toFixed(2)).replace(".", ",")}</td>
              </tr>
            ))}
          </tbody>
          {linhasInea.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 font-bold">
                <td className="px-4 py-3 text-gray-800" colSpan={4}>Total do período</td>
                <td className="px-4 py-3 text-right text-gray-800">{String(totalPeriodoKg.toFixed(2)).replace(".", ",")}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="text-right mt-4">
        <button
          onClick={handleExportSheets}
          disabled={exportandoSheets}
          className="inline-flex items-center gap-2 rounded-xl bg-golden-orange px-4 py-2 text-white font-lexend text-sm shadow hover:opacity-90 disabled:opacity-60"
        >
          {exportandoSheets ? "Enviando..." : "Exportar Totais p/ Sheets (INEA)"}
        </button>
      </div>
    </div>
  );
}