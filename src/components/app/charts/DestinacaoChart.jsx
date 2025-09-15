// src/components/app/charts/DestinacaoChart.jsx

import React from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Manteve-se o mesmo
const COLORS = {
    'recovery': '#0D3520', // Cor para Valorização (rain-forest)
    'disposal': '#CE603E', // Cor para Descarte (apricot-orange)
};

const formatNumber = (number, locale, decimals = 1) => {
  if (typeof number !== 'number' || isNaN(number)) {
    return '0,0';
  }
  return number.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

// MUDANÇA AQUI: Tooltip agora usa a chave 'translatedName' para exibição
const CustomTooltip = ({ active, payload, locale, unit }) => {
    if (active && payload && payload.length) {
        const data = payload[0];
        const mainValue = data.payload.value;
        const translatedName = data.payload.translatedName; // Usando o nome traduzido
        const breakdown = data.payload.breakdown || [];

        return (
            <div className="p-3 bg-white bg-opacity-95 border border-early-frost rounded-lg shadow-lg font-comfortaa text-rain-forest">
                <p className="font-lexend text-base mb-2 border-b border-early-frost pb-1">
                    {translatedName}: <span className="font-bold">{formatNumber(mainValue, locale, 2)} {unit}</span>
                </p>
                {breakdown.length > 0 && (
                     <ul className="list-none p-0 m-0 text-sm space-y-1">
                        {breakdown.map((item, index) => {
                            const percentage = mainValue > 0 ? (item.value / mainValue) * 100 : 0;
                            return (
                                <li key={index} className="flex justify-between items-center">
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

    const localeMap = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' };
    const currentLocale = localeMap[i18n.language] || 'pt-BR';
    const unit = t('dashboard:destinationChartComponent.unit');
    const chartTitle = t('dashboard:destinationChartComponent.chartTitle');
    const noDataMessage = t('dashboard:destinationChartComponent.noData');

    // MUDANÇA AQUI: Criamos uma nova chave 'translatedName' em vez de substituir a original
    const chartData = data.map(entry => ({
        ...entry,
        translatedName: t(`charts:chartLabels.${entry.name.toLowerCase()}`)
    }));

    if (isLoading) {
        return (
            <div className="bg-white p-4 rounded-lg shadow h-full min-h-[488px] flex flex-col items-center justify-center">
                <h3 className="text-acao font-lexend text-rain-forest text-center mb-4">{chartTitle}</h3>
                <p className="text-rich-soil">{t('dashboard:destinationChartComponent.loading')}</p>
            </div>
        );
    }
    
    if (!data || data.length === 0 || data.every(d => d.value === 0)) {
        return (
            <div className="bg-white p-4 rounded-lg shadow h-full min-h-[488px] flex flex-col items-center justify-center">
                <h3 className="text-acao font-lexend text-rain-forest text-center mb-4">{chartTitle}</h3>
                <p className="text-rich-soil">{noDataMessage}</p>
            </div>
        );
    }
    
    return (
        <div className="bg-white p-4 rounded-lg shadow h-full min-h-[488px] flex flex-col">
            <h3 className="text-acao font-lexend text-rain-forest text-center mb-4">
                {chartTitle}
            </h3>
            <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius="80%"
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="translatedName" // MUDANÇA AQUI: Usando a nova chave para o nome
                        >
                            {chartData.map((entry, index) => (
                                // MUDANÇA AQUI: Usando a chave original 'name' para pegar a cor
                                <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase()]} />
                            ))}
                        </Pie>
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
