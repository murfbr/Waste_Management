// src/components/charts/SummaryCards.jsx
import React from 'react';

// Helper function to format numbers in Brazilian Portuguese style
const formatNumberBR = (number, decimalPlaces = 2) => {
  if (typeof number !== 'number' || isNaN(number)) {
    return '0,00';
  }
  return number.toLocaleString('pt-BR', { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces });
};

const SummaryCard = ({ title, value, unit, bgColor = 'bg-gray-200', textColor = 'text-gray-800', valueTextSize = 'text-3xl', titleTextSize = 'text-sm' }) => (
  <div className={`p-4 md:p-6 rounded-lg shadow-md flex flex-col items-center justify-center text-center h-full ${bgColor} ${textColor}`}>
    <h3 className={`${titleTextSize} font-medium mb-1`}>{title}</h3>
    <p className={`${valueTextSize} font-bold`}>{value} <span className="text-lg font-normal">{unit}</span></p>
  </div>
);

const CategoryCard = ({ title, percentage, weightKg, bgColor, textColor }) => (
  <div className={`p-4 md:p-6 rounded-lg shadow-md flex flex-col items-center justify-center text-center h-full ${bgColor} ${textColor}`}>
    <h3 className="text-sm font-semibold mb-1">{title}</h3>
    <p className="text-2xl md:text-3xl font-bold mb-1">{formatNumberBR(percentage)}%</p>
    <p className="text-lg md:text-xl font-medium">{formatNumberBR(weightKg)} Kg</p>
  </div>
);


export default function SummaryCards({
  summaryData, // { totalGeralKg, compostavel: {kg, percent}, reciclavel: {kg, percent}, naoReciclavel: {kg, percent} }
  isLoading,
  titleContext = ""
}) {

  if (isLoading) {
    return (
      <div className="bg-white p-4 md:p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center bg-green-200 py-2 rounded-md">VISÃO GERAL{titleContext}</h2>
        <p className="text-center text-gray-500 py-8">Carregando indicadores...</p>
      </div>
    );
  }

  if (!summaryData || summaryData.totalGeralKg === undefined) {
     return (
      <div className="bg-white p-4 md:p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center bg-green-200 py-2 rounded-md">VISÃO GERAL{titleContext}</h2>
        <p className="text-center text-gray-500 py-8">Sem dados suficientes para os indicadores.</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center bg-green-200 py-2 rounded-md">
        VISÃO GERAL{titleContext}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        {/* Card Total */}
        <div className="md:col-span-1">
          <SummaryCard
            title="Total de Resíduos"
            value={formatNumberBR(summaryData.totalGeralKg)}
            unit="Kg"
            bgColor="bg-gray-600"
            textColor="text-white"
            valueTextSize="text-2xl md:text-3xl"
            titleTextSize="text-base"
          />
        </div>

        {/* Cards de Categoria - ocupando as 3 colunas restantes */}
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <CategoryCard
            title="% Compostável"
            percentage={summaryData.compostavel.percent}
            weightKg={summaryData.compostavel.kg}
            bgColor="bg-orange-300" // Cor similar à imagem
            textColor="text-orange-800"
          />
          <CategoryCard
            title="% Reciclável"
            percentage={summaryData.reciclavel.percent}
            weightKg={summaryData.reciclavel.kg}
            bgColor="bg-blue-400" // Cor similar à imagem
            textColor="text-blue-800"
          />
          <CategoryCard
            title="% Não Reciclável"
            percentage={summaryData.naoReciclavel.percent}
            weightKg={summaryData.naoReciclavel.kg}
            bgColor="bg-gray-700" // Cor similar à imagem
            textColor="text-white"
          />
        </div>
      </div>
    </div>
  );
}
