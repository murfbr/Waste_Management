// src/hooks/charts/useDestinacaoData.js
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { processDataForDestinacaoChart } from '../../services/dashboardProcessor';

/**
 * Hook para os dados do gráfico de Destinação (Valorização vs. Descarte).
 * @param {Array<Object>} dailyData A lista de documentos de totais diários.
 * @param {Array<Object>} empresasColeta - Este parâmetro não é mais usado no processador, mas mantido para compatibilidade da chamada.
 * @param {boolean} isVisible Flag que indica se a seção do gráfico está visível.
 * @param {Array<string>} selectedAreas As áreas selecionadas no filtro.
 * @returns {{destinacaoData: Array<Object>}}
 */
export function useDestinacaoData(dailyData, empresasColeta, isVisible, selectedAreas) {
  const { t } = useTranslation(['charts']);

  const destinacaoData = useMemo(() => {
    if (!isVisible || !dailyData || dailyData.length === 0) {
      return [];
    }
    // Agora, a função de cálculo recebe 'selectedAreas' corretamente.
    return processDataForDestinacaoChart(dailyData, t, selectedAreas);
  }, [dailyData, isVisible, t, selectedAreas]);

  return { destinacaoData };
}