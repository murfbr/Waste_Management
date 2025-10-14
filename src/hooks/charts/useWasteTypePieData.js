// src/hooks/charts/useWasteTypePieData.js
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { processDataForAggregatedPieChart } from '../../services/dashboardProcessor';

/**
 * Hook customizado para os dados do gráfico de pizza por TIPO de resíduo.
 * @param {Array<Object>} dailyData A lista de documentos de totais diários.
 * @param {boolean} isVisible Flag que indica se a seção do gráfico está visível.
 * @param {Array<string>} selectedAreas As áreas selecionadas no filtro.
 * @returns {{wasteTypePieData: Array<Object>}} Objeto com os dados processados.
 */
export function useWasteTypePieData(dailyData, isVisible, selectedAreas) {
  const { t } = useTranslation(['charts']);

  const wasteTypePieData = useMemo(() => {
    if (!isVisible || !dailyData || dailyData.length === 0) {
      return [];
    }
    // Repassamos 'selectedAreas' para a função de cálculo.
    return processDataForAggregatedPieChart(dailyData, t, selectedAreas);
  }, [dailyData, isVisible, t, selectedAreas]);

  return { wasteTypePieData };
}