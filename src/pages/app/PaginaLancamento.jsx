// src/pages/app/PaginaLancamento.jsx

import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import AuthContext from '../../context/AuthContext';
import { 
    collection, 
    addDoc, 
    deleteDoc, 
    doc, 
    query, 
    where, 
    getDocs, 
    documentId, 
    orderBy, 
    limit, 
    startAfter 
} from 'firebase/firestore';

import MessageBox from '../../components/app/MessageBox';
import WasteForm from '../../components/app/WasteForm';
import WasteRecordsList from '../../components/app/WasteRecordsList';

const REGISTOS_POR_PAGINA = 20; 

// --- MODAIS ---

const LogoutConfirmationModal = ({ isOpen, onCancel, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Confirmar Saída</h2>
        <p className="mb-6">Tem certeza de que deseja encerrar a sessão?</p>
        <div className="flex justify-end space-x-4">
          <button onClick={onCancel} className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300">Cancelar</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-md text-white bg-red-500 hover:bg-red-600">Sim, Sair</button>
        </div>
      </div>
    </div>
  );
};

// NOVO: Modal de Confirmação de Exclusão
const DeleteConfirmationModal = ({ isOpen, onCancel, onConfirm, record }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
        <h2 className="text-xl font-bold text-red-600 mb-4">Confirmar Exclusão</h2>
        <p className="mb-2">Tem certeza de que deseja excluir permanentemente este registo?</p>
        {record && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800 mb-6">
            <p><strong>Tipo:</strong> {record.wasteType} {record.wasteSubType ? `(${record.wasteSubType})` : ''}</p>
            <p><strong>Peso:</strong> {record.peso} kg</p>
            <p><strong>Data:</strong> {new Date(record.timestamp).toLocaleString('pt-BR')}</p>
          </div>
        )}
        <div className="flex justify-end space-x-4">
          <button onClick={onCancel} className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300">Cancelar</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700">Sim, Excluir</button>
        </div>
      </div>
    </div>
  );
};


export default function PaginaLancamento() {
  const { db, auth, currentUser, appId, userProfile } = useContext(AuthContext);
  const navigate = useNavigate();

  // Estados existentes
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [wasteRecords, setWasteRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false); 
  const [isRecordsVisible, setIsRecordsVisible] = useState(false);
  const [lastVisibleRecord, setLastVisibleRecord] = useState(null); 
  const [hasMoreRecords, setHasMoreRecords] = useState(false); 
  const [loadingMore, setLoadingMore] = useState(false);
  const [userAllowedClientes, setUserAllowedClientes] = useState([]);
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [selectedClienteData, setSelectedClienteData] = useState(null);
  const [loadingUserClientes, setLoadingUserClientes] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // NOVO: Estado para controlar o modal de exclusão e o registro a ser excluído
  const [recordToDelete, setRecordToDelete] = useState(null);

  const showMessage = (msg, error = false) => {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      showMessage('Erro ao tentar sair. Tente novamente.', true);
    }
  };

  // ... (useEffects para carregar clientes e registros permanecem os mesmos) ...
    // Carregar os detalhes dos CLIENTES permitidos ao utilizador
    useEffect(() => {
        if (!db || !userProfile) { 
          setLoadingUserClientes(false); 
          setUserAllowedClientes([]); 
          setSelectedClienteData(null); 
          return; 
        }
        const fetchUserClientes = async () => {
          setLoadingUserClientes(true); 
          let clienteIdsToFetch = []; 
          let loadedClientes = [];
          if (userProfile.role === 'master') {
            try {
              const q = query(collection(db, "clientes"), where("ativo", "==", true), orderBy("nome"));
              const querySnapshot = await getDocs(q);
              loadedClientes = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            } catch (e) { console.error("Erro ao carregar clientes (master):", e); }
          } else if (userProfile.clientesPermitidos?.length > 0) {
            clienteIdsToFetch = userProfile.clientesPermitidos;
            const CHUNK_SIZE = 30; 
            for (let i = 0; i < clienteIdsToFetch.length; i += CHUNK_SIZE) {
                const chunk = clienteIdsToFetch.slice(i, i + CHUNK_SIZE);
                if (chunk.length > 0) {
                    try {
                        const q = query(collection(db, "clientes"), where(documentId(), "in", chunk), where("ativo", "==", true), orderBy("nome"));
                        const querySnapshot = await getDocs(q);
                        loadedClientes.push(...querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })));
                    } catch (e) { console.error("Erro ao carregar clientes (gerente/operacional):", e); }
                }
            }
            loadedClientes.sort((a, b) => a.nome.localeCompare(b.nome));
          }
          setUserAllowedClientes(loadedClientes);
          if (loadedClientes.length > 0 && !selectedClienteId) {
            setSelectedClienteId(loadedClientes[0].id); 
          } else if (loadedClientes.length === 0) {
            setSelectedClienteId('');
          }
          setLoadingUserClientes(false);
        };
        fetchUserClientes();
      }, [db, userProfile]);
    
      useEffect(() => {
        if (selectedClienteId && userAllowedClientes.length > 0) {
          const cliente = userAllowedClientes.find(c => c.id === selectedClienteId);
          setSelectedClienteData(cliente || null);
        } else { 
          setSelectedClienteData(null); 
        }
      }, [selectedClienteId, userAllowedClientes]);
    
      const fetchInitialRecords = async () => {
        if (!db || !currentUser || !userProfile || !selectedClienteId) {
          setWasteRecords([]); setLoadingRecords(false); setHasMoreRecords(false); setLastVisibleRecord(null);
          return;
        }
        const canViewRecords = ['master', 'gerente', 'operacional'].includes(userProfile.role);
        if (!canViewRecords) {
          setWasteRecords([]); setLoadingRecords(false); setHasMoreRecords(false); setLastVisibleRecord(null);
          return;
        }
    
        setLoadingRecords(true);
        try {
          const firstBatchQuery = query(
            collection(db, `artifacts/${appId}/public/data/wasteRecords`),
            where("clienteId", "==", selectedClienteId),
            orderBy("timestamp", "desc"),
            limit(REGISTOS_POR_PAGINA)
          );
          const documentSnapshots = await getDocs(firstBatchQuery);
          const records = documentSnapshots.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
          
          setWasteRecords(records);
          setLastVisibleRecord(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
          setHasMoreRecords(documentSnapshots.docs.length === REGISTOS_POR_PAGINA);
    
        } catch (error) {
          console.error("PAGINA LANCAMENTO - Erro ao buscar registos iniciais:", error);
          showMessage('Erro ao carregar registos.', true);
          setWasteRecords([]);
          setHasMoreRecords(false);
        }
        setLoadingRecords(false);
      };
      
      useEffect(() => {
        if (selectedClienteId) { 
            fetchInitialRecords();
        } else { 
            setWasteRecords([]);
            setLoadingRecords(false);
            setHasMoreRecords(false);
            setLastVisibleRecord(null);
        }
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [selectedClienteId]);
    
      const carregarMaisRegistos = async () => {
        if (!lastVisibleRecord || !selectedClienteId || loadingMore) return; 
        setLoadingMore(true);
        try {
          const nextBatchQuery = query(
            collection(db, `artifacts/${appId}/public/data/wasteRecords`),
            where("clienteId", "==", selectedClienteId),
            orderBy("timestamp", "desc"),
            startAfter(lastVisibleRecord),
            limit(REGISTOS_POR_PAGINA)
          );
          const documentSnapshots = await getDocs(nextBatchQuery);
          const newRecords = documentSnapshots.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    
          setWasteRecords(prevRecords => [...prevRecords, ...newRecords]);
          setLastVisibleRecord(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
          setHasMoreRecords(documentSnapshots.docs.length === REGISTOS_POR_PAGINA);
    
        } catch (error) {
          console.error("PAGINA LANCAMENTO - Erro ao carregar mais registos:", error);
          showMessage('Erro ao carregar mais registos.', true);
        }
        setLoadingMore(false);
      };
    
      const handleAddWasteRecord = async (formDataFromWasteForm) => {
        if (!currentUser || !userProfile || !['master', 'gerente', 'operacional'].includes(userProfile.role)) { 
            showMessage("Ação não permitida.", true);
            return false; 
        }
        if (!selectedClienteId || !selectedClienteData) { 
            showMessage("Nenhum cliente selecionado para o lançamento.", true);
            return false; 
        }
        
        const contratosDoCliente = selectedClienteData.contratosColeta || [];
        const contratoAplicavel = contratosDoCliente.find(c => 
            c.tiposResiduoColetados?.includes(formDataFromWasteForm.wasteType)
        );
    
        if (!contratoAplicavel || !contratoAplicavel.empresaColetaId) {
            showMessage(`Nenhum contrato de coleta encontrado para o resíduo do tipo "${formDataFromWasteForm.wasteType}". Verifique o cadastro do cliente.`, true);
            return false;
        }
    
        try {
          const dadosParaSalvar = {
            ...formDataFromWasteForm, 
            clienteId: selectedClienteId, 
            empresaColetaId: contratoAplicavel.empresaColetaId,
            timestamp: Date.now(), 
            userId: currentUser.uid, 
            userEmail: currentUser.email,
          };
    
          await addDoc(collection(db, `artifacts/${appId}/public/data/wasteRecords`), dadosParaSalvar);
          
          showMessage('Resíduo registado com sucesso!');
          fetchInitialRecords(); 
          return true; 
        } catch (error) { 
            console.error("Erro ao adicionar registo de resíduo:", error);
            showMessage('Erro ao registar resíduo. Tente novamente.', true);
            return false; 
        }
      };
  // Função que abre o modal de exclusão
  const handleDeleteRequest = (record) => {
    setRecordToDelete(record);
  };

  // Função que confirma e executa a exclusão
  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;

    try {
      await deleteDoc(doc(db, `artifacts/${appId}/public/data/wasteRecords`, recordToDelete.id));
      showMessage('Registo excluído com sucesso!');
      setRecordToDelete(null); // Fecha o modal
      fetchInitialRecords(); // Atualiza a lista
    } catch (error) { 
      console.error("Erro ao excluir registo:", error);
      showMessage('Erro ao excluir registo. Tente novamente.', true);
      setRecordToDelete(null); // Fecha o modal mesmo em caso de erro
    }
  };

  const toggleRecordsVisibility = () => setIsRecordsVisible(!isRecordsVisible);
  // ... (verificações de loading e perfil permanecem as mesmas) ...
  if (loadingUserClientes && !userProfile) return <div className="text-center text-gray-600 p-8">A carregar dados...</div>;
  if (!userProfile && currentUser) return <div className="text-center text-gray-600 p-8">A carregar perfil...</div>;
  if (!userProfile || !['master', 'gerente', 'operacional'].includes(userProfile.role)) {
    return <div className="text-center text-red-600 p-8">Acesso Negado.</div>;
  }
  if (userProfile.role !== 'master' && userAllowedClientes.length === 0 && !loadingUserClientes) {
    return <div className="text-center text-orange-600 p-8">Sem acesso a clientes. Contacte o administrador.</div>;
  }
  if (userProfile.role === 'master' && userAllowedClientes.length === 0 && !loadingUserClientes) {
    return <div className="text-center text-orange-600 p-8">Nenhum cliente ativo cadastrado no sistema.</div>;
  }

  return (
    <div className="space-y-6">
      {/* O cabeçalho da página permanece o mesmo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-x-4 gap-y-2">
        <div className="flex items-center space-x-4 order-2 sm:order-1 justify-center sm:justify-start">
          {selectedClienteData && selectedClienteData.logoUrl && (
            <img 
              src={selectedClienteData.logoUrl} 
              alt={`Logo de ${selectedClienteData.nome || 'Cliente'}`} 
              className="h-12 w-12 object-contain rounded-md"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
          {selectedClienteData && (
            <span className="text-xl font-bold text-gray-700">{selectedClienteData.nome}</span>
          )}
        </div>
        <div className="text-center order-1 sm:order-2">
          <h1 className="text-3xl font-bold text-gray-800">Pesagem</h1>
        </div>
        <div className="flex justify-center sm:justify-end order-3">
            {userProfile.role === 'operacional' ? (
              <div className="flex items-center space-x-4">
                {userProfile && (
                  <span className="text-gray-700 font-medium text-right">
                    {userProfile.nome || currentUser.email}
                  </span>
                )}
                <button 
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="w-auto px-4 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 transition duration-150 flex-shrink-0"
                >
                  Sair
                </button>
              </div>
            ) : (
              <div className="w-full sm:w-auto sm:max-w-xs">
                {userAllowedClientes.length > 0 && (
                  <>
                    <label htmlFor="clienteSelectLancamento" className="sr-only">Selecionar Cliente</label>
                    <select 
                      id="clienteSelectLancamento" 
                      value={selectedClienteId} 
                      onChange={(e) => setSelectedClienteId(e.target.value)}
                      className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      disabled={loadingUserClientes}
                    >
                      {loadingUserClientes && <option value="">A carregar clientes...</option>}
                      {!loadingUserClientes && userAllowedClientes.length === 0 && <option value="">Nenhum cliente disponível</option>}
                      {!loadingUserClientes && userAllowedClientes.map(cliente => (
                        <option key={cliente.id} value={cliente.id}>
                          {cliente.nome} ({cliente.cidade || 'N/A'})
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            )}
        </div>
      </div>

      <MessageBox message={message} isError={isError} onClose={() => setMessage('')} />

      {/* O resto da página permanece o mesmo */}
      {loadingUserClientes && userAllowedClientes.length === 0 && (
          <div className="text-center text-gray-500 p-8">A carregar lista de clientes...</div>
      )}

      {!loadingUserClientes && selectedClienteId && selectedClienteData ? (
        <>
          <div className="bg-white p-6 rounded-lg shadow">
            <WasteForm 
                onAddWaste={handleAddWasteRecord} 
                clienteSelecionado={selectedClienteData} 
            />
          </div>
          <div className="bg-white rounded-lg shadow">
            <button 
              onClick={toggleRecordsVisibility} 
              className="w-full flex justify-between items-center p-6 text-left focus:outline-none"
              aria-expanded={isRecordsVisible} 
              aria-controls="waste-records-list-lancamento"
            >
              <h2 className="text-2xl font-semibold text-gray-700">
                Registos Recentes de: <span className="text-indigo-600">{selectedClienteData?.nome || 'Cliente Selecionado'}</span>
              </h2>
              <span className="text-2xl text-gray-600 transform transition-transform duration-200">{isRecordsVisible ? '▲' : '▼'}</span>
            </button>
            {isRecordsVisible && (
              <div id="waste-records-list-lancamento" className="p-6 border-t border-gray-200">
                <WasteRecordsList
                  records={wasteRecords}
                  loading={loadingRecords} 
                  onDelete={handleDeleteRequest} // Passa a nova função que abre o modal
                  userRole={userProfile ? userProfile.role : null}
                  hasMoreRecords={hasMoreRecords}
                  onLoadMore={carregarMaisRegistos}
                  loadingMore={loadingMore}
                  showMessage={showMessage}
                />
              </div>
            )}
          </div>
        </>
      ) : !loadingUserClientes && userAllowedClientes.length > 0 && !selectedClienteId ? (
         <div className="text-center text-gray-500 p-8">Por favor, selecione um cliente para continuar.</div>
      ) : null}

      {/* Renderiza os modais */}
      <LogoutConfirmationModal 
        isOpen={isLogoutModalOpen}
        onCancel={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
      />
      <DeleteConfirmationModal
        isOpen={!!recordToDelete}
        onCancel={() => setRecordToDelete(null)}
        onConfirm={handleConfirmDelete}
        record={recordToDelete}
      />
    </div>
  );
}
