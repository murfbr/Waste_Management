// src/pages/app/PaginaDashboard.jsx
import React, { useContext, useEffect, useState, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

// Importações dos componentes
import AuthContext from '../../context/AuthContext';
import ClienteSelectorDropdown from '../../components/app/ClienteSelectorDropdown';
import useHybridWasteData from '../../hooks/useHybridWasteData';
import MonthlyComparison from '../../components/app/charts/MonthlyComparison';
import DesvioDeAterro from '../../components/app/charts/DesvioDeAterro';
import WasteTypePieChart from '../../components/app/charts/WasteTypePieChart';
import AreaPieChart from '../../components/app/charts/AreaPieChart';
import SummaryCards from '../../components/app/charts/SummaryCards';
import DashboardFilters from '../../components/app/filters/DashboardFilters';
import DestinacaoChart from '../../components/app/charts/DestinacaoChart';
import LazySection from '../../components/app/LazySection';

// PADRONIZADO: Única função robusta para criar chaves camelCase a partir de strings do DB
const toCamelCaseKey = (str) => {
    if (!str) return 'naoEspecificado';
    const s = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const parts = s.split(/[\s-]+/);
    return parts[0] + parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
};

const RealtimeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 3.5a1.5 1.5 0 011.5 1.5v.586a1.5 1.5 0 003 0V5a1.5 1.5 0 011.5-1.5h.5a1.5 1.5 0 010 3h-.5a1.5 1.5 0 01-1.5-1.5v-.586a1.5 1.5 0 00-3 0V5a1.5 1.5 0 01-1.5 1.5H10a1.5 1.5 0 01-1.5-1.5V5a1.5 1.5 0 00-3 0v.586a1.5 1.5 0 01-1.5 1.5h-.5a1.5 1.5 0 010-3h.5A1.5 1.5 0 015 5v-.586a1.5 1.5 0 00-3 0V5a1.5 1.5 0 01-1.5 1.5H.5a1.5 1.5 0 010-3h.5A1.5 1.5 0 013.5 5v.586a1.5 1.5 0 003 0V5A1.5 1.5 0 018 3.5h2zM.5 10.5a1.5 1.5 0 011.5-1.5h16a1.5 1.5 0 010 3H2a1.5 1.5 0 01-1.5-1.5zm1.5 5.5a1.5 1.5 0 000-3h14a1.5 1.5 0 000 3H2z" />
    </svg>
);

const MESES_COMPLETOS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const TODOS_OS_MESES_INDICES = Array.from({ length: 12 }, (_, i) => i);

const processDataForAggregatedPieChart = (records, t) => {
  if (!Array.isArray(records) || records.length === 0) return [];
  const aggregation = records.reduce((acc, record) => {
    if (!record || !record.wasteType) return acc;
    let mainType = record.wasteType;
    let subType = record.wasteSubType;
    const weight = parseFloat(record.peso || 0);
    if (isNaN(weight)) return acc;

    let translatedMainType;
    if (mainType.startsWith('Reciclável')) {
      if (!subType) { const match = mainType.match(/\((.*)\)/); if (match) subType = match[1]; }
      translatedMainType = t('charts:wasteTypes.reciclavel');
    } else if (mainType.startsWith('Orgânico')) {
      if (!subType) { const match = mainType.match(/\((.*)\)/); if (match) subType = match[1]; }
      translatedMainType = t('charts:wasteTypes.organico');
    } else {
      translatedMainType = t(`charts:wasteTypes.${toCamelCaseKey(mainType)}`, mainType);
    }
    
    const translatedSubType = subType ? t(`charts:wasteSubTypes.${toCamelCaseKey(subType)}`, subType) : translatedMainType;

    if (!acc[translatedMainType]) {
      acc[translatedMainType] = { name: translatedMainType, value: 0, subtypes: {} };
    }
    acc[translatedMainType].value += weight;

    if (!acc[translatedMainType].subtypes[translatedSubType]) {
      acc[translatedMainType].subtypes[translatedSubType] = { name: translatedSubType, value: 0 };
    }
    acc[translatedMainType].subtypes[translatedSubType].value += weight;
    return acc;
  }, {});

  for (const mainType in aggregation) {
      const subtypes = aggregation[mainType].subtypes;
      const subtypeKeys = Object.keys(subtypes);
      if (subtypeKeys.length > 1 && subtypes[mainType]) {
          delete subtypes[mainType];
      }
  }
  return Object.values(aggregation).map(mainCategory => ({
    ...mainCategory,
    value: parseFloat(mainCategory.value.toFixed(2)),
    subtypes: Object.values(mainCategory.subtypes).map(sub => ({ ...sub, value: parseFloat(sub.value.toFixed(2)) })).sort((a, b) => b.value - a.value)
  }));
};

const processDataForAreaChartWithBreakdown = (records, t) => {
    if (!Array.isArray(records) || records.length === 0) return [];
    const aggregation = records.reduce((acc, record) => {
        if (!record || !record.areaLancamento || !record.wasteType) return acc;
        const areaName = record.areaLancamento;
        const weight = parseFloat(record.peso || 0);
        if (isNaN(weight)) return acc;
        
        let mainWasteType = record.wasteType;
        let translatedWasteType;
        if (mainWasteType.startsWith('Reciclável')) { translatedWasteType = t('charts:wasteTypes.reciclavel'); } 
        else if (mainWasteType.startsWith('Orgânico')) { translatedWasteType = t('charts:wasteTypes.organico'); }
        else { 
            translatedWasteType = t(`charts:wasteTypes.${toCamelCaseKey(mainWasteType)}`, mainWasteType); 
        }
        
        if (!acc[areaName]) { acc[areaName] = { name: areaName, value: 0, breakdown: {} }; }
        acc[areaName].value += weight;
        if (!acc[areaName].breakdown[translatedWasteType]) { acc[areaName].breakdown[translatedWasteType] = { name: translatedWasteType, value: 0 }; }
        acc[areaName].breakdown[translatedWasteType].value += weight;
        return acc;
    }, {});
    return Object.values(aggregation).map(areaData => ({
        ...areaData,
        value: parseFloat(areaData.value.toFixed(2)),
        breakdown: Object.values(areaData.breakdown).map(b => ({ ...b, value: parseFloat(b.value.toFixed(2)) })).filter(b => b.value > 0).sort((a, b) => b.value - a.value)
    }));
};

const processDataForDesvioDeAterro = (records, rejectCategoryName) => {
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
            name: new Date(dateKey).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit' }),
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

const processDataForMonthlyYearlyComparison = (records, t) => {
  if (!Array.isArray(records) || !records.length) return { data: [], years: [] };
  const monthlyData = {};
  const RECICLAVEL = t('charts:wasteTypes.reciclavel', 'Reciclável');
  const ORGANICO = t('charts:wasteTypes.organico', 'Orgânico');
  const REJEITO = t('charts:wasteTypes.rejeito', 'Rejeito');
  records.forEach(record => {
    if (!record || !record.timestamp || typeof record.peso !== 'number') return;
    const recordDate = new Date(record.timestamp);
    const recordYear = recordDate.getFullYear();
    const recordMonth = recordDate.getMonth();
    const weight = parseFloat(record.peso || 0);
    if (isNaN(weight)) return;

    if (!monthlyData[recordMonth]) { monthlyData[recordMonth] = {}; }
    if (!monthlyData[recordMonth][recordYear]) {
      monthlyData[recordMonth][recordYear] = {
        total: 0,
        breakdown: { [RECICLAVEL]: 0, [ORGANICO]: 0, [REJEITO]: 0 }
      };
    }
    monthlyData[recordMonth][recordYear].total += weight;
    const type = record.wasteType ? record.wasteType.toLowerCase() : '';
    if (type.includes('orgânico') || type.includes('compostavel')) {
        monthlyData[recordMonth][recordYear].breakdown[ORGANICO] += weight;
    } else if (type.includes('rejeito')) {
        monthlyData[recordMonth][recordYear].breakdown[REJEITO] += weight;
    } else {
        monthlyData[recordMonth][recordYear].breakdown[RECICLAVEL] += weight;
    }
  });

  const yearsInDate = [...new Set(records.map(r => new Date(r.timestamp).getFullYear()))].sort((a,b) => b - a);

  const chartData = MESES_COMPLETOS.map((monthName, index) => {
    const dataPoint = { month: monthName };
    if (monthlyData[index]) {
        yearsInDate.forEach(year => {
            if (monthlyData[index][year] !== undefined) {
                const yearData = monthlyData[index][year];
                dataPoint[year.toString()] = {
                    total: parseFloat(yearData.total.toFixed(2)),
                    breakdown: {
                        [RECICLAVEL]: parseFloat(yearData.breakdown[RECICLAVEL].toFixed(2)),
                        [ORGANICO]: parseFloat(yearData.breakdown[ORGANICO].toFixed(2)),
                        [REJEITO]: parseFloat(yearData.breakdown[REJEITO].toFixed(2)),
                    }
                };
            }
        });
    }
    return dataPoint;
  });

  return { data: chartData, years: yearsInDate.map(y => y.toString()) };
};

const processDataForSummaryCards = (records) => {
  if (!Array.isArray(records) || records.length === 0) return { totalGeralKg: 0, organico: {}, reciclavel: {}, rejeito: {} };
  let totalGeralKg = 0, totalOrganicoKg = 0, totalReciclavelKg = 0, totalRejeitoKg = 0;
  records.forEach(record => {
    const weight = parseFloat(record.peso || 0);
    if (isNaN(weight)) return;
    totalGeralKg += weight;
    const type = record.wasteType ? record.wasteType.toLowerCase() : '';
    if (type.includes('orgânico') || type.includes('compostavel')) {
        totalOrganicoKg += weight;
    } 
    else if (type.includes('rejeito')) {
        totalRejeitoKg += weight;
    } 
    else {
        totalReciclavelKg += weight;
    }
  });

  const percentOrganico = totalGeralKg > 0 ? (totalOrganicoKg / totalGeralKg) * 100 : 0;
  const percentReciclavel = totalGeralKg > 0 ? (totalReciclavelKg / totalGeralKg) * 100 : 0;
  const percentRejeito = totalGeralKg > 0 ? (totalRejeitoKg / totalGeralKg) * 100 : 0;

  return {
    totalGeralKg: parseFloat(totalGeralKg.toFixed(2)),
    organico: { kg: parseFloat(totalOrganicoKg.toFixed(2)), percent: parseFloat(percentOrganico.toFixed(2)) },
    reciclavel: { kg: parseFloat(totalReciclavelKg.toFixed(2)), percent: parseFloat(percentReciclavel.toFixed(2)) },
    rejeito: { kg: parseFloat(totalRejeitoKg.toFixed(2)), percent: parseFloat(percentRejeito.toFixed(2)) },
  };
};

const SectionTitle = ({ title, isExpanded, onClick }) => (
    <button onClick={onClick} className={`w-full flex justify-between items-center bg-rain-forest text-white py-2 px-4 rounded-t-lg text-left focus:outline-none ${!isExpanded ? 'rounded-b-lg' : ''}`} aria-expanded={isExpanded}>
        <h2 className="font-lexend text-acao font-semibold">{title}</h2>
        <span className="text-2xl transform transition-transform duration-200">{isExpanded ? '▲' : '▼'}</span>
    </button>
);

export default function PaginaDashboard() {
  const { t } = useTranslation(['dashboard', 'charts']);
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

  const [isMonthlyComparisonVisible, setIsMonthlyComparisonVisible] = useState(false);
  const [isCompositionVisible, setIsCompositionVisible] = useState(false);
  const [isDestinationVisible, setIsDestinationVisible] = useState(false);

  const [sectionsVisibility, setSectionsVisibility] = useState({ summary: true, monthlyComparison: true, composition: true, destination: true });
  const toggleSection = (section) => setSectionsVisibility(prev => ({ ...prev, [section]: !prev[section] }));

  const dashboardMode = useMemo(() => {
    if (!selectedClienteIds.length || !userAllowedClientes.length) {
      return 'ondemand';
    }
    const isRealtime = userAllowedClientes
      .filter(c => selectedClienteIds.includes(c.id))
      .some(c => c.realtimeDashboardEnabled === true);
    
    return isRealtime ? 'realtime' : 'ondemand';
  }, [selectedClienteIds, userAllowedClientes]);
  
  const { wasteRecords: recordsFullyFiltered, loading: loadingRecords } = useHybridWasteData(
    selectedClienteIds, 
    selectedYears, 
    selectedMonths,
    dashboardMode
  );

  const { wasteRecords: recordsForComparison, loading: loadingComparisonRecords } = useHybridWasteData(
    selectedClienteIds, 
    selectedYears, 
    TODOS_OS_MESES_INDICES,
    dashboardMode
  );

  useEffect(() => {
    if (!db) return;
    const fetchEmpresasColeta = async () => {
        setLoadingEmpresas(true);
        try {
            const querySnapshot = await getDocs(collection(db, "empresasColeta"));
            setEmpresasColeta(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) { console.error("Erro ao buscar empresas de coleta:", error); }
        setLoadingEmpresas(false);
    };
    fetchEmpresasColeta();
  }, [db]);


  useEffect(() => {
    if (!loadingAllowedClientes && userAllowedClientes?.length > 0) {
        if (selectedClienteIds.length === 0) {
            const firstClienteId = userAllowedClientes[0].id;
            setSelectedClienteIds([firstClienteId]);
            setSelectAllClientesToggle(false);
        }
    }
  }, [userAllowedClientes, loadingAllowedClientes, selectedClienteIds]);

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
    if (recordsForComparison.length > 0) {
      const yearsFromData = Array.from(new Set(recordsForComparison.map(r => new Date(r.timestamp).getFullYear()))).sort((a, b) => b - a);
      setAvailableYears(yearsFromData);
    }
  }, [recordsForComparison]);

  const recordsForMonthlyComparisonChart = useMemo(() => {
    if (loadingComparisonRecords || recordsForComparison.length === 0) return [];
    return recordsForComparison.filter(record => {
        const areaMatch = selectedAreas.length === 0 || selectedAreas.includes(record.areaLancamento);
        return areaMatch;
    });
  }, [recordsForComparison, selectedAreas, loadingComparisonRecords]);

  const recordsForOtherCharts = useMemo(() => {
    if (loadingRecords || recordsFullyFiltered.length === 0) return [];
    return recordsFullyFiltered.filter(record => {
        const areaMatch = selectedAreas.length === 0 || selectedAreas.includes(record.areaLancamento);
        return areaMatch;
    });
  }, [recordsFullyFiltered, selectedAreas, loadingRecords]);

  const destinacaoData = useMemo(() => {
    if (!isDestinationVisible) return [];
    
    if (recordsForOtherCharts.length === 0 || empresasColeta.length === 0) {
        return [];
    }

    const empresasMap = new Map(empresasColeta.map(e => [e.id, e]));
    const disposalDestinations = ['Aterro Sanitário', 'Incineração'];

    const recoveryData = { value: 0, breakdown: {} };
    const disposalData = { value: 0, breakdown: {} };

    recordsForOtherCharts.forEach(record => {
        const empresa = empresasMap.get(record.empresaColetaId);
        if (!empresa?.destinacoes || !record.wasteType) return;

        let mainWasteType = record.wasteType;
        if (mainWasteType.startsWith('Reciclável')) { mainWasteType = 'Reciclável'; }
        else if (mainWasteType.startsWith('Orgânico')) { mainWasteType = 'Orgânico'; }

        const destinacoesDoTipo = empresa.destinacoes[mainWasteType] || [];
        const isDisposal = destinacoesDoTipo.some(dest => disposalDestinations.includes(dest));
        
        const destinationName = destinacoesDoTipo[0] || 'Não especificado';
        
        const destinationKey = toCamelCaseKey(destinationName);
        const translatedDestination = t(`charts:destinations.${destinationKey}`, destinationName);
        
        const weight = record.peso;

        if (isDisposal) {
            disposalData.value += weight;
            disposalData.breakdown[translatedDestination] = (disposalData.breakdown[translatedDestination] || 0) + weight;
        } else {
            recoveryData.value += weight;
            recoveryData.breakdown[translatedDestination] = (recoveryData.breakdown[translatedDestination] || 0) + weight;
        }
    });
    
    const formatBreakdown = (breakdown) => {
        return Object.entries(breakdown)
            .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
            .sort((a, b) => b.value - a.value);
    };

const result = [];
if (recoveryData.value > 0) {
    result.push({
        name: t('charts:chartLabels.recovery', 'Recovery'),
        value: parseFloat(recoveryData.value.toFixed(2)),
        breakdown: formatBreakdown(recoveryData.breakdown)
    });
}
if (disposalData.value > 0) {
    result.push({
        name: t('charts:chartLabels.disposal', 'Disposal'),
        value: parseFloat(disposalData.value.toFixed(2)),
        breakdown: formatBreakdown(disposalData.breakdown)
    });
}
    
    return result;
  }, [recordsForOtherCharts, empresasColeta, isDestinationVisible, t]);

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

  const summaryData = useMemo(() => processDataForSummaryCards(recordsForOtherCharts), [recordsForOtherCharts]);

  const wasteTypePieData = useMemo(() => {
    if (!isCompositionVisible) return [];
    return processDataForAggregatedPieChart(recordsForOtherCharts, t);
  }, [recordsForOtherCharts, isCompositionVisible, t]);

  const areaPieData = useMemo(() => {
    if (!isCompositionVisible) return [];
    return processDataForAreaChartWithBreakdown(recordsForOtherCharts, t);
  }, [recordsForOtherCharts, isCompositionVisible, t]);

  const desvioDeAterroData = useMemo(() => {
    if (!isDestinationVisible) return [];
    return processDataForDesvioDeAterro(recordsForOtherCharts, "Rejeito");
  }, [recordsForOtherCharts, isDestinationVisible]);

  const { data: monthlyComparisonChartData, years: actualYearsInComparisonData } = useMemo(() => {
    if (!isMonthlyComparisonVisible) return { data: [], years: [] };
    return processDataForMonthlyYearlyComparison(recordsForMonthlyComparisonChart, t);
  }, [recordsForMonthlyComparisonChart, isMonthlyComparisonVisible, t]);


  if (loadingAuth || loadingAllowedClientes) { return <div className="p-8 text-center text-rich-soil">A carregar...</div>; }
    
  return (
    <div className="bg-gray-50 font-comfortaa min-h-screen p-4 md:p-6 space-y-6">
      <div className="bg-blue-coral text-white py-3 px-6 rounded-md shadow-lg flex justify-center items-center relative">
        <h1 className="font-lexend text-subtitulo font-bold text-center">{t('dashboard:paginaDashboard.header.title')}</h1>
        {dashboardMode === 'realtime' && (
          <div 
            className="absolute right-4 flex items-center bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse"
            title="Os dados estão sendo atualizados em tempo real."
          >
            <RealtimeIcon />
            <span>AO VIVO</span>
          </div>
        )}
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
        isLoading={loadingRecords || loadingComparisonRecords || selectedYears.length === 0} 
      />
      
      <div className="mt-8 space-y-6">
        {loadingRecords || loadingComparisonRecords || loadingEmpresas ? (<div className="text-center p-8 text-rich-soil">{t('dashboard:paginaDashboard.filters.loadingData')}</div>) :
         !selectedClienteIds.length ? (<div className="p-6 bg-white rounded-lg shadow text-center text-rich-soil">{t('dashboard:paginaDashboard.filters.selectClient')}</div>) :
         recordsForComparison.length === 0 ? (<div className="p-6 bg-white rounded-lg shadow text-center text-rich-soil">{t('dashboard:paginaDashboard.filters.noData')}</div>) : (
          <>
            <section>
                <SectionTitle title={t('dashboard:paginaDashboard.sections.overview')} isExpanded={sectionsVisibility.summary} onClick={() => toggleSection('summary')} />
                {sectionsVisibility.summary && <SummaryCards summaryData={summaryData} isLoading={loadingRecords} />}
            </section>
            
            <LazySection onVisible={() => setIsMonthlyComparisonVisible(true)}>
              <section>
                  <SectionTitle title={t('dashboard:paginaDashboard.sections.monthlyGeneration')} isExpanded={sectionsVisibility.monthlyComparison} onClick={() => toggleSection('monthlyComparison')} />
                  {sectionsVisibility.monthlyComparison && <MonthlyComparison chartData={monthlyComparisonChartData} yearsToCompare={actualYearsInComparisonData} isLoading={loadingComparisonRecords} />}
              </section>
            </LazySection>

            <LazySection onVisible={() => setIsCompositionVisible(true)}>
              <section>
                  <SectionTitle title={t('dashboard:paginaDashboard.sections.generationComposition')} isExpanded={sectionsVisibility.composition} onClick={() => toggleSection('composition')} />
                  {sectionsVisibility.composition && (
                      <div className="bg-white p-4 md:p-6 rounded-b-lg shadow grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <WasteTypePieChart data={wasteTypePieData} isLoading={loadingRecords} />
                          <AreaPieChart data={areaPieData} isLoading={loadingRecords} />
                      </div>
                  )}
              </section>
            </LazySection>

            <LazySection onVisible={() => setIsDestinationVisible(true)}>
              <section>
                  <SectionTitle title={t('dashboard:paginaDashboard.sections.destinationComposition')} isExpanded={sectionsVisibility.destination} onClick={() => toggleSection('destination')} />
                  {sectionsVisibility.destination && (
                      <div className="bg-white p-4 md:p-6 rounded-b-lg shadow grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <DesvioDeAterro data={desvioDeAterroData} isLoading={loadingRecords} />
                          <DestinacaoChart data={destinacaoData} isLoading={loadingRecords || loadingEmpresas} />
                      </div>
                  )}
              </section>
            </LazySection>
          </>
        )}
      </div>
    </div>
  );
}

