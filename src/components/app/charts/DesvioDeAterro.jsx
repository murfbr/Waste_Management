// src/components/charts/DesvioDeAterro.jsx
import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

export default function DesvioDeAterro({
  data, // Anteriormente lixoZeroData
  titleParts, // Objeto com { periodTitle, areaTitleSegment, dashboardTitleContext }
  isLoading,
  noDataMessageDetails = "" // Detalhes adicionais para a mensagem de "sem dados"
}) {
  // Constrói o título completo do gráfico
  const chartTitle = `Desvio de Aterro: % de Rejeito (${titleParts.periodTitleForOtherCharts || ''})${titleParts.areaTitleSegmentForOtherCharts || ''}${titleParts.dashboardTitleContext || ''}`;

  // Mensagem padrão de "sem dados"
  const baseNoDataMessage = `Sem dados para o gráfico Desvio de Aterro neste período${(titleParts.areaTitleSegmentForOtherCharts && titleParts.areaTitleSegmentForOtherCharts.toLowerCase().includes('área')) ? ' e área(s) selecionada(s)' : ''}.`;

  if (isLoading) {
    return (
      <div className="bg-white p-4 md:p-6 rounded-lg shadow">
        <h2 className="text-lg md:text-xl font-semibold text-gray-700 mb-4">{chartTitle}</h2>
        <p className="text-center text-gray-500 py-4">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow">
      <h2 className="text-lg md:text-xl font-semibold text-gray-700 mb-4">
        {chartTitle}
      </h2>
      {data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: '% Rejeito', angle: -90, position: 'insideLeft', offset: -10 }} domain={[0, 'dataMax + 10']} allowDataOverflow />
            <Tooltip formatter={(value, name) => {
                if (name === '% Rejeito') return [`${typeof value === 'number' ? value.toFixed(2) : value}%`, name];
                if (name === 'Média % Rejeito') return [`${typeof value === 'number' ? value.toFixed(2) : value}%`, name];
                return [value, name];
            }} />
            <Legend />
            <Line type="monotone" dataKey="percentualRejeito" stroke="#FF8042" name="% Rejeito" activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="mediaPercentualRejeito" stroke="#82ca9d" name="Média % Rejeito" strokeDasharray="5 5" dot={false} />
            <ReferenceLine y={10} label={{ value: "Meta 10%", position: "insideTopRight", fill: "#FF8042", dy: -5 }} stroke="#FF8042" strokeDasharray="3 3" />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-center text-gray-500 py-4">{baseNoDataMessage}{noDataMessageDetails}</p>
      )}
    </div>
  );
}
