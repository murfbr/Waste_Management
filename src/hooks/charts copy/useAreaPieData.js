// src/hooks/charts/useAreaPieData.js
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { processDataForAreaChartWithBreakdown } from '../../services/dashboardProcessor';

/**
 * Hook customizado para os dados do gráfico de pizza por ÁREA de lançamento.
 * @param {Array<Object>} records A lista de registros de resíduos.
 * @param {boolean} isVisible Flag que indica se a seção do gráfico está visível.
 * @returns {{areaPieData: Array<Object>}} Objeto com os dados processados.
 */
export function useAreaPieData(records, isVisible) {
  const { t } = useTranslation(['charts']);

  const areaPieData = useMemo(() => {
    if (!isVisible || !records || records.length === 0) {
      return [];
    }
    return processDataForAreaChartWithBreakdown(records, t);
  }, [records, isVisible, t]);

  return { areaPieData };
}