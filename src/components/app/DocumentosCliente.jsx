import React, { useEffect, useState, useContext, useMemo } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import AuthContext from "../../context/AuthContext";

function toBRDate(ts) {
  if (!ts) return "-";
  try {
    const d = typeof ts === "number" ? new Date(ts) : new Date(ts);
    return d.toLocaleDateString("pt-BR");
  } catch {
    return "-";
  }
}
function toTimeStr(hhmm) {
  return hhmm || "-";
}

// Converte "YYYY-MM-DD" + "HH:MM" -> timestamp(ms)
function composeTimestamp(dateStr, timeStr) {
  const d = dateStr || "";
  const t = timeStr && timeStr.length > 0 ? timeStr : "00:00";
  return new Date(`${d}T${t}:00`).getTime();
}
// Decompõe timestamp(ms) -> {date, time}
function splitTimestamp(ms) {
  if (!ms) return { date: "", time: "" };
  const d = new Date(ms);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const HH = String(d.getHours()).padStart(2, "0");
  const MM = String(d.getMinutes()).padStart(2, "0");
  return { date: `${yyyy}-${mm}-${dd}`, time: `${HH}:${MM}` };
}

export default function DocumentosCliente({
  clienteId,
  clienteNome,
  empresasColeta = [],
}) {
  const { db, userProfile } = useContext(AuthContext);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  // modal state
  const [open, setOpen] = useState(false);
  const [modo, setModo] = useState("novo"); // 'novo' | 'editar'
  const [docEdit, setDocEdit] = useState(null); // doc selecionado no modo editar

  const [form, setForm] = useState({
    data: "",
    hora: "",
    pesoTotalKg: "",
    tipoResiduo: "",
    transportador: "",
    destinacao: "",
    mtrUrl: "",
    cdfUrl: "",
  });
  const [salvando, setSalvando] = useState(false);

  const transportadores = useMemo(
    () =>
      (empresasColeta || [])
        .map((e) => e?.nomeFantasia)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [empresasColeta]
  );

  // carrega lista em tempo real
  useEffect(() => {
    if (!db || !clienteId) {
      setDocs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, "documentosFiscais"),
      where("clienteId", "==", clienteId),
      orderBy("dataEmissao", "desc")
    );
    const unsub = onSnapshot(
      q,
      (qs) => {
        const rows = qs.docs.map((d) => ({ id: d.id, ...d.data() }));
        setDocs(rows);
        setLoading(false);
      },
      (err) => {
        console.error("Erro ao buscar documentos:", err);
        setDocs([]);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [db, clienteId]);

  const resetForm = () => {
    setForm({
      data: "",
      hora: "",
      pesoTotalKg: "",
      tipoResiduo: "",
      transportador: "",
      destinacao: "",
      mtrUrl: "",
      cdfUrl: "",
    });
    setDocEdit(null);
    setModo("novo");
  };

  const abrirNovo = () => {
    resetForm();
    setModo("novo");
    setOpen(true);
  };

  const abrirEditar = (row) => {
    const { date, time } = splitTimestamp(row.dataEmissao);
    setForm({
      data: date,
      hora: time,
      pesoTotalKg: String(row.pesoTotalKg ?? ""),
      tipoResiduo: row.tipoResiduo || "",
      transportador: row.transportador || "",
      destinacao: row.destinacao || "",
      mtrUrl: row.mtrUrl || "",
      cdfUrl: row.cdfUrl || "",
    });
    setDocEdit(row);
    setModo("editar");
    setOpen(true);
  };

  const handleSalvar = async () => {
    if (!db || !clienteId) return;

    // validações mínimas
    if (!form.data) {
      alert("Informe a data de emissão.");
      return;
    }
    if (!form.pesoTotalKg) {
      alert("Informe o peso total (kg).");
      return;
    }
    if (!form.mtrUrl) {
      alert("Cole a URL do PDF do MTR.");
      return;
    }

    // timestamp + peso
    const ts = composeTimestamp(form.data, form.hora);
    const peso = Number(String(form.pesoTotalKg).replace(",", "."));
    if (Number.isNaN(peso)) {
      alert("Peso total inválido.");
      return;
    }

    // Somente master pode gravar (suas rules já exigem isso)
    if (userProfile?.role !== "master") {
      alert("Somente administradores podem salvar MTRs.");
      return;
    }

    setSalvando(true);
    try {
      const payload = {
        clienteId,
        clienteNome: clienteNome || "",
        dataEmissao: ts,
        hora: form.hora || "",
        pesoTotalKg: peso,
        tipoResiduo: form.tipoResiduo || "",
        transportador: form.transportador || "",
        destinacao: form.destinacao || "",
        mtrUrl: form.mtrUrl,
        cdfUrl: form.cdfUrl || "",
      };

      if (modo === "novo") {
        await addDoc(collection(db, "documentosFiscais"), {
          ...payload,
          createdAt: serverTimestamp(),
          createdByRole: userProfile?.role || "",
          createdByUid: userProfile?.uid || "",
        });
      } else if (modo === "editar" && docEdit?.id) {
        await updateDoc(doc(db, "documentosFiscais", docEdit.id), payload);
      }

      setOpen(false);
      resetForm();
    } catch (e) {
      console.error("Falha ao salvar MTR:", e);
      alert("Falha ao salvar. Veja o console para detalhes.");
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (row) => {
    if (!db || !row?.id) return;
    if (userProfile?.role !== "master") {
      alert("Somente administradores podem excluir MTRs.");
      return;
    }
    const ok = window.confirm("Excluir este registro? Esta ação não pode ser desfeita.");
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "documentosFiscais", row.id));
    } catch (e) {
      console.error("Falha ao excluir:", e);
      alert("Falha ao excluir. Veja o console para detalhes.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          Histórico de Documentos para: {clienteNome || clienteId || "-"}
        </h2>

        {userProfile?.role === "master" && clienteId ? (
          <button
            onClick={abrirNovo}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700"
          >
            Anexar MTR emitido
          </button>
        ) : null}
      </div>

      <div className="overflow-x-auto border rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Data de Emissão do MTR
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Hora
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Peso Total (kg)
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Tipo de Resíduo
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Transportador
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Destinação
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                MTR
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                CDF
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="9" className="p-4 text-center">
                  Carregando...
                </td>
              </tr>
            ) : docs.length > 0 ? (
              docs.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-2 text-sm">{toBRDate(d.dataEmissao)}</td>
                  <td className="px-4 py-2 text-sm">{toTimeStr(d.hora)}</td>
                  <td className="px-4 py-2 text-sm">{d.pesoTotalKg}</td>
                  <td className="px-4 py-2 text-sm">{d.tipoResiduo || "-"}</td>
                  <td className="px-4 py-2 text-sm">{d.transportador || "-"}</td>
                  <td className="px-4 py-2 text-sm">{d.destinacao || "-"}</td>
                  <td className="px-4 py-2 text-sm">
                    {d.mtrUrl ? (
                      <a
                        href={d.mtrUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline"
                      >
                        Abrir
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {d.cdfUrl ? (
                      <a
                        href={d.cdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline"
                      >
                        Abrir
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm text-right">
                    {userProfile?.role === "master" ? (
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => abrirEditar(d)}
                          className="px-3 py-1 rounded-md bg-amber-500 text-white hover:bg-amber-600"
                          title="Editar"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleExcluir(d)}
                          className="px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700"
                          title="Excluir"
                        >
                          Excluir
                        </button>
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="p-4 text-center text-gray-500">
                  Nenhum documento encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal simples */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {modo === "editar" ? "Editar documento" : "Anexar MTR emitido"}
              </h3>
              <button
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Data de emissão *
                </label>
                <input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                  className="mt-1 p-2 border rounded-md w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Hora</label>
                <input
                  type="time"
                  value={form.hora}
                  onChange={(e) => setForm((f) => ({ ...f, hora: e.target.value }))}
                  className="mt-1 p-2 border rounded-md w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Peso total (kg) *
                </label>
                <input
                  type="text"
                  placeholder="Ex.: 123,45"
                  value={form.pesoTotalKg}
                  onChange={(e) => setForm((f) => ({ ...f, pesoTotalKg: e.target.value }))}
                  className="mt-1 p-2 border rounded-md w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tipo de resíduo
                </label>
                <input
                  type="text"
                  value={form.tipoResiduo}
                  onChange={(e) => setForm((f) => ({ ...f, tipoResiduo: e.target.value }))}
                  className="mt-1 p-2 border rounded-md w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Transportador
                </label>
                <input
                  list="transportadores"
                  placeholder="Selecione ou digite"
                  value={form.transportador}
                  onChange={(e) => setForm((f) => ({ ...f, transportador: e.target.value }))}
                  className="mt-1 p-2 border rounded-md w-full"
                />
                {transportadores.length > 0 && (
                  <datalist id="transportadores">
                    {transportadores.map((n) => (
                      <option key={n} value={n} />
                    ))}
                  </datalist>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Destinação</label>
                <input
                  type="text"
                  value={form.destinacao}
                  onChange={(e) => setForm((f) => ({ ...f, destinacao: e.target.value }))}
                  className="mt-1 p-2 border rounded-md w-full"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  URL do PDF do MTR *
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={form.mtrUrl}
                  onChange={(e) => setForm((f) => ({ ...f, mtrUrl: e.target.value }))}
                  className="mt-1 p-2 border rounded-md w-full"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  URL do PDF do CDF (opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={form.cdfUrl}
                  onChange={(e) => setForm((f) => ({ ...f, cdfUrl: e.target.value }))}
                  className="mt-1 p-2 border rounded-md w-full"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvar}
                disabled={salvando}
                className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 disabled:opacity-50"
              >
                {salvando ? (modo === "editar" ? "Atualizando..." : "Salvando...") : (modo === "editar" ? "Atualizar" : "Salvar")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
