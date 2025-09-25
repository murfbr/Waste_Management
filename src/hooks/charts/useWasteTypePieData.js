// src/hooks/charts/useWasteTypePieData.js
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { processDataForAggregatedPieChart } from '../../services/dashboardProcessor';

/**
 * Hook customizado para os dados do gráfico de pizza por TIPO de resíduo.
 * Encapsula a lógica de processamento e tradução necessária para este gráfico.
 * @param {Array<Object>} records A lista de registros de resíduos.
 * @param {boolean} isVisible Flag que indica se a seção do gráfico está visível (para otimização).
 * @returns {{wasteTypePieData: Array<Object>}} Objeto com os dados processados.
 */
export function useWasteTypePieData(records, isVisible) {
  const { t } = useTranslation(['charts']);

  const wasteTypePieData = useMemo(() => {
    // Só processa os dados se a seção estiver visível e houver registros.
    if (!isVisible || !records || records.length === 0) {
      return [];
    }
    return processDataForAggregatedPieChart(records, t);
  }, [records, isVisible, t]);

  return { wasteTypePieData };
}