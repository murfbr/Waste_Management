// src/components/site/HeroSection.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import lancamentoImg from '../../pages/site/img/lancamento.png';

export default function HeroSection() {
  return (
    // Fundo branco e cor de texto base suave (rich-soil), que será sobrescrita pelos elementos filhos.
    <section className="bg-white text-rich-soil">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex md:flex-row flex-col items-center">
        <div className="lg:flex-grow md:w-1/2 lg:pr-24 md:pr-16 flex flex-col md:items-start md:text-left mb-16 md:mb-0 items-center text-center">
          
          {/* ELEMENTO: Título Principal
            REGRA: Deve usar a fonte Lexend, o tamanho 'titulo' (42pt) e a cor primária 'rain-forest'.
          */}
          {/* ANTES: className="title-font sm:text-5xl text-4xl mb-4 font-extrabold text-gray-900" */}
          <h1 className="font-lexend text-titulo font-extrabold text-rain-forest mb-4">
            <span className="text-apricot-orange">Ctrl+Waste:</span> Tecnologia intuitiva. Resultados mensuráveis.
          </h1>
          
          {/* ELEMENTO: Parágrafos Descritivos
            REGRA: Devem usar a fonte Comfortaa e o tamanho 'corpo' (11pt).
          */}
          {/* ANTES: className="mb-8 leading-relaxed text-lg text-gray-600" */}
          <p className="font-comfortaa text-corpo mb-8">
            Uma plataforma completa para monitoramento e gestão de resíduos feita para quem realmente opera: sistema intuitivo para registrar, reportar e reduzir resíduos
             por meio de dados precisos, dashboards em tempo real, emissão automática de MTR e insights prontos para decisões estratégicas.
          </p>
          <p className="font-comfortaa text-corpo mb-8">
            Do registro à análise, tudo o que sua empresa precisa para <b>tomar decisões baseadas em dados, reduzir custos operacionais e avançar em sustentabilidade com eficiência.</b>
          </p>
          
          <div className="flex justify-center md:justify-start">
            {/* ELEMENTO: Botão Primário (Call to Action)
              REGRA: O texto deve usar a fonte Lexend, o peso Semibold e o tamanho 'acao' (18pt).
            */}
            {/* ANTES: className="... text-lg" */}
            <Link 
              to="/contato" 
              className="inline-flex text-white bg-apricot-orange border-0 py-3 px-8 focus:outline-none hover:bg-apricot-orange rounded-lg font-lexend text-acao font-semibold shadow-lg transition-colors duration-300"
            >
              Peça uma Demonstração
            </Link>
            
            {/* ELEMENTO: Botão Secundário
              REGRA: O texto deve seguir o mesmo padrão do botão primário (Lexend, Semibold, 'acao').
            */}
            {/* ANTES: className="... text-lg" */}
            <Link 
              to="/produto" 
              className="ml-4 inline-flex text-rain-forest bg-early-frost border-0 py-3 px-8 focus:outline-none hover:bg-gray-300 rounded-lg font-lexend text-acao font-semibold transition-colors duration-300"
            >
              Saiba Mais
            </Link>
          </div>
        </div>
        <div className="lg:max-w-lg lg:w-full md:w-1/2 w-5/6">
          <img className="object-cover object-center rounded-lg shadow-2xl" alt="ilustração do painel do sistema Ctrl Waste" src={lancamentoImg} />
        </div>
      </div>
    </section>
  );
} 