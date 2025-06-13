import React from 'react';
import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <section className="bg-white text-gray-800">
      <div className="container mx-auto flex px-5 py-24 md:flex-row flex-col items-center">
        <div className="lg:flex-grow md:w-1/2 lg:pr-24 md:pr-16 flex flex-col md:items-start md:text-left mb-16 md:mb-0 items-center text-center">
          <h1 className="title-font sm:text-4xl text-3xl mb-4 font-bold">
            CtrlWaste: Gestão Inteligente de Resíduos para um Futuro Sustentável
          </h1>
          <p className="mb-8 leading-relaxed text-lg text-gray-600">
            Nossa plataforma oferece as ferramentas que você precisa para monitorar, analisar e otimizar todo o ciclo de vida dos resíduos da sua empresa, transformando dados em ações eficientes e econômicas.
          </p>
          <div className="flex justify-center">
            <Link to="/contato" className="inline-flex text-white bg-green-600 border-0 py-2 px-6 focus:outline-none hover:bg-green-700 rounded text-lg">
              Peça uma Demonstração
            </Link>
            <Link to="/produto" className="ml-4 inline-flex text-gray-700 bg-gray-200 border-0 py-2 px-6 focus:outline-none hover:bg-gray-300 rounded text-lg">
              Saiba Mais
            </Link>
          </div>
        </div>
        <div className="lg:max-w-lg lg:w-full md:w-1/2 w-5/6">
          {/* Placeholder para uma imagem ou ilustração */}
          <div className="bg-green-200 h-96 rounded-lg flex items-center justify-center shadow-lg">
            <p className="text-green-700 text-xl font-semibold">[Ilustração do Produto]</p>
          </div>
        </div>
      </div>
    </section>
  );
}