// src/components/site/ProductHeroSection.jsx
import React from 'react';

export default function ProductHeroSection() {
  return (
    // ANTES: className="bg-green-600"
    // DEPOIS: Usando a cor primária da marca para o fundo.
    <div className="bg-blue-coral">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8 text-center">
        
        {/* ANTES: className="text-4xl font-extrabold text-white sm:text-5xl" */}
        {/* DEPOIS: Aplicando nossa classe de título principal. */}
        <h2 className="font-lexend text-titulo font-extrabold text-white">
          Transforme Resíduos em Resultados
        </h2>
        
        {/* ANTES: className="mt-4 text-lg ... text-green-200" */}
        {/* DEPOIS: Usando a fonte de corpo e uma opacidade para o texto secundário. */}
        <p className="mt-4 text-xl font-comfortaa text-white/80 max-w-2xl mx-auto">
          Uma solução completa, do registo à análise, para uma gestão de resíduos mais inteligente e económica.
        </p>
      </div>
    </div>
  );
}