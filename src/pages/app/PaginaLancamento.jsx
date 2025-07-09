// src/pages/app/PaginaLancamento.jsx

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import AuthContext from '../../context/AuthContext';
import { 
    collection, 
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
import { getPendingRecords, deletePendingRecord } from '../../services/offlineSyncService';

const REGISTOS_POR_PAGINA = 20; 

// --- MODAIS (Sem alterações) ---
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
  const { db, auth, currentUser, appId, userProfile, userAllowedClientes, loadingUserClientes } = useContext(AuthContext);
  const navigate = useNavigate();

  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [unifiedRecords, setUnifiedRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false); 
  const [isRecordsVisible, setIsRecordsVisible] = useState(false);
  const [lastVisibleFirestoreRecord, setLastVisibleFirestoreRecord] = useState(null); 
  const [hasMoreRecords, setHasMoreRecords] = useState(false); 
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [selectedClienteData, setSelectedClienteData] = useState(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
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
  
  useEffect(() => {
    if (!loadingUserClientes && userAllowedClientes.length > 0 && !selectedClienteId) {
        setSelectedClienteId(userAllowedClientes[0].id);
    }
  }, [loadingUserClientes, userAllowedClientes, selectedClienteId]);

  useEffect(() => {
    if (selectedClienteId && userAllowedClientes.length > 0) {
      const cliente = userAllowedClientes.find(c => c.id === selectedClienteId);
      setSelectedClienteData(cliente || null);
    } else { 
      setSelectedClienteData(null); 
    }
  }, [selectedClienteId, userAllowedClientes]);

  const loadAndCombineRecords = useCallback(async () => {
    if (!db || !currentUser || !userProfile || !selectedClienteId) {
      setUnifiedRecords([]); setLoadingRecords(false); setHasMoreRecords(false); setLastVisibleFirestoreRecord(null);
      return;
    }
    setLoadingRecords(true);
    try {
      const pendingRecords = await getPendingRecords();
      const pendingWithFlag = pendingRecords
        .filter(p => p.clienteId === selectedClienteId)
        .map(p => ({ ...p, id: p.localId, isPending: true }));

      const firestoreQuery = query(
        collection(db, `artifacts/${appId}/public/data/wasteRecords`),
        where("clienteId", "==", selectedClienteId),
        orderBy("timestamp", "desc"),
        limit(REGISTOS_POR_PAGINA)
      );
      const firestoreSnap = await getDocs(firestoreQuery);
      const firestoreRecords = firestoreSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

      const pendingLocalIds = new Set(pendingWithFlag.map(p => p.localId));
      const filteredFirestoreRecords = firestoreRecords.filter(f => !pendingLocalIds.has(f.localId));
      
      const combined = [...pendingWithFlag, ...filteredFirestoreRecords];
      combined.sort((a, b) => b.timestamp - a.timestamp);

      setUnifiedRecords(combined);
      setLastVisibleFirestoreRecord(firestoreSnap.docs[firestoreSnap.docs.length - 1]);
      setHasMoreRecords(firestoreSnap.docs.length === REGISTOS_POR_PAGINA);

    } catch (error) {
      console.error("PAGINA LANCAMENTO - Erro ao carregar e combinar registros:", error);
      showMessage('Erro ao carregar registos.', true);
      setUnifiedRecords([]);
      setHasMoreRecords(false);
    }
    setLoadingRecords(false);
  }, [db, currentUser, userProfile, selectedClienteId, appId]);
  
  useEffect(() => {
    if (selectedClienteId) { 
        loadAndCombineRecords();
    } else { 
        setUnifiedRecords([]);
        setLoadingRecords(false);
        setHasMoreRecords(false);
        setLastVisibleFirestoreRecord(null);
    }
  }, [selectedClienteId, loadAndCombineRecords]);

  useEffect(() => {
    // O evento agora é o 'pending-records-updated', que é mais genérico e confiável.
    // Ele é disparado tanto ao adicionar um novo item quanto após uma sincronização.
    window.addEventListener('pending-records-updated', loadAndCombineRecords);
    return () => window.removeEventListener('pending-records-updated', loadAndCombineRecords);
  }, [loadAndCombineRecords]);

  const carregarMaisRegistos = async () => {
    if (!lastVisibleFirestoreRecord || !selectedClienteId || loadingMore) return; 
    setLoadingMore(true);
    try {
      const nextBatchQuery = query(
        collection(db, `artifacts/${appId}/public/data/wasteRecords`),
        where("clienteId", "==", selectedClienteId),
        orderBy("timestamp", "desc"),
        startAfter(lastVisibleFirestoreRecord),
        limit(REGISTOS_POR_PAGINA)
      );
      const documentSnapshots = await getDocs(nextBatchQuery);
      const newRecords = documentSnapshots.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

      const pendingLocalIds = new Set(unifiedRecords.filter(r => r.isPending).map(p => p.localId));
      const filteredNewRecords = newRecords.filter(f => !pendingLocalIds.has(f.localId));
      
      setUnifiedRecords(prevRecords => [...prevRecords, ...filteredNewRecords]);
      setLastVisibleFirestoreRecord(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
      setHasMoreRecords(documentSnapshots.docs.length === REGISTOS_POR_PAGINA);

    } catch (error) {
      console.error("PAGINA LANCAMENTO - Erro ao carregar mais registos:", error);
      showMessage('Erro ao carregar mais registos.', true);
    }
    setLoadingMore(false);
  };

  const handleDeleteRequest = (record) => {
    setRecordToDelete(record);
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      if (recordToDelete.isPending) {
        await deletePendingRecord(recordToDelete.localId);
        showMessage('Registo pendente excluído com sucesso!');
      } else {
        await deleteDoc(doc(db, `artifacts/${appId}/public/data/wasteRecords`, recordToDelete.id));
        showMessage('Registo excluído com sucesso!');
      }
      setRecordToDelete(null); 
      // Não precisamos mais chamar loadAndCombineRecords aqui, pois o evento 'pending-records-updated'
      // disparado por deletePendingRecord já fará isso. Para exclusões do Firestore,
      // uma atualização manual é necessária.
      if (!recordToDelete.isPending) {
        loadAndCombineRecords();
      }
    } catch (error) { 
      console.error("Erro ao excluir registo:", error);
      showMessage('Erro ao excluir registo. Tente novamente.', true);
      setRecordToDelete(null);
    }
  };

  const toggleRecordsVisibility = () => setIsRecordsVisible(!isRecordsVisible);
  
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

      {loadingUserClientes && userAllowedClientes.length === 0 && (
          <div className="text-center text-gray-500 p-8">A carregar lista de clientes...</div>
      )}

      {!loadingUserClientes && selectedClienteId && selectedClienteData ? (
        <>
          <div className="bg-white p-6 rounded-lg shadow">
            <WasteForm 
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
                  records={unifiedRecords}
                  loading={loadingRecords} 
                  onDelete={handleDeleteRequest}
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
