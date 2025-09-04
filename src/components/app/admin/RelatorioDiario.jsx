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
      const transp = it.empresaColetaId
        ? empresasMap.get(it.empresaColetaId)?.nomeFantasia || "-"
        : "-";
      const key = `${dia}|${tipo}|${sub}|${transp}`;
      if (!acc.has(key)) acc.set(key, { dia, tipo, sub, transp, totalKg: 0 });
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
      const headers = ["Data", "Tipo", "Subtipo", "Transportador", "Total_kg"];
      const rows = (linhasInea || []).map((r) => [r.dia, r.tipo, r.sub, r.transp, Number(r.totalKg || 0).toFixed(2)]);
      const sheetName = (startDate || new Date().toISOString().slice(0, 10)).slice(0, 7);
      const uniqueTitle = `INEA_${clienteData.id}_${clienteData?.nome || "Cliente"}`;

      const payload = {
        token: sheetsWebAppToken || undefined,
        spreadsheetId: clienteData?.planilhaRelatorioDiarioId || null,
        sheetName,
        headers,
        rows,
        metadata: { title: uniqueTitle, clientId: clienteData.id, clientName: clienteData?.nome || "", periodStart: startDate, periodEnd: endDate },
      };

      const res = await fetch(sheetsWebAppUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));

      if (!data || data.ok !== true) {
        console.error("Sheets export error:", data);
        alert("Falha ao exportar para o Google Sheets.");
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