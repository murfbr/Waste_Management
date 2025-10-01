// src/hooks/charts/useCO2Data.js
import { useMemo } from 'react';
import { calculateCO2Impact, calculateCO2Evolution } from '../../services/dashboardProcessor';

/**
 * Hook customizado e centralizado para todos os cálculos de CO₂ do dashboard.
 * Gerencia o estado de loading e os cálculos para o card de impacto e o gráfico de evolução.
 * @param {Object} params - Objeto com as dependências.
 * @returns {Object} Um objeto contendo `impactCardData`, `evolutionChartData` e `isCO2Loading`.
 */
export function useCO2Data({
  records,
  userAllowedClientes,
  empresasColeta,
  co2Config,
  isVisible,
  loadingRecords,
  loadingEmpresas,
  loadingCO2Config,
}) {
  const isCO2Loading = loadingRecords || loadingEmpresas || loadingCO2Config || !co2Config || !userAllowedClientes?.length;

  const impactCardData = useMemo(() => {
    if (isCO2Loading) {
      return { isLoading: true, netImpact: 0, totalEvitadas: 0, totalDiretas: 0, metodologia: 'Calculando...' };
    }
    const impactData = calculateCO2Impact({ records, userAllowedClientes, empresasColeta, co2Config });
    return { isLoading: false, ...impactData };
  }, [isCO2Loading, records, userAllowedClientes, empresasColeta, co2Config]);

  const evolutionChartData = useMemo(() => {
    if (!isVisible || isCO2Loading || records.length === 0) {
      return [];
    }
    return calculateCO2Evolution({ records, userAllowedClientes, empresasColeta, co2Config });
  }, [isVisible, isCO2Loading, records, userAllowedClientes, empresasColeta, co2Config]);

  return { impactCardData, evolutionChartData, isCO2Loading };
}