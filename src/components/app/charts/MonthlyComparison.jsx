import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { wasteTypeColors } from '../../../utils/wasteTypeColors';

const formatNumber = (number, locale) => {
  if (typeof number !== 'number' || isNaN(number)) return '0,0';
  return number.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const CustomTooltip = ({ active, payload, label, locale, unit, t }) => {
    if (active && payload && payload.length) {
        const hoveredItem = payload[0];
        // Determina o ano a partir do stackId (para barras empilhadas) ou do dataKey (para barras sólidas)
        const year = hoveredItem.stackId || hoveredItem.dataKey.split('.')[0];
        const monthDataForYear = hoveredItem.payload[year];

        if (!monthDataForYear) return null;

        const { total, breakdown } = monthDataForYear;
        
        const reciclavelName = t('charts:wasteTypes.reciclavel', 'Reciclável');
        const organicoName = t('charts:wasteTypes.organico', 'Orgânico');
        const rejeitoName = t('charts:wasteTypes.rejeito', 'Rejeito');

        const breakdownItems = [
            { name: reciclavelName, value: breakdown[reciclavelName] },
            { name: organicoName, value: breakdown[organicoName] },
            { name: rejeitoName, value: breakdown[rejeitoName] },
        ].filter(item => item.value > 0);

        return (
            <div className="p-3 bg-white bg-opacity-95 border border-early-frost rounded-lg shadow-lg font-comfortaa text-rain-forest">
                <p className="font-lexend text-base mb-2 border-b border-early-frost pb-1">
                    {label} ({year}): <span className="font-bold">{formatNumber(total, locale)} {unit}</span>
                </p>
                <ul className="list-none p-0 m-0 text-sm space-y-1">
                    {breakdownItems.map((item) => {
                        const percentage = total > 0 ? (item.value / total) * 100 : 0;
                        const color = wasteTypeColors[item.name]?.bg || wasteTypeColors.default.bg;
                        // Destaca o item que está sendo "hovered" no modo de barra empilhada
                        const isHovered = hoveredItem.dataKey.includes(item.name);
                        return (
                            <li key={item.name} className={`flex justify-between items-center transition-all duration-150 ${isHovered ? 'font-bold' : ''}`}>
                                <div className="flex items-center">
                                    <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }}></span>
                                    <span>{item.name}:</span>
                                </div>
                                <span className="ml-3">{formatNumber(item.value, locale)} {unit} ({percentage.toFixed(1)}%)</span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    }
    return null;
};

const YEAR_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

export default function MonthlyComparison({
  chartData,
  yearsToCompare,
  isLoading,
}) {
  const { t, i18n } = useTranslation(['dashboard', 'charts']);
  const [chartType, setChartType] = useState('solid'); // 'solid' ou 'stacked'

  const localeMap = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' };
  const currentLocale = localeMap[i18n.language] || 'pt-BR';

  const chartTitle = t('dashboard:monthlyComparisonComponent.chartTitle');
  const noDataMessage = t('dashboard:monthlyComparisonComponent.noData');
  const loadingMessage = t('dashboard:monthlyComparisonComponent.loading');
  const yAxisLabel = t('dashboard:monthlyComparisonComponent.yAxisLabel');
  const tooltipUnit = t('dashboard:monthlyComparisonComponent.tooltipUnit');

  const reciclavelName = t('charts:wasteTypes.reciclavel', 'Reciclável');
  const organicoName = t('charts:wasteTypes.organico', 'Orgânico');
  const rejeitoName = t('charts:wasteTypes.rejeito', 'Rejeito');
  const wasteTypes = [reciclavelName, organicoName, rejeitoName];

  if (isLoading) {
    return (
      <div className="bg-white p-4 md:p-6 rounded-lg shadow min-h-[400px] flex items-center justify-center">
        <div>
          <h2 className="text-acao font-lexend text-rain-forest mb-3 text-center">{chartTitle}</h2>
          <p className="text-center text-gray-500 py-4">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  const hasData = chartData && chartData.some(item => yearsToCompare.some(year => item[year] && item[year].total > 0));

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-acao font-lexend text-rain-forest text-center">
          {chartTitle}
        </h2>
        <div className="flex items-center p-1 bg-gray-100 rounded-lg">
            <button 
                onClick={() => setChartType('solid')}
                className={`px-3 py-1 text-sm font-bold rounded-md transition-all duration-200 ${chartType === 'solid' ? 'bg-white text-blue-coral shadow' : 'bg-transparent text-gray-500'}`}
            >
                {t('dashboard:monthlyComparisonComponent.viewType.total')}
            </button>
            <button 
                onClick={() => setChartType('stacked')}
                className={`px-3 py-1 text-sm font-bold rounded-md transition-all duration-200 ${chartType === 'stacked' ? 'bg-white text-blue-coral shadow' : 'bg-transparent text-gray-500'}`}
            >
                {t('dashboard:monthlyComparisonComponent.viewType.composition')}
            </button>
        </div>
      </div>
      
      {hasData ? (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', offset: -10 }} />
            <Tooltip content={<CustomTooltip locale={currentLocale} unit={tooltipUnit} t={t} />} />
            <Legend />
            
            {chartType === 'solid' 
              ? yearsToCompare.map((year, index) => (
                  <Bar key={year} dataKey={`${year}.total`} name={year.toString()} fill={YEAR_COLORS[index % YEAR_COLORS.length]} />
                ))
              : yearsToCompare.flatMap((year) => 
                  wasteTypes.map((type) => (
                      <Bar 
                          key={`${year}-${type}`} 
                          dataKey={`${year}.breakdown.${type}`} 
                          stackId={year} 
                          name={type} 
                          fill={wasteTypeColors[type]?.bg || wasteTypeColors.default.bg} 
                      />
                  ))
            )}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="min-h-[400px] flex items-center justify-center">
            <p className="text-center text-gray-500 py-4">{noDataMessage}</p>
        </div>
      )}
    </div>
  );
}

