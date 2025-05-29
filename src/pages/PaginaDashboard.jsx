// src/pages/PaginaDashboard.jsx
import React, { useContext, useEffect, useState, useMemo } from 'react';
import AuthContext from '../context/AuthContext';
import {
    Tooltip, Legend, ResponsiveContainer,
    XAxis, YAxis, CartesianGrid
} from 'recharts';
import DashboardFilters from '../components/DashboardFilters';
import ClienteSelectorDropdown from '../components/ClienteSelectorDropdown';
import useWasteData from '../hooks/useWasteData';
import MonthlyComparison from '../components/charts/MonthlyComparison';
import DesvioDeAterro from '../components/charts/DesvioDeAterro';
import WasteTypePieChart from '../components/charts/WasteTypePieChart';
import AreaPieChart from '../components/charts/AreaPieChart';
import SummaryCards from '../components/charts/SummaryCards';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AA336A', '#3D9140', '#FF5733', '#8333FF'];
const MESES_COMPLETOS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// --- Funções de Processamento de Dados ---
const processDataForPieChartByWeight = (records, groupByField) => {
  if (!Array.isArray(records) || records.length === 0) return { pieData: [], totalWeight: 0 };
  let totalWeight = 0;
  const counts = records.reduce((acc, record) => {
    if (!record) return acc;
    const key = record[groupByField] || 'Não especificado';
    const weight = parseFloat(record.peso || 0);
    if (isNaN(weight)) return acc;
    acc[key] = (acc[key] || 0) + weight;
    totalWeight += weight;
    return acc;
  }, {});
  const pieData = Object.entries(counts).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));
  return { pieData, totalWeight: parseFloat(totalWeight.toFixed(2)) };
};

const processDataForDesvioDeAterro = (records, rejectCategoryName = "Rejeito") => {
    if (!Array.isArray(records) || records.length === 0) return [];
    const dailyDataAggregated = records.reduce((acc, record) => {
        if (!record || !record.timestamp) return acc;
        const recordTimestamp = typeof record.timestamp === 'number' ? record.timestamp : record.timestamp?.toDate?.().getTime();
        if (!recordTimestamp) return acc;
        const dateKey = new Date(recordTimestamp).toISOString().split('T')[0];
        const weight = parseFloat(record.peso || 0);
        if (isNaN(weight)) return acc;
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

const processDataForMonthlyYearlyComparison = (records, year1, year2) => {
  if (!Array.isArray(records)) return { data: [], years: [] };
  const monthlyData = {};
  records.forEach(record => {
    if (!record || !record.timestamp || typeof record.peso !== 'number') return;
    const recordDate = new Date(record.timestamp);
    const recordYear = recordDate.getFullYear();
    const recordMonth = recordDate.getMonth();
    const weight = parseFloat(record.peso || 0);
    if (isNaN(weight)) return;
    if (recordYear === year1 || recordYear === year2) {
      if (!monthlyData[recordMonth]) monthlyData[recordMonth] = {};
      if (!monthlyData[recordMonth][recordYear]) monthlyData[recordMonth][recordYear] = 0;
      monthlyData[recordMonth][recordYear] += weight;
    }
  });
  const chartData = MESES_COMPLETOS.map((monthName, index) => {
    const dataPoint = { month: monthName };
    if (monthlyData[index]) {
      if (monthlyData[index][year1] !== undefined) dataPoint[year1.toString()] = parseFloat(monthlyData[index][year1].toFixed(2));
      if (year1 !== year2 && monthlyData[index][year2] !== undefined) dataPoint[year2.toString()] = parseFloat(monthlyData[index][year2].toFixed(2));
    }
    return dataPoint;
  });
  const actualYearsInData = [];
  if (chartData.some(d => d[year1.toString()] !== undefined)) actualYearsInData.push(year1.toString());
  if (year1 !== year2 && chartData.some(d => d[year2.toString()] !== undefined)) actualYearsInData.push(year2.toString());
  return { data: chartData, years: actualYearsInData };
};

const processDataForSummaryCards = (records) => {
  let totalGeralKg = 0;
  let totalCompostavelKg = 0;
  let totalReciclavelKg = 0;
  let totalNaoReciclavelKg = 0;
  const CLASSIFICATION_COMPOSTAVEL = 'Compostável';
  const CLASSIFICATION_RECICLAVEL = 'Reciclável';
  const CLASSIFICATION_NAO_RECICLAVEL = 'Não Reciclável';

  records.forEach(record => {
    const weight = parseFloat(record.peso || 0);
    if (isNaN(weight)) return;
    totalGeralKg += weight;
    const type = record.wasteType ? record.wasteType.toLowerCase() : '';
    if (type.includes('orgânico') || type.includes('compostavel')) {
        totalCompostavelKg += weight;
    } else if (type.includes('papel') || type.includes('plastico') || type.includes('metal') || type.includes('vidro') || type.includes('reciclavel')) {
        totalReciclavelKg += weight;
    } else {
        totalNaoReciclavelKg += weight;
    }
  });
  const percentCompostavel = totalGeralKg > 0 ? (totalCompostavelKg / totalGeralKg) * 100 : 0;
  const percentReciclavel = totalGeralKg > 0 ? (totalReciclavelKg / totalGeralKg) * 100 : 0;
  const percentNaoReciclavel = totalGeralKg > 0 ? (totalNaoReciclavelKg / totalGeralKg) * 100 : 0;
  return {
    totalGeralKg: parseFloat(totalGeralKg.toFixed(2)),
    compostavel: { kg: parseFloat(totalCompostavelKg.toFixed(2)), percent: parseFloat(percentCompostavel.toFixed(2)) },
    reciclavel: { kg: parseFloat(totalReciclavelKg.toFixed(2)), percent: parseFloat(percentReciclavel.toFixed(2)) },
    naoReciclavel: { kg: parseFloat(totalNaoReciclavelKg.toFixed(2)), percent: parseFloat(percentNaoReciclavel.toFixed(2)) },
  };
};

// Helper para formatar números
const formatNumberBR = (number, decimalPlaces = 2) => {
  if (typeof number !== 'number' || isNaN(number)) return '0,00';
  return number.toLocaleString('pt-BR', { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces });
};

// Componente auxiliar para títulos de seção
const SectionTitle = ({ title }) => (
  <div className="bg-green-500 text-white py-2 px-4 rounded-t-lg text-center mb-0"> {/* mb-0 para colar no card abaixo */}
    <h2 className="text-xl font-semibold">{title}</h2>
  </div>
);


export default function PaginaDashboard() {
  const { userProfile, currentUser, userAllowedClientes, loadingAllowedClientes } = useContext(AuthContext);
  const [selectedClienteIds, setSelectedClienteIds] = useState([]);
  const [selectAllClientesToggle, setSelectAllClientesToggle] = useState(false);
  const currentSystemYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth();
  const [selectedYear, setSelectedYear] = useState(currentSystemYear);
  const [selectedMonths, setSelectedMonths] = useState([currentMonthIndex]);
  const [allMonthsSelected, setAllMonthsSelected] = useState(false);
  const [availableAreas, setAvailableAreas] = useState([]);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const { allWasteRecords, loadingRecords: loadingAllWasteRecords } = useWasteData(selectedClienteIds);
  const [filteredWasteRecords, setFilteredWasteRecords] = useState([]);

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
    if (years.size === 0 && !loadingAllWasteRecords) years.add(currentSystemYear);
    return Array.from(years).sort((a,b) => b - a);
  }, [allWasteRecords, currentSystemYear, loadingAllWasteRecords]);

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
    const areasInFilteredPeriodRecords = new Set();
    recordsInPeriod.forEach(record => { if(record && record.areaLancamento) areasInFilteredPeriodRecords.add(record.areaLancamento); });
    const newAvailableAreas = Array.from(areasInFilteredPeriodRecords).sort();
    setAvailableAreas(newAvailableAreas);
    if (selectedAreas.length > 0) {
        const stillAvailableAndSelected = selectedAreas.filter(sa => newAvailableAreas.includes(sa));
        if (stillAvailableAndSelected.length !== selectedAreas.length || !selectedAreas.every(sa => stillAvailableAndSelected.includes(sa))) {
            setSelectedAreas(stillAvailableAndSelected);
        }
    } else if (selectedAreas.length !== 0 && newAvailableAreas.length === 0) {
        setSelectedAreas([]);
    }
  }, [allWasteRecords, selectedYear, selectedMonths]);

  const recordsFullyFiltered = useMemo(() => {
    if (!Array.isArray(filteredWasteRecords)) return [];
    if (selectedAreas.length === 0) return filteredWasteRecords;
    return filteredWasteRecords.filter(record => record && record.areaLancamento && selectedAreas.includes(record.areaLancamento));
  }, [filteredWasteRecords, selectedAreas]);

  const recordsForMonthlyComparison = useMemo(() => {
    if (!Array.isArray(allWasteRecords)) return [];
    if (selectedAreas.length === 0) return allWasteRecords;
    return allWasteRecords.filter(record => record && record.areaLancamento && selectedAreas.includes(record.areaLancamento));
  }, [allWasteRecords, selectedAreas]);

  const year1ToCompareForMonthlyChart = currentSystemYear;
  const year2ToCompareForMonthlyChart = currentSystemYear - 1;
  const { data: monthlyComparisonChartData, years: actualYearsInComparisonData } = useMemo(() =>
    processDataForMonthlyYearlyComparison(
      recordsForMonthlyComparison, year1ToCompareForMonthlyChart, year2ToCompareForMonthlyChart
    ), [recordsForMonthlyComparison, year1ToCompareForMonthlyChart, year2ToCompareForMonthlyChart]
  );

  const handleClienteSelectionChange = (clienteId) => { setSelectedClienteIds(prev => { const newSelection = prev.includes(clienteId) ? prev.filter(id => id !== clienteId) : [...prev, clienteId]; if (userAllowedClientes) { setSelectAllClientesToggle(newSelection.length === userAllowedClientes.length && userAllowedClientes.length > 0); } return newSelection; }); };
  const handleSelectAllClientesToggleChange = () => { setSelectAllClientesToggle(prev => { const newToggleState = !prev; if (newToggleState && userAllowedClientes) { setSelectedClienteIds(userAllowedClientes.map(c => c.id)); } else { setSelectedClienteIds([]); } return newToggleState; });};
  const handleMonthToggle = (monthIndex) => { setSelectedMonths(prev => { const newSelection = prev.includes(monthIndex) ? prev.filter(m => m !== monthIndex) : [...prev, monthIndex]; setAllMonthsSelected(newSelection.length === MESES_COMPLETOS.length); return newSelection; }); };
  const handleSelectAllMonthsToggle = () => { setAllMonthsSelected(prev => { const newToggleState = !prev; if (newToggleState) setSelectedMonths(MESES_COMPLETOS.map((_, index) => index)); else setSelectedMonths([]); return newToggleState; }); };
  const handleSelectedAreasChange = (newAreas) => { setSelectedAreas(Array.isArray(newAreas) ? newAreas : []);};

  const summaryData = useMemo(() => processDataForSummaryCards(recordsFullyFiltered), [recordsFullyFiltered]);
  const { pieData: wasteTypePieData } = processDataForPieChartByWeight(recordsFullyFiltered, 'wasteType');
  const { pieData: areaPieData } = processDataForPieChartByWeight(recordsFullyFiltered, 'areaLancamento');
  const desvioDeAterroData = processDataForDesvioDeAterro(recordsFullyFiltered);

  if (loadingAllowedClientes && !userProfile) return <div className="text-center text-gray-600 p-8">A carregar dados de autenticação...</div>;
  if (!userProfile && currentUser) return <div className="text-center text-gray-600 p-8">A carregar perfil do utilizador...</div>;
  if (!userProfile || (userProfile.role !== 'master' && userProfile.role !== 'gerente')) {
    return <div className="text-center text-red-500 p-8">Acesso Negado. Contacte o administrador.</div>;
  }
  const currentAllowedClientesFromAuth = userAllowedClientes || [];
  if (userProfile.role === 'gerente' && currentAllowedClientesFromAuth.length === 0 && !loadingAllowedClientes) {
    return <div className="text-center text-orange-600 p-8">Nenhum cliente associado ao seu perfil. Contacte o administrador.</div>;
  }
   if (userProfile.role === 'master' && currentAllowedClientesFromAuth.length === 0 && !loadingAllowedClientes) {
    return <div className="text-center text-orange-600 p-8">Nenhum cliente ativo cadastrado no sistema.</div>;
  }

  const dashboardTitleContext = useMemo(() => { if (selectAllClientesToggle || (Array.isArray(selectedClienteIds) && currentAllowedClientesFromAuth.length > 0 && selectedClienteIds.length === currentAllowedClientesFromAuth.length)) { return userProfile.role === 'master' ? " (Todos os Clientes Ativos)" : " (Todos os Seus Clientes)"; } else if (Array.isArray(selectedClienteIds) && selectedClienteIds.length === 1 && currentAllowedClientesFromAuth.length > 0) { const cliente = currentAllowedClientesFromAuth.find(c => c.id === selectedClienteIds[0]); return cliente ? ` de: ${cliente.nome}` : ""; } else if (Array.isArray(selectedClienteIds) && selectedClienteIds.length > 1) { return ` de ${selectedClienteIds.length} clientes`; } return ""; }, [selectedClienteIds, selectAllClientesToggle, currentAllowedClientesFromAuth, userProfile]);
  const periodTitleForFilteredCharts = useMemo(() => { if (allMonthsSelected || (Array.isArray(selectedMonths) && selectedMonths.length === MESES_COMPLETOS.length)) { return `${selectedYear}`; } else if (Array.isArray(selectedMonths) && selectedMonths.length > 0) { return selectedMonths.map(mIndex => MESES_COMPLETOS[mIndex] ? MESES_COMPLETOS[mIndex].substring(0,3) : '').join(', ') + `/${selectedYear}`; } return `Nenhum mês selecionado/${selectedYear}`; }, [selectedMonths, selectedYear, allMonthsSelected]);
  const areaTitleSegmentForFilteredCharts = useMemo(() => { if (selectedAreas.length === 1) return ` - Área: ${selectedAreas[0]}`; if (selectedAreas.length > 1) return ` - Áreas Selecionadas (${selectedAreas.length})`; return selectedAreas.length === 0 && availableAreas.length > 0 ? ' - Todas as Áreas Disponíveis' : ''; }, [selectedAreas, availableAreas]);

  const fullyFilteredTitleParts = { periodTitleForOtherCharts: periodTitleForFilteredCharts, areaTitleSegmentForOtherCharts: areaTitleSegmentForFilteredCharts, dashboardTitleContext };
  const pieChartsTitleContext = ` (${periodTitleForFilteredCharts})${areaTitleSegmentForFilteredCharts}${dashboardTitleContext}`;
  const summaryCardsTitleContext = ` (${periodTitleForFilteredCharts})${areaTitleSegmentForFilteredCharts}${dashboardTitleContext}`;

  const isLoadingPeriodAreaFilteredData = loadingAllWasteRecords && recordsFullyFiltered.length === 0 && allWasteRecords.length > 0;

  // Define se os gráficos que dependem de filtros de período devem ser mostrados
  const showPeriodFilteredVisualizations = (selectedMonths && selectedMonths.length > 0) || allMonthsSelected;

  return (
    <div className="bg-gray-100 min-h-screen p-4 md:p-6"> {/* Fundo da página */}
      {/* Barra de Título Principal */}
      <div className="bg-slate-700 text-white py-3 px-6 rounded-md mb-6 shadow-lg">
        <h1 className="text-2xl md:text-3xl font-bold text-center">DASHBOARD</h1>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 px-1">
        {/* O título "Dashboards" que estava aqui foi movido para a barra principal */}
        <div></div> {/* Espaço para alinhar o seletor de cliente à direita se necessário */}
        <ClienteSelectorDropdown
            userAllowedClientes={userAllowedClientes}
            selectedClienteIds={selectedClienteIds}
            onClienteSelectionChange={handleClienteSelectionChange}
            selectAllClientesToggle={selectAllClientesToggle}
            onSelectAllClientesToggleChange={handleSelectAllClientesToggleChange}
            loadingAllowedClientes={loadingAllowedClientes}
            userProfile={userProfile}
        />
      </div>

      {/* Filtros */}
      {/* O DashboardFilters já tem seu próprio título interno "Filtrar Período e Área" e estilo de card */}
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
      />

      {/* Conteúdo Principal dos Gráficos e Indicadores */}
      <div className="mt-8 space-y-8">
        {loadingAllWasteRecords && Array.isArray(selectedClienteIds) && selectedClienteIds.length > 0 && allWasteRecords.length === 0 ? (
          <div className="text-center text-gray-600 p-8">A carregar dados...</div>
        ) : !Array.isArray(selectedClienteIds) || selectedClienteIds.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow text-center"><p className="text-gray-600">Selecione pelo menos um cliente para visualizar os dados.</p></div>
        ) : (allWasteRecords.length === 0 && selectedClienteIds.length > 0 && !loadingAllWasteRecords) ? (
          <div className="bg-white p-6 rounded-lg shadow text-center"><p className="text-gray-600">Não há dados de resíduos registados para a seleção atual de clientes.</p></div>
        ) : (
          <>
            {/* Seção: VISÃO GERAL */}
            <section>
              <SectionTitle title="VISÃO GERAL" />
              {showPeriodFilteredVisualizations ? (
                <SummaryCards
                  summaryData={summaryData}
                  isLoading={isLoadingPeriodAreaFilteredData}
                  // titleContext={summaryCardsTitleContext} // O título já está na SectionTitle
                />
              ) : (
                <div className="bg-white p-6 rounded-b-lg shadow text-center"><p className="text-gray-600">Selecione um ou mais meses para visualizar os indicadores de Visão Geral.</p></div>
              )}
            </section>

            {/* Seção: GERAÇÃO POR MÊS */}
            <section>
              <SectionTitle title="GERAÇÃO POR MÊS" />
              {/* MonthlyComparison não tem título interno, então o SectionTitle é suficiente */}
              <MonthlyComparison
                chartData={monthlyComparisonChartData}
                yearsToCompare={actualYearsInComparisonData}
                // titleContext={dashboardTitleContext} // Título já está na SectionTitle
                isLoading={loadingAllWasteRecords && monthlyComparisonChartData.length === 0 && allWasteRecords.length === 0}
              />
            </section>

            {/* Seção: COMPOSIÇÃO DA GERAÇÃO */}
            <section>
              <SectionTitle title="COMPOSIÇÃO DA GERAÇÃO" />
              {showPeriodFilteredVisualizations ? (
                (recordsFullyFiltered.length > 0 || isLoadingPeriodAreaFilteredData) ? (
                  <div className="bg-white p-4 md:p-6 rounded-b-lg shadow grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <WasteTypePieChart
                      data={wasteTypePieData}
                      isLoading={isLoadingPeriodAreaFilteredData}
                      // titleContext={pieChartsTitleContext} // Títulos internos dos componentes de pizza podem ser ajustados ou removidos
                    />
                    <AreaPieChart
                      data={areaPieData}
                      isLoading={isLoadingPeriodAreaFilteredData}
                      // titleContext={pieChartsTitleContext}
                    />
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-b-lg shadow text-center"><p className="text-gray-500 py-4">Sem dados de composição para os filtros selecionados.</p></div>
                )
              ) : (
                <div className="bg-white p-6 rounded-b-lg shadow text-center"><p className="text-gray-500">Selecione um ou mais meses para visualizar os gráficos de composição.</p></div>
              )}
            </section>

            {/* Seção: COMPOSIÇÃO DA DESTINAÇÃO */}
            <section>
              <SectionTitle title="COMPOSIÇÃO DA DESTINAÇÃO" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-0"> {/* mt-0 para colar na SectionTitle */}
                {showPeriodFilteredVisualizations ? (
                  <DesvioDeAterro
                    data={desvioDeAterroData}
                    titleParts={fullyFilteredTitleParts} // Correção: Passando titleParts
                    isLoading={isLoadingPeriodAreaFilteredData}
                    noDataMessageDetails={(recordsFullyFiltered.length === 0 && showPeriodFilteredVisualizations && !loadingAllWasteRecords) ? " Nenhum registro encontrado para os filtros aplicados." : ""}
                  />
                ) : (
                  <div className="bg-white p-6 rounded-lg shadow text-center lg:col-span-1">
                    <p className="text-gray-600">Selecione um ou mais meses para visualizar o gráfico "Desvio de Aterro".</p>
                  </div>
                )}
                {/* Placeholder para o segundo gráfico */}
                <div className="bg-white p-6 rounded-lg shadow h-full flex items-center justify-center min-h-[488px]"> {/* min-h para igualar altura do gráfico de Desvio */}
                  <p className="text-gray-500 text-xl">Em Desenvolvimento</p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
