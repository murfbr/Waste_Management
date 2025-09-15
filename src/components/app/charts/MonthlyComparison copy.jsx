// src/components/app/charts/MonthlyComparison.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { wasteTypeColors } from '../../../utils/wasteTypeColors';

// Cores para as barras dos anos
const YEAR_COLORS = ['#0D4F5F', '#DB8D37', '#174C2F', '#CE603E'];

// Função auxiliar para formatação de números
const formatNumber = (number, locale, decimals = 1) => {
  if (typeof number !== 'number' || isNaN(number)) {
    return '0,0';
  }
  return number.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

// Componente de Tooltip Customizado
const CustomTooltip = ({ active, payload, label, locale, unit, t }) => {
    if (active && payload && payload.length) {
        const yearData = payload[0];
        const yearName = yearData.name;
        const monthDataForYear = yearData.payload[yearName];

        if (!monthDataForYear) return null;

        const totalValue = monthDataForYear.total;
        const breakdown = monthDataForYear.breakdown;
        
        // Pega os nomes traduzidos para garantir a correspondência
        const RECICLAVEL = t('charts:wasteTypes.reciclavel', 'Reciclável');
        const ORGANICO = t('charts:wasteTypes.organico', 'Orgânico');
        const REJEITO = t('charts:wasteTypes.rejeito', 'Rejeito');
        
        const breakdownItems = [
            { name: RECICLAVEL, value: breakdown[RECICLAVEL] },
            { name: ORGANICO, value: breakdown[ORGANICO] },
            { name: REJEITO, value: breakdown[REJEITO] }
        ].filter(item => item.value > 0);

        return (
            <div className="p-3 bg-white bg-opacity-95 border border-early-frost rounded-lg shadow-lg font-comfortaa text-rain-forest">
                <p className="font-lexend text-base mb-2 border-b border-early-frost pb-1">
                    {label} ({yearName}): <span className="font-bold">{formatNumber(totalValue, locale, 2)} {unit}</span>
                </p>
                {breakdownItems.length > 0 && (
                    <ul className="list-none p-0 m-0 text-sm space-y-1">
                        {breakdownItems.map((item, index) => {
                            const percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
                            const color = wasteTypeColors[item.name]?.bg || wasteTypeColors.default.bg;
                            return (
                                <li key={index} className="flex justify-between items-center">
                                    <div className="flex items-center">
                                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }}></span>
                                        <span>{item.name}:</span>
                                    </div>
                                    <span className="font-bold ml-3">{formatNumber(item.value, locale, 2)} {unit} ({formatNumber(percentage, locale, 1)}%)</span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        );
    }
    return null;
};


export default function MonthlyComparison({
  chartData,
  yearsToCompare,
  isLoading,
}) {
  const { t, i18n } = useTranslation(['dashboard', 'charts']);

  const localeMap = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' };
  const currentLocale = localeMap[i18n.language] || 'pt-BR';

  const chartTitle = t('monthlyComparisonComponent.chartTitle');
  const noDataMessage = t('monthlyComparisonComponent.noData');
  const loadingMessage = t('monthlyComparisonComponent.loading');
  const yAxisLabel = t('monthlyComparisonComponent.yAxisLabel');
  const tooltipUnit = t('monthlyComparisonComponent.tooltipUnit');

  if (isLoading) {
    return (
      <div className="bg-white p-4 md:p-6 rounded-lg shadow">
        <h2 className="text-acao font-lexend text-rain-forest mb-3 text-center">{chartTitle}</h2>
        <p className="text-center text-gray-500 py-4">{loadingMessage}</p>
      </div>
    );
  }

  const hasData = chartData && chartData.some(item => yearsToCompare.some(year => item[year]?.total > 0));

  return (
    <div className="bg-white p-4 md:p-6 rounded-b-lg shadow">
      <h2 className="text-acao font-lexend text-rain-forest mb-3 text-center">
        {chartTitle}
      </h2>
      {hasData ? (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis 
                label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', offset: -10 }} 
                tickFormatter={(value) => formatNumber(value, currentLocale, 0)}
            />
            <Tooltip 
                cursor={{ fill: 'rgba(219, 141, 55, 0.1)' }}
                content={<CustomTooltip locale={currentLocale} unit={tooltipUnit} t={t} />} 
            />
            <Legend />
            {yearsToCompare.map((year, index) => (
              <Bar 
                key={year} 
                dataKey={`${year}.total`} 
                fill={YEAR_COLORS[index % YEAR_COLORS.length]} 
                name={year.toString()} 
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-center text-gray-500 py-4">{noDataMessage}</p>
      )}
    </div>
  );
}
