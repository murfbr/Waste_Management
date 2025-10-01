// src/components/app/charts/WasteTypePieChart.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { wasteTypeColors } from '../../../utils/wasteTypeColors';

// Função auxiliar agora é dinâmica
const formatNumber = (number, locale, decimals = 1) => {
  if (typeof number !== 'number' || isNaN(number)) {
    return '0,0';
  }
  return number.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

// Tooltip customizado agora recebe 'locale' e 'unit'
const CustomTooltip = ({ active, payload, locale, unit }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const mainValue = data.value;
        const mainName = data.name;
        const subtypes = data.subtypes || [];

        return (
            <div className="p-3 bg-white bg-opacity-95 border border-early-frost rounded-lg shadow-lg font-comfortaa text-rain-forest">
                <p className="font-lexend text-base mb-2 border-b border-early-frost pb-1">
                    {mainName}: <span className="font-bold">{formatNumber(mainValue, locale)} {unit}</span>
                </p>
                {(subtypes.length > 1 || (subtypes.length === 1 && subtypes[0].name !== mainName)) && (
                     <ul className="list-none p-0 m-0 text-sm space-y-1">
                        {subtypes.map((sub, index) => {
                            const percentage = mainValue > 0 ? (sub.value / mainValue) * 100 : 0;
                            const color = wasteTypeColors[sub.name]?.bg || wasteTypeColors.default.bg;
                            return (
                                <li key={index} className="flex justify-between items-center">
                                    <div className="flex items-center">
                                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }}></span>
                                        <span>{sub.name}:</span>
                                    </div>
                                    <span className="font-bold ml-3">{formatNumber(sub.value, locale)} {unit} ({formatNumber(percentage, locale)}%)</span>
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

// Rótulo customizado agora recebe 'locale' e 'unit'
const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent, value, fill, locale, unit }) => {
    if (percent < 0.001) return null;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30; 
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill={fill} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="font-comfortaa text-sm">
            <tspan x={x} dy="0">{formatNumber(value, locale)} {unit}</tspan>
            <tspan x={x} dy="1.2em">{`(${(percent * 100).toFixed(1)}%)`}</tspan>
        </text>
    );
};


export default function WasteTypePieChart({ data, isLoading }) {
  const { t, i18n } = useTranslation('dashboard');

  const localeMap = {
    pt: 'pt-BR',
    en: 'en-US',
    es: 'es-ES',
  };
  const currentLocale = localeMap[i18n.language] || 'pt-BR';
  const unit = t('wasteTypePieChartComponent.unit');

  const chartTitle = t('wasteTypePieChartComponent.chartTitle');

  // Wrapper para passar props customizadas para a função de rótulo
  const CustomizedLabelWithLocale = (props) => renderCustomizedLabel({ ...props, locale: currentLocale, unit });

  if (isLoading) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center">
        <h3 className="text-acao font-lexend text-rain-forest mb-3 text-center">{chartTitle}</h3>
        <p className="text-center text-rain-forest font-comfortaa">{t('wasteTypePieChartComponent.loading')}</p>
      </div>
    );
  }

  return (
    <div className="h-[400px] flex flex-col">
      <h3 className="text-acao font-lexend text-rain-forest mb-3 text-center">
        {chartTitle}
      </h3>
      {data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false} 
              label={CustomizedLabelWithLocale}
              outerRadius="80%"
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => {
                const color = wasteTypeColors[entry.name]?.bg || wasteTypeColors.default.bg;
                return <Cell key={`cell-type-${index}`} fill={color} />;
              })}
            </Pie>
            <Tooltip content={<CustomTooltip locale={currentLocale} unit={unit} />} />
            <Legend
              verticalAlign="bottom"
              wrapperStyle={{ paddingTop: "20px", fontFamily: 'Comfortaa', color: '#51321D' }}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-center text-rich-soil font-comfortaa">{t('wasteTypePieChartComponent.noData')}</p>
        </div>
      )}
    </div>
  );
}