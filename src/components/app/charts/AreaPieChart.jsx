// src/components/app/charts/AreaPieChart.jsx
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { wasteTypeColors } from '../../../utils/wasteTypeColors'; // Importado

// Paleta de cores para as áreas
const CHART_COLORS = ['#0D4F5F', '#CE603E', '#0D3520', '#BCBCBC', '#DB8D37', '#51321D', '#174C2F'];

// Função auxiliar para formatar números
const formatNumberBR = (number, decimals = 1) => {
  if (typeof number !== 'number' || isNaN(number)) {
    return '0,0';
  }
  return number.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

// NOVO: Tooltip customizado para exibir o detalhamento por tipo de resíduo
const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const totalValue = data.value;
        const areaName = data.name;
        const breakdown = data.breakdown || [];

        return (
            <div className="p-3 bg-white bg-opacity-95 border border-early-frost rounded-lg shadow-lg font-comfortaa text-rich-soil">
                <p className="font-lexend text-base mb-2 border-b border-early-frost pb-1">
                    {areaName}: <span className="font-bold">{formatNumberBR(totalValue)} kg</span>
                </p>
                {breakdown.length > 0 && (
                     <ul className="list-none p-0 m-0 text-sm space-y-1">
                        {breakdown.map((item, index) => {
                            const percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
                            const color = wasteTypeColors[item.name]?.bg || wasteTypeColors.default.bg;
                            return (
                                <li key={index} className="flex justify-between items-center">
                                    <div className="flex items-center">
                                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }}></span>
                                        <span>{item.name}:</span>
                                    </div>
                                    <span className="font-bold ml-3">{formatNumberBR(item.value)} kg ({formatNumberBR(percentage)}%)</span>
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

// Rótulo customizado
const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent, value, fill }) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text
            x={x}
            y={y}
            fill={fill}
            textAnchor={x > cx ? 'start' : 'end'}
            dominantBaseline="central"
            className="font-comfortaa text-sm"
        >
            <tspan x={x} dy="0">{formatNumberBR(value)} kg</tspan>
            <tspan x={x} dy="1.2em">{`(${(percent * 100).toFixed(1)}%)`}</tspan>
        </text>
    );
};


export default function AreaPieChart({ data, isLoading }) {
  const chartTitle = `Composição por Área`;

  if (isLoading) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center">
        <h3 className="text-acao font-lexend text-rain-forest mb-3 text-center">{chartTitle}</h3>
        <p className="text-center text-rain-forest font-comfortaa">Carregando dados...</p>
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
              label={renderCustomizedLabel}
              outerRadius="80%"
              fill="#82ca9d"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-area-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            {/* ATUALIZADO: Usa o novo tooltip customizado */}
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom"
              wrapperStyle={{ paddingTop: "20px", fontFamily: 'Comfortaa', color: '#51321D' }}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-center text-rich-soil font-comfortaa">Sem dados para exibir.</p>
        </div>
      )}
    </div>
  );
}
