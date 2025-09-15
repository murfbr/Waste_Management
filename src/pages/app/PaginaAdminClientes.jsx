// src/pages/app/PaginaAdminClientes.jsx

import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../../context/AuthContext.jsx';
import { collection, onSnapshot, query, doc, updateDoc, deleteDoc, serverTimestamp, orderBy, addDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import MessageBox from '../../components/app/MessageBox.jsx';
import ClienteForm from '../../components/app/ClienteForm.jsx';
import TemplateManagerModal from '../../components/app/TemplateManagerModal.jsx';
import DeleteConfirmationModal from '../../components/app/DeleteConfirmationModal.jsx';
import ImportadorHistoricoCliente from '../../components/app/ImportadorHistoricoCliente.jsx';

export default function PaginaAdminClientes() {
  const { db, functions, userProfile: masterProfile, currentUser: masterCurrentUser, refreshAllowedClientes } = useContext(AuthContext);

  const saveIneaCredentials = httpsCallable(functions, 'saveIneaCredentials');
  const testIneaConnection = httpsCallable(functions, 'testIneaConnection');

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
  const [clienteParaImportar, setClienteParaImportar] = useState(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [clientTemplates, setClientTemplates] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clienteParaDeletar, setClienteParaDeletar] = useState(null);

  const showMessage = (msg, error = false, duration = 6000) => {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => setMessage(''), duration);
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
    const categoriasDosClientes = clientes.map(c => c.categoriaCliente).filter(Boolean);
    const categoriasDosTemplates = clientTemplates.map(t => t.category).filter(Boolean);
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
  };

  const handleEditCliente = (cliente) => {
    setEditingClienteId(cliente.id);
    setEditingClienteData(cliente);
    setShowForm(true);
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
        await saveIneaCredentials({ clienteId, login: configINEA.ineaLogin, senha: configINEA.ineaSenha, codUnidade: configINEA.ineaCodigoDaUnidade });
        showMessage("Credenciais INEA salvas com sucesso!", false);
      }
      handleCancelForm();
    } catch (e) {
      console.error("Erro ao salvar cliente ou credenciais:", e);
      showMessage(`Erro ao salvar: ${e.message}`, true);
    }
  };

  const handleOpenImportModal = (cliente) => {
    setClienteParaImportar(cliente);
  };
  const handleCloseImportModal = () => {
    setClienteParaImportar(null);
  };

  if (!masterProfile && masterCurrentUser) return <div className="p-8 text-center font-comfortaa">A carregar perfil...</div>;
  if (!masterProfile || masterProfile.role !== 'master') return <div className="p-8 text-center text-red-600 font-comfortaa">Acesso negado.</div>;

  const clientesFiltrados = selectedCategoriaFiltro
    ? clientes.filter(cliente => cliente.categoriaCliente === selectedCategoriaFiltro)
    : clientes;

  return (
    <div className="space-y-8 font-comfortaa">
      <h1 className="text-titulo font-lexend text-blue-coral">Gerir Clientes</h1>
      
      <MessageBox message={message} isError={isError} onClose={() => setMessage('')} />

      {!showForm && (
        <div className="flex space-x-4 mb-6">
            <button
                onClick={handleOpenCreateForm}
                className="px-4 py-2 bg-rain-forest hover:opacity-90 text-white font-semibold rounded-md shadow-sm font-lexend"
            >
                + Adicionar Novo Cliente
            </button>
            <button
                onClick={() => setIsTemplateModalOpen(true)}
                className="px-4 py-2 bg-blue-coral hover:opacity-90 text-white font-semibold rounded-md shadow-sm font-lexend"
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
        onClose={handleCloseImportModal}
        onImportSuccess={(successMsg) => showMessage(successMsg, false)}
      />

      <div className="bg-white p-6 rounded-xl shadow-lg mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
            <h2 className="text-subtitulo font-lexend text-blue-coral">Clientes Cadastrados</h2>
            <div className="mt-4 sm:mt-0">
                <select
                    id="filtro-categoria-cliente"
                    value={selectedCategoriaFiltro}
                    onChange={(e) => setSelectedCategoriaFiltro(e.target.value)}
                    className="mt-1 block w-full sm:w-auto p-2 border border-early-frost rounded-md shadow-sm"
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-lexend">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-lexend">Rede</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-lexend">Categoria</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-lexend">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider font-lexend">Ações</th> 
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-normal break-words text-sm font-medium text-gray-900">{cliente.nome}</td>
                    <td className="px-6 py-4 whitespace-normal break-words text-sm text-gray-500">{cliente.rede || '-'}</td>
                    <td className="px-6 py-4 whitespace-normal break-words text-sm text-gray-500">{cliente.categoriaCliente || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${cliente.ativo ? 'bg-green-100 text-abundant-green' : 'bg-red-100 text-red-800'}`}>
                        {cliente.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                      <div className="flex justify-center items-center space-x-4">
                        <button onClick={() => handleEditCliente(cliente)} className="font-semibold text-gray-600 hover:text-golden-orange">Editar</button>
                        <button onClick={() => handleOpenDeleteModal(cliente)} className="font-semibold text-gray-600 hover:text-red-600">Excluir</button> 
                        <button 
                          onClick={() => handleOpenImportModal(cliente)} 
                          className="font-semibold text-gray-600 hover:text-apricot-orange"
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

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        clienteNome={clienteParaDeletar?.nome}
      />
    </div>
  );
}