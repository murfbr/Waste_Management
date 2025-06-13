// src/pages/app/PaginaLancamento.jsx

import React, { useState, useEffect, useContext } from 'react';
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

// CAMINHOS CORRIGIDOS
import MessageBox from '../../components/app/MessageBox';
import WasteForm from '../../components/app/WasteForm';
import WasteRecordsList from '../../components/app/WasteRecordsList';

const REGISTOS_POR_PAGINA = 20; 

export default function PaginaLancamento() {
  const { db, currentUser, appId, userProfile } = useContext(AuthContext);

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

  const showMessage = (msg, error = false) => {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => setMessage(''), 5000);
  };

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
      } else if (userProfile.clientesPermitidos && userProfile.clientesPermitidos.length > 0) {
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
      if (loadedClientes.length > 0 && !selectedClienteId) { // Define o primeiro cliente apenas se nenhum estiver selecionado
        setSelectedClienteId(loadedClientes[0].id); 
      } else if (loadedClientes.length === 0) {
        setSelectedClienteId('');
      }
      setLoadingUserClientes(false);
    };
    fetchUserClientes();
  }, [db, userProfile]); // Removido selectedClienteId daqui para não re-buscar clientes desnecessariamente

  // Atualiza selectedClienteData quando selectedClienteId muda
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
  }, [selectedClienteId]); // Apenas re-busca registros quando o cliente muda

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
    try {
      await addDoc(collection(db, `artifacts/${appId}/public/data/wasteRecords`), {
        ...formDataFromWasteForm, 
        clienteId: selectedClienteId, 
        timestamp: Date.now(), 
        userId: currentUser.uid, 
        userEmail: currentUser.email,
      });
      showMessage('Resíduo registado com sucesso!');
      fetchInitialRecords(); 
      return true; 
    } catch (error) { 
        console.error("Erro ao adicionar registo de resíduo:", error);
        showMessage('Erro ao registar resíduo. Tente novamente.', true);
        return false; 
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (!currentUser || !userProfile || userProfile.role !== 'master') { 
        showMessage("Apenas administradores master podem excluir registos.", true);
        return; 
    }
    // Substituindo window.confirm por um modal/lógica futura se necessário
    // Por enquanto, o confirm é mantido para funcionalidade, mas deve ser trocado
    if (window.confirm('Tem certeza que deseja excluir este registo?')) {
      try {
        await deleteDoc(doc(db, `artifacts/${appId}/public/data/wasteRecords`, recordId));
        showMessage('Registo excluído com sucesso!');
        fetchInitialRecords(); 
      } catch (error) { 
        console.error("Erro ao excluir registo:", error);
        showMessage('Erro ao excluir registo. Tente novamente.', true);
      }
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="flex items-center space-x-3 mb-4 sm:mb-0">
          {selectedClienteData && selectedClienteData.logoUrl && (
            <img 
              src={selectedClienteData.logoUrl} 
              alt={`Logo de ${selectedClienteData.nome || 'Cliente'}`} 
              className="h-16 w-16 object-contain rounded-md"
              onError={(e) => { 
                console.error("Erro ao carregar imagem da logo:", selectedClienteData.logoUrl, e);
                e.target.style.display = 'none'; 
              }}
            />
          )}
          <h1 className="text-3xl font-bold text-gray-800">Lançamento de Pesagem</h1>
        </div>
        
        {userAllowedClientes.length > 0 && (
          <div className="w-full sm:w-auto sm:max-w-xs md:max-w-sm">
            <label htmlFor="clienteSelectLancamento" className="sr-only">Selecionar Cliente</label>
            <select 
              id="clienteSelectLancamento" 
              value={selectedClienteId} 
              onChange={(e) => setSelectedClienteId(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
          </div>
        )}
      </div>
      <MessageBox message={message} isError={isError} onClose={() => setMessage('')} />

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
                  onDelete={handleDeleteRecord}
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
    </div>
  );
}
