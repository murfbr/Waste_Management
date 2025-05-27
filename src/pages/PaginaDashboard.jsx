// src/pages/PaginaDashboard.jsx

import React, { useContext, useEffect, useState, useMemo } from 'react';
import AuthContext from '../context/AuthContext';
// IMPORTA O CONTEXTO DOS FILTROS
import DashboardFiltersContext from '../context/DashboardFiltersContext'; 
import { 
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    LineChart, Line, ReferenceLine 
} from 'recharts';
import { collection, onSnapshot, query, where, getDocs, documentId, orderBy } from 'firebase/firestore'; // Removido Timestamp não utilizado diretamente aqui
import DashboardFilters from '../components/DashboardFilters'; 

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AA336A', '#3D9140', '#FF5733', '#8333FF'];
const MESES_COMPLETOS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// Funções de processamento de dados (assumindo que estão corretas e não precisam de alteração imediata)
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
        const date = new Date(record.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
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
        const dateKey = new Date(record.timestamp).toISOString().split('T')[0]; 
        const weight = parseFloat(record.peso || 0);
        acc[dateKey] = acc[dateKey] || { total: 0, rejeito: 0 }; // Removido count não utilizado
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
  // Obtém dados de autenticação e clientes permitidos do AuthContext
  const { userProfile, db, appId, currentUser, userAllowedClientes } = useContext(AuthContext); 
  
  // Obtém estados e funções de manipulação de filtros do DashboardFiltersContext
  const filtersContext = useContext(DashboardFiltersContext);
  // Garante valores padrão se o contexto ainda não estiver totalmente pronto ou se algum valor for undefined
  const selectedClienteIds = filtersContext?.selectedClienteIds || [];
  const selectedYear = filtersContext?.selectedYear || new Date().getFullYear();
  const selectedMonths = filtersContext?.selectedMonths || [new Date().getMonth()]; // Array de índices (0-11)
  const allMonthsSelected = filtersContext?.allMonthsSelected || false;
  const setAvailableAreas = filtersContext?.setAvailableAreas || (() => {}); 
  const selectedAreaLixoZero = filtersContext?.selectedAreaLixoZero || 'ALL';
  const loadingUserClientesFromFilters = filtersContext?.loadingUserClientes === undefined ? true : filtersContext.loadingUserClientes;

  // Estados locais para os dados dos gráficos
  const [allWasteRecords, setAllWasteRecords] = useState([]);
  const [filteredWasteRecords, setFilteredWasteRecords] = useState([]); 
  const [loadingRecords, setLoadingRecords] = useState(true);
  
  const currentYear = new Date().getFullYear(); // Usado para o fallback de availableYears

  // Calcula os anos disponíveis para o filtro, baseado nos registos carregados
  const availableYears = useMemo(() => {
    const years = new Set();
    if (Array.isArray(allWasteRecords)) {
      allWasteRecords.forEach(record => {
          if (record && record.timestamp) years.add(new Date(record.timestamp).getFullYear());
      });
    }
    if (years.size === 0) years.add(currentYear);
    return Array.from(years).sort((a,b) => b - a);
  }, [allWasteRecords, currentYear]);

  // Efeito para buscar TODOS os registos de resíduos para os clientes selecionados (do contexto de filtros)
  useEffect(() => {
    // Aguarda o carregamento dos clientes do contexto de filtros
    if (!db || !currentUser || loadingUserClientesFromFilters || !selectedClienteIds || selectedClienteIds.length === 0) {
      setAllWasteRecords([]); 
      setLoadingRecords(false); 
      return;
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
        // Converte Firebase Timestamp para número (milissegundos)
        const timestamp = data.timestamp?.toDate?.().getTime() || data.timestamp || null;
        return { id: docSnap.id, ...data, timestamp };
      });
      setAllWasteRecords(currentRecords => 
        JSON.stringify(currentRecords || []) !== JSON.stringify(newRecords) ? newRecords : (currentRecords || [])
      );
      setLoadingRecords(false);
    }, (error) => {
      console.error("DASHBOARD: Erro ao buscar todos os registos:", error);
      setAllWasteRecords([]); 
      setLoadingRecords(false);
    });
    return () => unsubscribe();
  }, [db, currentUser, appId, JSON.stringify(selectedClienteIds), loadingUserClientesFromFilters]); // Depende de selectedClienteIds do contexto

  // Efeito para filtrar registos por período (ano/mês) e popular áreas disponíveis
  useEffect(() => {
    if (!Array.isArray(allWasteRecords) || allWasteRecords.length === 0) {
      setFilteredWasteRecords([]); // Limpa se não houver registos
      setAvailableAreas([]);    // Limpa se não houver registos
      return;
    }

    const recordsInPeriod = allWasteRecords.filter(record => {
      if (!record || typeof record.timestamp !== 'number') return false;
      const recordDate = new Date(record.timestamp); 
      if (isNaN(recordDate.getTime())) return false; // Validação de data
      const recordYearValue = recordDate.getFullYear();
      const recordMonthValue = recordDate.getMonth(); // 0-11
      // Garante que selectedMonths é um array antes de usar .includes()
      return recordYearValue === selectedYear && Array.isArray(selectedMonths) && selectedMonths.includes(recordMonthValue);
    });

    setFilteredWasteRecords(currentFiltered => 
        JSON.stringify(currentFiltered || []) !== JSON.stringify(recordsInPeriod) ? recordsInPeriod : (currentFiltered || [])
    );
    
    const areasInMonth = new Set();
    recordsInPeriod.forEach(record => { if(record && record.areaLancamento) areasInMonth.add(record.areaLancamento); });
    const newAvailableAreas = Array.from(areasInMonth).sort();
    // Chama a função do contexto para atualizar as áreas disponíveis globalmente para os filtros
    setAvailableAreas(currentAreas => 
        JSON.stringify(currentAreas || []) !== JSON.stringify(newAvailableAreas) ? newAvailableAreas : (currentAreas || [])
    );
  }, [JSON.stringify(allWasteRecords), selectedYear, JSON.stringify(selectedMonths), setAvailableAreas]); 


  const lixoZeroChartRecords = useMemo(() => {
    if (!Array.isArray(filteredWasteRecords)) return [];
    if (selectedAreaLixoZero === 'ALL') return filteredWasteRecords;
    return filteredWasteRecords.filter(record => record && record.areaLancamento === selectedAreaLixoZero);
  }, [filteredWasteRecords, selectedAreaLixoZero]); // selectedAreaLixoZero vem do contexto

  // Dados processados para os gráficos
  const { pieData: wasteTypeData, totalWeight: totalWasteWeight } = processDataForPieChartByWeight(allWasteRecords, 'wasteType');
  const { pieData: areaData } = processDataForPieChartByWeight(allWasteRecords, 'areaLancamento');
  const dailyVolumeData = processDataForDailyVolumeBarChart(filteredWasteRecords);
  const lixoZeroData = processDataForLixoZeroChart(lixoZeroChartRecords);

  // Lógica de renderização de loading e permissões
  if (loadingUserClientesFromFilters) return <div className="text-center text-gray-600 p-8">A carregar filtros...</div>;
  if (!userProfile && currentUser) return <div className="text-center text-gray-600 p-8">A carregar perfil...</div>;
  if (!userProfile || (userProfile.role !== 'master' && userProfile.role !== 'gerente')) {
    return <div className="text-center text-red-500 p-8">Acesso Negado.</div>;
  }
  
  const currentAllowedClientesFromAuth = userAllowedClientes || []; 
  if (userProfile.role === 'gerente' && currentAllowedClientesFromAuth.length === 0 && !loadingUserClientesFromFilters) {
    return <div className="text-center text-orange-600 p-8">Sem acesso a clientes.</div>;
  }
   if (userProfile.role === 'master' && currentAllowedClientesFromAuth.length === 0 && !loadingUserClientesFromFilters) {
    return <div className="text-center text-orange-600 p-8">Nenhum cliente ativo cadastrado.</div>;
  }

  // Constrói o título do contexto do cliente para os gráficos
  let dashboardTitleContext = ""; 
  if (Array.isArray(selectedClienteIds) && selectedClienteIds.length === 1 && currentAllowedClientesFromAuth.length > 0) {
    const cliente = currentAllowedClientesFromAuth.find(c => c.id === selectedClienteIds[0]);
    dashboardTitleContext = cliente ? ` de: ${cliente.nome}` : "";
  } else if (Array.isArray(selectedClienteIds) && selectedClienteIds.length > 1) {
    dashboardTitleContext = ` de ${selectedClienteIds.length} clientes selecionados`;
  } else if (Array.isArray(selectedClienteIds) && currentAllowedClientesFromAuth.length > 0 && selectedClienteIds.length === currentAllowedClientesFromAuth.length) {
     dashboardTitleContext = userProfile.role === 'master' ? " (Todos os Clientes Ativos)" : " (Todos os Seus Clientes Permitidos)";
  }
  
  // Constrói o título do período para os gráficos de barras e linha
  let periodTitle = "";
  const currentSelectedMonths = selectedMonths || []; // Garante que é um array
  if (allMonthsSelected || currentSelectedMonths.length === MESES_COMPLETOS.length) {
    periodTitle = `${selectedYear}`;
  } else if (currentSelectedMonths.length > 0) {
    periodTitle = currentSelectedMonths.map(mIndex => MESES_COMPLETOS[mIndex] ? MESES_COMPLETOS[mIndex].substring(0,3) : '').join(', ') + `/${selectedYear}`;
  } else {
    periodTitle = `Nenhum mês selecionado/${selectedYear}`;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboards</h1>
      </div>

      {/* DashboardFilters agora obtém a maioria dos seus dados e funções do DashboardFiltersContext */}
      {/* Passamos apenas as props que o DashboardFilters realmente precisa do AuthContext ou que são calculadas aqui */}
      <DashboardFilters 
        userProfile={userProfile} // Para a lógica de "Selecionar Todos..."
        userAllowedClientes={userAllowedClientes || []} // Para popular a lista de clientes nos filtros
        availableYears={availableYears || []} // Calculado aqui e passado para o filtro de ano
      /> 
      
      {/* Secção de Gráficos */}
      {loadingRecords && Array.isArray(selectedClienteIds) && selectedClienteIds.length > 0 ? ( 
          <div className="text-center text-gray-600 p-8">A carregar dados dos gráficos...</div>
      ) : !Array.isArray(selectedClienteIds) || selectedClienteIds.length === 0 ? ( 
          <div className="bg-white p-6 rounded-lg shadow text-center"><p className="text-gray-600">Selecione pelo menos um cliente para visualizar os dados.</p></div>
      ) : (filteredWasteRecords.length === 0 && lixoZeroChartRecords.length === 0 && allWasteRecords.length > 0) && (!selectedMonths || selectedMonths.length === 0) ? ( 
        <div className="bg-white p-6 rounded-lg shadow text-center"><p className="text-gray-600">Selecione um ou mais meses para ver os gráficos de período.</p></div>
      ) : (allWasteRecords.length === 0 && filteredWasteRecords.length === 0 && selectedClienteIds.length > 0) ? ( 
          <div className="bg-white p-6 rounded-lg shadow text-center"><p className="text-gray-600">Não há dados de resíduos registados para a seleção atual.</p></div>
      ) : (
        <>
          {/* Gráfico de Barras: Volume Diário */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Volume Diário de Resíduos ({periodTitle}){dashboardTitleContext}</h2>
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
            ) : <p className="text-center text-gray-500">Sem dados para o gráfico de volume diário neste período.</p>}
          </div>

          {/* Gráfico de Linha: Meta Lixo Zero */}
          <div className="bg-white p-6 rounded-lg shadow mt-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Meta Lixo Zero: Percentual de Rejeito ({periodTitle})
              {selectedAreaLixoZero !== 'ALL' ? ` - Área: ${selectedAreaLixoZero}` : ' - Todas as Áreas'}
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
            ) : <p className="text-center text-gray-500">Sem dados para o gráfico Meta Lixo Zero neste período/área.</p>}
          </div>

          {/* Gráficos de Pizza */}
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
