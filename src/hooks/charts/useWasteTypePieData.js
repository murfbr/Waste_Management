// src/hooks/charts/useWasteTypePieData.js
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { processDataForAggregatedPieChart } from '../../services/dashboardProcessor';

/**
 * Hook customizado para os dados do gráfico de pizza por TIPO de resíduo.
 * @param {Array<Object>} dailyData A lista de documentos de totais diários.
 * @param {boolean} isVisible Flag que indica se a seção do gráfico está visível.
 * @returns {{wasteTypePieData: Array<Object>}} Objeto com os dados processados.
 */
export function useWasteTypePieData(dailyData, isVisible) {
  const { t } = useTranslation(['charts']);

  const wasteTypePieData = useMemo(() => {
    if (!isVisible || !dailyData || dailyData.length === 0) {
      return [];
    }
    return processDataForAggregatedPieChart(dailyData, t);
  }, [dailyData, isVisible, t]);

  return { wasteTypePieData };
}
