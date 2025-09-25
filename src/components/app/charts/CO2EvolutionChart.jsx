import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

const CustomTooltip = ({ active, payload, label }) => {
    const { t } = useTranslation('charts');
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-300 rounded-md shadow-lg">
                <p className="font-bold text-gray-800">{label}</p>
                {payload.map((entry, index) => (
                    <p key={`item-${index}`} style={{ color: entry.color }}>
                        {`${entry.name}: ${entry.value.toFixed(2)} t CO₂e`}
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
        </div>
    );
}