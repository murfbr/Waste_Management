// src/hooks/charts/useMonthlyComparisonData.js
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { processDataForMonthlyYearlyComparison } from '../../services/dashboardProcessor';

/**
 * Hook customizado para os dados do gráfico de Comparação Mensal.
 * Retorna tanto os dados formatados para o gráfico quanto a lista de anos encontrados nos dados.
 * @param {Array<Object>} records A lista de registros de resíduos.
 * @param {boolean} isVisible Flag que indica se a seção do gráfico está visível.
 * @returns {{monthlyComparisonData: Array<Object>, yearsToCompare: Array<string>}} Objeto com os dados e a lista de anos.
 */
export function useMonthlyComparisonData(records, isVisible) {
  const { t } = useTranslation(['charts']);

  const { data, years } = useMemo(() => {
    if (!isVisible || !records || records.length === 0) {
      return { data: [], years: [] };
    }
    return processDataForMonthlyYearlyComparison(records, t);
  }, [records, isVisible, t]);

  // Renomeamos as chaves de retorno para serem mais descritivas
  return { monthlyComparisonData: data, yearsToCompare: years };
}