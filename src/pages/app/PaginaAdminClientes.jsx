// src/pages/PaginaAdminClientes.jsx

import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../../context/AuthContext';
import { collection, addDoc, onSnapshot, query, doc, updateDoc, deleteDoc, serverTimestamp, orderBy, writeBatch } from 'firebase/firestore';
import MessageBox from '../../components/app/MessageBox';
import ClienteForm from '../../components/app/ClienteForm'; 
import Papa from 'papaparse';

// Categorias iniciais - pode ser movido para um arquivo de constantes se usado em mais lugares
const CATEGORIAS_CLIENTE_INICIAIS = ["Hotel", "Escola", "Condomínio", "Aeroporto"];

export default function PaginaAdminClientes() {
  const { db, appId, userProfile: masterProfile, currentUser: masterCurrentUser } = useContext(AuthContext);

  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  
  const [empresasColetaDisponiveis, setEmpresasColetaDisponiveis] = useState([]);
  
  // Estado para as categorias de cliente disponíveis para o formulário e filtro
  const [availableClientCategorias, setAvailableClientCategorias] = useState([...CATEGORIAS_CLIENTE_INICIAIS]);
  // Estado para o filtro de categoria na tabela
  const [selectedCategoriaFiltro, setSelectedCategoriaFiltro] = useState('');


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

  // Efeito para carregar clientes e extrair categorias únicas deles
  useEffect(() => {
    if (!db) return; 
    setLoadingClientes(true);
    const q = query(collection(db, "clientes"), orderBy("nome"));
    const unsub = onSnapshot(q, (qs) => {
      const clientesData = qs.docs.map(d => ({ id: d.id, ...d.data() }));
      setClientes(clientesData);
      
      // Extrai categorias únicas dos clientes carregados e mescla com as iniciais
      const categoriasDosClientes = clientesData
        .map(cliente => cliente.categoriaCliente)
        .filter(categoria => typeof categoria === 'string' && categoria.trim() !== '');
      
      setAvailableClientCategorias(prevCategorias => {
        const todasCategorias = Array.from(new Set([...CATEGORIAS_CLIENTE_INICIAIS, ...prevCategorias, ...categoriasDosClientes]));
        return todasCategorias.sort(); // Opcional: manter ordenado
      });

      setLoadingClientes(false);
    }, (err) => { 
      console.error("Erro ao carregar clientes:", err); 
      showMessage("Erro ao carregar clientes.", true); 
      setLoadingClientes(false); 
    });
    return () => unsub();
  }, [db]);

  useEffect(() => { /* Carregar Empresas */
    if (!db) return;
    const qE = query(collection(db, "empresasColeta"), orderBy("nomeFantasia"));
    const unsubE = onSnapshot(qE, (qs) => {
      setEmpresasColetaDisponiveis(qs.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Erro ao carregar empresas de coleta:", err));
    return () => unsubE();
  }, [db]);

  // Handler para quando uma nova categoria é adicionada através do ClienteForm
  const handleNewCategoriaAdded = (novaCategoria) => {
    if (novaCategoria && !availableClientCategorias.includes(novaCategoria)) {
      setAvailableClientCategorias(prevCategorias => {
        const novas = Array.from(new Set([...prevCategorias, novaCategoria]));
        return novas.sort(); // Opcional: manter ordenado
      });
    }
  };

  const handleOpenCreateForm = () => { 
    setEditingClienteId(null); 
    setEditingClienteData(null); 
    setShowForm(true); 
    setClienteParaImportar(null); 
  };
  const handleEditCliente = (cliente) => { 
    setEditingClienteId(cliente.id); 
    setEditingClienteData(cliente); 
    setShowForm(true); 
    setClienteParaImportar(null); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };
  const handleCancelForm = () => { 
    setShowForm(false); 
    setEditingClienteId(null); 
    setEditingClienteData(null);
  };
  
  const handleDeleteCliente = async (clienteId) => {
    if (!db || !masterProfile || masterProfile.role !== 'master') return showMessage("Ação não permitida.", true);
    // Substituir window.confirm por um modal customizado em produção
    if (window.confirm("Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita e removerá também os utilizadores associados.")) {
        try { 
          await deleteDoc(doc(db, "clientes", clienteId)); 
          showMessage("Cliente excluído com sucesso!"); 
          if (editingClienteId === clienteId) handleCancelForm();
        } catch (e) { 
          console.error("Erro ao excluir cliente:", e); 
          showMessage("Erro ao excluir cliente. Tente novamente.", true); 
        }
    }
  };

  const handleFormSubmit = async (formData) => {
    if (!db || !masterCurrentUser || !masterProfile || masterProfile.role !== 'master') return showMessage("Ação não permitida.", true);
    
    const clienteDataToSave = { 
      ...formData, 
      ultimaModificacao: serverTimestamp(), 
      modificadoPor: masterCurrentUser.uid 
    };

    // Se a categoria submetida for nova, adiciona à lista de availableClientCategorias
    if (formData.categoriaCliente && !availableClientCategorias.includes(formData.categoriaCliente)) {
        handleNewCategoriaAdded(formData.categoriaCliente);
    }

    try {
      if (editingClienteId) { 
        await updateDoc(doc(db, "clientes", editingClienteId), clienteDataToSave); 
        showMessage("Cliente atualizado com sucesso!");
      } else { 
        clienteDataToSave.criadoPor = masterCurrentUser.uid; 
        clienteDataToSave.dataCriacao = serverTimestamp();
        await addDoc(collection(db, "clientes"), clienteDataToSave); 
        showMessage("Cliente adicionado com sucesso!");
      }
      handleCancelForm(); 
    } catch (e) { 
      console.error("Erro ao salvar cliente:", e); 
      showMessage("Erro ao salvar cliente. Tente novamente.", true); 
    }
  };
  
  const handleFileChange = (event) => setImportFile(event.target.files[0]);
  const handleOpenImportModal = (cliente) => { 
    setClienteParaImportar(cliente); 
    setImportFile(null); 
    setShowForm(false); 
    setEditingClienteId(null); 
    setEditingClienteData(null); 
  };
  const handleCancelImport = () => { 
    setClienteParaImportar(null); 
    setImportFile(null); 
  };

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
            userId: masterCurrentUser.uid, userEmail: masterCurrentUser.email, importadoEm: serverTimestamp(), appId: appId || 'default-app-id'
          });
        });
        if (importErrors.length > 0) { showMessage(`Erros na importação:\n${importErrors.join('\n')}`, true, 15000); setIsImporting(false); return; }
        if (validRecords.length === 0) { showMessage("Nenhum registo válido encontrado no ficheiro CSV.", true); setIsImporting(false); return; }
        try {
          const batch = writeBatch(db);
          const recordsCollection = collection(db, `artifacts/${appId}/public/data/wasteRecords`);
          validRecords.forEach(record => { const newRecordRef = doc(recordsCollection); batch.set(newRecordRef, record); });
          await batch.commit();
          showMessage(`${validRecords.length} registos importados com sucesso para ${clienteParaImportar.nome}!`, false);
        } catch (error) { console.error("Erro ao salvar registos importados:", error); showMessage("Erro ao salvar os registos importados. Tente novamente.", true); }
        setIsImporting(false); setClienteParaImportar(null); setImportFile(null);
      },
      error: (error) => { console.error("Erro ao processar CSV:", error); showMessage(`Erro ao processar o ficheiro CSV: ${error.message}`, true); setIsImporting(false); }
    });
  };

  if (!masterProfile && masterCurrentUser) return <div className="p-8 text-center">A carregar perfil...</div>;
  if (!masterProfile || masterProfile.role !== 'master') return <div className="p-8 text-center text-red-600">Acesso negado.</div>;

  // Filtra os clientes com base na categoria selecionada
  const clientesFiltrados = selectedCategoriaFiltro 
    ? clientes.filter(cliente => cliente.categoriaCliente === selectedCategoriaFiltro)
    : clientes;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Gerir Clientes</h1>
      <MessageBox message={message} isError={isError} onClose={() => setMessage('')} />

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
          key={editingClienteId || 'new-cliente-form'} 
          initialData={editingClienteData}
          onSubmit={handleFormSubmit}
          onCancel={handleCancelForm}
          empresasColetaDisponiveis={empresasColetaDisponiveis}
          isEditing={!!editingClienteId}
          availableCategorias={availableClientCategorias}
          onNewCategoriaAdded={handleNewCategoriaAdded}
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
              <li>Formato da <strong>Data</strong>: DD/MM/YYYY ou YYYY-MM-DD.</li>
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
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">Clientes Cadastrados</h2>
            {/* Filtro de Categoria com Estilo Atualizado */}
            <div className="mt-4 sm:mt-0">
                <label htmlFor="filtro-categoria-cliente" className="sr-only">Filtrar por Categoria</label>
                <select
                    id="filtro-categoria-cliente"
                    value={selectedCategoriaFiltro}
                    onChange={(e) => setSelectedCategoriaFiltro(e.target.value)}
                    // Aplicando as classes de estilo solicitadas
                    className="mt-1 block w-full sm:w-auto p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                    <option value="">Todas as Categorias</option>
                    {availableClientCategorias.map(categoria => (
                        <option key={categoria} value={categoria}>{categoria}</option>
                    ))}
                </select>
            </div>
        </div>

        {loadingClientes ? (<p className="text-gray-600">A carregar clientes...</p>) : clientesFiltrados.length === 0 ? (
            <p className="text-gray-600">
                {selectedCategoriaFiltro ? `Nenhum cliente encontrado para a categoria "${selectedCategoriaFiltro}".` : "Nenhum cliente cadastrado."}
            </p>
        ) : (
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rede</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th> 
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clientesFiltrados.map((cliente) => ( // Usa clientesFiltrados aqui
                  <tr key={cliente.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-normal break-words text-sm font-medium text-gray-900">{cliente.nome}</td>
                    <td className="px-6 py-4 whitespace-normal break-words text-sm text-gray-500">{cliente.rede || '-'}</td>
                    <td className="px-6 py-4 whitespace-normal break-words text-sm text-gray-500">{cliente.categoriaCliente || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${cliente.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {cliente.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <button onClick={() => handleEditCliente(cliente)} className="text-indigo-600 hover:text-indigo-900 transition-colors duration-150">Editar</button>
                        <button onClick={() => handleDeleteCliente(cliente.id)} className="text-red-600 hover:text-red-900 transition-colors duration-150">Excluir</button> 
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
