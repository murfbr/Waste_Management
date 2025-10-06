// src/pages/app/PaginaDashboard.jsx
import React, { useContext, useEffect, useState, useMemo } from 'react';
// ALTERAÇÃO 1 de 3: Adicionado 'doc' e 'getDoc' para buscar a configuração de CO2
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Importações dos componentes
import AuthContext from '../../context/AuthContext.jsx';
import ClienteSelectorDropdown from '../../components/app/ClienteSelectorDropdown.jsx';
import useHybridWasteData from '../../hooks/useHybridWasteData.js';
import MonthlyComparison from '../../components/app/charts/MonthlyComparison.jsx';
import DesvioDeAterro from '../../components/app/charts/DesvioDeAterro.jsx';
import WasteTypePieChart from '../../components/app/charts/WasteTypePieChart.jsx';
import AreaPieChart from '../../components/app/charts/AreaPieChart.jsx';
import SummaryCards from '../../components/app/charts/SummaryCards.jsx';
import DashboardFilters from '../../components/app/filters/DashboardFilters.jsx';
import DestinacaoChart from '../../components/app/charts/DestinacaoChart.jsx';
import CO2ImpactCard from '../../components/app/charts/CO2ImpactCard.jsx';
import CO2EvolutionChart from '../../components/app/charts/CO2EvolutionChart.jsx';
import LazySection from '../../components/app/LazySection.jsx';
import { useSummaryData } from '../../hooks/charts/useSummaryData.js';
import { useWasteTypePieData } from '../../hooks/charts/useWasteTypePieData.js';
import { useAreaPieData } from '../../hooks/charts/useAreaPieData.js';
import { useDesvioDeAterroData } from '../../hooks/charts/useDesvioDeAterroData.js';
import { useMonthlyComparisonData } from '../../hooks/charts/useMonthlyComparisonData.js';
import { useDestinacaoData } from '../../hooks/charts/useDestinacaoData.js';
import { useCO2Data } from '../../hooks/charts/useCO2Data.js';
import { useDashboardFilters } from '../../context/DashboardFilterContext.jsx';
import ReportGeneratorButton from '../../components/app/ReportGeneratorButton.jsx';
import * as dataProcessor from '../../services/dashboardProcessor.js';

const RealtimeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 3.5a1.5 1.5 0 011.5 1.5v.586a1.5 1.5 0 003 0V5a1.5 1.5 0 011.5-1.5h.5a1.5 1.5 0 010 3h-.5a1.5 1.5 0 01-1.5-1.5v-.586a1.5 1.5 0 00-3 0V5a1.5 1.5 0 01-1.5 1.5H10a1.5 1.5 0 01-1.5-1.5V5a1.5 1.5 0 00-3 0v.586a1.5 1.5 0 01-1.5 1.5h-.5a1.5 1.5 0 010-3h.5A1.5 1.5 0 015 5v-.586a1.5 1.5 0 00-3 0V5a1.5 1.5 0 01-1.5 1.5H.5a1.5 1.5 0 010-3h.5A1.5 1.5 0 013.5 5v.586a1.5 1.5 0 003 0V5A1.5 1.5 0 018 3.5h2zM.5 10.5a1.5 1.5 0 011.5-1.5h16a1.5 1.5 0 010 3H2a1.5 1.5 0 01-1.5-1.5zm1.5 5.5a1.5 1.5 0 000-3h14a1.5 1.5 0 000 3H2z" />
    </svg>
);

const MESES_COMPLETOS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const TODOS_OS_MESES_INDICES = Array.from({ length: 12 }, (_, i) => i);

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

  const { selectedYears, selectedMonths, selectedAreas, handleManualAreaChange } = useDashboardFilters();

  const [availableYears, setAvailableYears] = useState([]);
  const [availableAreas, setAvailableAreas] = useState([]);

  const [empresasColeta, setEmpresasColeta] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);

  const [isMonthlyComparisonVisible, setIsMonthlyComparisonVisible] = useState(false);
  const [isCompositionVisible, setIsCompositionVisible] = useState(false);
  const [isDestinationVisible, setIsDestinationVisible] = useState(false);
  const [isSustainabilityVisible, setIsSustainabilityVisible] = useState(false);

  const [co2Config, setCo2Config] = useState(null);
  const [loadingCO2Config, setLoadingCO2Config] = useState(true);

  const [sectionsVisibility, setSectionsVisibility] = useState({ summary: true, sustainability: true, monthlyComparison: true, composition: true, destination: true });
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
    handleManualAreaChange([]); 
}, [selectedClienteIds, userAllowedClientes, handleManualAreaChange]); 
  
  useEffect(() => {
    if (recordsForComparison.length > 0) {
      const yearsFromData = Array.from(new Set(recordsForComparison.map(r => new Date(r.timestamp).getFullYear()))).sort((a, b) => b - a);
      setAvailableYears(yearsFromData);
    }
  }, [recordsForComparison]);

  useEffect(() => {
    if (!db || selectedYears.length === 0) return;

    const fetchCO2Config = async () => {
        setLoadingCO2Config(true);
        const anoReferencia = Math.max(...selectedYears);
        const docRef = doc(db, 'emissoesConfig', `config_${anoReferencia}`);
        try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setCo2Config(docSnap.data());
            } else {
                console.warn(`Configuração de CO2 para o ano ${anoReferencia} não encontrada.`);
                setCo2Config(null);
            }
        } catch (error) {
            console.error("Erro ao buscar configuração de CO2:", error);
            setCo2Config(null);
        } finally {
            setLoadingCO2Config(false);
        }
    };

    fetchCO2Config();
  }, [db, selectedYears]);

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
  
 
  const { impactCardData, evolutionChartData } = useCO2Data({
    records: recordsForOtherCharts,
    userAllowedClientes,
    empresasColeta,
    co2Config,
    isVisible: isSustainabilityVisible,
    loadingRecords,
    loadingEmpresas,
    loadingCO2Config,
});

  const { destinacaoData } = useDestinacaoData(recordsForOtherCharts, empresasColeta, isDestinationVisible);

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

  const { summaryData } = useSummaryData(recordsForOtherCharts);
  const { wasteTypePieData } = useWasteTypePieData(recordsForOtherCharts, isCompositionVisible);
  const { areaPieData } = useAreaPieData(recordsForOtherCharts, isCompositionVisible);
  const { desvioDeAterroData } = useDesvioDeAterroData(recordsForOtherCharts, isDestinationVisible);


  const { monthlyComparisonData, yearsToCompare } = useMonthlyComparisonData(recordsForMonthlyComparisonChart, isMonthlyComparisonVisible);

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
        availableYears={availableYears} 
        availableAreas={availableAreas} 
        isLoading={loadingRecords || loadingComparisonRecords || selectedYears.length === 0} 
      />
      
      <div title="Em desenvolvimento" className="inline-block">
        <ReportGeneratorButton 
            elementIdToCapture="dashboard-content-for-pdf" 
            filters={{ selectedClienteIds, selectedYears, selectedMonths }} 
            disabled
        />
      </div>  

      <div id="dashboard-content-for-pdf">
        <div className="mt-8 space-y-6">
          {loadingRecords || loadingComparisonRecords || loadingEmpresas ? (<div className="text-center p-8 text-rich-soil">{t('dashboard:paginaDashboard.filters.loadingData')}</div>) :
          !selectedClienteIds.length ? (<div className="p-6 bg-white rounded-lg shadow text-center text-rich-soil">{t('dashboard:paginaDashboard.filters.selectClient')}</div>) :
          recordsForComparison.length === 0 ? (<div className="p-6 bg-white rounded-lg shadow text-center text-rich-soil">{t('dashboard:paginaDashboard.filters.noData')}</div>) : (
            <>
              <section>
                  <SectionTitle title={t('dashboard:paginaDashboard.sections.overview')} isExpanded={sectionsVisibility.summary} onClick={() => toggleSection('summary')} />
                  {sectionsVisibility.summary && (
                    <div className="pt-4">
                        <div className="lg:col-span-2">
                            <SummaryCards summaryData={summaryData} isLoading={loadingRecords} />
                        </div>
                    </div>
                  )}
              </section>

              
              
              <LazySection onVisible={() => setIsMonthlyComparisonVisible(true)}>
                <section>
                    <SectionTitle title={t('dashboard:paginaDashboard.sections.monthlyGeneration')} isExpanded={sectionsVisibility.monthlyComparison} onClick={() => toggleSection('monthlyComparison')} />
                    {sectionsVisibility.monthlyComparison && <MonthlyComparison chartData={monthlyComparisonData} yearsToCompare={yearsToCompare} isLoading={loadingComparisonRecords} />}
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

              <LazySection onVisible={() => setIsSustainabilityVisible(true)}>
                <section>
                    <SectionTitle title="Sustentabilidade e Impacto de Carbono (fase de teste)" isExpanded={sectionsVisibility.sustainability} onClick={() => toggleSection('sustainability')} />
                    {sectionsVisibility.sustainability && (
                        <div className="bg-white p-4 md:p-6 rounded-b-lg shadow grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                            <CO2ImpactCard data={impactCardData} isLoading={impactCardData.isLoading} />
                            <CO2EvolutionChart data={evolutionChartData} isLoading={loadingRecords || !isSustainabilityVisible} />
                        </div>
                    )}
                </section>
              </LazySection>
            </>
          )}
        </div>
      </div>
    </div>
  );
}