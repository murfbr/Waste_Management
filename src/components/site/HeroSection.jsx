import React from 'react';
import { Link } from 'react-router-dom';
import lancamentoImg from '../../pages/site/img/lancamento.png'

export default function HeroSection() {
  return (
    <section className="bg-white text-gray-800">
      {/* Container principal agora usa max-w-7xl e padding responsivo para garantir a centralização */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex md:flex-row flex-col items-center">
        <div className="lg:flex-grow md:w-1/2 lg:pr-24 md:pr-16 flex flex-col md:items-start md:text-left mb-16 md:mb-0 items-center text-center">
          <h1 className="title-font sm:text-5xl text-4xl mb-4 font-extrabold text-gray-900">
            <span className="text-green-600">Ctrl Waste:</span> Tecnologia intuitiva. Resultados mensuráveis.
          </h1>
          <p className="mb-8 leading-relaxed text-lg text-gray-600">
            Uma plataforma completa para monitoramento e gestão de resíduos feita para quem realmente opera: sistema intuitivo para registrar, reportar e reduzir resíduos
             por meio de dados precisos, dashboards em tempo real, emissão automática de MTR e insights prontos para decisões estratégicas.
          </p>
          <p className="mb-8 leading-relaxed text-gray-600">
            Do registro à análise, tudo o que sua empresa precisa para <b>tomar decisões baseadas em dados, reduzir custos operacionais e avançar em sustentabilidade com eficiência.</b>
          </p>
          <div className="flex justify-center md:justify-start">
            <Link to="/contato" className="inline-flex text-white bg-green-600 border-0 py-3 px-8 focus:outline-none hover:bg-green-700 rounded-lg text-lg shadow-lg">
              Peça uma Demonstração
            </Link>
            <Link to="/produto" className="ml-4 inline-flex text-gray-700 bg-gray-200 border-0 py-3 px-8 focus:outline-none hover:bg-gray-300 rounded-lg text-lg">
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
