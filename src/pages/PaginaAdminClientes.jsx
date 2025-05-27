// src/pages/PaginaAdminClientes.jsx

import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { collection, addDoc, onSnapshot, query, doc, updateDoc, deleteDoc, serverTimestamp, orderBy, writeBatch } from 'firebase/firestore';
import MessageBox from '../components/MessageBox';
import ClienteForm from '../components/ClienteForm'; 
import Papa from 'papaparse';

export default function PaginaAdminClientes() {
  const { db, appId, userProfile: masterProfile, currentUser: masterCurrentUser } = useContext(AuthContext);

  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  
  const [empresasColetaDisponiveis, setEmpresasColetaDisponiveis] = useState([]);
  
  const [showForm, setShowForm] = useState(false); 
  const [editingClienteData, setEditingClienteData] = useState(null); 
  const [editingClienteId, setEditingClienteId] = useState(null); 

  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [clienteParaImportar, setClienteParaImportar] = useState(null);

  const showMessage = (msg, error = false, duration = 6000) => {
    setMessage(msg); setIsError(error);
    setTimeout(() => setMessage(''), duration);
  };

  useEffect(() => { /* Carregar Clientes */
    if (!db) return; setLoadingClientes(true);
    const q = query(collection(db, "clientes"), orderBy("nome"));
    const unsub = onSnapshot(q, (qs) => {
      setClientes(qs.docs.map(d => ({ id: d.id, ...d.data() }))); setLoadingClientes(false);
    }, (err) => { console.error("Erro clientes:", err); showMessage("Erro clientes.", true); setLoadingClientes(false); });
    return () => unsub();
  }, [db]);

  useEffect(() => { /* Carregar Empresas */
    if (!db) return;
    const qE = query(collection(db, "empresasColeta"), orderBy("nomeFantasia"));
    const unsubE = onSnapshot(qE, (qs) => {
      setEmpresasColetaDisponiveis(qs.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Erro empresas:", err));
    return () => unsubE();
  }, [db]);

  const handleOpenCreateForm = () => { setEditingClienteId(null); setEditingClienteData(null); setShowForm(true); setClienteParaImportar(null); };
  const handleEditCliente = (cliente) => { setEditingClienteId(cliente.id); setEditingClienteData(cliente); setShowForm(true); setClienteParaImportar(null); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleCancelForm = () => { setShowForm(false); setEditingClienteId(null); setEditingClienteData(null);};
  
  const handleDeleteCliente = async (clienteId) => {
    if (!db || !masterProfile || masterProfile.role !== 'master') return showMessage("Ação não permitida.", true);
    if (window.confirm("Tem certeza que deseja excluir este cliente?")) {
        try { await deleteDoc(doc(db, "clientes", clienteId)); showMessage("Cliente excluído!"); if (editingClienteId === clienteId) handleCancelForm();
        } catch (e) { console.error("Erro excluir cliente:", e); showMessage("Erro excluir.", true); }
    }
  };

  const handleFormSubmit = async (formData) => {
    if (!db || !masterCurrentUser || !masterProfile || masterProfile.role !== 'master') return showMessage("Ação não permitida.", true);
    const clienteDataToSave = { ...formData, ultimaModificacao: serverTimestamp(), modificadoPor: masterCurrentUser.uid };
    try {
      if (editingClienteId) { 
        await updateDoc(doc(db, "clientes", editingClienteId), clienteDataToSave); showMessage("Cliente atualizado!");
      } else { 
        clienteDataToSave.criadoPor = masterCurrentUser.uid; clienteDataToSave.dataCriacao = serverTimestamp();
        await addDoc(collection(db, "clientes"), clienteDataToSave); showMessage("Cliente adicionado!");
      }
      handleCancelForm(); 
    } catch (e) { console.error("Erro salvar cliente:", e); showMessage("Erro ao salvar.", true); }
  };
  
  const handleFileChange = (event) => setImportFile(event.target.files[0]);
  const handleOpenImportModal = (cliente) => { setClienteParaImportar(cliente); setImportFile(null); setShowForm(false); setEditingClienteId(null); setEditingClienteData(null); };
  const handleCancelImport = () => { setClienteParaImportar(null); setImportFile(null); };
  const processAndImportCSV = async () => { 
    if (!importFile || !clienteParaImportar || !db || !masterCurrentUser || masterProfile?.role !== 'master') { 
      showMessage("Selecione cliente e ficheiro, ou permissão negada.", true); return; 
    }
    setIsImporting(true);
    Papa.parse(importFile, {
      header: true, skipEmptyLines: true,
      complete: async (results) => {
        const { data, errors: parseErrors } = results;
        let importErrors = []; let validRecords = [];
        if (parseErrors.length > 0) { parseErrors.forEach(err => importErrors.push(`Erro CSV linha ${err.row}: ${err.message}`));}
        data.forEach((row, index) => {
          const { Data, Area, TipoResiduo, Peso } = row;
          if (!Data || !Area || !TipoResiduo || !Peso) { importErrors.push(`Linha ${index + 2}: Dados obrigatórios em falta.`); return; }
          const pesoNum = parseFloat(String(Peso).replace(',', '.'));
          if (isNaN(pesoNum) || pesoNum <= 0) { importErrors.push(`Linha ${index + 2}: Peso inválido.`); return; }
          let timestamp;
          if (String(Data).includes('/')) { const p = String(Data).split('/'); if (p.length === 3) timestamp = new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0])).getTime();
          } else if (String(Data).includes('-')) { timestamp = new Date(Data).getTime(); }
          if (isNaN(timestamp)) { importErrors.push(`Linha ${index + 2}: Data inválida.`); return; }
          if (clienteParaImportar.areasPersonalizadas && !clienteParaImportar.areasPersonalizadas.includes(Area)) { importErrors.push(`Linha ${index + 2}: Área "${Area}" inválida para ${clienteParaImportar.nome}.`); return; }
          let vWT = false; const aCWT = [...(clienteParaImportar.categoriasPrincipaisResiduo || [])];
          if (clienteParaImportar.fazSeparacaoReciclaveisCompleta && clienteParaImportar.tiposReciclaveisPersonalizados) { aCWT.push(...clienteParaImportar.tiposReciclaveisPersonalizados); }
          if (aCWT.includes(TipoResiduo)) vWT = true;
          if (!vWT) { importErrors.push(`Linha ${index + 2}: TipoResiduo "${TipoResiduo}" inválido para ${clienteParaImportar.nome}.`); return; }
          validRecords.push({
            clienteId: clienteParaImportar.id, areaLancamento: Area, wasteType: TipoResiduo, peso: pesoNum, timestamp: timestamp,
            userId: masterCurrentUser.uid, userEmail: masterCurrentUser.email, importadoEm: serverTimestamp()
          });
        });
        if (importErrors.length > 0) { showMessage(`Erros:\n${importErrors.join('\n')}`, true, 15000); setIsImporting(false); return; }
        if (validRecords.length === 0) { showMessage("Nenhum registo válido no CSV.", true); setIsImporting(false); return; }
        try {
          const batch = writeBatch(db);
          const recordsCollection = collection(db, `artifacts/${appId}/public/data/wasteRecords`);
          validRecords.forEach(record => { const newRecordRef = doc(recordsCollection); batch.set(newRecordRef, record); });
          await batch.commit();
          showMessage(`${validRecords.length} registos importados para ${clienteParaImportar.nome}!`, false);
        } catch (error) { console.error("Erro ao salvar importados:", error); showMessage("Erro ao salvar.", true); }
        setIsImporting(false); setClienteParaImportar(null); setImportFile(null);
      },
      error: (error) => { console.error("Erro parse CSV:", error); showMessage(`Erro CSV: ${error.message}`, true); setIsImporting(false); }
    });
  };

  if (!masterProfile && masterCurrentUser) return <div className="p-8 text-center">A carregar perfil...</div>;
  if (!masterProfile || masterProfile.role !== 'master') return <div className="p-8 text-center text-red-600">Acesso negado.</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Gerir Clientes</h1>
      <MessageBox message={message} isError={isError} />

      {!showForm && !clienteParaImportar && (
        <button
          onClick={handleOpenCreateForm}
          className="mb-6 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          + Adicionar Novo Cliente
        </button>
      )}

      {showForm && (
        <ClienteForm
          key={editingClienteId || 'new'} 
          initialData={editingClienteData}
          onSubmit={handleFormSubmit}
          onCancel={handleCancelForm}
          empresasColetaDisponiveis={empresasColetaDisponiveis}
          isEditing={!!editingClienteId}
          // btnPrimaryClass e btnSecondaryClass foram removidas do ClienteForm
          // O ClienteForm agora estiliza os seus próprios botões com Tailwind direto
        />
      )}

      {clienteParaImportar && !showForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg mt-8 border border-blue-300">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Importar Histórico para: <span className="text-blue-600">{clienteParaImportar.nome}</span></h2>
          <div className="text-sm text-gray-600 mb-4 space-y-1">
            <p><strong>Instruções para o ficheiro CSV:</strong></p>
            <ul className="list-disc list-inside pl-4">
              <li>O ficheiro deve ser no formato CSV (valores separados por vírgula).</li>
              <li>A primeira linha deve ser o cabeçalho.</li>
              <li>Colunas obrigatórias (com estes nomes exatos no cabeçalho): <strong>Data</strong>, <strong>Area</strong>, <strong>TipoResiduo</strong>, <strong>Peso</strong>.</li>
              <li>Formato da <strong>Data</strong>: DD/MM/YYYY ou liturgi-MM-DD.</li>
              <li><strong>Area</strong>: Deve corresponder a uma das "Áreas Internas" configuradas para este cliente.</li>
              <li><strong>TipoResiduo</strong>: Deve corresponder a uma das "Categorias Principais" ou "Sub-tipos de Recicláveis" configurados para este cliente.</li>
              <li><strong>Peso</strong>: Número (ex: 10.5 ou 10,5).</li>
            </ul>
          </div>
          <div className="flex items-center space-x-3">
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange} 
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <button 
              onClick={processAndImportCSV} 
              disabled={!importFile || isImporting}
              className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isImporting ? "A Importar..." : "Importar Ficheiro"}
            </button>
            <button 
              onClick={handleCancelImport}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-lg mt-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Clientes Cadastrados</h2>
        {loadingClientes ? (<p>A carregar clientes...</p>) : clientes.length === 0 ? (<p>Nenhum cliente cadastrado.</p>) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 table-fixed">
              <colgroup>
                <col className="w-2/6" />
                <col className="w-1/6" />
                <col className="w-1/6" />
                <col className="w-1/6" />
                <col className="w-auto" /> 
              </colgroup>
              <thead>
                <tr>
                  <th className="th-table text-left uppercase tracking-wider">Nome</th>
                  <th className="th-table text-left uppercase tracking-wider">Rede</th>
                  <th className="th-table text-left uppercase tracking-wider">Categoria</th>
                  <th className="th-table text-left uppercase tracking-wider">Status</th>
                  <th className="th-table text-center normal-case tracking-normal">Ações</th> 
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td className="td-table font-medium text-gray-900 break-words">{cliente.nome}</td>
                    <td className="td-table break-words">{cliente.rede || '-'}</td>
                    <td className="td-table break-words">{cliente.categoriaCliente || '-'}</td>
                    <td className="td-table">
                      <span className={`status-badge ${cliente.ativo ? 'status-active' : 'status-inactive'}`}>
                        {cliente.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="td-table text-center px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex justify-center items-center space-x-2">
                        <button onClick={() => handleEditCliente(cliente)} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium hover:underline">Editar</button>
                        <button onClick={() => handleDeleteCliente(cliente.id)} className="text-red-600 hover:text-red-700 text-sm font-medium hover:underline">Excluir</button> 
                        <button 
                          onClick={() => handleOpenImportModal(cliente)} 
                          className="px-2 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          title="Importar histórico de lançamentos para este cliente"
                        >
                          Importar Hist.
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
