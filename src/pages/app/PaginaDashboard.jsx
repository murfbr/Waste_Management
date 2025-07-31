// src/pages/app/PaginaDashboard.jsx
import React, { useContext, useEffect, useState, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';

// Importações dos componentes
import AuthContext from '../../context/AuthContext';
import ClienteSelectorDropdown from '../../components/app/ClienteSelectorDropdown';
import useWasteData from '../../hooks/useWasteData';
import MonthlyComparison from '../../components/app/charts/MonthlyComparison';
import DesvioDeAterro from '../../components/app/charts/DesvioDeAterro';
import WasteTypePieChart from '../../components/app/charts/WasteTypePieChart';
import AreaPieChart from '../../components/app/charts/AreaPieChart';
import SummaryCards from '../../components/app/charts/SummaryCards';
import DashboardFilters from '../../components/app/filters/DashboardFilters'; 
import DestinacaoChart from '../../components/app/charts/DestinacaoChart';

const MESES_COMPLETOS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const TODOS_OS_MESES_INDICES = Array.from({ length: 12 }, (_, i) => i);

// --- Funções de Processamento de Dados ---

// FUNÇÃO ATUALIZADA: Lógica de agregação mais robusta
const processDataForAggregatedPieChart = (records) => {
  if (!Array.isArray(records) || records.length === 0) return [];

  const aggregation = records.reduce((acc, record) => {
    if (!record || !record.wasteType) return acc;

    let mainType = record.wasteType;
    let subType = record.wasteSubType;
    const weight = parseFloat(record.peso || 0);
    if (isNaN(weight)) return acc;

    // Normaliza a categoria principal para garantir o agrupamento correto
    if (mainType.startsWith('Reciclável')) {
      if (!subType) {
        const match = mainType.match(/\((.*)\)/);
        if (match) subType = match[1];
      }
      mainType = 'Reciclável';
    } else if (mainType.startsWith('Orgânico')) {
      if (!subType) {
        const match = mainType.match(/\((.*)\)/);
        if (match) subType = match[1];
      }
      mainType = 'Orgânico';
    }
    
    if (!acc[mainType]) {
      acc[mainType] = { name: mainType, value: 0, subtypes: {} };
    }

    acc[mainType].value += weight;

    const subTypeNameForList = subType || mainType;
    
    if (!acc[mainType].subtypes[subTypeNameForList]) {
        acc[mainType].subtypes[subTypeNameForList] = { name: subTypeNameForList, value: 0 };
    }
    acc[mainType].subtypes[subTypeNameForList].value += weight;

    return acc;
  }, {});

  // PÓS-PROCESSAMENTO: Remove a entrada genérica (ex: "Orgânico") do detalhe do tooltip se houver subtipos específicos.
  for (const mainType in aggregation) {
      const subtypes = aggregation[mainType].subtypes;
      const subtypeKeys = Object.keys(subtypes);
      // Se há mais de um subtipo e um deles tem o mesmo nome da categoria principal, remove-o.
      if (subtypeKeys.length > 1 && subtypes[mainType]) {
          delete subtypes[mainType];
      }
  }

  return Object.values(aggregation).map(mainCategory => ({
    ...mainCategory,
    value: parseFloat(mainCategory.value.toFixed(2)),
    subtypes: Object.values(mainCategory.subtypes).map(sub => ({
        ...sub,
        value: parseFloat(sub.value.toFixed(2))
    })).sort((a, b) => b.value - a.value)
  }));
};


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
    const sortedDailyData = Object.entries(dailyDataAggregated).map(([dateKey, data]) => {
        const percentualRejeito = data.total > 0 ? (data.rejeito / data.total) * 100 : 0;
        const taxaDesvio = 100 - percentualRejeito;
        return {
            dateKey,
            name: new Date(dateKey + 'T00:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            taxaDesvio: parseFloat(taxaDesvio.toFixed(2)),
        };
    }).sort((a, b) => new Date(a.dateKey) - new Date(b.dateKey));
    let acumuladoSomaTaxaDesvio = 0;
    return sortedDailyData.map((dataPoint, index) => {
        acumuladoSomaTaxaDesvio += dataPoint.taxaDesvio;
        const mediaTaxaDesvio = acumuladoSomaTaxaDesvio / (index + 1);
        return { ...dataPoint, mediaTaxaDesvio: parseFloat(mediaTaxaDesvio.toFixed(2)) };
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
  let totalGeralKg = 0, totalCompostavelKg = 0, totalReciclavelKg = 0, totalRejeitoKg = 0;
  records.forEach(record => {
    const weight = parseFloat(record.peso || 0);
    if (isNaN(weight)) return;
    totalGeralKg += weight;
    const type = record.wasteType ? record.wasteType.toLowerCase() : '';
    if (type.includes('orgânico') || type.includes('compostavel')) {
        totalCompostavelKg += weight;
    } else if (type.includes('rejeito')) {
        totalRejeitoKg += weight;
    } else {
        totalReciclavelKg += weight;
    }
  });
  const percentCompostavel = totalGeralKg > 0 ? (totalCompostavelKg / totalGeralKg) * 100 : 0;
  const percentReciclavel = totalGeralKg > 0 ? (totalReciclavelKg / totalGeralKg) * 100 : 0;
  const percentRejeito = totalGeralKg > 0 ? (totalRejeitoKg / totalGeralKg) * 100 : 0;

  return {
    totalGeralKg: parseFloat(totalGeralKg.toFixed(2)),
    compostavel: { kg: parseFloat(totalCompostavelKg.toFixed(2)), percent: parseFloat(percentCompostavel.toFixed(2)) },
    reciclavel: { kg: parseFloat(totalReciclavelKg.toFixed(2)), percent: parseFloat(percentReciclavel.toFixed(2)) },
    rejeito: { kg: parseFloat(totalRejeitoKg.toFixed(2)), percent: parseFloat(percentRejeito.toFixed(2)) },
  };
};

const SectionTitle = ({ title, isExpanded, onClick }) => (
    <button
      onClick={onClick}
      className={`w-full flex justify-between items-center bg-rain-forest text-white py-2 px-4 rounded-t-lg text-left focus:outline-none ${!isExpanded ? 'rounded-b-lg' : ''}`}
      aria-expanded={isExpanded}
    >
        <h2 className="font-lexend text-acao font-semibold">{title}</h2>
        <span className="text-2xl transform transition-transform duration-200">
            {isExpanded ? '▲' : '▼'}
        </span>
    </button>
);

export default function PaginaDashboard() {
  const { db, userProfile, userAllowedClientes, loadingAuth, loadingAllowedClientes } = useContext(AuthContext);
  
  const now = new Date();
  const [selectedClienteIds, setSelectedClienteIds] = useState([]);
  const [selectAllClientesToggle, setSelectAllClientesToggle] = useState(false);
  const [selectedYears, setSelectedYears] = useState([now.getFullYear()]);
  const [selectedMonths, setSelectedMonths] = useState([now.getMonth()]);
  const [selectedAreas, setSelectedAreas] = useState([]);
  
  const [availableYears, setAvailableYears] = useState([]);
  const [availableAreas, setAvailableAreas] = useState([]);

  const [empresasColeta, setEmpresasColeta] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const { allWasteRecords, loadingRecords } = useWasteData(selectedClienteIds);

  const [sectionsVisibility, setSectionsVisibility] = useState({
    summary: true,
    monthlyComparison: true,
    composition: true,
    destination: true,
  });

  const toggleSection = (section) => {
    setSectionsVisibility(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    if (!db) return;
    const fetchEmpresasColeta = async () => {
        setLoadingEmpresas(true);
        try {
            const querySnapshot = await getDocs(collection(db, "empresasColeta"));
            const empresasData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEmpresasColeta(empresasData);
        } catch (error) {
            console.error("Erro ao buscar empresas de coleta:", error);
        }
        setLoadingEmpresas(false);
    };
    fetchEmpresasColeta();
  }, [db]);


  useEffect(() => {
    if (!loadingAllowedClientes && userAllowedClientes?.length > 0) {
        const initialSelectedIds = userAllowedClientes.map(c => c.id);
        setSelectedClienteIds(initialSelectedIds);
        setSelectAllClientesToggle(true);
    }
  }, [userAllowedClientes, loadingAllowedClientes]);

  useEffect(() => {
    if (userAllowedClientes.length > 0 && selectedClienteIds.length > 0) {
      const areas = new Set(userAllowedClientes.filter(c => selectedClienteIds.includes(c.id)).flatMap(c => c.areasPersonalizadas || []));
      setAvailableAreas(Array.from(areas).sort());
    } else {
      setAvailableAreas([]);
    }
    setSelectedAreas([]);
  }, [selectedClienteIds, userAllowedClientes]);
  
  useEffect(() => {
    if (allWasteRecords.length > 0) {
      const yearsFromData = Array.from(new Set(allWasteRecords.map(r => new Date(r.timestamp).getFullYear()))).sort((a, b) => b - a);
      setAvailableYears(yearsFromData);
    }
  }, [allWasteRecords]);

  const recordsFullyFiltered = useMemo(() => {
    if (selectedYears.length === 0 || loadingRecords || allWasteRecords.length === 0) return [];
    return allWasteRecords.filter(record => {
      if (!record?.timestamp) return false;
      const recordDate = new Date(record.timestamp);
      if (isNaN(recordDate.getTime())) return false;
      const yearMatch = selectedYears.includes(recordDate.getFullYear());
      const monthMatch = selectedMonths.includes(recordDate.getMonth());
      const areaMatch = selectedAreas.length === 0 || selectedAreas.includes(record.areaLancamento);
      return yearMatch && monthMatch && areaMatch;
    });
  }, [allWasteRecords, selectedYears, selectedMonths, selectedAreas, loadingRecords]);


  const destinacaoData = useMemo(() => {
    if (recordsFullyFiltered.length === 0 || empresasColeta.length === 0) {
        return [{ name: 'Recuperação', value: 0 }, { name: 'Descarte', value: 0 }];
    }

    const empresasMap = new Map(empresasColeta.map(e => [e.id, e]));
    let recoveryWeight = 0;
    let disposalWeight = 0;
    const disposalDestinations = ['Aterro Sanitário', 'Incineração'];

    recordsFullyFiltered.forEach(record => {
        const empresaId = record.empresaColetaId;
        if (!empresaId) return;

        const empresa = empresasMap.get(empresaId);
        if (!empresa?.destinacoes) return;

        const destinacoesDoTipo = empresa.destinacoes[record.wasteType] || [];
        const isDisposal = destinacoesDoTipo.some(dest => disposalDestinations.includes(dest));

        if (isDisposal) {
            disposalWeight += record.peso;
        } else {
            recoveryWeight += record.peso;
        }
    });

    return [
        { name: 'Recuperação', value: parseFloat(recoveryWeight.toFixed(2)) },
        { name: 'Descarte', value: parseFloat(disposalWeight.toFixed(2)) }
    ];
  }, [recordsFullyFiltered, empresasColeta]);


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
        setSelectedClienteIds(newToggleState ? userAllowedClientes.map(c => c.id) : []);
        return newToggleState;
    });
  };

  const handleYearToggle = (year) => {
    setSelectedYears(prev => {
      const newSelection = prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year];
      return newSelection.length === 0 ? prev : newSelection;
    });
  };

  const handleQuickPeriodSelect = (period) => {
    const currentDate = new Date();
    let years = [];
    let months = [];

    switch (period) {
        case 'thisMonth':
            years = [currentDate.getFullYear()];
            months = [currentDate.getMonth()];
            break;
        case 'last3Months':
            let tempDate = new Date();
            for (let i = 0; i < 3; i++) {
                years.push(tempDate.getFullYear());
                months.push(tempDate.getMonth());
                tempDate.setMonth(tempDate.getMonth() - 1);
            }
            years = [...new Set(years)];
            months = [...new Set(months)];
            break;
        case 'thisYear':
            years = [currentDate.getFullYear()];
            months = TODOS_OS_MESES_INDICES;
            break;
        case 'lastYear':
            years = [currentDate.getFullYear() - 1];
            months = TODOS_OS_MESES_INDICES;
            break;
        default:
            years = [currentDate.getFullYear()];
            months = [currentDate.getMonth()];
    }
    setSelectedYears(years);
    setSelectedMonths(months);
  };

  const summaryData = useMemo(() => processDataForSummaryCards(recordsFullyFiltered), [recordsFullyFiltered]);
  const wasteTypePieData = useMemo(() => processDataForAggregatedPieChart(recordsFullyFiltered), [recordsFullyFiltered]);
  const { pieData: areaPieData } = useMemo(() => processDataForPieChartByWeight(recordsFullyFiltered, 'areaLancamento'), [recordsFullyFiltered]);
  const desvioDeAterroData = useMemo(() => processDataForDesvioDeAterro(recordsFullyFiltered, "Rejeito"), [recordsFullyFiltered]);
  const comparisonYears = useMemo(() => {
    const sortedYears = [...availableYears].sort((a, b) => b - a);
    if (sortedYears.length === 0) return [new Date().getFullYear()];
    if (sortedYears.length === 1) return [sortedYears[0]];
    return [sortedYears[0], sortedYears[1]];
  }, [availableYears]);
  const { data: monthlyComparisonChartData, years: actualYearsInComparisonData } = useMemo(() => {
    return processDataForMonthlyYearlyComparison(allWasteRecords, comparisonYears[0], comparisonYears[1] || comparisonYears[0]);
  }, [allWasteRecords, comparisonYears]);

  if (loadingAuth || loadingAllowedClientes) {
      return <div className="p-8 text-center text-rich-soil">A carregar...</div>;
  }
    
  return (
    <div className="bg-gray-50 font-comfortaa min-h-screen p-4 md:p-6 space-y-6">
      <div className="bg-blue-coral text-white py-3 px-6 rounded-md shadow-lg">
        <h1 className="font-lexend text-subtitulo font-bold text-center">DASHBOARD</h1>
      </div>
      
      <ClienteSelectorDropdown 
          userAllowedClientes={userAllowedClientes} 
          selectedClienteIds={selectedClienteIds} 
          onClienteSelectionChange={handleClienteSelectionChange} 
          selectAllClientesToggle={selectAllClientesToggle} 
          onSelectAllClientesToggleChange={handleSelectAllClientesToggleChange} 
          loadingAllowedClientes={loadingAllowedClientes} 
          userProfile={userProfile} 
      />
      
      <DashboardFilters 
        selectedYears={selectedYears} 
        onYearToggle={handleYearToggle} 
        availableYears={availableYears} 
        selectedMonths={selectedMonths} 
        onSelectedMonthsChange={setSelectedMonths}
        selectedAreas={selectedAreas} 
        onSelectedAreasChange={setSelectedAreas} 
        availableAreas={availableAreas} 
        onQuickPeriodSelect={handleQuickPeriodSelect}
        isLoading={loadingRecords || selectedYears.length === 0} 
      />
      
      <div className="mt-8 space-y-6">
        {loadingRecords || loadingEmpresas ? (<div className="text-center p-8 text-rich-soil">A carregar dados...</div>) :
         !selectedClienteIds.length ? (<div className="p-6 bg-white rounded-lg shadow text-center text-rich-soil">Por favor, selecione um cliente para visualizar os dados.</div>) :
         !allWasteRecords.length ? (<div className="p-6 bg-white rounded-lg shadow text-center text-rich-soil">Nenhum dado de resíduo registado para os clientes selecionados.</div>) : (
          <>
            <section>
                <SectionTitle 
                    title="VISÃO GERAL"
                    isExpanded={sectionsVisibility.summary}
                    onClick={() => toggleSection('summary')}
                />
                {sectionsVisibility.summary && (
                    recordsFullyFiltered.length > 0 
                        ? <SummaryCards summaryData={summaryData} isLoading={loadingRecords} /> 
                        : <div className="p-6 bg-white rounded-b-lg shadow text-center text-rich-soil">Nenhum dado encontrado para os filtros selecionados.</div>
                )}
            </section>
            <section>
                <SectionTitle 
                    title="GERAÇÃO POR MÊS (COMPARATIVO ANUAL)" 
                    isExpanded={sectionsVisibility.monthlyComparison}
                    onClick={() => toggleSection('monthlyComparison')}
                />
                {sectionsVisibility.monthlyComparison && (
                    <MonthlyComparison chartData={monthlyComparisonChartData} yearsToCompare={actualYearsInComparisonData} isLoading={loadingRecords} />
                )}
            </section>
            <section>
                <SectionTitle 
                    title="COMPOSIÇÃO DA GERAÇÃO" 
                    isExpanded={sectionsVisibility.composition}
                    onClick={() => toggleSection('composition')}
                />
                {sectionsVisibility.composition && (
                    recordsFullyFiltered.length > 0 ? (
                        <div className="bg-white p-4 md:p-6 rounded-b-lg shadow grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <WasteTypePieChart data={wasteTypePieData} isLoading={loadingRecords} />
                            <AreaPieChart data={areaPieData} isLoading={loadingRecords} />
                        </div>
                    ) : (<div className="p-6 bg-white rounded-b-lg shadow text-center text-rich-soil">Sem dados de composição para o período selecionado.</div>)
                )}
            </section>
            <section>
                <SectionTitle 
                    title="COMPOSIÇÃO DA DESTINAÇÃO" 
                    isExpanded={sectionsVisibility.destination}
                    onClick={() => toggleSection('destination')}
                />
                {sectionsVisibility.destination && (
                    <div className="bg-white p-4 md:p-6 rounded-b-lg shadow grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {recordsFullyFiltered.length > 0 ? <DesvioDeAterro data={desvioDeAterroData} isLoading={loadingRecords} /> : <div className="p-6 bg-white rounded-lg shadow text-center text-rich-soil min-h-[488px] flex items-center justify-center">Sem dados de desvio para o período selecionado.</div>}
                        
                        <DestinacaoChart 
                            data={destinacaoData} 
                            isLoading={loadingRecords || loadingEmpresas} 
                        />
                    </div>
                )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
