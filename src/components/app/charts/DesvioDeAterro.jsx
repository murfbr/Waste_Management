// src/components/charts/DesvioDeAterro.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation('dashboard');

  const localeMap = {
    pt: 'pt-BR',
    en: 'en-US',
    es: 'es-ES',
  };
  const currentLocale = localeMap[i18n.language] || 'pt-BR';

  const chartTitle = t('landfillDiversionComponent.chartTitle');
  const baseNoDataMessage = t('landfillDiversionComponent.noData');

  // Lógica para tornar o eixo Y dinâmico
  const allValues = data ? data.flatMap(d => [d.taxaDesvio, d.mediaTaxaDesvio]).filter(v => typeof v === 'number') : [];
  const minValue = allValues.length > 0 ? Math.min(...allValues) : 100;

  // Define o domínio e os ticks com base no menor valor.
  // Se o menor valor for >= 50, usamos a visão "zoom". Caso contrário, a visão completa.
  const isZoomed = minValue >= 50;
  
  // No modo zoom, o domínio começa um pouco abaixo do menor valor de dado ('dataMin - 5') para dar um respiro,
  // e os ticks são mais focados na área de interesse.
  const yAxisDomain = isZoomed ? ['dataMin - 5', 101] : [0, 100];
  const yAxisTicks = isZoomed ? [50, 75, 90, 100] : [0, 25, 50, 75, 90, 100];

  if (isLoading) {
    return (
      <div className="bg-white p-4 md:p-6 rounded-lg shadow font-comfortaa">
        <h2 className="text-acao font-lexend text-rain-forest text-center mb-4">{chartTitle}</h2>
        <p className="text-center text-rain-forest py-4">{t('landfillDiversionComponent.loading')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow">
      <h2 className="text-acao font-lexend text-rain-forest text-center mb-4">
        {chartTitle}
      </h2>
      {data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid stroke="#BCBCBC" strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fill: '#0D4F5F', fontFamily: 'Comfortaa' }} />
            <YAxis 
              tick={{ fill: '#0D4F5F', fontFamily: 'Comfortaa' }}
              label={{ value: t('landfillDiversionComponent.yAxisLabel'), angle: -90, position: 'insideLeft', fill: '#0D4F5F', fontFamily: 'Lexend', offset: -5 }} 
              domain={yAxisDomain}
              tickFormatter={(tick) => `${tick}%`}
              ticks={yAxisTicks}
              interval={0}
            />
            <Tooltip 
              formatter={(value, name) => {
                const formattedValue = `${typeof value === 'number' ? value.toLocaleString(currentLocale, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : value}%`;
                return [formattedValue, name]; 
              }}
              labelFormatter={(label) => `${t('landfillDiversionComponent.tooltip.label')}: ${label}`}
              contentStyle={{ fontFamily: 'Comfortaa', borderColor: '#BCBCBC', borderRadius: '0.5rem' }}
              labelStyle={{ fontFamily: 'Lexend', color: '#0D4F5F' }}
            />
            <Legend wrapperStyle={{ fontFamily: 'Comfortaa', color: '#0D4F5F', paddingTop: '20px' }} />
            <Line 
              type="monotone" 
              dataKey="taxaDesvio"
              stroke={chartColors.taxaDesvio}
              strokeWidth={2}
              name={t('landfillDiversionComponent.legend.diversionRate')}
              activeDot={{ r: 6, fill: chartColors.taxaDesvio }} 
            />
            <Line 
              type="monotone" 
              dataKey="mediaTaxaDesvio"
              stroke={chartColors.mediaTaxaDesvio}
              strokeWidth={2}
              name={t('landfillDiversionComponent.legend.averageRate')}
              strokeDasharray="5 5" 
              dot={false} 
            />
            {/* Linha "fantasma" apenas para adicionar a Meta na legenda */}
            <Line 
              dataKey="meta" 
              name={t('landfillDiversionComponent.legend.goal', 'Meta')}
              stroke={chartColors.meta}
              strokeWidth={2}
              strokeDasharray="3 3"
              activeDot={false}
            />
            <ReferenceLine 
              y={90}
              stroke={chartColors.meta}
              strokeWidth={2}
              strokeDasharray="3 3" 
              ifOverflow="extendDomain"
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[400px] flex items-center justify-center font-comfortaa">
          <p className="text-center text-rain-forest py-4">{baseNoDataMessage}{noDataMessageDetails}</p>
        </div>
      )}
    </div>
  );
}