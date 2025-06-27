// src/components/site/AboutHero.jsx
import React from 'react';

export default function AboutHero() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">Sobre nós</h2>
          <p className="mt-6 text-xl leading-8 text-green-600 font-semibold">
            Tecnologia para transformar resíduos em dados e dados em economia.
          </p>
          <p className="mt-4 text-lg text-gray-600">
            O Ctrl Waste é uma solução cleantech desenvolvida para tornar a gestão de resíduos mais eficiente, econômica e estratégica. Unimos software inteligente e hardware acessível (balança + tablet) para oferecer o controle que sua operação precisa: por peso, tipo de resíduo, ponto gerador e período.
          </p>
          <p className="mt-4 text-lg text-gray-600">
            Com o Ctrl Waste, sua empresa ganha visibilidade total sobre o que descarta, identifica oportunidades de reduzir desperdícios e ainda automatiza processos essenciais, como a emissão do MTR (Manifesto de Transporte de Resíduos).
          </p>
           <p className="mt-4 text-lg text-gray-600">
            Mais do que monitorar, ajudamos você a tomar decisões com base em dados reais - um passo essencial para alcançar metas de ESG, certificações e ganhos operacionais.
          </p>
        </div>
      </div>
    </section>
  );
}
