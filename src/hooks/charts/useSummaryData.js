// src/hooks/charts/useSummaryData.js
import { useMemo } from 'react';
import { processDataForSummaryCards } from '../../services/dashboardProcessor';

/**
 * Hook customizado para os dados dos cartões de resumo.
 * @param {Array<Object>} dailyData A lista de documentos de totais diários.
 * @returns {{summaryData: Object}} Um objeto com os dados processados para os SummaryCards.
 */
export function useSummaryData(dailyData) {
  const summaryData = useMemo(() => {
    // --- LOG DE DEPURAÇÃO 1: INSPECIONANDO OS DADOS BRUTOS ---
    console.log('[DEPURAÇÃO ETAPA 1] Hook: useSummaryData. Dados brutos recebidos (dailyData):', JSON.parse(JSON.stringify(dailyData || [])));
    
    const processedData = processDataForSummaryCards(dailyData);
    
    // --- LOG DE DEPURAÇÃO 2: INSPECIONANDO O RESULTADO DO CÁLCULO ---
    console.log('[DEPURAÇÃO ETAPA 2] Hook: useSummaryData. Dados processados retornados (processedData):', processedData);

    return processedData;
  }, [dailyData]); 

  return { summaryData };
}