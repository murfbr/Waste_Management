// src/components/charts/WasteTypePieChart.jsx
import React, { useMemo } from 'react'; // Adicionado useMemo aqui
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AA336A', '#3D9140', '#FF5733', '#8333FF'];

// Helper function to format numbers in Brazilian Portuguese style
const formatNumberBR = (number) => {
  if (typeof number !== 'number' || isNaN(number)) {
    return '0,00';
  }
  return number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function WasteTypePieChart({
  data,
  isLoading,
  titleContext = ""
}) {
  const chartTitle = `Composição por Tipo de Resíduo (Peso)${titleContext}`;

  if (isLoading) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg shadow h-[400px] md:h-[450px] flex flex-col">
        <h3 className="text-md md:text-lg font-semibold text-gray-700 mb-3 text-center">{chartTitle}</h3>
        <div className="flex-grow flex items-center justify-center">
          <p className="text-center text-gray-500">Carregando dados...</p>
        </div>
      </div>
    );
  }

  // Calculate total for percentage calculation in tooltip
  const totalValue = useMemo(() => {
    if (!data || data.length === 0) return 0; // Adiciona verificação para data vazia ou nula
    return data.reduce((sum, entry) => sum + (entry.value || 0), 0);
  }, [data]);

  return (
    <div className="bg-gray-50 p-4 rounded-lg shadow h-[400px] md:h-[450px] flex flex-col">
      <h3 className="text-md md:text-lg font-semibold text-gray-700 mb-3 text-center">
        {chartTitle}
      </h3>
      {data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height="90%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              // Label da fatia mostrando nome e peso formatado
              label={({ name, value }) => `${name}: ${formatNumberBR(value)} kg`}
              outerRadius="80%"
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-type-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name, props) => {
                const itemName = props.payload.name;
                const itemValue = props.payload.value;
                // Recalculate percentage for tooltip
                const percentage = totalValue > 0 && typeof itemValue === 'number' ? (itemValue / totalValue) * 100 : 0;
                return [
                  `${itemName}: ${formatNumberBR(itemValue)} kg (${percentage.toFixed(0)}%)`,
                  null // null como segundo argumento remove o label "Valor:"
                ];
              }}
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
