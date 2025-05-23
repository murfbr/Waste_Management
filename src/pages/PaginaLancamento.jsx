// src/pages/PaginaLancamento.jsx

import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, where, getDocs, documentId, orderBy } from 'firebase/firestore';

import MessageBox from '../components/MessageBox';
import WasteForm from '../components/WasteForm'; // Este componente também precisará de atualizações
import WasteRecordsList from '../components/WasteRecordsList';

export default function PaginaLancamento() {
  const { db, currentUser, appId, userProfile } = useContext(AuthContext);

  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [wasteRecords, setWasteRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [isRecordsVisible, setIsRecordsVisible] = useState(false);

  const [userAllowedClientes, setUserAllowedClientes] = useState([]);
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [selectedClienteData, setSelectedClienteData] = useState(null); // Para guardar os dados completos do cliente selecionado
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
      setSelectedClienteData(null); // Limpa dados do cliente anterior
      let clienteIdsToFetch = [];
      let loadedClientes = [];

      if (userProfile.role === 'master') {
        try {
          const clientesQuery = query(collection(db, "clientes"), where("ativo", "==", true), orderBy("nome"));
          const querySnapshot = await getDocs(clientesQuery);
          loadedClientes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
          console.error("Erro ao carregar todos os clientes para master:", error);
        }
      } else if (userProfile.clientesPermitidos && userProfile.clientesPermitidos.length > 0) {
        clienteIdsToFetch = userProfile.clientesPermitidos;
        try {
          // Firestore 'in' query limit is 30 elements. For more, batch or redesign.
          // For now, assuming less than 30 permitted clients per user.
          if (clienteIdsToFetch.length > 0) {
            const clientesQuery = query(collection(db, "clientes"), where(documentId(), "in", clienteIdsToFetch), where("ativo", "==", true), orderBy("nome"));
            const querySnapshot = await getDocs(clientesQuery);
            loadedClientes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          }
        } catch (error) {
          console.error("Erro ao carregar clientes permitidos:", error);
        }
      }
      
      setUserAllowedClientes(loadedClientes);
      if (loadedClientes.length > 0) {
        setSelectedClienteId(loadedClientes[0].id); // Seleciona o primeiro por defeito
        setSelectedClienteData(loadedClientes[0]);
      } else {
        setSelectedClienteId('');
      }
      setLoadingUserClientes(false);
    };

    fetchUserClientes();
  }, [db, userProfile]);

  // Atualiza selectedClienteData quando selectedClienteId muda
  useEffect(() => {
    if (selectedClienteId && userAllowedClientes.length > 0) {
      const cliente = userAllowedClientes.find(c => c.id === selectedClienteId);
      setSelectedClienteData(cliente || null);
    } else {
      setSelectedClienteData(null);
    }
  }, [selectedClienteId, userAllowedClientes]);


  // Buscar registos de resíduos, filtrados pelo selectedClienteId
  useEffect(() => {
    if (!db || !currentUser || !userProfile || !selectedClienteId) {
      setLoadingRecords(false);
      setWasteRecords([]);
      return;
    }
    
    const canViewRecords = ['master', 'gerente', 'operacional'].includes(userProfile.role);
    if (!canViewRecords) {
      setLoadingRecords(false);
      setWasteRecords([]);
      return;
    }

    setLoadingRecords(true);
    const wasteRecordsQuery = query(
      collection(db, `artifacts/${appId}/public/data/wasteRecords`), // Mantendo este caminho para wasteRecords por agora
      where("clienteId", "==", selectedClienteId), // FILTRO POR CLIENTE
      orderBy("timestamp", "desc") // Adicionado orderBy
    );

    const unsubscribe = onSnapshot(wasteRecordsQuery, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWasteRecords(records);
      setLoadingRecords(false);
    }, (error) => {
      console.error("PAGINA LANCAMENTO - Erro ao buscar registos em tempo real:", error);
      showMessage('Erro ao carregar registos. Tente recarregar a página.', true);
      setLoadingRecords(false);
    });

    return () => unsubscribe();
  }, [db, currentUser, appId, userProfile, selectedClienteId]);


  const handleAddWasteRecord = async (formDataFromWasteForm) => {
    if (!currentUser || !userProfile || !['master', 'gerente', 'operacional'].includes(userProfile.role)) {
      showMessage('Você não tem permissão para registar resíduos.', true);
      return false;
    }
    if (!selectedClienteId || !selectedClienteData) {
        showMessage('Por favor, selecione um cliente para o lançamento.', true);
        return false;
    }
    // Validações que dependem do selectedClienteData (ex: área está nas áreas permitidas)
    // podem ser adicionadas aqui ou no WasteForm.

    try {
      await addDoc(collection(db, `artifacts/${appId}/public/data/wasteRecords`), {
        ...formDataFromWasteForm, // Contém areaLancamento, wasteType, peso
        clienteId: selectedClienteId, // ADICIONADO clienteId ao registo
        timestamp: Date.now(),
        userId: currentUser.uid,
        userEmail: currentUser.email,
      });
      showMessage('Resíduo registado com sucesso!');
      return true; 
    } catch (error) {
      console.error('Erro ao registar resíduo:', error);
      showMessage('Erro ao registar resíduo. Tente novamente.', true);
      return false;
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (!currentUser || !userProfile || userProfile.role !== 'master') {
      showMessage('Você não tem permissão para excluir registos.', true);
      return;
    }
    if (window.confirm('Tem certeza que deseja excluir este registo?')) {
      try {
        const recordRef = doc(db, `artifacts/${appId}/public/data/wasteRecords`, recordId);
        await deleteDoc(recordRef);
        showMessage('Registo excluído com sucesso!');
      } catch (error) { 
        console.error('Erro ao excluir registo:', error);
        showMessage('Erro ao excluir registo. Tente novamente.', true);
      }
    }
  };

  const toggleRecordsVisibility = () => {
    setIsRecordsVisible(!isRecordsVisible);
  };

  // Renderização de Loading ou Mensagens de Permissão
  if (loadingUserClientes) {
    return <div className="text-center text-gray-600 p-8">A carregar dados do cliente...</div>;
  }
  if (!userProfile && currentUser) {
    return <div className="text-center text-gray-600 p-8">A carregar perfil do utilizador...</div>;
  }
  if (!userProfile || !['master', 'gerente', 'operacional'].includes(userProfile.role)) {
    return (
      <div className="text-center text-red-600 p-8">
        Você não tem permissão para aceder à funcionalidade de Lançamento de Pesagem.
        {userProfile && ` (Seu nível: ${userProfile.role})`}
      </div>
    );
  }
  if (userProfile.role !== 'master' && userAllowedClientes.length === 0 && !loadingUserClientes) {
    return (
      <div className="text-center text-orange-600 p-8">
        Você não tem acesso a nenhum cliente para realizar lançamentos. Contacte o administrador.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Lançamento de Pesagem</h1>
        {userAllowedClientes.length > 0 && (
          <div className="w-full sm:w-auto sm:max-w-xs md:max-w-sm"> {/* Limitando a largura do select */}
            <label htmlFor="clienteSelect" className="sr-only">Selecionar Cliente</label>
            <select
              id="clienteSelect"
              value={selectedClienteId}
              onChange={(e) => setSelectedClienteId(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" // Usando estilo padrão
            >
              {userAllowedClientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome} ({cliente.cidade || 'N/A'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      <MessageBox message={message} isError={isError} />

      {selectedClienteId && selectedClienteData ? (
        <>
          <div className="bg-white p-6 rounded-lg shadow">
            <WasteForm 
              onAddWaste={handleAddWasteRecord} 
              // Passa os dados do cliente selecionado para o WasteForm
              clienteSelecionado={selectedClienteData} 
            />
          </div>

          <div className="bg-white rounded-lg shadow">
            <button
              onClick={toggleRecordsVisibility}
              className="w-full flex justify-between items-center p-6 text-left focus:outline-none"
              aria-expanded={isRecordsVisible}
              aria-controls="waste-records-list"
            >
              <h2 className="text-2xl font-semibold text-gray-700">
                Registos Recentes de: <span className="text-indigo-600">{selectedClienteData?.nome || 'Cliente Selecionado'}</span>
              </h2>
              <span className="text-2xl text-gray-600 transform transition-transform duration-200">
                {isRecordsVisible ? '▲' : '▼'}
              </span>
            </button>
            
            {isRecordsVisible && (
              <div id="waste-records-list" className="p-6 border-t border-gray-200">
                <WasteRecordsList
                  records={wasteRecords}
                  loading={loadingRecords}
                  onDelete={handleDeleteRecord}
                  userRole={userProfile ? userProfile.role : null}
                />
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center text-gray-500 p-8">
          { (userProfile.role === 'master' && userAllowedClientes.length === 0 && !loadingUserClientes) 
            ? "Nenhum cliente cadastrado no sistema. Adicione um cliente na área de administração."
            : "Por favor, selecione um cliente para continuar."
          }
        </div>
      )}
    </div>
  );
}
