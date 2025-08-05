import React from 'react';
import { useTranslation } from 'react-i18next';

export default function AboutHero() {
  const { t } = useTranslation();

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
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
      </div>
    </section>
  );
}
