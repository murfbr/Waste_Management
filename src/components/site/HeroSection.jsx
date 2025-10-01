import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import lancamentoImg from '../../pages/site/img/lancamento4.png';
import logoAzulLaranja from '../../pages/site/img/Vertical-AzulLaranja-SVG.svg';

export default function HeroSection() {
  // 1. Obtenha o objeto i18n junto com o 't'
  const { t, i18n } = useTranslation('site');

  // 2. Determine o prefixo do caminho com base no idioma atual
  // Se o idioma for 'pt', o prefixo é uma string vazia. Caso contrário, será '/en' ou '/es'.
  const langPrefix = i18n.language === 'pt' ? '' : `/${i18n.language}`;

  // 3. Crie os caminhos completos para os botões
  const contatoPath = `${langPrefix}/contato`;
  const produtoPath = `${langPrefix}/produto`;

  return (
    <section className="bg-white text-rich-soil">
      <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 pt-8 pb-8">
        <div className="flex md:flex-row flex-col items-center gap-12">
          <div className="w-full md:w-1/2 lg:flex-grow lg:pr-24 md:pr-16 flex flex-col items-center md:items-start text-center md:text-left mb-16 md:mb-0">
            <h1 className="font-lexend text-subtitulo font-extrabold text-blue-coral mb-6 w-full">
              <img className="w-32 h-auto mb-6 object-contain mx-auto md:mx-0" alt="Ctrl Waste logo" src={logoAzulLaranja} />
              {t('hero.title')}
            </h1>

            <div className="space-y-6 w-full">
              <p className="font-comfortaa text-corpo">
                {t('hero.paragraph1')}
              </p>
              <p className="font-comfortaa text-corpo">
                {t('hero.paragraph2')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full mt-8">
              {/* 4. Use as variáveis dinâmicas nos links */}
              <Link
                to={contatoPath}
                className="w-full sm:w-auto text-center text-white bg-apricot-orange border-0 py-3 px-8 focus:outline-none hover:bg-apricot-orange rounded-lg font-lexend text-acao font-semibold shadow-lg transition-colors duration-300"
              >
                {t('hero.buttonDemo')}
              </Link>

              <Link
                to={produtoPath}
                className="w-full sm:w-auto text-center text-blue-coral bg-early-frost border-0 py-3 px-8 focus:outline-none hover:bg-gray-300 rounded-lg font-lexend text-acao font-semibold transition-colors duration-300"
              >
                {t('hero.buttonLearn')}
              </Link>
            </div>
          </div>

          <div className="w-full md:w-1/2 flex justify-center md:justify-end">
            <img className="object-cover object-center rounded-lg shadow-2xl w-full max-w-md" alt="Ctrl Waste dashboard" src={lancamentoImg} />
          </div>
        </div>
      </div>
    </section>
  );
}