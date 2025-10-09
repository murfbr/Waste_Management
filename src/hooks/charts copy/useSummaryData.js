// src/hooks/useSummaryData.js
import { useMemo } from 'react';
import { processDataForSummaryCards } from '../../services/dashboardProcessor';

/**
 * Hook customizado para calcular os dados dos cartões de resumo.
 * Ele encapsula a lógica de memorização (useMemo) e a chamada à função de processamento,
 * mantendo o componente principal mais limpo.
 *
 * @param {Array<Object>} records A lista de registros de resíduos a serem processados.
 * @returns {{summaryData: Object}} Um objeto contendo os dados processados para os SummaryCards.
 */
export function useSummaryData(records) {
  const summaryData = useMemo(() => {
    // Se não houver registros, a função de processamento já trata disso.
    return processDataForSummaryCards(records);
  }, [records]); // A computação só será refeita se os 'records' mudarem.

  return { summaryData };
}