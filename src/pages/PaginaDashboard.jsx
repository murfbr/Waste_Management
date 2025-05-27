// src/pages/PaginaDashboard.jsx

import React, { useContext, useEffect, useState, useMemo } from 'react';
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

// Funções de processamento de dados
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
        return {
            ...dataPoint,
            mediaPercentualRejeito: parseFloat((acumuladoSomaPercentual / (index + 1)).toFixed(2))
        };
    });
};

export default function PaginaDashboard() {
  const { userProfile, db, appId, currentUser, userAllowedClientes, loadingAllowedClientes } = useContext(AuthContext); 
  
  const [selectedClienteIds, setSelectedClienteIds] = useState([]); 
  const [selectAllClientesToggle, setSelectAllClientesToggle] = useState(false);
  
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

  useEffect(() => {
    if (userAllowedClientes && userAllowedClientes.length > 0) {
        const initialSelectedIds = userAllowedClientes.map(c => c.id);
        setSelectedClienteIds(initialSelectedIds);
        setSelectAllClientesToggle(true);
    } else {
        setSelectedClienteIds([]);
        setSelectAllClientesToggle(false);
    }
  }, [userAllowedClientes]);


  const availableYears = useMemo(() => {
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

  useEffect(() => {
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

  useEffect(() => {
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

  const recordsFilteredByArea = useMemo(() => {
    if (!Array.isArray(filteredWasteRecords)) return [];
    if (selectedAreas.length === 0) return filteredWasteRecords; 
    return filteredWasteRecords.filter(record => record && record.areaLancamento && selectedAreas.includes(record.areaLancamento));
  }, [filteredWasteRecords, selectedAreas]);

  const handleClienteSelectionChange = (clienteId) => { 
    setSelectedClienteIds(prev => {
      const newSelection = prev.includes(clienteId) ? prev.filter(id => id !== clienteId) : [...prev, clienteId];
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
  };
  const handleMonthToggle = (monthIndex) => {
    setSelectedMonths(prev => {
        const newSelection = prev.includes(monthIndex) ? prev.filter(m => m !== monthIndex) : [...prev, monthIndex];
        setAllMonthsSelected(newSelection.length === MESES_COMPLETOS.length);
        return newSelection;
    });
  };
  const handleSelectAllMonthsToggle = () => {
    setAllMonthsSelected(prev => {
      const newToggleState = !prev;
      if (newToggleState) setSelectedMonths(MESES_COMPLETOS.map((_, index) => index));
      else setSelectedMonths([]);
      return newToggleState;
    });
  };

  const handleSelectedAreasChange = (newAreas) => {
    // ADICIONADO CONSOLE.LOG PARA DEPURAÇÃO
    console.log("PaginaDashboard - handleSelectedAreasChange - Recebido:", newAreas);
    setSelectedAreas(Array.isArray(newAreas) ? newAreas : []);
  };


  const { pieData: wasteTypeData, totalWeight: totalWasteWeight } = processDataForPieChartByWeight(allWasteRecords, 'wasteType');
  const { pieData: areaData } = processDataForPieChartByWeight(allWasteRecords, 'areaLancamento');
  
  const dailyVolumeData = processDataForDailyVolumeBarChart(recordsFilteredByArea);
  const lixoZeroData = processDataForLixoZeroChart(recordsFilteredByArea);

  if (loadingAllowedClientes) return <div className="text-center text-gray-600 p-8">A carregar dados de clientes...</div>;
  if (!userProfile && currentUser) return <div className="text-center text-gray-600 p-8">A carregar perfil...</div>;
  if (!userProfile || (userProfile.role !== 'master' && userProfile.role !== 'gerente')) {
    return <div className="text-center text-red-500 p-8">Acesso Negado.</div>;
  }
  
  const currentAllowedClientesFromAuth = userAllowedClientes || []; 
  if (userProfile.role === 'gerente' && currentAllowedClientesFromAuth.length === 0 && !loadingAllowedClientes) {
    return <div className="text-center text-orange-600 p-8">Sem acesso a clientes.</div>;
  }
   if (userProfile.role === 'master' && currentAllowedClientesFromAuth.length === 0 && !loadingAllowedClientes) {
    return <div className="text-center text-orange-600 p-8">Nenhum cliente ativo cadastrado.</div>;
  }

  let dashboardTitleContext = ""; 
  if (Array.isArray(selectedClienteIds) && selectedClienteIds.length === 1 && currentAllowedClientesFromAuth.length > 0) {
    const cliente = currentAllowedClientesFromAuth.find(c => c.id === selectedClienteIds[0]);
    dashboardTitleContext = cliente ? ` de: ${cliente.nome}` : "";
  } else if (Array.isArray(selectedClienteIds) && selectedClienteIds.length > 1 && selectedClienteIds.length < currentAllowedClientesFromAuth.length) {
    dashboardTitleContext = ` de ${selectedClienteIds.length} clientes selecionados`;
  } else if (Array.isArray(selectedClienteIds) && currentAllowedClientesFromAuth.length > 0 && selectedClienteIds.length === currentAllowedClientesFromAuth.length) {
     dashboardTitleContext = userProfile.role === 'master' ? " (Todos os Clientes Ativos)" : " (Todos os Seus Clientes Permitidos)";
  }

  let periodTitle = "";
  if (allMonthsSelected || (Array.isArray(selectedMonths) && selectedMonths.length === MESES_COMPLETOS.length)) {
    periodTitle = `${selectedYear}`;
  } else if (Array.isArray(selectedMonths) && selectedMonths.length > 0) {
    periodTitle = selectedMonths.map(mIndex => MESES_COMPLETOS[mIndex] ? MESES_COMPLETOS[mIndex].substring(0,3) : '').join(', ') + `/${selectedYear}`;
  } else {
    periodTitle = `Nenhum mês selecionado/${selectedYear}`;
  }

  let areaTitleSegment = ' - Todas as Áreas';
  if (selectedAreas.length === 1) {
    areaTitleSegment = ` - Área: ${selectedAreas[0]}`;
  } else if (selectedAreas.length > 1) {
    areaTitleSegment = ` - Áreas Selecionadas (${selectedAreas.length})`;
  }


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboards</h1>
      </div>

      <DashboardFilters 
        userProfile={userProfile} 
        userAllowedClientes={userAllowedClientes || []} 
        selectedClienteIds={selectedClienteIds} 
        onClienteSelectionChange={handleClienteSelectionChange} 
        selectAllToggle={selectAllClientesToggle} 
        onSelectAllToggleChange={handleSelectAllClientesToggleChange} 
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
        loadingUserClientes={loadingAllowedClientes} 
      /> 
      
      {loadingRecords && Array.isArray(selectedClienteIds) && selectedClienteIds.length > 0 ? ( <div className="text-center text-gray-600 p-8">A carregar dados dos gráficos...</div>
      ) : !Array.isArray(selectedClienteIds) || selectedClienteIds.length === 0 ? ( <div className="bg-white p-6 rounded-lg shadow text-center"><p className="text-gray-600">Selecione pelo menos um cliente para visualizar os dados.</p></div>
      ) : (filteredWasteRecords.length === 0 && allWasteRecords.length > 0) && (!selectedMonths || selectedMonths.length === 0) ? ( 
        <div className="bg-white p-6 rounded-lg shadow text-center"><p className="text-gray-600">Selecione um ou mais meses para ver os gráficos de período.</p></div>
      ) : (allWasteRecords.length === 0 && selectedClienteIds.length > 0) ? ( <div className="bg-white p-6 rounded-lg shadow text-center"><p className="text-gray-600">Não há dados de resíduos registados para a seleção atual.</p></div>
      ) : (
        <>
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
