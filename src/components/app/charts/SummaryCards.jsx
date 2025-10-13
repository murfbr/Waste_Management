// src/components/app/charts/SummaryCards.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';

// ---- Helpers ----
const formatNumber = (number, locale, decimalPlaces = 2) => {
  if (typeof number !== 'number' || isNaN(number)) {
    return '0,00';
  }
  return number.toLocaleString(locale, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
};

// Converte dinamicamente: < 10.000 mantém Kg; ≥ 10.000 vira toneladas (t)
const formatWeight = (number, locale) => {
  if (typeof number !== 'number' || isNaN(number)) {
    return { value: '0,00', unit: 'Kg' };
  }
  if (number >= 10000) {
    const tons = number / 1000;
    return {
      value: tons.toLocaleString(locale, { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
      unit: 't',
    };
  }
  return {
    value: number.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    unit: 'Kg',
  };
};

// ---- UI Cards ----
const SummaryCard = ({ title, value, unit, bgColor, textColor }) => (
  <div className={`p-4 md:p-6 rounded-lg shadow-md flex flex-col items-center justify-center text-center h-full ${bgColor} ${textColor} font-comfortaa`}>
    <h3 className="text-base font-semibold mb-1">{title}</h3>
    <p className="font-lexend text-2xl md:text-3xl font-bold">
      {value} <span className="text-lg font-normal">{unit}</span>
    </p>
  </div>
);

const CategoryCard = ({ title, percentage, weightKg, bgColor, textColor, locale }) => {
  const { value, unit } = formatWeight(weightKg, locale);
  return (
    <div className={`p-4 md:p-6 rounded-lg shadow-md flex flex-col items-center justify-center text-center h-full ${bgColor} ${textColor} font-comfortaa`}>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="font-lexend text-2xl md:text-3xl font-bold mb-1">{formatNumber(percentage, locale)}%</p>
      <p className="text-lg md:text-xl font-medium">{value} {unit}</p>
    </div>
  );
};

export default function SummaryCards({ summaryData, isLoading }) {
  const { t, i18n } = useTranslation('dashboard');

  // Locale map
  const localeMap = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' };
  const currentLocale = localeMap[i18n.language] || 'pt-BR';

  if (isLoading) {
    return (
      <div className="bg-white p-4 md:p-6 rounded-b-lg shadow">
        <p className="text-center text-rich-soil py-8 font-comfortaa">
          {t('summaryCardsComponent.loading')}
        </p>
      </div>
    );
  }

  // A condição foi ajustada para ser mais robusta
  if (!summaryData || summaryData.organico === undefined || summaryData.organico.percent === undefined) {
    return (
      <div className="bg-white p-4 md:p-6 rounded-b-lg shadow">
        <p className="text-center text-rich-soil py-8 font-comfortaa">
          {t('summaryCardsComponent.noData')}
        </p>
      </div>
    );
  }

  // Formata o total com a regra Kg → t
  const totalFormatted = formatWeight(summaryData.totalGeralKg, currentLocale);

  return (
    <div className="bg-white p-4 md:p-6 rounded-b-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        {/* Card Total */}
        <div className="md:col-span-1">
          <SummaryCard 
            title={t('summaryCardsComponent.totalWaste')}
            value={totalFormatted.value}
            unit={totalFormatted.unit}
            bgColor="bg-golden-orange"
            textColor="text-white"
          />
        </div>

        {/* Cards de Categoria */}
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <CategoryCard
            title={t('summaryCardsComponent.organic')}
            percentage={summaryData.organico.percent}
            weightKg={summaryData.organico.kg}
            bgColor="bg-rich-soil"
            textColor="text-white"
            locale={currentLocale}
          />
          <CategoryCard
            title={t('summaryCardsComponent.recyclable')}
            percentage={summaryData.reciclavel.percent}
            weightKg={summaryData.reciclavel.kg}
            bgColor="bg-blue-coral"
            textColor="text-white"
            locale={currentLocale}
          />
          <CategoryCard
            title={t('summaryCardsComponent.disposable')}
            percentage={summaryData.rejeito.percent}
            weightKg={summaryData.rejeito.kg}
            bgColor="bg-early-frost"
            textColor="text-rich-soil"
            locale={currentLocale}
          />
        </div>
      </div>
    </div>
  );
}
