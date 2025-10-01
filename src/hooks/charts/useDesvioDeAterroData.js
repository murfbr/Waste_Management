// src/hooks/charts/useDesvioDeAterroData.js
import { useMemo } from 'react';
import { processDataForDesvioDeAterro } from '../../services/dashboardProcessor';

/**
 * Hook customizado para os dados do gráfico de Desvio de Aterro.
 * @param {Array<Object>} records A lista de registros de resíduos.
 * @param {boolean} isVisible Flag que indica se a seção do gráfico está visível.
 * @returns {{desvioDeAterroData: Array<Object>}} Objeto com os dados processados para o gráfico.
 */
export function useDesvioDeAterroData(records, isVisible) {
  const desvioDeAterroData = useMemo(() => {
    if (!isVisible || !records || records.length === 0) {
      return [];
    }
    // A lógica de negócio (qual categoria é considerada "Rejeito") fica encapsulada aqui.
    const REJECT_CATEGORY_NAME = "Rejeito";
    return processDataForDesvioDeAterro(records, REJECT_CATEGORY_NAME);
  }, [records, isVisible]);

  return { desvioDeAterroData };
}