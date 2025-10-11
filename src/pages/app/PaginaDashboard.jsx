// src/pages/app/PaginaDashboard.jsx
import React, { useContext, useEffect, useState, useMemo } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Importações dos componentes
import AuthContext from '../../context/AuthContext';
import ClienteSelectorDropdown from '../../components/app/ClienteSelectorDropdown';
import useAggregatedData from '../../hooks/useAggregatedData';
import MonthlyComparison from '../../components/app/charts/MonthlyComparison';
import DesvioDeAterro from '../../components/app/charts/DesvioDeAterro';
import WasteTypePieChart from '../../components/app/charts/WasteTypePieChart';
import AreaPieChart from '../../components/app/charts/AreaPieChart';
import SummaryCards from '../../components/app/charts/SummaryCards';
import DashboardFilters from '../../components/app/filters/DashboardFilters';
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

  const { selectedYears, setSelectedYears, selectedMonths, setSelectedMonths, selectedAreas, handleManualAreaChange } = useDashboardFilters();

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2];
  }, []);

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
  // A guarda `selectedClienteIds.length === 0` impede que ele re-selecione
  // um cliente se o usuário já tiver feito alguma seleção.
  if (!loadingAllowedClientes && userAllowedClientes?.length > 0 && selectedClienteIds.length === 0) {
      const savedClienteId = sessionStorage.getItem(CLIENTE_STORAGE_KEY);
      const isSavedClienteAllowed = userAllowedClientes.some(c => c.id === savedClienteId);

      if (savedClienteId && isSavedClienteAllowed) {
          setSelectedClienteIds([savedClienteId]);
      } else {
          const firstClienteId = userAllowedClientes[0].id;
          setSelectedClienteIds([firstClienteId]);
      }
      setSelectAllClientesToggle(false);
  }
// Remova `selectedClienteIds` daqui. Este efeito só precisa rodar quando os clientes disponíveis mudam.
}, [userAllowedClientes, loadingAllowedClientes]); 

  // CORREÇÃO ROBUSTA: Define os filtros de data iniciais apenas uma vez, 
  // quando as funções estão disponíveis e os filtros ainda não foram definidos.
  useEffect(() => {
    if (setSelectedYears && setSelectedMonths && selectedYears.length === 0) {
      const currentDate = new Date();
      setSelectedYears([currentDate.getFullYear()]);
      setSelectedMonths([currentDate.getMonth()]);
    }
  }, [setSelectedYears, setSelectedMonths, selectedYears]);


useEffect(() => {
    console.log('[DEBUG CO2] useEffect de busca disparado.');
    if (!db || selectedYears.length === 0) {
        console.warn('[DEBUG CO2] Saindo: `selectedYears` está vazio.');
        return;
    }
    const fetchCO2Config = async () => {
        setLoadingCO2Config(true);
        const anoReferencia = Math.max(...selectedYears);
        const docRef = doc(db, 'emissoesConfig', `config_${anoReferencia}`);
        console.log(`[DEBUG CO2] 1. Preparando para buscar documento em: "emissoesConfig/config_${anoReferencia}"`);
        try {
            const docSnap = await getDoc(docRef);
            console.log('[DEBUG CO2] 2. Chamada getDoc() concluída.');
            if (docSnap.exists()) {
                const data = docSnap.data();
                console.log('[DEBUG CO2] 3. SUCESSO: Documento encontrado.', data);
                setCo2Config(data);
            } else {
                console.error(`[DEBUG CO2] 3. FALHA: Documento em "emissoesConfig/config_${anoReferencia}" NÃO foi encontrado.`);
                setCo2Config(null);
            }
        } catch (error) {
            console.error(`[DEBUG CO2] 3. ERRO CRÍTICO ao tentar buscar o documento:`, error);
            setCo2Config(null);
        } finally {
            console.log('[DEBUG CO2] 4. Bloco finally executado.');
            setLoadingCO2Config(false);
        }
    };
    fetchCO2Config();
}, [db, selectedYears]);


// --- INÍCIO DA CORREÇÃO ---

// 1. Crie uma variável que unifica os estados de carregamento relevantes.
const isSustainabilityLoading = loadingRecords || loadingCO2Config;

// 2. Chame o hook 'useCO2Data' com a nova prop 'isLoading' e as props corretas.
const { impactCardData, evolutionChartData } = useCO2Data({
    dailyData, // Corrigido de 'records' para 'dailyData'
    userAllowedClientes,
    co2Config,
    isVisible: isSustainabilityVisible,
    isLoading: isSustainabilityLoading, // Passando o estado unificado
});

  const { destinacaoData } = useDestinacaoData(dailyData, empresasColeta, isDestinationVisible);

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
  
  const { summaryData } = useSummaryData(dailyData);
  const { wasteTypePieData } = useWasteTypePieData(dailyData, isCompositionVisible);
  const { areaPieData } = useAreaPieData(dailyData, isCompositionVisible);
  const { desvioDeAterroData } = useDesvioDeAterroData(dailyData, isDestinationVisible);
  const { monthlyComparisonData, yearsToCompare } = useMonthlyComparisonData(monthlyData, isMonthlyComparisonVisible, selectedYears);

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
        availableAreas={availableAreas} 
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

