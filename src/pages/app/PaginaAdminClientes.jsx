import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../../context/AuthContext.jsx';
import { collection, onSnapshot, query, doc, updateDoc, deleteDoc, serverTimestamp, orderBy, writeBatch, addDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import MessageBox from '../../components/app/MessageBox.jsx';
import ClienteForm from '../../components/app/ClienteForm.jsx'; 
import TemplateManagerModal from '../../components/app/TemplateManagerModal.jsx';
import DeleteConfirmationModal from '../../components/app/DeleteConfirmationModal.jsx';
import ImportadorHistoricoCliente from '../../components/app/ImportadorHistoricoCliente.jsx';
import ExportarHistoricoCliente from '../../components/app/ExportarHistoricoCliente.jsx';
import { FaEdit, FaTrash, FaFileImport, FaDownload } from 'https://esm.sh/react-icons/fa';

export default function PaginaAdminClientes() {
  const { db, functions, appId, userProfile: masterProfile, currentUser: masterCurrentUser, refreshAllowedClientes } = useContext(AuthContext);

  const saveIneaCredentials = httpsCallable(functions, 'saveIneaCredentials');
  const testIneaConnection = httpsCallable(functions, 'testIneaConnection');
  const checkConfigFunction = httpsCallable(functions, 'checkConfig');

  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [empresasColetaDisponiveis, setEmpresasColetaDisponiveis] = useState([]);
  const [availableClientCategorias, setAvailableClientCategorias] = useState([]);
  const [selectedCategoriaFiltro, setSelectedCategoriaFiltro] = useState('');
  const [showForm, setShowForm] = useState(false); 
  const [editingClienteData, setEditingClienteData] = useState(null); 
  const [editingClienteId, setEditingClienteId] = useState(null); 
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [testConnectionStatus, setTestConnectionStatus] = useState({ loading: false, message: '', isError: false });
  const [configCheckResult, setConfigCheckResult] = useState(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [clientTemplates, setClientTemplates] = useState([]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clienteParaDeletar, setClienteParaDeletar] = useState(null);
  
  const [clienteParaImportar, setClienteParaImportar] = useState(null);
  const [clienteParaExportar, setClienteParaExportar] = useState(null);


  const showMessage = (msg, error = false, duration = 6000) => {
    setMessage(msg); setIsError(error);
    setTimeout(() => setMessage(''), duration);
  };
  
  const handleCheckConfig = async () => {
    setConfigCheckResult('Verificando...');
    try {
      const result = await checkConfigFunction();
      setConfigCheckResult(result.data.message);
    } catch (error) {
      console.error("Erro ao verificar configuração:", error);
      setConfigCheckResult(`Erro ao chamar a função: ${error.message}`);
    }
  };

  const handleTestConnection = async (clienteId) => {
    if (!clienteId) {
        showMessage("ID do cliente não encontrado. Salve o cliente primeiro.", true);
        return;
    }
    setTestConnectionStatus({ loading: true, message: 'A testar conexão...', isError: false });
    try {
        const result = await testIneaConnection({ clienteId });
        setTestConnectionStatus({ loading: false, message: result.data.message, isError: false });
    } catch (error) {
        console.error("Erro no teste de conexão:", error);
        setTestConnectionStatus({ loading: false, message: error.message, isError: true });
    }
  };

  useEffect(() => {
    if (!db) return; 
    setLoadingClientes(true);
    const q = query(collection(db, "clientes"), orderBy("nome"));
    const unsub = onSnapshot(q, (qs) => {
      const clientesData = qs.docs.map(d => ({ id: d.id, ...d.data() }));
      setClientes(clientesData);
      setLoadingClientes(false);
    }, (err) => { 
      console.error("Erro ao carregar clientes:", err); 
      showMessage("Erro ao carregar clientes.", true); 
      setLoadingClientes(false); 
    });
    return () => unsub();
  }, [db]);

  useEffect(() => {
    if (!db) return;
    const qE = query(collection(db, "empresasColeta"), orderBy("nomeFantasia"));
    const unsubE = onSnapshot(qE, (qs) => {
      setEmpresasColetaDisponiveis(qs.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Erro ao carregar empresas de coleta:", err));
    return () => unsubE();
  }, [db]);
  
  useEffect(() => {
    if (!db) return;
    const templatesCollection = collection(db, 'systemPresets/clientConfiguration/clientTemplates');
    const unsubscribe = onSnapshot(templatesCollection, (snapshot) => {
      const templatesData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setClientTemplates(templatesData);
    }, (error) => {
        console.error("Erro ao carregar modelos de cliente:", error);
        showMessage("Não foi possível carregar os modelos de cliente.", true);
    });
    return () => unsubscribe();
  }, [db]);

  useEffect(() => {
    const categoriasDosClientes = clientes
      .map(cliente => cliente.categoriaCliente)
      .filter(Boolean);
    const categoriasDosTemplates = clientTemplates
      .map(template => template.category)
      .filter(Boolean);
    const todasCategorias = Array.from(new Set([...categoriasDosClientes, ...categoriasDosTemplates]));
    setAvailableClientCategorias(todasCategorias.sort());
  }, [clientes, clientTemplates]);

  const handleNewCategoriaAdded = (novaCategoria) => {
    if (novaCategoria && !availableClientCategorias.includes(novaCategoria)) {
      setAvailableClientCategorias(prevCategorias => [...prevCategorias, novaCategoria].sort());
    }
  };

  const handleOpenCreateForm = () => { 
    setEditingClienteId(null); 
    setEditingClienteData(null); 
    setShowForm(true); 
    setClienteParaImportar(null); 
    setTestConnectionStatus({ loading: false, message: '', isError: false });
  };

  const handleEditCliente = (cliente) => { 
    setEditingClienteId(cliente.id); 
    setEditingClienteData(cliente); 
    setShowForm(true); 
    setClienteParaImportar(null); 
    setTestConnectionStatus({ loading: false, message: '', isError: false });
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };
  
  const handleCancelForm = () => { 
    setShowForm(false); 
  };
  
  const handleOpenDeleteModal = (cliente) => {
    setClienteParaDeletar(cliente);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setClienteParaDeletar(null);
    setIsDeleteModalOpen(false);
  };
  
  const handleOpenImportModal = (cliente) => {
    setClienteParaImportar(cliente);
  };
  
  const handleOpenExportModal = (cliente) => {
    setClienteParaExportar(cliente);
  };

  const handleConfirmDelete = async () => {
    if (!db || !masterProfile || masterProfile.role !== 'master' || !clienteParaDeletar) {
      showMessage("Ação não permitida ou cliente não selecionado.", true);
      return;
    }

    try {
      await deleteDoc(doc(db, "clientes", clienteParaDeletar.id));
      await refreshAllowedClientes();
      showMessage("Cliente excluído com sucesso!");
      if (editingClienteId === clienteParaDeletar.id) handleCancelForm();
    } catch (e) {
      console.error("Erro ao excluir cliente:", e);
      showMessage("Erro ao excluir cliente. Tente novamente.", true);
    } finally {
      handleCloseDeleteModal();
    }
  };

  const handleFormSubmit = async (formData) => {
    if (!db || !masterCurrentUser || !masterProfile || masterProfile.role !== 'master') {
      return showMessage("Ação não permitida.", true);
    }
    
    const { configINEA, ...clienteDataPrincipal } = formData;
    
    const configIneaToSave = { ...configINEA };
    delete configIneaToSave.ineaSenha;

    const clienteDataToSave = { 
      ...clienteDataPrincipal, 
      configINEA: configIneaToSave,
      ultimaModificacao: serverTimestamp(), 
      modificadoPor: masterCurrentUser.uid 
    };

    try {
      let clienteId = editingClienteId;
      if (editingClienteId) { 
        await updateDoc(doc(db, "clientes", editingClienteId), clienteDataToSave); 
        showMessage("Dados do cliente atualizados com sucesso!");
      } else { 
        clienteDataToSave.criadoPor = masterCurrentUser.uid; 
        clienteDataToSave.dataCriacao = serverTimestamp();
        const docRef = await addDoc(collection(db, "clientes"), clienteDataToSave); 
        clienteId = docRef.id;
        showMessage("Cliente adicionado com sucesso!");
      }

      await refreshAllowedClientes();

      if (clienteId && configINEA && configINEA.ineaSenha) {
        showMessage("Salvando credenciais da integração INEA...", false, 3000);
        await saveIneaCredentials({
          clienteId: clienteId,
          login: configINEA.ineaLogin,
          senha: configINEA.ineaSenha,
          codUnidade: configINEA.ineaCodigoDaUnidade,
        });
        showMessage("Credenciais INEA salvas com sucesso!", false);
      }

      handleCancelForm(); 
    } catch (e) { 
      console.error("Erro ao salvar cliente ou credenciais:", e); 
      showMessage(`Erro ao salvar: ${e.message}`, true); 
    }
  };
  
  if (!masterProfile && masterCurrentUser) return <div className="p-8 text-center">A carregar perfil...</div>;
  if (!masterProfile || masterProfile.role !== 'master') return <div className="p-8 text-center text-red-600">Acesso negado.</div>;

  const clientesFiltrados = selectedCategoriaFiltro 
    ? clientes.filter(cliente => cliente.categoriaCliente === selectedCategoriaFiltro)
    : clientes;

  return (
    <div className="space-y-8 font-comfortaa">
      <h1 className="text-3xl font-bold text-blue-coral font-lexend">Gerir Clientes</h1>
      
      <MessageBox message={message} isError={isError} onClose={() => setMessage('')} />

      {!showForm && (
        <div className="flex space-x-4 mb-6">
            <button
                onClick={handleOpenCreateForm}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md shadow-sm"
            >
                + Adicionar Novo Cliente
            </button>
            <button
                onClick={() => setIsTemplateModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-sm"
            >
                Gerenciar Modelos
            </button>
        </div>
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
          editingClienteId={editingClienteId}
          onTestConnection={handleTestConnection}
          testConnectionStatus={testConnectionStatus}
          clientTemplates={clientTemplates}
        />
      )}
      
      <TemplateManagerModal 
        db={db}
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
      />
      
      <ImportadorHistoricoCliente 
        isOpen={!!clienteParaImportar}
        cliente={clienteParaImportar}
        onClose={() => setClienteParaImportar(null)}
        onImportSuccess={(successMsg) => showMessage(successMsg, false)}
      />

      <ExportarHistoricoCliente
        isOpen={!!clienteParaExportar}
        cliente={clienteParaExportar}
        onClose={() => setClienteParaExportar(null)}
        empresasColeta={empresasColetaDisponiveis}
      />

      <div className="bg-white p-6 rounded-xl shadow-lg mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800 font-lexend">Clientes Cadastrados</h2>
            <div className="mt-4 sm:mt-0">
                <label htmlFor="filtro-categoria-cliente" className="sr-only">Filtrar por Categoria</label>
                <select
                    id="filtro-categoria-cliente"
                    value={selectedCategoriaFiltro}
                    onChange={(e) => setSelectedCategoriaFiltro(e.target.value)}
                    className="mt-1 block w-full sm:w-auto p-2 border border-gray-300 rounded-md shadow-sm"
                >
                    <option value="">Todas as Categorias</option>
                    {availableClientCategorias.map(categoria => (
                        <option key={categoria} value={categoria}>{categoria}</option>
                    ))}
                </select>
            </div>
        </div>

        {loadingClientes ? (<p>A carregar clientes...</p>) : clientesFiltrados.length === 0 ? (
            <p>Nenhum cliente cadastrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rede</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th> 
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clientesFiltrados.map((cliente) => (
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
                        <div className="flex justify-center items-center space-x-4">
                            <button onClick={() => handleEditCliente(cliente)} title="Editar Cliente" className="text-indigo-600 hover:text-indigo-900 transition-colors">
                                <FaEdit size={18} />
                            </button>
                            <button onClick={() => handleOpenDeleteModal(cliente)} title="Excluir Cliente" className="text-red-600 hover:text-red-900 transition-colors">
                                <FaTrash size={16} />
                            </button>
                            <button onClick={() => handleOpenImportModal(cliente)} title="Importar Histórico" className="text-gray-600 hover:text-gray-900 transition-colors">
                                <FaFileImport size={18} />
                            </button>
                            <button onClick={() => handleOpenExportModal(cliente)} title="Exportar Histórico" className="text-gray-600 hover:text-gray-900 transition-colors">
                                <FaDownload size={18} />
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

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        clienteNome={clienteParaDeletar?.nome}
      />
    </div>
  );
}

