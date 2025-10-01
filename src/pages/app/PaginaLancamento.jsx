// src/pages/app/PaginaLancamento.jsx

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import AuthContext from '../../context/AuthContext';
import { collection, deleteDoc, doc, query, where, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';

import MessageBox from '../../components/app/MessageBox';
import WasteForm from '../../components/app/WasteForm';
import WasteRecordsList from '../../components/app/WasteRecordsList';
import { getPendingRecords, deletePendingRecord, addPendingRecord } from '../../services/offlineSyncService';
import ConfirmationModal from '../../components/app/ConfirmationModal';
import SyncStatusIndicator from '../../components/app/SyncStatusIndicator';
import { exportToCsv } from '../../utils/csvExport';

const REGISTROS_POR_PAGINA = 10; 

export default function PaginaLancamento() {
  const { db, auth, currentUser, appId, userProfile, userAllowedClientes, loadingUserClientes } = useContext(AuthContext);
  const { t, i18n } = useTranslation('wasteRegister');
  const navigate = useNavigate();

  const localeMap = {
    pt: 'pt-BR',
    en: 'en-GB',
    es: 'es-ES',
  };
  const currentLocale = localeMap[i18n.language] || 'pt-BR';

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

  const [empresasColeta, setEmpresasColeta] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);

  const [formResetKey, setFormResetKey] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  
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
      showMessage(t('paginaLancamento.messages.logoutError'), true);
    }
  };
  
  const handleLogoutRequest = () => {
    setModalState({
        isOpen: true,
        title: t('paginaLancamento.logoutModal.title'),
        message: t('paginaLancamento.logoutModal.message'),
        confirmText: t('paginaLancamento.logoutModal.confirm'),
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

useEffect(() => {
  const fetchEmpresasColeta = async () => {
    if (!db) return;
    setLoadingEmpresas(true);
    try {
      const empresasRef = collection(db, 'empresasColeta');
      const q = query(empresasRef, where("ativo", "==", true));
      const querySnapshot = await getDocs(q);
      const listaEmpresas = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmpresasColeta(listaEmpresas);
    } catch (error) {
      console.error("Erro ao buscar empresas de coleta:", error);
      showMessage('Falha ao carregar os dados das empresas de coleta.', true);
    } finally {
      setLoadingEmpresas(false);
    }
  };

  fetchEmpresasColeta();
}, [db]);;


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
        limit(REGISTROS_POR_PAGINA)
      );
      const firestoreSnap = await getDocs(firestoreQuery);
      const firestoreRecords = firestoreSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

      const pendingLocalIds = new Set(pendingWithFlag.map(p => p.localId));
      const filteredFirestoreRecords = firestoreRecords.filter(f => !pendingLocalIds.has(f.localId));
      
      const combined = [...pendingWithFlag, ...filteredFirestoreRecords];
      combined.sort((a, b) => b.timestamp - a.timestamp);

      setUnifiedRecords(combined);
      setLastVisibleFirestoreRecord(firestoreSnap.docs[firestoreSnap.docs.length - 1]);
      setHasMoreRecords(firestoreSnap.docs.length === REGISTROS_POR_PAGINA);

    } catch (error) {
      console.error("PAGINA LANCAMENTO - Erro ao carregar e combinar registros:", error);
      showMessage(t('paginaLancamento.messages.loadError'), true);
      setUnifiedRecords([]);
      setHasMoreRecords(false);
    }
    setLoadingRecords(false);
  }, [db, currentUser, userProfile, selectedClienteId, appId, t]);
  
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

  const handleExportRequest = async (period, clienteNome) => {
    if (!selectedClienteId) {
        showMessage(t('paginaLancamento.messages.exportClientError'), true);
        return;
    }
    setIsExporting(true);
    try {
        const now = new Date();
        let startDate;

        switch (period) {
            case 'today':
                startDate = new Date(now.setHours(0, 0, 0, 0));
                break;
            case '7days':
                startDate = new Date(now.setDate(now.getDate() - 7));
                startDate.setHours(0, 0, 0, 0);
                break;
            case '30days':
                startDate = new Date(now.setDate(now.getDate() - 30));
                startDate.setHours(0, 0, 0, 0);
                break;
            default:
                startDate = new Date(now.setDate(now.getDate() - 7));
                startDate.setHours(0, 0, 0, 0);
        }

        const allPendingRecords = await getPendingRecords();
        const pendingRecordsInPeriod = allPendingRecords.filter(p => 
            p.clienteId === selectedClienteId && p.timestamp >= startDate.getTime()
        ).map(p => ({ ...p, id: p.localId, isPending: true }));

        const firestoreQuery = query(
            collection(db, `artifacts/${appId}/public/data/wasteRecords`),
            where("clienteId", "==", selectedClienteId),
            where("timestamp", ">=", startDate.getTime()),
            orderBy("timestamp", "desc")
        );
        const firestoreSnap = await getDocs(firestoreQuery);
        const firestoreRecords = firestoreSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

        const pendingLocalIds = new Set(pendingRecordsInPeriod.map(p => p.localId));
        const filteredFirestoreRecords = firestoreRecords.filter(f => !pendingLocalIds.has(f.localId));
        
        const combined = [...pendingRecordsInPeriod, ...filteredFirestoreRecords];
        combined.sort((a, b) => b.timestamp - a.timestamp);

        exportToCsv(combined, clienteNome, showMessage);

    } catch (error) {
        console.error("Erro ao gerar relatório CSV:", error);
        showMessage(t('paginaLancamento.messages.exportError'), true);
    } finally {
        setIsExporting(false);
    }
  };

  const carregarMaisRegistros = async () => {
    if (!lastVisibleFirestoreRecord || !selectedClienteId || loadingMore) return; 
    setLoadingMore(true);
    try {
      const nextBatchQuery = query(
        collection(db, `artifacts/${appId}/public/data/wasteRecords`),
        where("clienteId", "==", selectedClienteId),
        orderBy("timestamp", "desc"),
        startAfter(lastVisibleFirestoreRecord),
        limit(REGISTROS_POR_PAGINA)
      );
      const documentSnapshots = await getDocs(nextBatchQuery);
      const newRecords = documentSnapshots.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

      const pendingLocalIds = new Set(unifiedRecords.filter(r => r.isPending).map(p => p.localId));
      const filteredNewRecords = newRecords.filter(f => !pendingLocalIds.has(f.localId));
      
      setUnifiedRecords(prevRecords => [...prevRecords, ...filteredNewRecords]);
      setLastVisibleFirestoreRecord(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
      setHasMoreRecords(documentSnapshots.docs.length === REGISTROS_POR_PAGINA);

    } catch (error) {
      console.error("PAGINA LANCAMENTO - Erro ao carregar mais registros:", error);
      showMessage(t('paginaLancamento.messages.loadError'), true);
    }
    setLoadingMore(false);
  };

  const handleDeleteRequest = (record) => {
    setModalState({
        isOpen: true,
        title: t('paginaLancamento.deleteModal.title'),
        message: t('paginaLancamento.deleteModal.message'),
        confirmText: t('paginaLancamento.deleteModal.confirm'),
        theme: 'danger',
        onConfirm: () => handleConfirmDelete(record),
        content: (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800 mb-6 text-left">
                <p><strong>{t('paginaLancamento.deleteModal.itemType')}:</strong> {record.wasteType} {record.wasteSubType ? `(${record.wasteSubType})` : ''}</p>
                <p><strong>{t('paginaLancamento.deleteModal.itemWeight')}:</strong> {record.peso} kg</p>
                <p><strong>{t('paginaLancamento.deleteModal.itemDate')}:</strong> {new Date(record.timestamp).toLocaleString(currentLocale)}</p>
            </div>
        )
    });
  };

  const handleConfirmDelete = async (recordToDelete) => {
    if (!recordToDelete) return;
    try {
      if (recordToDelete.isPending) {
        await deletePendingRecord(recordToDelete.localId);
        showMessage(t('paginaLancamento.messages.pendingDeleted'));
      } else {
        await deleteDoc(doc(db, `artifacts/${appId}/public/data/wasteRecords`, recordToDelete.id));
        showMessage(t('paginaLancamento.messages.recordDeleted'));
      }
      if (!recordToDelete.isPending) {
        loadAndCombineRecords();
      }
    } catch (error) { 
      console.error("Erro ao excluir registro:", error);
      showMessage(t('paginaLancamento.messages.deleteError'), true);
    }
    setModalState({ isOpen: false });
  };

  const handleLimitExceeded = (data) => {
    const { peso, limite, wasteType } = data;
    setModalState({
        isOpen: true,
        title: t('paginaLancamento.limitModal.title'),
        message: t('paginaLancamento.limitModal.message'),
        confirmText: t('paginaLancamento.limitModal.confirm'),
        theme: 'warning',
        onConfirm: () => handleConfirmLimit(data),
        content: (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 mb-6 text-left">
                <div className="flex justify-between text-lg"><span className="font-medium text-gray-500">{t('paginaLancamento.limitModal.itemType')}:</span><span className="font-bold text-gray-900">{wasteType}</span></div>
                <div className="flex justify-between text-lg"><span className="font-medium text-gray-500">{t('paginaLancamento.limitModal.limit')}:</span><span className="font-bold text-gray-900">{limite} kg</span></div>
                <div className="flex justify-between text-2xl"><span className="font-medium text-gray-500">{t('paginaLancamento.limitModal.submitted')}:</span><span className="font-extrabold text-red-600">{peso} kg</span></div>
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
      loadAndCombineRecords(); 
      setFormResetKey(key => key + 1);
    } else {
      showMessage(result.message, true);
    }
    setModalState({ isOpen: false });
  };

  const toggleRecordsVisibility = () => setIsRecordsVisible(!isRecordsVisible);
  

  if (loadingUserClientes && !userProfile) return <div className="text-center text-gray-600 p-8">{t('paginaLancamento.loadingData')}</div>;
  if (!userProfile && currentUser) return <div className="text-center text-gray-600 p-8">{t('paginaLancamento.loadingProfile')}</div>;
  if (!userProfile || !['master', 'gerente', 'operacional'].includes(userProfile.role)) {
    return <div className="text-center text-red-600 p-8">{t('paginaLancamento.accessDenied')}</div>;
  }
  if (userProfile.role !== 'master' && userAllowedClientes.length === 0 && !loadingUserClientes) {
    return <div className="text-center text-orange-600 p-8">{t('paginaLancamento.noClientAccess')}</div>;
  }
  if (userProfile.role === 'master' && userAllowedClientes.length === 0 && !loadingUserClientes) {
    return <div className="text-center text-orange-600 p-8">{t('paginaLancamento.noClientsRegistered')}</div>;
  }

  return (
    <div className="space-y-6 font-comfortaa">
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
            <span className="text-xl font-lexend text-rich-soil">{selectedClienteData.nome}</span>
          )}
        </div>
        <div className="text-center order-1 sm:order-2">
          <h1 className="font-lexend text-subtitulo text-rain-forest">{t('paginaLancamento.title')}</h1>
        </div>
        <div className="flex justify-center sm:justify-end items-center order-3">
            {userProfile.role === 'operacional' ? (
              <div className="flex items-center space-x-4">
                <SyncStatusIndicator />
                {userProfile && (
                  <span className="text-rich-soil font-medium text-right">
                    {userProfile.nome || currentUser.email}
                  </span>
                )}
                <button 
                  onClick={handleLogoutRequest}
                  className="w-auto px-4 py-2 bg-apricot-orange text-white font-lexend rounded-lg shadow-md hover:opacity-90 transition duration-150 flex-shrink-0"
                >
                  {t('paginaLancamento.logoutButton')}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                 <SyncStatusIndicator />
                <div className="w-full sm:w-auto sm:max-w-xs">
                  {userAllowedClientes.length > 0 && (
                    <>
                      <label htmlFor="clienteSelectLancamento" className="sr-only">{t('paginaLancamento.selectClient')}</label>
                      <select 
                        id="clienteSelectLancamento" 
                        value={selectedClienteId} 
                        onChange={(e) => setSelectedClienteId(e.target.value)}
                        className="block w-full p-2 border border-early-frost rounded-md shadow-sm focus:ring-blue-coral focus:border-blue-coral font-comfortaa text-corpo"
                        disabled={loadingUserClientes}
                      >
                        {loadingUserClientes && <option value="">{t('paginaLancamento.loadingClients')}</option>}
                        {!loadingUserClientes && userAllowedClientes.length === 0 && <option value="">{t('paginaLancamento.noClientsAvailable')}</option>}
                        {!loadingUserClientes && userAllowedClientes.map(cliente => (
                          <option key={cliente.id} value={cliente.id}>
                            {cliente.nome} ({cliente.cidade || 'N/A'})
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
              </div>
            )}
        </div>
      </div>

      <MessageBox message={message} isError={isError} onClose={() => setMessage('')} />

      {loadingUserClientes && userAllowedClientes.length === 0 && (
          <div className="text-center text-rich-soil p-8">{t('paginaLancamento.loadingClientList')}</div>
      )}

      {!loadingUserClientes && selectedClienteId && selectedClienteData ? (
        <>
          <div className="bg-white p-6 rounded-lg shadow">
            <WasteForm 
                clienteSelecionado={selectedClienteData}
                empresasColetaDisponiveis={empresasColeta} 
                onLimitExceeded={handleLimitExceeded}
                onSuccessfulSubmit={loadAndCombineRecords}
                formResetKey={formResetKey}
            />
          </div>
          <div className="bg-white rounded-lg shadow">
            <button 
              onClick={toggleRecordsVisibility} 
              className="w-full flex justify-between items-center p-6 text-left focus:outline-none"
              aria-expanded={isRecordsVisible} 
              aria-controls="waste-records-list-lancamento"
            >
              <h2 className="font-lexend text-acao text-rain-forest">
                {t('paginaLancamento.recentRecords')} <span className="text-blue-coral">{selectedClienteData?.nome || ''}</span>
              </h2>
              <span className="text-2xl text-exotic-plume transform transition-transform duration-200">{isRecordsVisible ? '▲' : '▼'}</span>
            </button>
            {isRecordsVisible && (
              <div id="waste-records-list-lancamento" className="p-6 border-t border-early-frost">
                <WasteRecordsList
                  records={unifiedRecords}
                  loading={loadingRecords} 
                  onDelete={handleDeleteRequest}
                  userRole={userProfile ? userProfile.role : null}
                  hasMoreRecords={hasMoreRecords}
                  onLoadMore={carregarMaisRegistros}
                  loadingMore={loadingMore}
                  onExport={handleExportRequest}
                  isExporting={isExporting}
                  clienteNome={selectedClienteData?.nome}
                />
              </div>
            )}
          </div>
        </>
      ) : !loadingUserClientes && userAllowedClientes.length > 0 && !selectedClienteId ? (
         <div className="text-center text-rich-soil p-8">{t('paginaLancamento.pleaseSelectClient')}</div>
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