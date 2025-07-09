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
import { getPendingRecords, deletePendingRecord, addPendingRecord } from '../../services/offlineSyncService';
import ConfirmationModal from '../../components/app/ConfirmationModal';

const REGISTOS_POR_PAGINA = 20; 

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
  
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    theme: 'info',
    onConfirm: () => {},
    content: null,
  });

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
  
  const handleLogoutRequest = () => {
    setModalState({
        isOpen: true,
        title: 'Confirmar Saída',
        message: 'Tem certeza de que deseja encerrar a sessão?',
        confirmText: 'Sim, Sair',
        theme: 'danger',
        onConfirm: () => {
            handleLogout();
            setModalState({ isOpen: false });
        },
        content: null,
    });
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
    setModalState({
        isOpen: true,
        title: 'Confirmar Exclusão',
        message: 'Tem certeza de que deseja excluir permanentemente este registo?',
        confirmText: 'Sim, Excluir',
        theme: 'danger',
        onConfirm: () => handleConfirmDelete(record),
        content: (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800 mb-6 text-left">
                <p><strong>Tipo:</strong> {record.wasteType} {record.wasteSubType ? `(${record.wasteSubType})` : ''}</p>
                <p><strong>Peso:</strong> {record.peso} kg</p>
                <p><strong>Data:</strong> {new Date(record.timestamp).toLocaleString('pt-BR')}</p>
            </div>
        )
    });
  };

  const handleConfirmDelete = async (recordToDelete) => {
    if (!recordToDelete) return;
    try {
      if (recordToDelete.isPending) {
        await deletePendingRecord(recordToDelete.localId);
        showMessage('Registo pendente excluído com sucesso!');
      } else {
        await deleteDoc(doc(db, `artifacts/${appId}/public/data/wasteRecords`, recordToDelete.id));
        showMessage('Registo excluído com sucesso!');
      }
      if (!recordToDelete.isPending) {
        loadAndCombineRecords();
      }
    } catch (error) { 
      console.error("Erro ao excluir registo:", error);
      showMessage('Erro ao excluir registo. Tente novamente.', true);
    }
    setModalState({ isOpen: false });
  };

  const handleLimitExceeded = (data) => {
    const { peso, limite, wasteType } = data;
    setModalState({
        isOpen: true,
        title: 'Atenção: Limite Máximo Excedido',
        message: 'O peso lançado está acima do limite configurado. Deseja confirmar mesmo assim?',
        confirmText: 'Confirmar Mesmo Assim',
        theme: 'warning',
        onConfirm: () => handleConfirmLimit(data),
        content: (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 mb-6 text-left">
                <div className="flex justify-between text-lg"><span className="font-medium text-gray-500">Tipo:</span><span className="font-bold text-gray-900">{wasteType}</span></div>
                <div className="flex justify-between text-lg"><span className="font-medium text-gray-500">Limite:</span><span className="font-bold text-gray-900">{limite} kg</span></div>
                <div className="flex justify-between text-2xl"><span className="font-medium text-gray-500">Lançado:</span><span className="font-extrabold text-red-600">{peso} kg</span></div>
            </div>
        )
    });
  };

  const handleMinimumLimitExceeded = (data) => {
    const { peso, wasteType } = data;
    setModalState({
        isOpen: true,
        title: 'Atenção: Lançamento Baixo',
        message: 'Lançamentos abaixo de 1kg podem indicar um erro de digitação. Deseja confirmar mesmo assim?',
        confirmText: 'Confirmar Mesmo Assim',
        theme: 'warning',
        onConfirm: () => handleConfirmLimit(data),
        content: (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 mb-6 text-left">
                <div className="flex justify-between text-lg"><span className="font-medium text-gray-500">Tipo:</span><span className="font-bold text-gray-900">{wasteType}</span></div>
                <div className="flex justify-between text-2xl"><span className="font-medium text-gray-500">Lançado:</span><span className="font-extrabold text-yellow-600">{peso} kg</span></div>
            </div>
        )
    });
  };

  const handleConfirmLimit = async (limitModalData) => {
    if (!limitModalData) return;
    const { limite, ...recordData } = limitModalData;
    const result = await addPendingRecord(recordData);
    if (result.success) {
      showMessage(result.message);
    } else {
      showMessage(result.message, true);
    }
    setModalState({ isOpen: false });
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
                  onClick={handleLogoutRequest}
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
                onLimitExceeded={handleLimitExceeded}
                onMinimumLimitExceeded={handleMinimumLimitExceeded}
                onSuccessfulSubmit={loadAndCombineRecords}
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

      <ConfirmationModal
        isOpen={modalState.isOpen}
        onCancel={() => setModalState({ isOpen: false })}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        theme={modalState.theme}
      >
        {modalState.content}
      </ConfirmationModal>
    </div>
  );
}
