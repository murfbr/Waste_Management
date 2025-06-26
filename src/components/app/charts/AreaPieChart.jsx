// src/components/charts/AreaPieChart.jsx
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AA336A', '#3D9140', '#FF5733', '#8333FF'];

// Função auxiliar para formatar números
const formatNumberBR = (number) => {
  if (typeof number !== 'number' || isNaN(number)) {
    return '0,0';
  }
  // AJUSTADO: Agora formata com 1 casa decimal
  return number.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
};

// RÓTULO CUSTOMIZADO: Posição, alinhamento e fonte ajustados.
const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent, value, fill }) => {
    if (percent < 0.05) { // Oculta o rótulo para fatias muito pequenas
        return null;
    }
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 40;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text
            x={x}
            y={y}
            fill={fill}
            textAnchor="middle"
            dominantBaseline="central"
            className="text-sm font-bold"
        >
            <tspan x={x} dy="0">{formatNumberBR(value)} kg</tspan>
            {/* AJUSTADO: Percentual com 1 casa decimal */}
            <tspan x={x} dy="1.2em">{`(${(percent * 100).toFixed(1)}%)`}</tspan>
        </text>
    );
};


export default function AreaPieChart({
  data,
  isLoading,
  titleContext = ""
}) {
  const chartTitle = `Composição por Área (Peso)${titleContext}`;

  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow h-[500px] flex flex-col">
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
    <div className="bg-white p-4 rounded-lg shadow h-[500px] flex flex-col">
      <h3 className="text-md md:text-lg font-semibold text-gray-700 mb-3 text-center">
        {chartTitle}
      </h3>
      {data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              // AJUSTE DE ESPAÇAMENTO: O valor 'cy' move o centro do gráfico para cima.
              // Diminua o valor (ex: "40%") para subir mais e dar mais espaço para a legenda.
              cy="45%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius="65%"
              fill="#82ca9d"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-area-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                  // AJUSTADO: Percentual com 1 casa decimal no tooltip
                  `${formatNumberBR(value)} kg (${(value / totalValue * 100).toFixed(1)}%)`,
                  name
              ]}
              labelStyle={{ fontWeight: 'bold' }}
              wrapperClassName="rounded-md border-gray-300 shadow-lg"
            />
            <Legend verticalAlign="bottom" />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-center text-gray-500">Sem dados para o gráfico de área do cliente.</p>
        </div>
      )}
    </div>
  );
}
