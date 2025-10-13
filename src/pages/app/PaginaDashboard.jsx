import React, { useContext, useEffect, useState, useMemo } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// A linha 16, que causa o erro, está aqui. Ela precisa do 'export default' do outro arquivo.
import DashboardFilters from '../../components/app/filters/DashboardFilters';

import AuthContext from '../../context/AuthContext';
import ClienteSelectorDropdown from '../../components/app/ClienteSelectorDropdown';
import useAggregatedData from '../../hooks/useAggregatedData';
import MonthlyComparison from '../../components/app/charts/MonthlyComparison';
import DesvioDeAterro from '../../components/app/charts/DesvioDeAterro';
import WasteTypePieChart from '../../components/app/charts/WasteTypePieChart';
import AreaPieChart from '../../components/app/charts/AreaPieChart';
import SummaryCards from '../../components/app/charts/SummaryCards';
import DestinacaoChart from '../../components/app/charts/DestinacaoChart';
import CO2ImpactCard from '../../components/app/charts/CO2ImpactCard';
import CO2EvolutionChart from '../../components/app/charts/CO2EvolutionChart';
import LazySection from '../../components/app/LazySection';
import { useSummaryData } from '../../hooks/charts/useSummaryData';
import { useWasteTypePieData } from '../../hooks/charts/useWasteTypePieData';
import { useAreaPieData } from '../../hooks/charts/useAreaPieData';
import { useDesvioDeAterroData } from '../../hooks/charts/useDesvioDeAterroData';
import { useMonthlyComparisonData } from '../../hooks/charts/useMonthlyComparisonData';
import { useDestinacaoData } from '../../hooks/charts/useDestinacaoData';
import { useCO2Data } from '../../hooks/charts/useCO2Data';
import { useDashboardFilters } from '../../context/DashboardFilterContext.jsx';
import ReportGeneratorButton from '../../components/app/ReportGeneratorButton';

const CLIENTE_STORAGE_KEY = 'lastSelectedClienteId';

const SectionTitle = ({ title, isExpanded, onClick }) => (
    <button onClick={onClick} className={`w-full flex justify-between items-center bg-rain-forest text-white py-2 px-4 rounded-t-lg text-left focus:outline-none ${!isExpanded ? 'rounded-b-lg' : ''}`} aria-expanded={isExpanded}>
        <h2 className="font-lexend text-acao font-semibold">{title}</h2>
        <span className="text-2xl transform transition-transform duration-200">{isExpanded ? '▲' : '▼'}</span>
    </button>
);

export default function PaginaDashboard() {
  const { t } = useTranslation(['dashboard', 'charts']);
  const { db, userProfile, userAllowedClientes, loadingAuth, loadingAllowedClientes } = useContext(AuthContext);
  
  const [selectedClienteIds, setSelectedClienteIds] = useState([]);
  const [selectAllClientesToggle, setSelectAllClientesToggle] = useState(false);

  const { selectedYears, setSelectedYears, selectedMonths, setSelectedMonths, selectedAreas, handleManualAreaChange: setSelectedAreas } = useDashboardFilters();

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2];
  }, []);

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

  const { dailyData, monthlyData, loading: loadingRecords } = useAggregatedData(
    selectedClienteIds, 
    selectedYears, 
    selectedMonths
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
    if (!loadingAllowedClientes && userAllowedClientes?.length > 0 && selectedClienteIds.length === 0) {
      let initialClienteId = null;
      const savedClienteId = sessionStorage.getItem(CLIENTE_STORAGE_KEY);
      const isSavedClienteAllowed = userAllowedClientes.some(c => c.id === savedClienteId);

      if (savedClienteId && isSavedClienteAllowed) {
        initialClienteId = savedClienteId;
      } else {
        initialClienteId = userAllowedClientes[0].id;
      }
      
      setSelectedClienteIds([initialClienteId]);
      setSelectAllClientesToggle(false);

      const cliente = userAllowedClientes.find(c => c.id === initialClienteId);
      if (cliente && cliente.areasPersonalizadas) {
        const allAreaIds = cliente.areasPersonalizadas.map(area => `${cliente.id}_${area}`);
        setSelectedAreas(allAreaIds);
      }
    }
  }, [userAllowedClientes, loadingAllowedClientes, setSelectedAreas]);


  useEffect(() => {
    if (setSelectedYears && setSelectedMonths && selectedYears.length === 0) {
      const currentDate = new Date();
      setSelectedYears([currentDate.getFullYear()]);
      setSelectedMonths([currentDate.getMonth()]);
    }
  }, [setSelectedYears, setSelectedMonths, selectedYears]);


  useEffect(() => {
    if (!db || selectedYears.length === 0) {
        return;
    }
    const fetchCO2Config = async () => {
        setLoadingCO2Config(true);
        const anoReferencia = Math.max(...selectedYears);
        const docRef = doc(db, 'emissoesConfig', `config_${anoReferencia}`);
        try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setCo2Config(docSnap.data());
            } else {
                setCo2Config(null);
            }
        } catch (error) {
            console.error(`Erro ao buscar configuração de CO2:`, error);
            setCo2Config(null);
        } finally {
            setLoadingCO2Config(false);
        }
    };
    fetchCO2Config();
  }, [db, selectedYears]);


  const areaFilterData = useMemo(() => {
    if (!userAllowedClientes || selectedClienteIds.length === 0) {
      return { isMultiClient: false, areas: [] };
    }

    if (selectedClienteIds.length === 1) {
      const clienteId = selectedClienteIds[0];
      const cliente = userAllowedClientes.find(c => c.id === clienteId);
      return {
        isMultiClient: false,
        clientId: clienteId,
        areas: cliente?.areasPersonalizadas?.sort((a, b) => a.localeCompare(b)) || []
      };
    }

    const selectedClientsWithAreas = selectedClienteIds.map(id => {
      const cliente = userAllowedClientes.find(c => c.id === id);
      return {
        clientId: id,
        clientName: cliente?.nome || 'Cliente Desconhecido',
        areas: cliente?.areasPersonalizadas?.sort((a, b) => a.localeCompare(b)) || []
      };
    }).sort((a, b) => a.clientName.localeCompare(b.clientName));

    return {
      isMultiClient: true,
      clients: selectedClientsWithAreas
    };
  }, [selectedClienteIds, userAllowedClientes]);
  
  const { summaryData } = useSummaryData(dailyData, selectedAreas);
  const { wasteTypePieData } = useWasteTypePieData(dailyData, isCompositionVisible, selectedAreas);
  const { areaPieData } = useAreaPieData(dailyData, isCompositionVisible, selectedAreas);
  const { desvioDeAterroData } = useDesvioDeAterroData(dailyData, isDestinationVisible, selectedAreas);
  const { destinacaoData } = useDestinacaoData(dailyData, empresasColeta, isDestinationVisible, selectedAreas);
  const { monthlyComparisonData, yearsToCompare } = useMonthlyComparisonData(monthlyData, isMonthlyComparisonVisible, selectedYears, selectedAreas);
  
  const isSustainabilityLoading = loadingRecords || loadingCO2Config;
  const { impactCardData, evolutionChartData } = useCO2Data({
      dailyData,
      userAllowedClientes,
      co2Config,
      isVisible: isSustainabilityVisible,
      isLoading: isSustainabilityLoading,
      selectedAreas,
  });

  const handleClienteSelectionChange = (clienteId) => {
    const newSelection = selectedClienteIds.includes(clienteId) 
      ? selectedClienteIds.filter(id => id !== clienteId)
      : [...selectedClienteIds, clienteId];

    setSelectedClienteIds(newSelection);

    if (newSelection.length === 1) {
      const cliente = userAllowedClientes.find(c => c.id === newSelection[0]);
      if (cliente && cliente.areasPersonalizadas) {
        const allAreaIds = cliente.areasPersonalizadas.map(area => `${cliente.id}_${area}`);
        setSelectedAreas(allAreaIds);
      }
    } else {
      setSelectedAreas([]);
    }

    if (userAllowedClientes) {
      setSelectAllClientesToggle(newSelection.length === userAllowedClientes.length);
    }
  };
  const handleSelectAllClientesToggleChange = () => {
    setSelectAllClientesToggle(prev => {
        const newToggleState = !prev;
        const newSelection = newToggleState ? userAllowedClientes.map(c => c.id) : [];
        setSelectedClienteIds(newSelection);
        setSelectedAreas([]);
        return newToggleState;
    });
  };
  
  if (loadingAuth || loadingAllowedClientes) { return <div className="p-8 text-center text-rich-soil">A carregar...</div>; }
    
  return (
    <div className="bg-gray-50 font-comfortaa min-h-screen p-4 md:p-6 space-y-6">
      <div className="bg-blue-coral text-white py-3 px-6 rounded-md shadow-lg flex justify-center items-center relative">
        <h1 className="font-lexend text-subtitulo font-bold text-center">{t('dashboard:paginaDashboard.header.title')}</h1>
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
        areaFilterData={areaFilterData} 
        isLoading={loadingRecords} 
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
          {loadingRecords || loadingEmpresas ? (<div className="text-center p-8 text-rich-soil">{t('dashboard:paginaDashboard.filters.loadingData')}</div>) :
          !selectedClienteIds.length ? (<div className="p-6 bg-white rounded-lg shadow text-center text-rich-soil">{t('dashboard:paginaDashboard.filters.selectClient')}</div>) :
          dailyData.length === 0 && monthlyData.length === 0 ? (<div className="p-6 bg-white rounded-lg shadow text-center text-rich-soil">{t('dashboard:paginaDashboard.filters.noData')}</div>) : (
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
                    {sectionsVisibility.monthlyComparison && <MonthlyComparison chartData={monthlyComparisonData} yearsToCompare={yearsToCompare} isLoading={loadingRecords} />}
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