// src/components/app/charts/DestinacaoChart.jsx

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = {
    'Recovery': '#22c55e', // Verde para recuperação/valorização
    'Disposal': '#ef4444', // Vermelho para descarte/disposição
};

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        // O peso total é passado em cada fatia do gráfico para o cálculo da porcentagem
        const total = data.totalWeight;
        const percent = total > 0 ? ((payload[0].value / total) * 100).toFixed(2) : 0;
        return (
            <div className="p-2 bg-white border border-gray-300 rounded-md shadow-lg">
                <p className="font-bold text-gray-800">{data.name}</p>
                <p className="text-sm text-gray-600">Peso: {payload[0].value.toLocaleString('pt-BR')} kg ({percent}%)</p>
            </div>
        );
    }
    return null;
};

export default function DestinacaoChart({ data, isLoading }) {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px] bg-white rounded-lg shadow">
                <p className="text-gray-500">Calculando dados de destinação...</p>
            </div>
        );
    }

    if (!data || data.every(d => d.value === 0)) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px] bg-white rounded-lg shadow">
                <p className="text-gray-500 text-center">
                    Sem dados suficientes para calcular a destinação.
                    <br />
                    <span className="text-xs">Verifique os contratos dos clientes e as destinações das empresas de coleta.</span>
                </p>
            </div>
        );
    }
    
    // Calcula o peso total para passar ao tooltip para o cálculo de porcentagem
    const totalWeight = data.reduce((sum, entry) => sum + entry.value, 0);
    const chartData = data.map(entry => ({ ...entry, totalWeight }));

    return (
        <div className="bg-white p-4 rounded-lg shadow h-full min-h-[488px] flex flex-col">
            <h3 className="text-lg font-semibold text-gray-700 text-center mb-4">Destinação Final (Recovery vs Disposal)</h3>
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
                            nameKey="name"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend formatter={(value) => <span className="text-gray-600">{value}</span>} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
