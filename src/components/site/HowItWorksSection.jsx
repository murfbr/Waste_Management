import React from 'react';
import { useTranslation } from 'react-i18next';

const Step = ({ number, title, children }) => (
  <div className="flex">
    <div className="flex-shrink-0">
      <div className="flex items-center justify-center h-12 w-12 rounded-full bg-apricot-orange text-white font-bold text-xl">
        {number}
      </div>
    </div>
    <div className="ml-4">
      <h3 className="font-lexend text-acao font-bold text-blue-coral">{title}</h3>
      <div className="mt-2 font-comfortaa text-corpo text-rich-soil space-y-2">{children}</div>
    </div>
  </div>
);

export default function HowItWorksSection() {
  const { t } = useTranslation('site');
  const steps = t('howItWorks.steps', { returnObjects: true });

  return (
    <section className="bg-gray-100 py-16 sm:py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="font-lexend text-subtitulo font-bold tracking-tight text-blue-coral">
            {t('howItWorks.title')}
          </h2>
          <p className="mt-4 max-w-2xl font-comfortaa text-corpo text-rich-soil lg:mx-auto">
            {t('howItWorks.subtitle')}
          </p>
        </div>

        <div className="mt-20">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, i) => (
              <Step key={i} number={i + 1} title={step.title}>
                <p>{step.text}</p>
              </Step>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
