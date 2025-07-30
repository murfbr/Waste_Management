// src/components/site/AboutHero.jsx
import React from 'react';

export default function AboutHero() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          {/* Título Principal */}
          {/* ANTES: className="text-4xl font-bold ... text-gray-900 sm:text-6xl" */}
          <h2 className="font-lexend text-titulo font-bold tracking-tight text-blue-coral">Sobre nós</h2>
          
          {/* Subtítulo/Tagline */}
          {/* ANTES: className="mt-6 text-xl ... text-green-600" */}
          <p className="mt-6 font-lexend text-xl leading-8 text-apricot-orange font-semibold">
            Tecnologia para transformar resíduos em dados e dados em economia.
          </p>
          
          {/* Textos de Corpo */}
          {/* ANTES: className="mt-4 text-lg text-gray-600" */}
          <p className="mt-4 font-comfortaa text-corpo text-rich-soil">
            O Ctrl Waste é uma solução cleantech desenvolvida para tornar a gestão de resíduos mais eficiente, econômica e estratégica. Unimos software inteligente e hardware acessível (balança + tablet) para oferecer o controle que sua operação precisa: por peso, tipo de resíduo, ponto gerador e período.
          </p>
          <p className="mt-4 font-comfortaa text-corpo text-rich-soil">
            Com o Ctrl Waste, sua empresa ganha visibilidade total sobre o que descarta, identifica oportunidades de reduzir desperdícios e ainda automatiza processos essenciais, como a emissão do MTR (Manifesto de Transporte de Resíduos).
          </p>
           <p className="mt-4 font-comfortaa text-corpo text-rich-soil">
            Mais do que monitorar, ajudamos você a tomar decisões com base em dados reais - um passo essencial para alcançar metas de ESG, certificações e ganhos operacionais.
          </p>
        </div>
      </div>
    </section>
  );
}