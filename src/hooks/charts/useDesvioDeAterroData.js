// src/hooks/charts/useDesvioDeAterroData.js
import { useMemo } from 'react';
import { processDataForDesvioDeAterro } from '../../services/dashboardProcessor';

/**
 * Hook customizado para os dados do gráfico de Desvio de Aterro.
 * @param {Array<Object>} dailyData A lista de documentos de totais diários.
 * @param {boolean} isVisible Flag que indica se a seção do gráfico está visível.
 * @param {Array<string>} selectedAreas As áreas selecionadas no filtro.
 * @returns {{desvioDeAterroData: Array<Object>}} Objeto com os dados processados para o gráfico.
 */
export function useDesvioDeAterroData(dailyData, isVisible, selectedAreas) {
  const desvioDeAterroData = useMemo(() => {
    if (!isVisible || !dailyData || dailyData.length === 0) {
      return [];
    }
    const REJECT_CATEGORY_NAME = "Rejeito";
    // Repassamos 'selectedAreas' para a função de cálculo.
    return processDataForDesvioDeAterro(dailyData, REJECT_CATEGORY_NAME, selectedAreas);
  }, [dailyData, isVisible, selectedAreas]);

  return { desvioDeAterroData };
}