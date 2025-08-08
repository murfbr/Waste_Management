import React from 'react';
import { useTranslation } from 'react-i18next';

const ValueItem = ({ icon, text }) => (
  <div className="flex items-start gap-x-4">
    <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-blue-coral">
      <span className="text-2xl">{icon}</span>
    </div>
    <div>
      <p className="font-lexend text-lg font-semibold text-blue-coral">{text}</p>
    </div>
  </div>
);

export default function ValuesSection() {
  const { t } = useTranslation('site');
  const values = t('valuesSection.values', { returnObjects: true });

  return (
    <section className="bg-gray-100 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* O grid principal agora contém duas colunas bem definidas */}
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-12 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 items-start">
          
          {/* Coluna da Esquerda: Título e Descrição */}
          <div className="lg:pr-8 lg:pt-2">
            <div className="lg:max-w-lg">
              <p className="font-lexend text-subtitulo font-bold tracking-tight text-blue-coral">
                {t('valuesSection.title')}
              </p>
              <p className="mt-6 font-comfortaa text-acao leading-8 text-rich-soil">
                {t('valuesSection.description')}
              </p>
              {/* O subtítulo foi movido daqui para a coluna da direita */}
            </div>
          </div>

          {/* Coluna da Direita: Novo Título e a Lista de Valores */}
          <div className="lg:pt-2">
            {/* O subtítulo agora é o título desta coluna, com o estilo solicitado */}
            <h2 className="font-lexend text-subtitulo font-bold tracking-tight text-apricot-orange">
              {t('valuesSection.subtitle')}
            </h2>
            <dl className="mt-10 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2">
              {values.map((value, i) => (
                <ValueItem key={i} icon={value.icon} text={value.text} />
              ))}
            </dl>
          </div>

        </div>
      </div>
    </section>
  );
}