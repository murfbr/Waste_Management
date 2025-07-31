// src/components/app/charts/SummaryCards.jsx
import React from 'react';

// Função auxiliar para formatar números no padrão pt-BR
const formatNumberBR = (number, decimalPlaces = 2) => {
  if (typeof number !== 'number' || isNaN(number)) {
    return '0,00';
  }
  return number.toLocaleString('pt-BR', { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces });
};

// Card genérico para o valor total
const SummaryCard = ({ title, value, unit, bgColor, textColor }) => (
  <div className={`p-4 md:p-6 rounded-lg shadow-md flex flex-col items-center justify-center text-center h-full ${bgColor} ${textColor} font-comfortaa`}>
    <h3 className={`text-base font-semibold mb-1`}>{title}</h3>
    <p className={`font-lexend text-2xl md:text-3xl font-bold`}>
      {value} <span className="text-lg font-normal">{unit}</span>
    </p>
  </div>
);

// Card para as categorias de resíduos
const CategoryCard = ({ title, percentage, weightKg, bgColor, textColor }) => (
  <div className={`p-4 md:p-6 rounded-lg shadow-md flex flex-col items-center justify-center text-center h-full ${bgColor} ${textColor} font-comfortaa`}>
    <h3 className="text-sm font-semibold mb-1">{title}</h3>
    <p className="font-lexend text-2xl md:text-3xl font-bold mb-1">{formatNumberBR(percentage)}%</p>
    <p className="text-lg md:text-xl font-medium">{formatNumberBR(weightKg)} Kg</p>
  </div>
);


// ALTERAÇÃO: O componente agora espera summaryData.rejeito
export default function SummaryCards({ summaryData, isLoading }) {

  if (isLoading) {
    return (
      <div className="bg-white p-4 md:p-6 rounded-b-lg shadow">
        <p className="text-center text-rich-soil py-8 font-comfortaa">Carregando indicadores...</p>
      </div>
    );
  }

  // ALTERAÇÃO: A verificação agora busca por summaryData.rejeito
  if (!summaryData || summaryData.rejeito === undefined) {
     return (
      <div className="bg-white p-4 md:p-6 rounded-b-lg shadow">
        <p className="text-center text-rich-soil py-8 font-comfortaa">Sem dados suficientes para os indicadores.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 md:p-6 rounded-b-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        {/* Card Total */}
        <div className="md:col-span-1">
          <SummaryCard
            title="Total de Resíduos"
            value={formatNumberBR(summaryData.totalGeralKg)}
            unit="Kg"
            bgColor="bg-golden-orange"
            textColor="text-white"
          />
        </div>

        {/* Cards de Categoria - ocupando as 3 colunas restantes */}
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <CategoryCard
            title="% Compostável"
            percentage={summaryData.compostavel.percent}
            weightKg={summaryData.compostavel.kg}
            bgColor="bg-rich-soil"
            textColor="text-white"  
          />
          <CategoryCard
            title="% Reciclável"
            percentage={summaryData.reciclavel.percent}
            weightKg={summaryData.reciclavel.kg}
            bgColor="bg-rain-forest"
            textColor="text-white"
          />
          {/* ALTERAÇÃO: O card agora é "% Rejeito" e usa summaryData.rejeito */}
          <CategoryCard
            title="% Rejeito"
            percentage={summaryData.rejeito.percent}
            weightKg={summaryData.rejeito.kg}
            bgColor="bg-early-frost"
            textColor="text-rich-soil"
          />
        </div>
      </div>
    </div>
  );
}
