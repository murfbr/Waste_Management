// src/pages/PaginaLancamento.jsx

import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, where, getDocs, documentId } from 'firebase/firestore';

import MessageBox from '../components/MessageBox';
import WasteForm from '../components/WasteForm';
import WasteRecordsList from '../components/WasteRecordsList';

export default function PaginaLancamento() {
  const { db, currentUser, appId, userProfile } = useContext(AuthContext);

  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [wasteRecords, setWasteRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [isRecordsVisible, setIsRecordsVisible] = useState(false);

  // NOVOS ESTADOS PARA GESTÃO DE HOTÉIS
  const [userAllowedHotels, setUserAllowedHotels] = useState([]); // Lista de objetos de hotel
  const [selectedHotelId, setSelectedHotelId] = useState('');   // ID do hotel selecionado para lançamento/visualização
  const [loadingUserHotels, setLoadingUserHotels] = useState(true);

  const showMessage = (msg, error = false) => {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => setMessage(''), 5000);
  };

  // EFEITO PARA CARREGAR OS DETALHES DOS HOTÉIS PERMITIDOS AO UTILIZADOR
  useEffect(() => {
    if (!db || !userProfile) {
      setLoadingUserHotels(false);
      setUserAllowedHotels([]);
      return;
    }

    const fetchUserHotels = async () => {
      setLoadingUserHotels(true);
      let hotelIdsToFetch = [];

      if (userProfile.role === 'master') {
        // Master tem acesso a todos os hotéis
        try {
          const hoteisQuery = query(collection(db, "hoteis"), where("ativo", "==", true));
          const querySnapshot = await getDocs(hoteisQuery);
          const todosHoteis = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setUserAllowedHotels(todosHoteis);
          if (todosHoteis.length > 0) {
            setSelectedHotelId(todosHoteis[0].id); // Seleciona o primeiro por defeito para o master
          }
        } catch (error) {
          console.error("Erro ao carregar todos os hotéis para master:", error);
          setUserAllowedHotels([]);
        }
      } else if (userProfile.hoteisPermitidos && userProfile.hoteisPermitidos.length > 0) {
        hotelIdsToFetch = userProfile.hoteisPermitidos;
        try {
          const hoteisQuery = query(collection(db, "hoteis"), where(documentId(), "in", hotelIdsToFetch), where("ativo", "==", true));
          const querySnapshot = await getDocs(hoteisQuery);
          const permittedHotelsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setUserAllowedHotels(permittedHotelsData);
          if (permittedHotelsData.length > 0) {
            setSelectedHotelId(permittedHotelsData[0].id); // Seleciona o primeiro hotel permitido por defeito
          }
        } catch (error) {
          console.error("Erro ao carregar hotéis permitidos:", error);
          setUserAllowedHotels([]);
        }
      } else {
        // Utilizador não é master e não tem hotéis permitidos
        setUserAllowedHotels([]);
      }
      setLoadingUserHotels(false);
    };

    fetchUserHotels();
  }, [db, userProfile]);


  // useEffect para buscar registos de resíduos, AGORA FILTRADOS PELO selectedHotelId
  useEffect(() => {
    if (!db || !currentUser || !userProfile || !selectedHotelId) { // Adicionado !selectedHotelId
      setLoadingRecords(false);
      setWasteRecords([]); // Limpa os registos se não houver hotel selecionado
      return;
    }
    
    const canViewRecords = ['master', 'gerente', 'operacional'].includes(userProfile.role);
    if (!canViewRecords) {
      setLoadingRecords(false);
      setWasteRecords([]);
      return;
    }

    setLoadingRecords(true);
    // Query AGORA FILTRA POR hotelId
    const wasteRecordsQuery = query(
      collection(db, `artifacts/${appId}/public/data/wasteRecords`),
      where("hotelId", "==", selectedHotelId), // FILTRO POR HOTEL
      // orderBy("timestamp", "desc") // Adicionar orderBy se tiver índice
    );

    const unsubscribe = onSnapshot(wasteRecordsQuery, (snapshot) => {
      const records = [];
      snapshot.forEach(doc => {
        records.push({ id: doc.id, ...doc.data() });
      });
      // Ordenação local, já que orderBy com timestamp pode exigir índice composto com hotelId
      records.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setWasteRecords(records);
      setLoadingRecords(false);
    }, (error) => {
      console.error("PAGINA LANCAMENTO - Erro ao buscar registos em tempo real:", error);
      showMessage('Erro ao carregar registos. Tente recarregar a página.', true);
      setLoadingRecords(false);
    });

    return () => unsubscribe();
  }, [db, currentUser, appId, userProfile, selectedHotelId]); // Adicionado selectedHotelId às dependências


  const handleAddWasteRecord = async (newRecordData) => {
    if (!currentUser || !userProfile || !['master', 'gerente', 'operacional'].includes(userProfile.role)) {
      showMessage('Você não tem permissão para registar resíduos.', true);
      return false;
    }
    if (!selectedHotelId) { // Verifica se um hotel está selecionado
        showMessage('Por favor, selecione um hotel para o lançamento.', true);
        return false;
    }

    try {
      await addDoc(collection(db, `artifacts/${appId}/public/data/wasteRecords`), {
        ...newRecordData,
        hotelId: selectedHotelId, // ADICIONADO hotelId ao registo
        timestamp: Date.now(),
        userId: currentUser.uid,
        userEmail: currentUser.email,
      });
      showMessage('Resíduo registado com sucesso!');
      return true; // WasteForm limpará os campos se isto for true
    } catch (error) {
      console.error('Erro ao registar resíduo:', error);
      showMessage('Erro ao registar resíduo. Tente novamente.', true);
      return false;
    }
  };

  const handleDeleteRecord = async (recordId) => {
    // ... (lógica inalterada, mas a lista já estará filtrada pelo hotel)
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
  if (loadingUserHotels) {
    return <div className="text-center text-gray-600 p-8">A carregar dados do hotel...</div>;
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
  if (userProfile.role !== 'master' && userAllowedHotels.length === 0) {
    return (
      <div className="text-center text-orange-600 p-8">
        Você não tem acesso a nenhum hotel para realizar lançamentos. Contacte o administrador.
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Lançamento de Pesagem</h1>
        {/* Dropdown para Seleção de Hotel */}
        {userAllowedHotels.length > 0 && (
          <div className="w-full sm:w-auto">
            <label htmlFor="hotelSelect" className="sr-only">Selecionar Hotel</label>
            <select
              id="hotelSelect"
              value={selectedHotelId}
              onChange={(e) => setSelectedHotelId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              {userAllowedHotels.map(hotel => (
                <option key={hotel.id} value={hotel.id}>
                  {hotel.nome} ({hotel.cidade || 'N/A'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      <MessageBox message={message} isError={isError} />

      {selectedHotelId ? (
        <>
          <div className="bg-white p-6 rounded-lg shadow">
            <WasteForm 
              onAddWaste={handleAddWasteRecord} 
              // Se o WasteForm precisar de saber o hotelId para algo (ex: buscar áreas específicas do hotel), passe-o
              // selectedHotelId={selectedHotelId} 
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
                Registos Recentes de: <span className="text-indigo-600">{userAllowedHotels.find(h => h.id === selectedHotelId)?.nome || 'Hotel Selecionado'}</span>
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
          {userProfile.role === 'master' && userAllowedHotels.length === 0 && !loadingUserHotels 
            ? "Nenhum hotel cadastrado no sistema. Adicione um hotel na área de administração."
            : "Por favor, selecione um hotel para continuar."
          }
        </div>
      )}
    </div>
  );
}
