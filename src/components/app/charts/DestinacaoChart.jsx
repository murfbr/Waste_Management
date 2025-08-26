// src/components/app/charts/DestinacaoChart.jsx

import React from 'react';
import { useTranslation } from 'react-i18next'; 
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = {
    'recovery': '#0D3520',
    'disposal': '#BCBCBC',
};

const formatNumber = (number, locale, decimals = 1) => {
  if (typeof number !== 'number' || isNaN(number)) {
    return '0,0';
  }
  return number.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

// CORRIGIDO: O Tooltip agora é "puro", não faz mais tradução
const CustomTooltip = ({ active, payload, locale, unit }) => {
    if (active && payload && payload.length) {
        const data = payload[0];
        const mainValue = data.payload.value;
        const mainName = data.name;
        const breakdown = data.payload.breakdown || [];

        return (
            <div className="p-3 bg-white bg-opacity-95 border border-early-frost rounded-lg shadow-lg font-comfortaa text-rain-forest">
                <p className="font-lexend text-base mb-2 border-b border-early-frost pb-1">
                    {mainName}: <span className="font-bold">{formatNumber(mainValue, locale, 2)} {unit}</span>
                </p>
                {breakdown.length > 0 && (
                     <ul className="list-none p-0 m-0 text-sm space-y-1">
                        {breakdown.map((item, index) => {
                            const percentage = mainValue > 0 ? (item.value / mainValue) * 100 : 0;
                            return (
                                <li key={index} className="flex justify-between items-center">
                                    {/* Exibe o item.name diretamente, pois ele já vem traduzido */}
                                    <span>{item.name}:</span>
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

export default function DestinacaoChart({ data, isLoading }) {
    const { t, i18n } = useTranslation(['dashboard', 'charts']);

    const localeMap = {
        pt: 'pt-BR',
        en: 'en-US',
        es: 'es-ES',
    };
    const currentLocale = localeMap[i18n.language] || 'pt-BR';
    const unit = t('dashboard:destinationChartComponent.unit');

    // O breakdown já vem traduzido, então só traduzimos o 'name' principal
    const translatedData = data.map(entry => ({
        ...entry,
        name: t(`charts:chartLabels.${entry.name.toLowerCase()}`)
    }));

    if (isLoading) { /* ...código inalterado... */ }
    if (!data || data.length === 0 || data.every(d => d.value === 0)) { /* ...código inalterado... */ }
    
    return (
        <div className="bg-white p-4 rounded-lg shadow h-full min-h-[488px] flex flex-col">
            <h3 className="text-acao font-lexend text-rain-forest text-center mb-4">
                {t('dashboard:destinationChartComponent.chartTitle')}
            </h3>
            <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={translatedData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius="80%"
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                        >
                            {translatedData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[data[index].name.toLowerCase()]} />
                            ))}
                        </Pie>
                        {/* O Tooltip agora é mais simples e não precisa mais da prop 't' */}
                        <Tooltip content={<CustomTooltip locale={currentLocale} unit={unit} />} />
                        <Legend 
                            formatter={(value) => <span className="text-blue-coral font-comfortaa">{value}</span>} 
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}