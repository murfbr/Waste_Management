// src/components/site/ProductHeroSection.jsx
import React from 'react';

export default function ProductHeroSection() {
  return (
    <div className="bg-green-600">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-extrabold text-white sm:text-5xl">
          Transforme Resíduos em Resultados
        </h2>
        <p className="mt-4 text-lg leading-6 text-green-200 max-w-2xl mx-auto">
          Uma solução completa, do registo à análise, para uma gestão de resíduos mais inteligente e económica.
        </p>
      </div>
    </div>
  );
}
