// src/components/site/HeroSection.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import lancamentoImg from '../../pages/site/img/lancamento3.png';
import logoAzulLaranja from '../../pages/site/img/Vertical-AzulLaranja-SVG.svg';

export default function HeroSection() {
  const { t } = useTranslation('site');

  return (
    <section className="bg-white text-rich-soil">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex md:flex-row flex-col items-center">
        
        {/* Texto e Botões */}
        <div className="lg:flex-grow md:w-1/2 lg:pr-24 md:pr-16 flex flex-col md:items-start md:text-left mb-16 md:mb-0 items-center text-center">
          
          <h1 className="font-lexend text-titulo font-extrabold text-blue-coral mb-4 flex flex-col items-center md:items-start">
            <img className="w-32 h-auto mb-4 object-contain" alt="Ctrl Waste logo" src={logoAzulLaranja} />
            {t('hero.title')}
          </h1>
          
          <p className="font-comfortaa text-corpo mb-8">
            {t('hero.paragraph1')}
          </p>
          <p className="font-comfortaa text-corpo mb-8">
            {t('hero.paragraph2')}
          </p>

          <div className="flex justify-center md:justify-start">
            <Link 
              to="/contato" 
              className="inline-flex text-white bg-apricot-orange border-0 py-3 px-8 focus:outline-none hover:bg-apricot-orange rounded-lg font-lexend text-acao font-semibold shadow-lg transition-colors duration-300"
            >
              {t('hero.buttonDemo')}
            </Link>

            <Link 
              to="/produto" 
              className="ml-4 inline-flex text-blue-coral bg-early-frost border-0 py-3 px-8 focus:outline-none hover:bg-gray-300 rounded-lg font-lexend text-acao font-semibold transition-colors duration-300"
            >
              {t('hero.buttonLearn')}
            </Link>
          </div>
        </div>

        {/* Imagem de destaque */}
        <div className="lg:max-w-lg lg:w-full md:w-1/2 w-5/6">
          <img className="object-cover object-center rounded-lg shadow-2xl" alt="Ctrl Waste dashboard" src={lancamentoImg} />
        </div>
      </div>
    </section>
  );
}
