// src/pages/PaginaDashboard.jsx

import React, { useContext, useEffect, useState } from 'react';
import AuthContext from '../context/AuthContext';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { collection, onSnapshot, query, where, getDocs, documentId, orderBy } from 'firebase/firestore'; // Adicionado orderBy

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AA336A', '#3D9140', '#FF5733', '#8333FF'];

// Estas funções operam sobre os 'wasteRecords' já filtrados, então não precisam de grandes mudanças,
// mas os nomes dos campos (wasteType, area) nos registos devem estar corretos.
const processDataForWasteTypeChart = (records) => {
  if (!records || records.length === 0) return [];
  const counts = records.reduce((acc, record) => {
    const type = record.wasteType || 'Não especificado'; // 'wasteType' é o campo no wasteRecord
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
};

const processDataForHotelAreaChart = (records) => {
  if (!records || records.length === 0) return [];
  const counts = records.reduce((acc, record) => {
    const area = record.areaLancamento || 'Não especificado'; // 'areaLancamento' é o novo campo no wasteRecord
    acc[area] = (acc[area] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
};


export default function PaginaDashboard() {
  const { userProfile, db, appId, currentUser } = useContext(AuthContext);
  
  const [wasteRecords, setWasteRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  // Renomeado para refletir "Clientes"
  const [userAllowedClientes, setUserAllowedClientes] = useState([]);
  const [selectedClienteIds, setSelectedClienteIds] = useState([]); 
  const [loadingUserClientes, setLoadingUserClientes] = useState(true);
  const [selectAllToggle, setSelectAllToggle] = useState(true);

  // Carregar clientes permitidos/todos os clientes
  useEffect(() => {
    if (!db || !userProfile) {
      setLoadingUserClientes(false);
      setUserAllowedClientes([]);
      setSelectedClienteIds([]);
      return;
    }

    const fetchUserClientes = async () => {
      setLoadingUserClientes(true);
      let loadedClientes = [];
      try {
        if (userProfile.role === 'master') {
          const clientesQuery = query(collection(db, "clientes"), where("ativo", "==", true), orderBy("nome")); // Busca da coleção "clientes"
          const querySnapshot = await getDocs(clientesQuery);
          loadedClientes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } else if (userProfile.clientesPermitidos && userProfile.clientesPermitidos.length > 0) { // Usa "clientesPermitidos"
          const clientesQuery = query(collection(db, "clientes"), where(documentId(), "in", userProfile.clientesPermitidos), where("ativo", "==", true), orderBy("nome"));
          const querySnapshot = await getDocs(clientesQuery);
          loadedClientes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        
        setUserAllowedClientes(loadedClientes);
        setSelectedClienteIds(loadedClientes.map(c => c.id)); // Seleciona todos por padrão
        setSelectAllToggle(true);

      } catch (error) {
        console.error("Erro ao carregar clientes para dashboard:", error);
        setUserAllowedClientes([]);
        setSelectedClienteIds([]);
      }
      setLoadingUserClientes(false);
    };

    fetchUserClientes();
  }, [db, userProfile]);

  // Buscar os registos de resíduos com base nos clientes selecionados
  useEffect(() => {
    if (!db || !currentUser || !userProfile || loadingUserClientes) { 
      setLoadingRecords(false);
      setWasteRecords([]);
      return;
    }

    if (selectedClienteIds.length === 0) {
        setLoadingRecords(false);
        setWasteRecords([]);
        return;
    }

    setLoadingRecords(true);
    let wasteRecordsQuery;

    // Query usa 'in' para múltiplos clienteId
    wasteRecordsQuery = query(
      collection(db, `artifacts/${appId}/public/data/wasteRecords`), // Caminho dos wasteRecords
      where("clienteId", "in", selectedClienteIds) // Filtra por clienteId
    );
    
    const unsubscribe = onSnapshot(wasteRecordsQuery, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // A ordenação por timestamp pode ser feita aqui se não houver no query por causa do 'in'
      records.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setWasteRecords(records);
      setLoadingRecords(false);
    }, (error) => {
      console.error("Erro ao buscar registos para dashboard:", error);
      setWasteRecords([]); 
      setLoadingRecords(false);
    });

    return () => unsubscribe();
  }, [db, currentUser, appId, userProfile, selectedClienteIds, loadingUserClientes]);


  const handleClienteSelectionChange = (clienteId) => {
    setSelectedClienteIds(prevSelected => {
      const newSelection = prevSelected.includes(clienteId)
        ? prevSelected.filter(id => id !== clienteId)
        : [...prevSelected, clienteId];
      
      setSelectAllToggle(newSelection.length === userAllowedClientes.length);
      return newSelection;
    });
  };

  const handleSelectAllToggleChange = () => {
    const newToggleState = !selectAllToggle;
    setSelectAllToggle(newToggleState);
    if (newToggleState) {
      setSelectedClienteIds(userAllowedClientes.map(c => c.id));
    } else {
      setSelectedClienteIds([]);
    }
  };

  const wasteTypeData = processDataForWasteTypeChart(wasteRecords);
  const hotelAreaData = processDataForHotelAreaChart(wasteRecords); // Renomear para clienteAreaData se preferir

  // Lógica de renderização de loading e permissões
  if (loadingUserClientes) {
    return <div className="text-center text-gray-600 p-8">A carregar dados dos clientes...</div>;
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
  if (userProfile.role === 'gerente' && userAllowedClientes.length === 0 && !loadingUserClientes) {
    return (
        <div className="text-center text-orange-600 p-8">
            Você não tem acesso a nenhum cliente ativo para visualizar dashboards. Contacte o administrador.
        </div>
    );
  }
  if (userProfile.role === 'master' && userAllowedClientes.length === 0 && !loadingUserClientes) {
    return (
        <div className="text-center text-orange-600 p-8">
            Nenhum cliente ativo cadastrado no sistema para exibir dashboards.
        </div>
    );
  }

  let dashboardTitleContext = "";
  if (selectedClienteIds.length === 1) {
    const cliente = userAllowedClientes.find(c => c.id === selectedClienteIds[0]);
    dashboardTitleContext = cliente ? ` de: ${cliente.nome}` : "";
  } else if (selectedClienteIds.length > 1 && selectedClienteIds.length < userAllowedClientes.length) {
    dashboardTitleContext = ` de ${selectedClienteIds.length} clientes selecionados`;
  } else if (selectedClienteIds.length > 0 && selectedClienteIds.length === userAllowedClientes.length) {
     dashboardTitleContext = userProfile.role === 'master' ? " (Todos os Clientes Ativos)" : " (Todos os Seus Clientes Permitidos)";
  }


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboards</h1>
      </div>

      {/* Seleção de Clientes com Checkboxes */}
      {userAllowedClientes.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="mb-3">
            <label htmlFor="selectAllClientesToggle" className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="selectAllClientesToggle"
                checked={selectAllToggle}
                onChange={handleSelectAllToggleChange}
                className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                {userProfile.role === 'master' ? 'Selecionar Todos os Clientes Ativos' : 'Selecionar Todos os Meus Clientes'}
              </span>
            </label>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-2 border p-3 rounded-md">
            {userAllowedClientes.map(cliente => (
              <label key={cliente.id} htmlFor={`cliente-cb-${cliente.id}`} className="flex items-center cursor-pointer p-1 hover:bg-gray-100 rounded">
                <input
                  type="checkbox"
                  id={`cliente-cb-${cliente.id}`}
                  value={cliente.id}
                  checked={selectedClienteIds.includes(cliente.id)}
                  onChange={() => handleClienteSelectionChange(cliente.id)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">{cliente.nome} ({cliente.cidade || 'N/A'})</span>
              </label>
            ))}
          </div>
        </div>
      )}
      
      {loadingRecords ? (
        <div className="text-center text-gray-600 p-8">A carregar dados dos gráficos...</div>
      ) : selectedClienteIds.length === 0 ? (
         <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-gray-600">Selecione pelo menos um cliente para visualizar os dados.</p>
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

            {hotelAreaData.length > 0 ? ( // Pode renomear para clienteAreaData se quiser
              <div className="bg-gray-50 p-4 rounded-lg shadow h-[450px]">
                <h3 className="text-lg font-semibold text-gray-700 mb-3 text-center">Total de Registos por Área do Cliente</h3>
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
            ) : <p className="text-center text-gray-500 lg:col-span-1">Sem dados para o gráfico de área do cliente.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
