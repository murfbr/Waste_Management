// src/components/charts/DesvioDeAterro.jsx
import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

/**
 * Renderiza um gráfico de linha para a "Taxa de Desvio de Aterro".
 * Exibe a taxa de desvio diária e a média móvel, com uma linha de referência para a meta de 90%.
 */
export default function DesvioDeAterro({
  data,
  isLoading,
  noDataMessageDetails = ""
}) {
  // Título do gráfico conforme solicitado
  const chartTitle = "TAXA DE DESVIO DE ATERRO";

  const baseNoDataMessage = `Sem dados para o gráfico Taxa de Desvio de Aterro.`;

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
            <YAxis 
              label={{ value: '% Desvio de Aterro', angle: -90, position: 'insideLeft', offset: -10 }} 
              domain={[0, 100]} // Eixo Y vai de 0 a 100%
              tickFormatter={(tick) => `${tick}%`}
              allowDataOverflow 
            />
            <Tooltip 
              formatter={(value, name) => {
                const formattedValue = `${typeof value === 'number' ? value.toFixed(2) : value}%`;
                if (name === 'Taxa de Desvio') return [formattedValue, 'Taxa de Desvio'];
                if (name === 'Média de Desvio') return [formattedValue, 'Média de Desvio'];
                return [value, name];
              }}
              labelFormatter={(label) => `Dia: ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="taxaDesvio" // Chave de dados para a taxa de desvio
              stroke="#8884d8" // Cor roxa para a taxa de desvio
              name="Taxa de Desvio" // Nome da linha
              activeDot={{ r: 6 }} 
            />
            <Line 
              type="monotone" 
              dataKey="mediaTaxaDesvio" // Chave de dados para a média da taxa de desvio
              stroke="#82ca9d" // Cor verde para a média
              name="Média de Desvio" // Nome da linha de média
              strokeDasharray="5 5" 
              dot={false} 
            />
            <ReferenceLine 
              y={90} // Meta de 90%
              label={{ value: "Meta 90%", position: "insideTopRight", fill: "#d946ef", dy: -5 }} 
              stroke="#d946ef" // Cor magenta para a linha de meta
              strokeDasharray="3 3" 
              ifOverflow="extendDomain"
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[400px] flex items-center justify-center">
          <p className="text-center text-gray-500 py-4">{baseNoDataMessage}{noDataMessageDetails}</p>
        </div>
      )}
    </div>
  );
}
