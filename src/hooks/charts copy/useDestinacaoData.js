// src/hooks/charts/useDestinacaoData.js
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { processDataForDestinacaoChart } from '../../services/dashboardProcessor';

/**
 * Hook customizado para os dados do gráfico de Destinação (Valorização vs. Descarte).
 * Gerencia as dependências de registros, empresas de coleta e traduções.
 * @param {Array<Object>} records A lista de registros de resíduos.
 * @param {Array<Object>} empresasColeta A lista de empresas de coleta para consulta de destinação.
 * @param {boolean} isVisible Flag que indica se a seção do gráfico está visível.
 * @returns {{destinacaoData: Array<Object>}} Objeto com os dados processados para o gráfico.
 */
export function useDestinacaoData(records, empresasColeta, isVisible) {
  const { t } = useTranslation(['charts']);

  const destinacaoData = useMemo(() => {
    if (!isVisible || !records || records.length === 0 || !empresasColeta || empresasColeta.length === 0) {
      return [];
    }
    return processDataForDestinacaoChart(records, empresasColeta, t);
  }, [records, empresasColeta, isVisible, t]);

  return { destinacaoData };
}