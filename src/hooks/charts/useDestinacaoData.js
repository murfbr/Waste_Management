// src/hooks/charts/useDestinacaoData.js
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { processDataForDestinacaoChart } from '../../services/dashboardProcessor';

/**
 * Hook para os dados do gráfico de Destinação (Valorização vs. Descarte).
 * @param {Array<Object>} dailyData A lista de documentos de totais diários.
 * @param {boolean} isVisible Flag que indica se a seção do gráfico está visível.
 * @returns {{destinacaoData: Array<Object>}}
 */
export function useDestinacaoData(dailyData, isVisible) {
  const { t } = useTranslation(['charts']);

  const destinacaoData = useMemo(() => {
    if (!isVisible || !dailyData || dailyData.length === 0) {
      return [];
    }
    // NOTA: A dependência de `empresasColeta` foi removida pois os dados de destinação
    // agora vêm diretamente dos documentos diários.
    return processDataForDestinacaoChart(dailyData, t);
  }, [dailyData, isVisible, t]);

  return { destinacaoData };
}