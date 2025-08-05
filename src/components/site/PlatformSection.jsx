import React from 'react';
import { useTranslation } from 'react-i18next';
import dashboardImg from '../../pages/site/img/composicaogeracao3.png';
import pesagemImg from '../../pages/site/img/pesagem.png';
import mtrImg from '../../pages/site/img/mtr.png';

const FeatureDetail = ({ title, children, imageUrl, reverse = false }) => (
  <div className={`flex items-center gap-8 md:gap-16 ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} flex-col`}>
    <div className="md:w-1/2">
      <h3 className="font-lexend text-subtitulo font-bold text-blue-coral mb-4">{title}</h3>
      <div className="space-y-4 font-comfortaa text-corpo text-rich-soil">
        {children}
      </div>
    </div>
    <div className="md:w-1/2">
      <img className="object-cover object-center rounded-lg shadow-xl" alt={`Ilustração para ${title}`} src={imageUrl} />
    </div>
  </div>
);

export default function PlatformSection() {
  const { t } = useTranslation();

  return (
    <section className="body-font bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-20">
          <h2 className="font-lexend text-subtitulo font-bold text-blue-coral mb-4">
            {t('platform.sectionTitle')}
          </h2>
          <div className="flex mt-6 justify-center">
            <div className="w-20 h-1 rounded-full bg-apricot-orange inline-flex"></div>
          </div>
        </div>

        <div className="space-y-20">
          <FeatureDetail title={t('platform.features.dashboards.title')} imageUrl={dashboardImg}>
            <p>{t('platform.features.dashboards.text1')}</p>
            <ul className="list-disc list-inside space-y-2">
              {t('platform.features.dashboards.list', { returnObjects: true }).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <p className="font-semibold">{t('platform.features.dashboards.highlight')}</p>
          </FeatureDetail>

          <FeatureDetail title={t('platform.features.quickEntry.title')} imageUrl={pesagemImg} reverse={true}>
            <p>{t('platform.features.quickEntry.text1')}</p>
            <ul className="list-disc list-inside space-y-2">
              {t('platform.features.quickEntry.list', { returnObjects: true }).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </FeatureDetail>

          <FeatureDetail title={t('platform.features.reports.title')} imageUrl={mtrImg}>
            <p>{t('platform.features.reports.text1')}</p>
            <ul className="list-disc list-inside space-y-2">
              {t('platform.features.reports.list', { returnObjects: true }).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <aside className="mt-6 p-4 bg-apricot-orange/10 border-l-4 border-apricot-orange">
              <p className="text-blue-coral font-semibold">{t('platform.features.reports.aside')}</p>
            </aside>
          </FeatureDetail>
        </div>
      </div>
    </section>
  );
}
