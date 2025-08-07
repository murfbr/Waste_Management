// src/components/app/charts/DestinacaoChart.jsx

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Cores definidas localmente, baseadas na sua identidade visual
const COLORS = {
    'Recuperação': '#0D3520', // rain-forest (sucesso)
    'Descarte': '#BCBCBC',    // early-frost (alerta/descarte)
};

// Função auxiliar para formatar números
const formatNumberBR = (number, decimals = 1) => {
  if (typeof number !== 'number' || isNaN(number)) {
    return '0,0';
  }
  return number.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const mainValue = data.value;
        const mainName = data.name;
        const breakdown = data.breakdown || [];

        return (
            <div className="p-3 bg-white bg-opacity-95 border border-early-frost rounded-lg shadow-lg font-comfortaa text-rain-forest">
                <p className="font-lexend text-base mb-2 border-b border-early-frost pb-1">
                    {mainName}: <span className="font-bold">{formatNumberBR(mainValue, 2)} kg</span>
                </p>
                {breakdown.length > 0 && (
                     <ul className="list-none p-0 m-0 text-sm space-y-1">
                        {breakdown.map((item, index) => {
                            const percentage = mainValue > 0 ? (item.value / mainValue) * 100 : 0;
                            return (
                                <li key={index} className="flex justify-between items-center">
                                    <span>{item.name}:</span>
                                    <span className="font-bold ml-3">{formatNumberBR(item.value, 2)} kg ({formatNumberBR(percentage, 1)}%)</span>
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
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px] bg-white rounded-lg shadow font-comfortaa">
                <p className="text-rain-forestl">Calculando dados de destinação...</p>
            </div>
        );
    }

    if (!data || data.length === 0 || data.every(d => d.value === 0)) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px] bg-white rounded-lg shadow font-comfortaa">
                <p className="text-rain-forest text-center">
                    Sem dados suficientes para calcular a destinação.
                    <br />
                    <span className="text-xs">Verifique os contratos e destinações.</span>
                </p>
            </div>
        );
    }
    
    return (
        <div className="bg-white p-4 rounded-lg shadow h-full min-h-[488px] flex flex-col">
            <h3 className="text-acao font-lexend text-rain-forest text-center mb-4">
                Destinação Final
            </h3>
            <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius="80%"
                            fill="#8884d8" // Cor padrão (não será usada por causa das Cells)
                            dataKey="value"
                            nameKey="name"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                            formatter={(value) => <span className="text-blue-coral font-comfortaa">{value}</span>} 
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
