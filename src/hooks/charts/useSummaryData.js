// src/hooks/charts/useSummaryData.js
import { useMemo } from 'react';
import { processDataForSummaryCards } from '../../services/dashboardProcessor';

/**
 * Hook customizado para os dados dos cartões de resumo.
 * @param {Array<Object>} dailyData A lista de documentos de totais diários.
 * @param {Array<string>} selectedAreas As áreas selecionadas no filtro.
 * @returns {{summaryData: Object}} Um objeto com os dados processados para os SummaryCards.
 */
export function useSummaryData(dailyData, selectedAreas) {
  const summaryData = useMemo(() => {
    // Apenas repassamos 'selectedAreas' para a função de cálculo.
    return processDataForSummaryCards(dailyData, selectedAreas);
  }, [dailyData, selectedAreas]); 

  return { summaryData };
}