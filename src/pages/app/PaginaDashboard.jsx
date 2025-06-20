// src/pages/app/PaginaDashboard.jsx
import React, { useContext, useEffect, useState, useMemo } from 'react';

// Importações dos componentes
import AuthContext from '../../context/AuthContext';
import ClienteSelectorDropdown from '../../components/app/ClienteSelectorDropdown';
import useWasteData from '../../hooks/useWasteData';
import MonthlyComparison from '../../components/app/charts/MonthlyComparison';
import DesvioDeAterro from '../../components/app/charts/DesvioDeAterro';
import WasteTypePieChart from '../../components/app/charts/WasteTypePieChart';
import AreaPieChart from '../../components/app/charts/AreaPieChart';
import SummaryCards from '../../components/app/charts/SummaryCards';
import DashboardFilters from '../../components/app/DashboardFilters'; 

const MESES_COMPLETOS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// --- Funções de Processamento de Dados (Implementadas) ---
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

    const sortedDailyData = Object.entries(dailyDataAggregated).map(([dateKey, data]) => ({
        dateKey, name: new Date(dateKey + 'T00:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        total: data.total, rejeito: data.rejeito,
        percentualRejeito: data.total > 0 ? parseFloat(((data.rejeito / data.total) * 100).toFixed(2)) : 0
    })).sort((a, b) => new Date(a.dateKey) - new Date(b.dateKey));

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
  records.forEach(record => {
    const weight = parseFloat(record.peso || 0);
    if (isNaN(weight)) return;
    totalGeralKg += weight;
    const type = record.wasteType ? record.wasteType.toLowerCase() : '';
    if (type.includes('orgânico') || type.includes('compostavel')) {
        totalCompostavelKg += weight;
    } else if (type.includes('rejeito')) {
        totalNaoReciclavelKg += weight;
    } else {
        totalReciclavelKg += weight;
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

const SectionTitle = ({ title }) => (
  <div className="bg-green-500 text-white py-2 px-4 rounded-t-lg text-center mb-0">
    <h2 className="text-xl font-semibold">{title}</h2>
  </div>
);
// --- Fim das Funções de Processamento ---

export default function PaginaDashboard() {
  const { userProfile, userAllowedClientes, loadingAuth, loadingAllowedClientes } = useContext(AuthContext);
  
  const [selectedClienteIds, setSelectedClienteIds] = useState([]);
  const [selectAllClientesToggle, setSelectAllClientesToggle] = useState(false);
  
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState(Array.from({ length: 12 }, (_, i) => i));
  const [selectedAreas, setSelectedAreas] = useState([]);

  // Revertendo a lógica de busca para ser mais robusta.
  const { allWasteRecords, loadingRecords: loadingAllWasteRecords } = useWasteData(selectedClienteIds);
  
  const [availableYears, setAvailableYears] = useState([]);
  const [availableAreas, setAvailableAreas] = useState([]);

  useEffect(() => {
    if (!loadingAllowedClientes && userAllowedClientes?.length > 0) {
        const initialSelectedIds = userAllowedClientes.map(c => c.id);
        setSelectedClienteIds(initialSelectedIds);
        setSelectAllClientesToggle(true);
    }
  }, [userAllowedClientes, loadingAllowedClientes]);

  useEffect(() => {
    if (userAllowedClientes.length > 0 && selectedClienteIds.length > 0) {
      const areas = new Set();
      const selectedClientes = userAllowedClientes.filter(cliente => selectedClienteIds.includes(cliente.id));
      selectedClientes.forEach(cliente => {
        if (Array.isArray(cliente.areasPersonalizadas)) {
          cliente.areasPersonalizadas.forEach(area => areas.add(area));
        }
      });
      setAvailableAreas(Array.from(areas).sort());
    } else {
      setAvailableAreas([]);
    }
    setSelectedAreas([]);
  }, [selectedClienteIds, userAllowedClientes]);

  // Lógica robusta: define os anos disponíveis e o padrão a partir dos dados recebidos.
  useEffect(() => {
    if (allWasteRecords.length > 0) {
      const yearsFromData = Array.from(new Set(allWasteRecords.map(r => new Date(r.timestamp).getFullYear()))).sort((a, b) => b - a);
      setAvailableYears(yearsFromData);
      
      if (yearsFromData.length > 0 && selectedYears.length === 0) {
        setSelectedYears([yearsFromData[0]]);
      }
    }
  }, [allWasteRecords, selectedYears]);

  const recordsFullyFiltered = useMemo(() => {
    if (selectedYears.length === 0 || loadingAllWasteRecords || allWasteRecords.length === 0) {
        return [];
    }
    return allWasteRecords.filter(record => {
      if (!record || !record.timestamp) return false;
      const recordDate = new Date(record.timestamp);
      if (isNaN(recordDate.getTime())) return false;
      
      const recordYear = recordDate.getFullYear();
      const recordMonth = recordDate.getMonth();

      const yearMatch = selectedYears.includes(recordYear);
      const monthMatch = selectedMonths.includes(recordMonth);
      const areaMatch = selectedAreas.length === 0 || selectedAreas.includes(record.areaLancamento);

      return yearMatch && monthMatch && areaMatch;
    });
  }, [allWasteRecords, selectedYears, selectedMonths, selectedAreas, loadingAllWasteRecords]);

  // Handlers
  const handleClienteSelectionChange = (clienteId) => {
    setSelectedClienteIds(prev => {
        const newSelection = prev.includes(clienteId) ? prev.filter(id => id !== clienteId) : [...prev, clienteId];
        if (userAllowedClientes) { setSelectAllClientesToggle(newSelection.length === userAllowedClientes.length); }
        return newSelection;
    });
  };
  const handleSelectAllClientesToggleChange = () => {
    setSelectAllClientesToggle(prev => {
        const newToggleState = !prev;
        if (newToggleState && userAllowedClientes) { setSelectedClienteIds(userAllowedClientes.map(c => c.id)); } 
        else { setSelectedClienteIds([]); }
        return newToggleState;
    });
  };

  const handleYearToggle = (year) => {
    setSelectedYears(prev => {
      const newSelection = prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year];
      return newSelection.length === 0 ? prev : newSelection;
    });
  };

  const handleMonthToggle = (monthIndex) => {
    setSelectedMonths(prev => {
      const newSelection = prev.includes(monthIndex) ? prev.filter(m => m !== monthIndex) : [...prev, monthIndex];
      return newSelection.length === 0 ? prev : newSelection;
    });
  };
  const handleSelectAllMonthsToggle = () => {
    setSelectedMonths(prev => prev.length === 12 ? prev : Array.from({ length: 12 }, (_, i) => i));
  };
  
  const summaryData = useMemo(() => processDataForSummaryCards(recordsFullyFiltered), [recordsFullyFiltered]);
  const { pieData: wasteTypePieData } = useMemo(() => processDataForPieChartByWeight(recordsFullyFiltered, 'wasteType'), [recordsFullyFiltered]);
  const { pieData: areaPieData } = useMemo(() => processDataForPieChartByWeight(recordsFullyFiltered, 'areaLancamento'), [recordsFullyFiltered]);
  const desvioDeAterroData = useMemo(() => processDataForDesvioDeAterro(recordsFullyFiltered, "Rejeito"), [recordsFullyFiltered]);
  
  const comparisonYears = useMemo(() => {
    const sortedSelectedYears = [...availableYears].sort((a, b) => b - a);
    if (sortedSelectedYears.length === 0) return [new Date().getFullYear()];
    if (sortedSelectedYears.length === 1) return [sortedSelectedYears[0]];
    return [sortedSelectedYears[0], sortedSelectedYears[1]];
  }, [availableYears]);

  const { data: monthlyComparisonChartData, years: actualYearsInComparisonData } = useMemo(() => {
    return processDataForMonthlyYearlyComparison(allWasteRecords, comparisonYears[0], comparisonYears[1] || comparisonYears[0]);
  }, [allWasteRecords, comparisonYears]);

  if (loadingAuth || loadingAllowedClientes) {
      return <div className="p-8 text-center text-gray-700">A carregar...</div>;
  }
    
  return (
    <div className="bg-gray-100 min-h-screen p-4 md:p-6 space-y-6">
      <div className="bg-slate-700 text-white py-3 px-6 rounded-md shadow-lg"><h1 className="text-2xl md:text-3xl font-bold text-center">DASHBOARD</h1></div>
      
      <ClienteSelectorDropdown userAllowedClientes={userAllowedClientes} selectedClienteIds={selectedClienteIds} onClienteSelectionChange={handleClienteSelectionChange} selectAllClientesToggle={selectAllClientesToggle} onSelectAllClientesToggleChange={handleSelectAllClientesToggleChange} loadingAllowedClientes={loadingAllowedClientes} userProfile={userProfile} />
      
      <DashboardFilters 
        selectedYears={selectedYears} 
        onYearToggle={handleYearToggle} 
        availableYears={availableYears} 
        selectedMonths={selectedMonths} 
        onMonthToggle={handleMonthToggle} 
        allMonthsSelected={selectedMonths.length === 12} 
        onSelectAllMonthsToggle={handleSelectAllMonthsToggle} 
        selectedAreas={selectedAreas} 
        onSelectedAreasChange={setSelectedAreas} 
        availableAreas={availableAreas} 
        isLoading={loadingAllWasteRecords || selectedYears.length === 0} 
      />
      
      <div className="mt-8 space-y-8">
        {loadingAllWasteRecords || selectedYears.length === 0 ? (<div className="text-center p-8 text-gray-600">A carregar dados dos resíduos...</div>) :
         !selectedClienteIds.length ? (<div className="p-6 bg-white rounded-lg shadow text-center">Por favor, selecione um cliente para visualizar os dados.</div>) :
         !allWasteRecords.length ? (<div className="p-6 bg-white rounded-lg shadow text-center">Nenhum dado de resíduo registado para os clientes selecionados.</div>) : (
          <>
            <section>
                <SectionTitle title="VISÃO GERAL" />
                {recordsFullyFiltered.length > 0 ? <SummaryCards summaryData={summaryData} isLoading={loadingAllWasteRecords} /> : <div className="p-6 bg-white rounded-b-lg shadow text-center">Nenhum dado encontrado para os filtros selecionados.</div>}
            </section>
            <section>
                <SectionTitle title="GERAÇÃO POR MÊS (COMPARATIVO ANUAL)" />
                <MonthlyComparison chartData={monthlyComparisonChartData} yearsToCompare={actualYearsInComparisonData} isLoading={loadingAllWasteRecords} />
            </section>
            <section>
                <SectionTitle title="COMPOSIÇÃO DA GERAÇÃO" />
                {recordsFullyFiltered.length > 0 ? (
                    <div className="bg-white p-4 md:p-6 rounded-b-lg shadow grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <WasteTypePieChart data={wasteTypePieData} isLoading={loadingAllWasteRecords} />
                        <AreaPieChart data={areaPieData} isLoading={loadingAllWasteRecords} />
                    </div>
                ) : (<div className="p-6 bg-white rounded-b-lg shadow text-center">Sem dados de composição para o período selecionado.</div>)}
            </section>
            <section>
                <SectionTitle title="COMPOSIÇÃO DA DESTINAÇÃO" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-0">
                    {recordsFullyFiltered.length > 0 ? <DesvioDeAterro data={desvioDeAterroData} titleParts={{}} isLoading={loadingAllWasteRecords} /> : <div className="p-6 bg-white rounded-lg shadow text-center min-h-[488px] flex items-center justify-center">Sem dados de destinação para o período selecionado.</div>}
                    <div className="p-6 bg-white rounded-lg shadow h-full flex items-center justify-center min-h-[488px]"><p className="text-gray-500 text-xl">Em Desenvolvimento</p></div>
                </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
