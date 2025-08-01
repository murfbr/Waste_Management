// src/components/charts/DesvioDeAterro.jsx
import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

// Cores definidas localmente, baseadas na sua identidade visual
const chartColors = {
  taxaDesvio: '#156172',      // exotic-plume
  mediaTaxaDesvio: '#DB8D37', // golden-orange
  meta: '#174C2F',           // abundant-green
};

export default function DesvioDeAterro({
  data,
  isLoading,
  noDataMessageDetails = ""
}) {
  const chartTitle = "Taxa de desvio de aterro";
  const baseNoDataMessage = `Sem dados para o gráfico Taxa de Desvio de Aterro.`;

  if (isLoading) {
    return (
      <div className="bg-white p-4 md:p-6 rounded-lg shadow font-comfortaa">
        <h2 className="text-acao font-lexend text-blue-coral text-center mb-4">{chartTitle}</h2>
        <p className="text-center text-blue-coral py-4">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow">
      <h2 className="text-acao font-lexend text-blue-coral text-center mb-4">
        {chartTitle}
      </h2>
      {data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid stroke="#BCBCBC" strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fill: '#0D4F5F', fontFamily: 'Comfortaa' }} />
            <YAxis 
              tick={{ fill: '#0D4F5F', fontFamily: 'Comfortaa' }}
              label={{ value: '% Desvio', angle: -90, position: 'insideLeft', fill: '#0D4F5F', fontFamily: 'Lexend', offset: -5 }} 
              domain={[0, 100]}
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
              contentStyle={{ fontFamily: 'Comfortaa', borderColor: '#BCBCBC', borderRadius: '0.5rem' }}
              labelStyle={{ fontFamily: 'Lexend', color: '#0D4F5F' }}
            />
            <Legend wrapperStyle={{ fontFamily: 'Comfortaa', color: '#0D4F5F', paddingTop: '20px' }} />
            <Line 
              type="monotone" 
              dataKey="taxaDesvio"
              stroke={chartColors.taxaDesvio}
              strokeWidth={2}
              name="Taxa de Desvio"
              activeDot={{ r: 6, fill: chartColors.taxaDesvio }} 
            />
            <Line 
              type="monotone" 
              dataKey="mediaTaxaDesvio"
              stroke={chartColors.mediaTaxaDesvio}
              strokeWidth={2}
              name="Média de Desvio"
              strokeDasharray="5 5" 
              dot={false} 
            />
            <ReferenceLine 
              y={90}
              label={{ value: "Meta 90%", position: "insideTopRight", fill: chartColors.meta, dy: -10, fontFamily: 'Lexend' }} 
              stroke={chartColors.meta}
              strokeWidth={2}
              strokeDasharray="3 3" 
              ifOverflow="extendDomain"
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[400px] flex items-center justify-center font-comfortaa">
          <p className="text-center text-blue-coral py-4">{baseNoDataMessage}{noDataMessageDetails}</p>
        </div>
      )}
    </div>
  );
}
