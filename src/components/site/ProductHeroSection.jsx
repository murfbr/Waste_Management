// src/components/site/ProductHeroSection.jsx

import React from 'react';
import { useTranslation } from 'react-i18next';

export default function ProductHeroSection() {
  const { t } = useTranslation();

  return (
    <div className="bg-blue-coral">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8 text-center">
        <h2 className="font-lexend text-titulo font-extrabold text-white">
          {t('productHero.title')}
        </h2>
        <p className="mt-4 text-xl font-comfortaa text-white/80 max-w-2xl mx-auto">
          {t('productHero.subtitle')}
        </p>
      </div>
    </div>
  );
}
