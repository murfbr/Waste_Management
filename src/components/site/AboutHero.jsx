import React, { useRef, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SociosImg from '../../pages/site/img/socios.png';

export default function AboutHero() {
  const { t } = useTranslation('site');

  // Estado e ref para capturar a altura do texto
  const textRef = useRef(null);
  const [textHeight, setTextHeight] = useState(null);

  useLayoutEffect(() => {
    if (textRef.current) {
      setTextHeight(textRef.current.offsetHeight);
    }
  }, []);

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Coluna do texto */}
          <div ref={textRef}>
            <h2 className="font-lexend text-titulo font-bold tracking-tight text-blue-coral">
              {t('aboutHero.title')}
            </h2>

            <p className="mt-6 font-lexend text-xl leading-8 text-apricot-orange font-semibold">
              {t('aboutHero.subtitle')}
            </p>

            <p className="mt-4 font-comfortaa text-corpo text-rich-soil">
              {t('aboutHero.paragraph1')}
            </p>
            <p className="mt-4 font-comfortaa text-corpo text-rich-soil">
              {t('aboutHero.paragraph2')}
            </p>
            <p className="mt-4 font-comfortaa text-corpo text-rich-soil">
              {t('aboutHero.paragraph3')}
            </p>
          </div>

          {/* Coluna da imagem */}
          <div className="flex justify-center items-start">
            <img
              src={SociosImg}
              alt="Sócios Ctrl+Waste"
              className="rounded-2xl object-cover object-center"
              style={{
                height: textHeight ? `${textHeight}px` : 'auto',
                width: '100%',
                maxWidth: '600px',
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
