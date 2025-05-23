// src/pages/PaginaDashboard.jsx

import React, { useContext, useEffect, useState } from 'react';
import AuthContext from '../context/AuthContext';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { collection, onSnapshot, query, where, getDocs, documentId } from 'firebase/firestore';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AA336A', '#3D9140', '#FF5733', '#8333FF'];

const processDataForWasteTypeChart = (records) => {
  if (!records || records.length === 0) return [];
  const counts = records.reduce((acc, record) => {
    const type = record.wasteType || 'Não especificado';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
};

const processDataForHotelAreaChart = (records) => {
  if (!records || records.length === 0) return [];
  const counts = records.reduce((acc, record) => {
    const area = record.area || 'Não especificado';
    acc[area] = (acc[area] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
};


export default function PaginaDashboard() {
  const { userProfile, db, appId, currentUser } = useContext(AuthContext);
  
  const [wasteRecords, setWasteRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  // Estados para seleção de hotel (AGORA UM ARRAY DE IDs)
  const [userAllowedHotels, setUserAllowedHotels] = useState([]);
  const [selectedHotelIds, setSelectedHotelIds] = useState([]); 
  const [loadingUserHotels, setLoadingUserHotels] = useState(true);
  const [selectAllToggle, setSelectAllToggle] = useState(true); // Para o checkbox "Selecionar Todos"

  // Carregar hotéis permitidos/todos os hotéis
  useEffect(() => {
    if (!db || !userProfile) {
      setLoadingUserHotels(false);
      setUserAllowedHotels([]);
      setSelectedHotelIds([]);
      return;
    }

    const fetchUserHotels = async () => {
      setLoadingUserHotels(true);
      let loadedHotels = [];
      try {
        if (userProfile.role === 'master') {
          const hoteisQuery = query(collection(db, "hoteis"), where("ativo", "==", true));
          const querySnapshot = await getDocs(hoteisQuery);
          loadedHotels = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } else if (userProfile.hoteisPermitidos && userProfile.hoteisPermitidos.length > 0) {
          const hoteisQuery = query(collection(db, "hoteis"), where(documentId(), "in", userProfile.hoteisPermitidos), where("ativo", "==", true));
          const querySnapshot = await getDocs(hoteisQuery);
          loadedHotels = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        
        setUserAllowedHotels(loadedHotels);
        // Por padrão, seleciona todos os hotéis carregados
        setSelectedHotelIds(loadedHotels.map(h => h.id));
        setSelectAllToggle(true); // Assume que todos estão selecionados inicialmente

      } catch (error) {
        console.error("Erro ao carregar hotéis para dashboard:", error);
        setUserAllowedHotels([]);
        setSelectedHotelIds([]);
      }
      setLoadingUserHotels(false);
    };

    fetchUserHotels();
  }, [db, userProfile]);

  // Buscar os registos de resíduos com base nos hotéis selecionados
  useEffect(() => {
    if (!db || !currentUser || !userProfile || loadingUserHotels) { 
      setLoadingRecords(false);
      setWasteRecords([]);
      return;
    }

    if (selectedHotelIds.length === 0) { // Se nenhum hotel estiver selecionado
        setLoadingRecords(false);
        setWasteRecords([]);
        return;
    }

    setLoadingRecords(true);
    let wasteRecordsQuery;

    // Query agora usa 'in' para múltiplos IDs
    wasteRecordsQuery = query(
      collection(db, `artifacts/${appId}/public/data/wasteRecords`),
      where("hotelId", "in", selectedHotelIds)
    );
    
    const unsubscribe = onSnapshot(wasteRecordsQuery, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWasteRecords(records);
      setLoadingRecords(false);
    }, (error) => {
      console.error("Erro ao buscar registos para dashboard:", error);
      setWasteRecords([]); 
      setLoadingRecords(false);
    });

    return () => unsubscribe();
  }, [db, currentUser, appId, userProfile, selectedHotelIds, loadingUserHotels]);


  const handleHotelSelectionChange = (hotelId) => {
    setSelectedHotelIds(prevSelected => {
      const newSelection = prevSelected.includes(hotelId)
        ? prevSelected.filter(id => id !== hotelId)
        : [...prevSelected, hotelId];
      
      // Atualiza o estado do checkbox "Selecionar Todos"
      if (newSelection.length === userAllowedHotels.length) {
        setSelectAllToggle(true);
      } else {
        setSelectAllToggle(false);
      }
      return newSelection;
    });
  };

  const handleSelectAllToggleChange = () => {
    const newToggleState = !selectAllToggle;
    setSelectAllToggle(newToggleState);
    if (newToggleState) {
      setSelectedHotelIds(userAllowedHotels.map(h => h.id));
    } else {
      setSelectedHotelIds([]);
    }
  };


  const wasteTypeData = processDataForWasteTypeChart(wasteRecords);
  const hotelAreaData = processDataForHotelAreaChart(wasteRecords);

  // Lógica de renderização de loading e permissões
  if (loadingUserHotels) {
    return <div className="text-center text-gray-600 p-8">A carregar dados dos hotéis...</div>;
  }
  if (!userProfile && currentUser) {
    return <div className="text-center text-gray-600 p-8">A carregar perfil do utilizador...</div>;
  }
  if (!userProfile || (userProfile.role !== 'master' && userProfile.role !== 'gerente')) {
    return (
      <div className="text-center text-red-500 p-8">
        Você não tem permissão para aceder a esta página de Dashboards.
        {userProfile && ` (Seu nível: ${userProfile.role})`}
      </div>
    );
  }
  if (userProfile.role === 'gerente' && userAllowedHotels.length === 0 && !loadingUserHotels) {
    return (
        <div className="text-center text-orange-600 p-8">
            Você não tem acesso a nenhum hotel ativo para visualizar dashboards. Contacte o administrador.
        </div>
    );
  }
  if (userProfile.role === 'master' && userAllowedHotels.length === 0 && !loadingUserHotels) {
    return (
        <div className="text-center text-orange-600 p-8">
            Nenhum hotel ativo cadastrado no sistema para exibir dashboards.
        </div>
    );
  }

  // Determina o nome do hotel ou a descrição da seleção para o título
  let dashboardTitleContext = "";
  if (selectedHotelIds.length === 1) {
    const hotel = userAllowedHotels.find(h => h.id === selectedHotelIds[0]);
    dashboardTitleContext = hotel ? ` de: ${hotel.nome}` : "";
  } else if (selectedHotelIds.length > 1 && selectedHotelIds.length < userAllowedHotels.length) {
    dashboardTitleContext = ` de ${selectedHotelIds.length} hotéis selecionados`;
  } else if (selectedHotelIds.length > 0 && selectedHotelIds.length === userAllowedHotels.length) {
     dashboardTitleContext = userProfile.role === 'master' ? " (Todos os Hotéis Ativos)" : " (Todos os Seus Hotéis Permitidos)";
  }


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboards</h1>
      </div>

      {/* Seleção de Hotéis com Checkboxes */}
      {userAllowedHotels.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="mb-3">
            <label htmlFor="selectAllHotelsToggle" className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="selectAllHotelsToggle"
                checked={selectAllToggle}
                onChange={handleSelectAllToggleChange}
                className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                {userProfile.role === 'master' ? 'Selecionar Todos os Hotéis Ativos' : 'Selecionar Todos os Meus Hotéis'}
              </span>
            </label>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-2 border p-3 rounded-md">
            {userAllowedHotels.map(hotel => (
              <label key={hotel.id} htmlFor={`hotel-cb-${hotel.id}`} className="flex items-center cursor-pointer p-1 hover:bg-gray-100 rounded">
                <input
                  type="checkbox"
                  id={`hotel-cb-${hotel.id}`}
                  value={hotel.id}
                  checked={selectedHotelIds.includes(hotel.id)}
                  onChange={() => handleHotelSelectionChange(hotel.id)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">{hotel.nome} ({hotel.cidade || 'N/A'})</span>
              </label>
            ))}
          </div>
        </div>
      )}
      
      {loadingRecords ? (
        <div className="text-center text-gray-600 p-8">A carregar dados dos gráficos...</div>
      ) : selectedHotelIds.length === 0 ? (
         <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-gray-600">Selecione pelo menos um hotel para visualizar os dados.</p>
        </div>
      ) : wasteRecords.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-gray-600">
                Não há dados de resíduos registados para a seleção atual.
            </p>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Visão Geral dos Resíduos{dashboardTitleContext}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
            {wasteTypeData.length > 0 ? (
              <div className="bg-gray-50 p-4 rounded-lg shadow h-[450px]">
                <h3 className="text-lg font-semibold text-gray-700 mb-3 text-center">Total de Registos por Tipo de Resíduo</h3>
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie data={wasteTypeData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={120} fill="#8884d8" dataKey="value">
                      {wasteTypeData.map((entry, index) => (<Cell key={`cell-type-${index}`} fill={COLORS[index % COLORS.length]} />))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="text-center text-gray-500 lg:col-span-1">Sem dados para o gráfico de tipo de resíduo.</p>}

            {hotelAreaData.length > 0 ? (
              <div className="bg-gray-50 p-4 rounded-lg shadow h-[450px]">
                <h3 className="text-lg font-semibold text-gray-700 mb-3 text-center">Total de Registos por Área do Hotel</h3>
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie data={hotelAreaData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={120} fill="#82ca9d" dataKey="value">
                      {hotelAreaData.map((entry, index) => (<Cell key={`cell-area-${index}`} fill={COLORS[index % COLORS.length]} />))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="text-center text-gray-500 lg:col-span-1">Sem dados para o gráfico de área do hotel.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
