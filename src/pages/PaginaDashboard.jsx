// src/pages/PaginaDashboard.jsx

import React, { useContext, useEffect, useState, useMemo, useRef } from 'react'; // Adicionado useRef
import AuthContext from '../context/AuthContext';
import { 
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    LineChart, Line, ReferenceLine 
} from 'recharts';
import { collection, onSnapshot, query, where, getDocs, documentId, orderBy } from 'firebase/firestore';
import DashboardFilters from '../components/DashboardFilters'; 

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AA336A', '#3D9140', '#FF5733', '#8333FF'];
const MESES_COMPLETOS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// Funções de processamento de dados (inalteradas)
const processDataForPieChartByWeight = (records, groupByField) => {
  if (!Array.isArray(records) || records.length === 0) return { pieData: [], totalWeight: 0 };
  let totalWeight = 0;
  const counts = records.reduce((acc, record) => {
    if (!record) return acc;
    const key = record[groupByField] || 'Não especificado';
    const weight = parseFloat(record.peso || 0);
    acc[key] = (acc[key] || 0) + weight;
    totalWeight += weight;
    return acc;
  }, {});
  const pieData = Object.entries(counts).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));
  return { pieData, totalWeight: parseFloat(totalWeight.toFixed(2)) };
};
const processDataForDailyVolumeBarChart = (records) => {
    if (!Array.isArray(records) || records.length === 0) return [];
    const dailyVolumes = records.reduce((acc, record) => {
        if (!record || !record.timestamp) return acc;
        const recordTimestamp = typeof record.timestamp === 'number' ? record.timestamp : record.timestamp?.toDate?.().getTime();
        if (!recordTimestamp) return acc;
        const date = new Date(recordTimestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const weight = parseFloat(record.peso || 0);
        acc[date] = (acc[date] || 0) + weight;
        return acc;
    }, {});
    return Object.entries(dailyVolumes)
        .map(([name, volume]) => ({ name, volume: parseFloat(volume.toFixed(2)) }))
        .sort((a,b) => {
            const [dayA, monthA] = a.name.split('/');
            const [dayB, monthB] = b.name.split('/');
            if (!monthA || !monthB || !dayA || !dayB) return 0;
            return new Date(`2000/${monthA}/${dayA}`) - new Date(`2000/${monthB}/${dayB}`);
        });
};
const processDataForLixoZeroChart = (records, rejectCategoryName = "Rejeito") => {
    if (!Array.isArray(records) || records.length === 0) return [];
    const dailyDataAggregated = records.reduce((acc, record) => {
        if (!record || !record.timestamp) return acc;
        const recordTimestamp = typeof record.timestamp === 'number' ? record.timestamp : record.timestamp?.toDate?.().getTime();
        if (!recordTimestamp) return acc;
        const dateKey = new Date(recordTimestamp).toISOString().split('T')[0]; 
        const weight = parseFloat(record.peso || 0);
        acc[dateKey] = acc[dateKey] || { total: 0, rejeito: 0 };
        acc[dateKey].total += weight;
        if (record.wasteType === rejectCategoryName) {
            acc[dateKey].rejeito += weight;
        }
        return acc;
    }, {});
    const sortedDailyData = Object.entries(dailyDataAggregated)
        .map(([dateKey, data]) => ({
            dateKey, 
            name: new Date(dateKey + 'T00:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            total: data.total,
            rejeito: data.rejeito,
            percentualRejeito: data.total > 0 ? parseFloat(((data.rejeito / data.total) * 100).toFixed(2)) : 0
        }))
        .sort((a, b) => new Date(a.dateKey) - new Date(b.dateKey)); 
    let acumuladoSomaPercentual = 0;
    return sortedDailyData.map((dataPoint, index) => {
        acumuladoSomaPercentual += dataPoint.percentualRejeito;
        return { ...dataPoint, mediaPercentualRejeito: parseFloat((acumuladoSomaPercentual / (index + 1)).toFixed(2)) };
    });
};

export default function PaginaDashboard() {
  const { userProfile, db, appId, currentUser, userAllowedClientes, loadingAllowedClientes } = useContext(AuthContext); 
  
  const [selectedClienteIds, setSelectedClienteIds] = useState([]); 
  const [selectAllClientesToggle, setSelectAllClientesToggle] = useState(false);
  const [isClienteDropdownOpen, setIsClienteDropdownOpen] = useState(false); // Novo estado
  const clienteDropdownRef = useRef(null); // Novo ref

  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonths, setSelectedMonths] = useState([currentMonthIndex]);
  const [allMonthsSelected, setAllMonthsSelected] = useState(false); 

  const [availableAreas, setAvailableAreas] = useState([]); 
  const [selectedAreas, setSelectedAreas] = useState([]); 

  const [allWasteRecords, setAllWasteRecords] = useState([]);
  const [filteredWasteRecords, setFilteredWasteRecords] = useState([]); 
  const [loadingRecords, setLoadingRecords] = useState(true);

  // Efeito para fechar dropdown de cliente ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (clienteDropdownRef.current && !clienteDropdownRef.current.contains(event.target)) {
        setIsClienteDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [clienteDropdownRef]);

  useEffect(() => {
    if (userAllowedClientes && userAllowedClientes.length > 0) {
        const initialSelectedIds = userAllowedClientes.map(c => c.id);
        setSelectedClienteIds(initialSelectedIds);
        setSelectAllClientesToggle(true); // Assume que se há clientes permitidos, todos são selecionados inicialmente
    } else {
        setSelectedClienteIds([]);
        setSelectAllClientesToggle(false);
    }
  }, [userAllowedClientes]);

  const availableYears = useMemo(() => { /* ... (inalterado) ... */
    const years = new Set();
    if (Array.isArray(allWasteRecords)) {
      allWasteRecords.forEach(record => {
          if (record && record.timestamp) {
            const recordTimestamp = typeof record.timestamp === 'number' ? record.timestamp : record.timestamp?.toDate?.().getTime();
            if (recordTimestamp) years.add(new Date(recordTimestamp).getFullYear());
          }
      });
    }
    if (years.size === 0) years.add(currentYear);
    return Array.from(years).sort((a,b) => b - a);
  }, [allWasteRecords, currentYear]);

  useEffect(() => { /* ... (busca de allWasteRecords inalterada) ... */
    if (!db || !currentUser || loadingAllowedClientes || !selectedClienteIds || selectedClienteIds.length === 0) {
      setAllWasteRecords([]); setLoadingRecords(false); return;
    }
    setLoadingRecords(true);
    const q = query(
        collection(db, `artifacts/${appId}/public/data/wasteRecords`), 
        where("clienteId", "in", selectedClienteIds),
        orderBy("timestamp", "desc") 
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newRecords = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const timestamp = data.timestamp?.toDate?.().getTime() || data.timestamp || null;
        return { id: docSnap.id, ...data, timestamp };
      });
      setAllWasteRecords(newRecords);
      setLoadingRecords(false);
    }, (error) => {
      console.error("DASHBOARD: Erro ao buscar todos os registos:", error);
      setAllWasteRecords([]); setLoadingRecords(false);
    });
    return () => unsubscribe();
  }, [db, currentUser, appId, selectedClienteIds, loadingAllowedClientes]);

  useEffect(() => { /* ... (lógica de filteredWasteRecords e availableAreas inalterada, mas revisada a parte de selectedAreas) ... */
    if (!Array.isArray(allWasteRecords) || allWasteRecords.length === 0) {
      setFilteredWasteRecords([]); 
      setAvailableAreas([]);    
      return;
    }
    const recordsInPeriod = allWasteRecords.filter(record => {
      if (!record || typeof record.timestamp !== 'number') return false;
      const recordDate = new Date(record.timestamp); 
      if (isNaN(recordDate.getTime())) return false;
      const recordYearValue = recordDate.getFullYear();
      const recordMonthValue = recordDate.getMonth();
      return recordYearValue === selectedYear && Array.isArray(selectedMonths) && selectedMonths.includes(recordMonthValue);
    });
    setFilteredWasteRecords(recordsInPeriod);
    const areasInMonth = new Set();
    recordsInPeriod.forEach(record => { if(record && record.areaLancamento) areasInMonth.add(record.areaLancamento); });
    const newAvailableAreas = Array.from(areasInMonth).sort();
    setAvailableAreas(newAvailableAreas);
    if (selectedAreas.length > 0) {
        const stillAvailable = selectedAreas.filter(sa => newAvailableAreas.includes(sa));
        if (stillAvailable.length !== selectedAreas.length || !selectedAreas.every(sa => stillAvailable.includes(sa))) {
            setSelectedAreas(stillAvailable); 
        }
    }
  }, [allWasteRecords, selectedYear, selectedMonths]);

  const recordsFilteredByArea = useMemo(() => { /* ... (inalterado) ... */
    if (!Array.isArray(filteredWasteRecords)) return [];
    if (selectedAreas.length === 0) return filteredWasteRecords; 
    return filteredWasteRecords.filter(record => record && record.areaLancamento && selectedAreas.includes(record.areaLancamento));
  }, [filteredWasteRecords, selectedAreas]);

  // Handlers de cliente (mantidos, pois a lógica de estado é a mesma)
  const handleClienteSelectionChange = (clienteId) => { 
    setSelectedClienteIds(prev => {
      const newSelection = prev.includes(clienteId) ? prev.filter(id => id !== clienteId) : [...prev, clienteId];
      // Atualiza o selectAllClientesToggle com base na nova seleção
      if (userAllowedClientes) {
        setSelectAllClientesToggle(newSelection.length === userAllowedClientes.length && userAllowedClientes.length > 0);
      }
      return newSelection;
    });
  };
  const handleSelectAllClientesToggleChange = () => { 
    setSelectAllClientesToggle(prev => {
      const newToggleState = !prev;
      if (newToggleState && userAllowedClientes) {
        setSelectedClienteIds(userAllowedClientes.map(c => c.id));
      } else {
        setSelectedClienteIds([]);
      }
      return newToggleState;
    });
    // Fecha o dropdown se o toggle "todos" for usado
    setIsClienteDropdownOpen(false); 
  };
  
  // Handlers de mês e área (inalterados)
  const handleMonthToggle = (monthIndex) => { /* ... */ 
    setSelectedMonths(prev => {
        const newSelection = prev.includes(monthIndex) ? prev.filter(m => m !== monthIndex) : [...prev, monthIndex];
        setAllMonthsSelected(newSelection.length === MESES_COMPLETOS.length);
        return newSelection;
    });
  };
  const handleSelectAllMonthsToggle = () => { /* ... */ 
    setAllMonthsSelected(prev => {
      const newToggleState = !prev;
      if (newToggleState) setSelectedMonths(MESES_COMPLETOS.map((_, index) => index));
      else setSelectedMonths([]);
      return newToggleState;
    });
  };
  const handleSelectedAreasChange = (newAreas) => { /* ... */ 
    setSelectedAreas(Array.isArray(newAreas) ? newAreas : []);
  };

  // Função para determinar o texto do botão de seleção de clientes
  const getClienteDisplayValue = () => {
    if (!userAllowedClientes || userAllowedClientes.length === 0) return "Nenhum cliente";
    if (selectAllClientesToggle || selectedClienteIds.length === userAllowedClientes.length) {
      return userProfile?.role === 'master' ? "Todos Clientes Ativos" : "Todos Seus Clientes";
    }
    if (selectedClienteIds.length === 1) {
      const cliente = userAllowedClientes.find(c => c.id === selectedClienteIds[0]);
      return cliente ? cliente.nome : "1 cliente selecionado";
    }
    if (selectedClienteIds.length > 1) {
      return `${selectedClienteIds.length} clientes selecionados`;
    }
    return "Selecionar cliente(s)";
  };

  const { pieData: wasteTypeData, totalWeight: totalWasteWeight } = processDataForPieChartByWeight(allWasteRecords, 'wasteType');
  const { pieData: areaData } = processDataForPieChartByWeight(allWasteRecords, 'areaLancamento');
  const dailyVolumeData = processDataForDailyVolumeBarChart(recordsFilteredByArea);
  const lixoZeroData = processDataForLixoZeroChart(recordsFilteredByArea);

  // Lógica de mensagens de loading e permissão (adaptada)
  if (loadingAllowedClientes && !userProfile) return <div className="text-center text-gray-600 p-8">A carregar dados...</div>;
  if (!userProfile && currentUser) return <div className="text-center text-gray-600 p-8">A carregar perfil...</div>;
  if (!userProfile || (userProfile.role !== 'master' && userProfile.role !== 'gerente')) {
    return <div className="text-center text-red-500 p-8">Acesso Negado.</div>;
  }
  // Adicionado loadingAllowedClientes na condição para evitar piscar de mensagens
  const currentAllowedClientesFromAuth = userAllowedClientes || []; 
  if (userProfile.role === 'gerente' && currentAllowedClientesFromAuth.length === 0 && !loadingAllowedClientes) {
    return <div className="text-center text-orange-600 p-8">Sem acesso a clientes.</div>;
  }
   if (userProfile.role === 'master' && currentAllowedClientesFromAuth.length === 0 && !loadingAllowedClientes) {
    return <div className="text-center text-orange-600 p-8">Nenhum cliente ativo cadastrado.</div>;
  }

  // Lógica de dashboardTitleContext e periodTitle (adaptada)
  let dashboardTitleContext = ""; 
  if (selectAllClientesToggle || (Array.isArray(selectedClienteIds) && currentAllowedClientesFromAuth.length > 0 && selectedClienteIds.length === currentAllowedClientesFromAuth.length)) {
    dashboardTitleContext = userProfile.role === 'master' ? " (Todos os Clientes Ativos)" : " (Todos os Seus Clientes Permitidos)";
  } else if (Array.isArray(selectedClienteIds) && selectedClienteIds.length === 1 && currentAllowedClientesFromAuth.length > 0) {
    const cliente = currentAllowedClientesFromAuth.find(c => c.id === selectedClienteIds[0]);
    dashboardTitleContext = cliente ? ` de: ${cliente.nome}` : "";
  } else if (Array.isArray(selectedClienteIds) && selectedClienteIds.length > 1) {
    dashboardTitleContext = ` de ${selectedClienteIds.length} clientes selecionados`;
  }
  
  let periodTitle = ""; /* ... (inalterado) ... */
  if (allMonthsSelected || (Array.isArray(selectedMonths) && selectedMonths.length === MESES_COMPLETOS.length)) {
    periodTitle = `${selectedYear}`;
  } else if (Array.isArray(selectedMonths) && selectedMonths.length > 0) {
    periodTitle = selectedMonths.map(mIndex => MESES_COMPLETOS[mIndex] ? MESES_COMPLETOS[mIndex].substring(0,3) : '').join(', ') + `/${selectedYear}`;
  } else {
    periodTitle = `Nenhum mês selecionado/${selectedYear}`;
  }
  let areaTitleSegment = ' - Todas as Áreas'; /* ... (inalterado) ... */
  if (selectedAreas.length === 1) { areaTitleSegment = ` - Área: ${selectedAreas[0]}`; } 
  else if (selectedAreas.length > 1) { areaTitleSegment = ` - Áreas Selecionadas (${selectedAreas.length})`;}

  return (
    <div className="space-y-8">
      {/* MODIFICADO: Cabeçalho com título e dropdown de cliente */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Dashboards</h1>
        
        {/* Novo Dropdown Multi-Select de Cliente */}
        {(!loadingAllowedClientes && userAllowedClientes && userAllowedClientes.length > 0) && (
          <div className="relative w-full sm:w-auto sm:min-w-[250px]" ref={clienteDropdownRef}>
            <button
              type="button"
              onClick={() => setIsClienteDropdownOpen(!isClienteDropdownOpen)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              aria-haspopup="listbox"
              aria-expanded={isClienteDropdownOpen}
            >
              <span className="block truncate">{getClienteDisplayValue()}</span>
              <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            </button>

            {isClienteDropdownOpen && (
              <div className="absolute z-20 mt-1 w-full sm:w-72 bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                <label className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-2"
                    checked={selectAllClientesToggle}
                    onChange={handleSelectAllClientesToggleChange}
                  />
                  {userProfile?.role === 'master' ? "Todos Clientes Ativos" : "Todos Seus Clientes"}
                </label>
                {userAllowedClientes.map(cliente => (
                  <label key={cliente.id} className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-2"
                      value={cliente.id}
                      checked={selectedClienteIds.includes(cliente.id)}
                      onChange={() => handleClienteSelectionChange(cliente.id)}
                      disabled={selectAllClientesToggle} // Desabilita individual se "todos" estiver marcado
                    />
                    {cliente.nome}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
        {loadingAllowedClientes && <div className="text-sm text-gray-500 mt-1 sm:ml-4">Carregando clientes...</div>}
      </div>

      {/* DashboardFilters agora não lida mais com seleção de clientes */}
      <DashboardFilters 
        userProfile={userProfile} 
        availableYears={availableYears || []}
        selectedYear={selectedYear} 
        onYearChange={setSelectedYear} 
        selectedMonths={selectedMonths || []} 
        onMonthToggle={handleMonthToggle} 
        allMonthsSelected={allMonthsSelected} 
        onSelectAllMonthsToggle={handleSelectAllMonthsToggle} 
        availableAreas={availableAreas || []} 
        selectedAreas={selectedAreas}                 
        onSelectedAreasChange={handleSelectedAreasChange} 
        // Removidas props de cliente: userAllowedClientes, selectedClienteIds, onClienteSelectionChange, selectAllToggle, onSelectAllToggleChange, loadingUserClientes
      /> 
      
      {/* Seção de Gráficos (sem alterações na lógica, mas o contexto do título foi adaptado) */}
      {loadingRecords && Array.isArray(selectedClienteIds) && selectedClienteIds.length > 0 ? ( <div className="text-center text-gray-600 p-8">A carregar dados dos gráficos...</div>
      ) : !Array.isArray(selectedClienteIds) || selectedClienteIds.length === 0 ? ( <div className="bg-white p-6 rounded-lg shadow text-center"><p className="text-gray-600">Selecione pelo menos um cliente para visualizar os dados.</p></div>
      ) : (filteredWasteRecords.length === 0 && allWasteRecords.length > 0) && (!selectedMonths || selectedMonths.length === 0) ? ( 
        <div className="bg-white p-6 rounded-lg shadow text-center"><p className="text-gray-600">Selecione um ou mais meses para ver os gráficos de período.</p></div>
      ) : (allWasteRecords.length === 0 && selectedClienteIds.length > 0) ? ( <div className="bg-white p-6 rounded-lg shadow text-center"><p className="text-gray-600">Não há dados de resíduos registados para a seleção atual.</p></div>
      ) : (
        <>
          {/* ... (Gráficos JSX inalterados) ... */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Volume Diário de Resíduos ({periodTitle})
              {areaTitleSegment}
              {dashboardTitleContext}
            </h2>
            {dailyVolumeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dailyVolumeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => `${value.toFixed(2)} kg`} />
                  <Legend />
                  <Bar dataKey="volume" fill="#8884d8" name="Volume Total (kg)" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-gray-500">Sem dados para o gráfico de volume diário neste período{selectedAreas.length > 0 ? ` e área(s) selecionada(s)` : ''}.</p>}
          </div>

          <div className="bg-white p-6 rounded-lg shadow mt-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Meta Lixo Zero: Percentual de Rejeito ({periodTitle})
              {areaTitleSegment}
              {dashboardTitleContext}
            </h2>
            {lixoZeroData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={lixoZeroData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: '% Rejeito', angle: -90, position: 'insideLeft' }} domain={[0, 'dataMax + 10']} allowDataOverflow />
                  <Tooltip formatter={(value, name) => {
                      if (name === '% Rejeito') return [`${value.toFixed(2)}%`, name];
                      if (name === 'Média % Rejeito') return [`${value.toFixed(2)}%`, name];
                      return [value, name];
                  }} />
                  <Legend />
                  <Line type="monotone" dataKey="percentualRejeito" stroke="#FF8042" name="% Rejeito" activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="mediaPercentualRejeito" stroke="#82ca9d" name="Média % Rejeito" strokeDasharray="5 5" dot={false} />
                  <ReferenceLine y={10} label={{ value: "Meta 10%", position: "insideTopRight", fill: "#FF8042", dy: -5 }} stroke="#FF8042" strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-gray-500">Sem dados para o gráfico Meta Lixo Zero neste período{selectedAreas.length > 0 ? ` e área(s) selecionada(s)` : ''}.</p>}
          </div>

          <div className="bg-white p-6 rounded-lg shadow mt-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Composição Geral dos Resíduos (Total: {totalWasteWeight.toFixed(2)} kg){dashboardTitleContext}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
              {wasteTypeData.length > 0 ? (
                <div className="bg-gray-50 p-4 rounded-lg shadow h-[450px]">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3 text-center">Por Tipo de Resíduo (Peso)</h3>
                  <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                      <Pie data={wasteTypeData} cx="50%" cy="50%" labelLine={false} label={({ name, value, percent }) => `${name}: ${value.toFixed(2)} kg (${(percent * 100).toFixed(0)}%)`} outerRadius={120} fill="#8884d8" dataKey="value">
                        {wasteTypeData.map((entry, index) => (<Cell key={`cell-type-${index}`} fill={COLORS[index % COLORS.length]} />))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value.toFixed(2)} kg`, name]}/>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="text-center text-gray-500 lg:col-span-1">Sem dados para o gráfico de tipo de resíduo.</p>}

              {areaData.length > 0 ? (
                <div className="bg-gray-50 p-4 rounded-lg shadow h-[450px]">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3 text-center">Por Área do Cliente (Peso)</h3>
                  <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                      <Pie data={areaData} cx="50%" cy="50%" labelLine={false} label={({ name, value, percent }) => `${name}: ${value.toFixed(2)} kg (${(percent * 100).toFixed(0)}%)`} outerRadius={120} fill="#82ca9d" dataKey="value">
                        {areaData.map((entry, index) => (<Cell key={`cell-area-${index}`} fill={COLORS[index % COLORS.length]} />))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value.toFixed(2)} kg`, name]}/>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="text-center text-gray-500 lg:col-span-1">Sem dados para o gráfico de área do cliente.</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
