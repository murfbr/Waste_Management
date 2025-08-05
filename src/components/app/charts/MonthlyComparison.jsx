// src/components/charts/MonthlyYearlyComparisonChart.jsx
import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Cores para as barras dos anos (pode expandir se for comparar mais de 2 anos)
const YEAR_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

export default function MonthlyYearlyComparisonChart({
  chartData, // Array no formato: [{ month: 'Janeiro', '2024': 150, '2025': 180 }, ...]
  yearsToCompare, // Array de strings/números dos anos, ex: ['2024', '2025']
  titleContext, // String opcional para adicionar ao título, ex: "de Cliente X"
  isLoading,
}) {
  const chartTitle = `Volume Mensal Comparativo Anual${titleContext || ''}`;
  const noDataMessage = `Sem dados para o gráfico de volume mensal comparativo.`;

  if (isLoading) {
    return (
      <div className="bg-white p-4 md:p-6 rounded-lg shadow">
        <h2 className="text-acao font-lexend text-rain-forest mb-3 text-center">{chartTitle}</h2>
        <p className="text-center text-gray-500 py-4">Carregando dados...</p>
      </div>
    );
  }

  // Verifica se há algum dado para algum dos anos a serem comparados
  const hasData = chartData && chartData.some(item => yearsToCompare.some(year => item[year] !== undefined && item[year] > 0));

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow">
      <h2 className="text-acao font-lexend text-rain-forest mb-3 text-center">
        {chartTitle}
      </h2>
      {hasData ? (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft', offset: -10 }} />
            <Tooltip formatter={(value) => `${typeof value === 'number' ? value.toFixed(2) : value} kg`} />
            <Legend />
            {yearsToCompare.map((year, index) => (
              <Bar key={year} dataKey={year.toString()} fill={YEAR_COLORS[index % YEAR_COLORS.length]} name={year.toString()} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-center text-gray-500 py-4">{noDataMessage}</p>
      )}
    </div>
  );
}
