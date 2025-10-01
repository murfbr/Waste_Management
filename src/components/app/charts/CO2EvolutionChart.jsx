import React from 'react';
<<<<<<< HEAD
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
=======
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
>>>>>>> aprovacao
import { useTranslation } from 'react-i18next';

const CustomTooltip = ({ active, payload, label }) => {
    const { t } = useTranslation('charts');
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-300 rounded-md shadow-lg">
                <p className="font-bold text-gray-800">{label}</p>
                {payload.map((entry, index) => (
                    <p key={`item-${index}`} style={{ color: entry.color }}>
<<<<<<< HEAD
                        {`${entry.name}: ${entry.value.toFixed(2)} t CO₂e`}
=======
                        {`${entry.name}: ${entry.value.toFixed(3)} t CO₂e`}
>>>>>>> aprovacao
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function CO2EvolutionChart({ data, isLoading }) {
    const { t } = useTranslation('charts');

    if (isLoading) {
        return <div className="text-center p-4">Carregando dados de evolução...</div>;
    }

    if (!data || data.length === 0) {
        return <div className="text-center p-4">Não há dados suficientes para exibir a evolução.</div>;
    }

    return (
<<<<<<< HEAD
        <div className="h-96 w-full">
            <h4 className="font-lexend text-md font-semibold text-rich-soil mb-4 text-center">Evolução do Balanço de CO₂e</h4>
            <ResponsiveContainer>
                <LineChart
                    data={data}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: 't CO₂e', angle: -90, position: 'insideLeft' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                        type="monotone" 
                        dataKey="netImpact" 
                        name={t('co2Evolution.netImpact', 'Balanço Líquido')} 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 8 }}
                    />
                </LineChart>
            </ResponsiveContainer>
=======
        // ALTERAÇÃO: Usando Flexbox para organizar o título e o gráfico verticalmente.
        <div className="w-full flex flex-col">
            <h2 className="font-lexend text-acao font-semibold text-rich-soil mb-4 text-center">Balanço de CO₂e Acumulado no Período</h2>
            
            {/* ALTERAÇÃO: Container com altura definida para o gráfico, garantindo que ele não vaze. */}
            <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                    {/* ALTERAÇÃO: Removida a margem manual para permitir o cálculo automático pela biblioteca. */}
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="chartGreenGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis 
                            label={{ value: 't CO₂e', angle: -90, position: 'insideLeft' }}
                            // Adicionado domain para garantir que o eixo comece em 0
                            domain={[0, 'auto']} 
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area 
                            type="monotone" 
                            dataKey="netImpact" 
                            name={t('co2Evolution.cumulativeImpact', 'Balanço Acumulado')} 
                            stroke="#16a34a"
                            fillOpacity={1}
                            fill="url(#chartGreenGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
>>>>>>> aprovacao
        </div>
    );
}