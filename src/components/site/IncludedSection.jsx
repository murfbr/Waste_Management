import React from 'react';
import { useTranslation } from 'react-i18next';

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-coral" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ListItem = ({ icon, text }) => (
  <li className="flex items-center">
    <div className="flex-shrink-0">{icon}</div>
    <span className="ml-3 font-comfortaa text-corpo text-rich-soil">{text}</span>
  </li>
);

export default function IncludedSection() {
  const { t } = useTranslation('site');

  const includedList = t('included.list', { returnObjects: true }) || [];
  const requirementsList = t('requirements.list', { returnObjects: true }) || [];
  const icons = ['📱', '⚖️', '⏱️'];

  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-12">
          <div>
            <h2 className="font-lexend text-subtitulo font-bold text-blue-coral">
              {t('included.title')}
            </h2>
            <p className="mt-4 font-comfortaa text-corpo text-rich-soil">
              {t('included.description')}
            </p>
            <ul className="mt-8 space-y-4">
              {includedList.map((item, i) => (
                <ListItem key={i} icon={<CheckCircleIcon />} text={item} />
              ))}
            </ul>
          </div>
          <div className="bg-gray-50 rounded-2xl p-8">
            <h2 className="font-lexend text-subtitulo font-bold text-blue-coral">
              {t('requirements.title')}
            </h2>
            <p className="mt-4 font-comfortaa text-corpo text-rich-soil">
              {t('requirements.description')}
            </p>
            <ul className="mt-8 space-y-4">
              {requirementsList.map((item, i) => (
                <ListItem key={i} icon={icons[i]} text={item} />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
