// src/hooks/charts/useCO2Data.js
import { useMemo } from 'react';
import { calculateCO2Impact, calculateCO2Evolution } from '../../services/dashboardProcessor';

export function useCO2Data({
  dailyData,
  userAllowedClientes,
  co2Config,
  isVisible,
  isLoading, // Recebe um único estado de 'loading'
}) {

  const impactCardData = useMemo(() => {
    // A condição de guarda agora é muito mais simples
    if (isLoading || !co2Config) {
      return { isLoading: true, netImpact: 0, totalEvitadas: 0, totalDiretas: 0, metodologia: 'Dados insuficientes.' };
    }
    
    const impactData = calculateCO2Impact({ dailyData, userAllowedClientes, co2Config });
    return { isLoading: false, ...impactData };

  }, [isLoading, dailyData, userAllowedClientes, co2Config]);

  const evolutionChartData = useMemo(() => {
    if (!isVisible || isLoading || !co2Config || !dailyData || dailyData.length === 0) {
      return [];
    }
    return calculateCO2Evolution({ dailyData, userAllowedClientes, co2Config });
    
  }, [isVisible, isLoading, dailyData, userAllowedClientes, co2Config]);

  return { impactCardData, evolutionChartData };
}