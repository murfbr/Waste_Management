// src/pages/PaginaLancamento.jsx

import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { 
    collection, 
    addDoc, 
    onSnapshot, // Manteremos onSnapshot para atualizações em tempo real dos primeiros N, ou mudar para getDocs para paginação simples
    deleteDoc, 
    doc, 
    query, 
    where, 
    getDocs, 
    documentId, 
    orderBy, 
    limit, // Para limitar o número de documentos
    startAfter // Para paginação
} from 'firebase/firestore';

import MessageBox from '../components/MessageBox';
import WasteForm from '../components/WasteForm';
import WasteRecordsList from '../components/WasteRecordsList';

const REGISTOS_POR_PAGINA = 20; // Define quantos registos carregar de cada vez

export default function PaginaLancamento() {
  const { db, currentUser, appId, userProfile } = useContext(AuthContext);

  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  
  const [wasteRecords, setWasteRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false); // Inicialmente false
  const [isRecordsVisible, setIsRecordsVisible] = useState(false);

  // Estados para paginação
  const [lastVisibleRecord, setLastVisibleRecord] = useState(null); // Último documento da busca anterior
  const [hasMoreRecords, setHasMoreRecords] = useState(false); // Se há mais registos para carregar
  const [loadingMore, setLoadingMore] = useState(false); // Loading para o botão "Carregar Mais"

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
    // ... (lógica de carregar clientes inalterada) ...
    if (!db || !userProfile) { setLoadingUserClientes(false); setUserAllowedClientes([]); setSelectedClienteData(null); return; }
    const fetchUserClientes = async () => {
      setLoadingUserClientes(true); setSelectedClienteData(null); let clienteIdsToFetch = []; let loadedClientes = [];
      if (userProfile.role === 'master') {
        try {
          const q = query(collection(db, "clientes"), where("ativo", "==", true), orderBy("nome"));
          loadedClientes = (await getDocs(q)).docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) { console.error("Erro master clientes:", e); }
      } else if (userProfile.clientesPermitidos && userProfile.clientesPermitidos.length > 0) {
        clienteIdsToFetch = userProfile.clientesPermitidos;
        try {
          if (clienteIdsToFetch.length > 0) {
            const q = query(collection(db, "clientes"), where(documentId(), "in", clienteIdsToFetch), where("ativo", "==", true), orderBy("nome"));
            loadedClientes = (await getDocs(q)).docs.map(doc => ({ id: doc.id, ...doc.data() }));
          }
        } catch (e) { console.error("Erro gerente/op clientes:", e); }
      }
      setUserAllowedClientes(loadedClientes);
      if (loadedClientes.length > 0) { setSelectedClienteId(loadedClientes[0].id); setSelectedClienteData(loadedClientes[0]); }
      else { setSelectedClienteId(''); }
      setLoadingUserClientes(false);
    };
    fetchUserClientes();
  }, [db, userProfile]);

  // Atualiza selectedClienteData quando selectedClienteId muda
  useEffect(() => {
    // ... (lógica inalterada) ...
    if (selectedClienteId && userAllowedClientes.length > 0) {
      const cliente = userAllowedClientes.find(c => c.id === selectedClienteId);
      setSelectedClienteData(cliente || null);
    } else { setSelectedClienteData(null); }
  }, [selectedClienteId, userAllowedClientes]);

  // Função para buscar os registos iniciais (ou quando o cliente muda)
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
      const records = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
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
  
  // useEffect para buscar registos iniciais quando selectedClienteId muda
  useEffect(() => {
    fetchInitialRecords();
  }, [selectedClienteId, db, currentUser, userProfile, appId]); // Adicionado db, currentUser, userProfile, appId como dependências

  // Função para carregar mais registos
  const carregarMaisRegistos = async () => {
    if (!lastVisibleRecord || !selectedClienteId) return;
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
      const newRecords = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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
    // ... (lógica inalterada, mas após adicionar, pode querer recarregar os registos iniciais)
    if (!currentUser || !userProfile || !['master', 'gerente', 'operacional'].includes(userProfile.role)) { /* ... */ return false; }
    if (!selectedClienteId || !selectedClienteData) { /* ... */ return false; }
    try {
      await addDoc(collection(db, `artifacts/${appId}/public/data/wasteRecords`), {
        ...formDataFromWasteForm, clienteId: selectedClienteId, timestamp: Date.now(),
        userId: currentUser.uid, userEmail: currentUser.email,
      });
      showMessage('Resíduo registado com sucesso!');
      fetchInitialRecords(); // Recarrega a primeira página para mostrar o novo registo no topo
      return true; 
    } catch (error) { /* ... */ return false; }
  };

  const handleDeleteRecord = async (recordId) => {
    // ... (lógica inalterada, mas após excluir, pode querer recarregar)
    if (!currentUser || !userProfile || userProfile.role !== 'master') { /* ... */ return; }
    if (window.confirm('Tem certeza que deseja excluir este registo?')) {
      try {
        await deleteDoc(doc(db, `artifacts/${appId}/public/data/wasteRecords`, recordId));
        showMessage('Registo excluído com sucesso!');
        // Recarrega para refletir a exclusão. Poderia ser mais otimizado removendo do estado local.
        fetchInitialRecords(); 
      } catch (error) { /* ... */ }
    }
  };

  const toggleRecordsVisibility = () => setIsRecordsVisible(!isRecordsVisible);

  // ... (lógica de renderização de loading e permissões inalterada) ...
  if (loadingUserClientes) return <div className="text-center text-gray-600 p-8">A carregar dados do cliente...</div>;
  if (!userProfile && currentUser) return <div className="text-center text-gray-600 p-8">A carregar perfil...</div>;
  if (!userProfile || !['master', 'gerente', 'operacional'].includes(userProfile.role)) {
    return <div className="text-center text-red-600 p-8">Acesso Negado.</div>;
  }
  if (userProfile.role !== 'master' && userAllowedClientes.length === 0 && !loadingUserClientes) {
    return <div className="text-center text-orange-600 p-8">Sem acesso a clientes.</div>;
  }

  return (
    <div className="space-y-6">
      {/* ... (JSX do título e dropdown de cliente inalterado) ... */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Lançamento de Pesagem</h1>
        {userAllowedClientes.length > 0 && (
          <div className="w-full sm:w-auto sm:max-w-xs md:max-w-sm">
            <label htmlFor="clienteSelect" className="sr-only">Selecionar Cliente</label>
            <select id="clienteSelect" value={selectedClienteId} onChange={(e) => setSelectedClienteId(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              {userAllowedClientes.map(cliente => (<option key={cliente.id} value={cliente.id}>{cliente.nome} ({cliente.cidade || 'N/A'})</option>))}
            </select>
          </div>
        )}
      </div>
      <MessageBox message={message} isError={isError} />

      {selectedClienteId && selectedClienteData ? (
        <>
          <div className="bg-white p-6 rounded-lg shadow">
            <WasteForm onAddWaste={handleAddWasteRecord} clienteSelecionado={selectedClienteData} />
          </div>
          <div className="bg-white rounded-lg shadow">
            <button onClick={toggleRecordsVisibility} className="w-full flex justify-between items-center p-6 text-left focus:outline-none"
              aria-expanded={isRecordsVisible} aria-controls="waste-records-list">
              <h2 className="text-2xl font-semibold text-gray-700">
                Registos Recentes de: <span className="text-indigo-600">{selectedClienteData?.nome || 'Cliente Selecionado'}</span>
              </h2>
              <span className="text-2xl text-gray-600 transform transition-transform duration-200">{isRecordsVisible ? '▲' : '▼'}</span>
            </button>
            {isRecordsVisible && (
              <div id="waste-records-list" className="p-6 border-t border-gray-200">
                <WasteRecordsList
                  records={wasteRecords}
                  loading={loadingRecords} // Passa o loading principal para a lista
                  onDelete={handleDeleteRecord}
                  userRole={userProfile ? userProfile.role : null}
                  // Novas props para paginação
                  hasMoreRecords={hasMoreRecords}
                  onLoadMore={carregarMaisRegistos}
                  loadingMore={loadingMore}
                  showMessage={showMessage}
                />
              </div>
            )}
          </div>
        </>
      ) : ( /* ... (JSX de fallback inalterado) ... */
        <div className="text-center text-gray-500 p-8">
          { (userProfile.role === 'master' && userAllowedClientes.length === 0 && !loadingUserClientes) 
            ? "Nenhum cliente cadastrado no sistema."
            : "Por favor, selecione um cliente para continuar."
          }
        </div>
      )}
    </div>
  );
}
