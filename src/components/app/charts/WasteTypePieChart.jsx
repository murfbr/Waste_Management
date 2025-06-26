// src/components/charts/WasteTypePieChart.jsx
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Cores temáticas para os tipos de resíduo
const WASTE_TYPE_COLORS = {
    'Reciclável': '#3f7fff',
    'Orgânico': '#704729',
    'Rejeito': '#757575',
    'default': '#6b7280'
};

// Função auxiliar para formatar números
const formatNumberBR = (number) => {
  if (typeof number !== 'number' || isNaN(number)) {
    return '0,00';
  }
  return number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// RÓTULO CUSTOMIZADO FINAL: Posição, alinhamento e fonte ajustados.
const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent, value, fill }) => {
    if (percent < 0.05) { // Oculta o rótulo para fatias muito pequenas
        return null;
    }
    const RADIAN = Math.PI / 180;
    // 1. Aumenta a distância do rótulo em relação ao gráfico
    const radius = outerRadius + 35; 
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text
            x={x}
            y={y}
            fill={fill} 
            // 2. Garante que o bloco de texto esteja centralizado em seu ponto de ancoragem
            textAnchor="middle"
            dominantBaseline="central"
            className="text-sm font-bold" 
        >
            {/* O tspan herda o text-anchor e se alinha ao centro */}
            <tspan x={x} dy="0">{formatNumberBR(value)} kg</tspan>
            <tspan x={x} dy="1.2em">{`(${(percent * 100).toFixed(0)}%)`}</tspan>
        </text>
    );
};


export default function WasteTypePieChart({
  data,
  isLoading,
  titleContext = ""
}) {
  const chartTitle = `Composição por Tipo de Resíduo (Peso)${titleContext}`;

  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow h-[400px] md:h-[450px] flex flex-col">
        <h3 className="text-md md:text-lg font-semibold text-gray-700 mb-3 text-center">{chartTitle}</h3>
        <div className="flex-grow flex items-center justify-center">
          <p className="text-center text-gray-500">Carregando dados...</p>
        </div>
      </div>
    );
  }

  const totalValue = useMemo(() => {
    if (!data || data.length === 0) return 0;
    return data.reduce((sum, entry) => sum + (entry.value || 0), 0);
  }, [data]);

  return (
    <div className="bg-white p-4 rounded-lg shadow h-[400px] md:h-[450px] flex flex-col">
      <h3 className="text-md md:text-lg font-semibold text-gray-700 mb-3 text-center">
        {chartTitle}
      </h3>
      {data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height="90%">
          <PieChart margin={{ top: 30, right: 40, left: 40, bottom: 20 }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false} 
              label={renderCustomizedLabel}
              outerRadius="80%"
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-type-${index}`} fill={WASTE_TYPE_COLORS[entry.name] || WASTE_TYPE_COLORS.default} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                  `${formatNumberBR(value)} kg (${(value / totalValue * 100).toFixed(0)}%)`,
                  name
              ]}
              labelStyle={{ fontWeight: 'bold' }}
              wrapperClassName="rounded-md border-gray-300 shadow-lg"
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-center text-gray-500">Sem dados para o gráfico de tipo de resíduo.</p>
        </div>
      )}
    </div>
  );
}
