// src/hooks/charts/useAreaPieData.js
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { processDataForAreaChartWithBreakdown } from '../../services/dashboardProcessor';

/**
 * Hook customizado para os dados do gráfico de pizza por ÁREA de lançamento.
 * @param {Array<Object>} dailyData A lista de documentos de totais diários.
 * @param {boolean} isVisible Flag que indica se a seção do gráfico está visível.
 * @param {Array<string>} selectedAreas As áreas selecionadas no filtro.
 * @returns {{areaPieData: Array<Object>}} Objeto com os dados processados.
 */
export function useAreaPieData(dailyData, isVisible, selectedAreas) {
  const { t } = useTranslation(['charts']);

  const areaPieData = useMemo(() => {
    if (!isVisible || !dailyData || dailyData.length === 0) {
      return [];
    }
    // Repassamos 'selectedAreas' para a função de cálculo.
    return processDataForAreaChartWithBreakdown(dailyData, t, selectedAreas);
  }, [dailyData, isVisible, t, selectedAreas]);

  return { areaPieData };
}