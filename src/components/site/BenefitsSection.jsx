import React from 'react';
import { useTranslation } from 'react-i18next';

export default function BenefitsSection() {
  const { t } = useTranslation('site');

  return (
    <section className="bg-gray-50 py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-lexend text-subtitulo font-bold text-blue-coral">
            {t('benefits.sectionTitle')}
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Card 1 */}
          <div className="p-6 bg-white rounded-xl shadow-md text-center">
            <div className="flex justify-center mb-4">
              {/* Ícone original aqui, se tiver */}
            </div>
            <h3 className="font-lexend text-lg font-semibold text-blue-coral mb-2">
              {t('benefits.cards.dataEconomy.title')}
            </h3>
            <p className="font-comfortaa text-corpo text-rich-soil">
              {t('benefits.cards.dataEconomy.text')}
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 bg-white rounded-xl shadow-md text-center">
            <div className="flex justify-center mb-4">
              {/* Ícone original aqui, se tiver */}
            </div>
            <h3 className="font-lexend text-lg font-semibold text-blue-coral mb-2">
              {t('benefits.cards.operationControl.title')}
            </h3>
            <p className="font-comfortaa text-corpo text-rich-soil">
              {t('benefits.cards.operationControl.text')}
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 bg-white rounded-xl shadow-md text-center">
            <div className="flex justify-center mb-4">
              {/* Ícone original aqui, se tiver */}
            </div>
            <h3 className="font-lexend text-lg font-semibold text-blue-coral mb-2">
              {t('benefits.cards.legalAutomation.title')}
            </h3>
            <p className="font-comfortaa text-corpo text-rich-soil">
              {t('benefits.cards.legalAutomation.text')}
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 bg-white rounded-xl shadow-md text-center">
            <div className="flex justify-center mb-4">
              {/* Ícone original aqui, se tiver */}
            </div>
            <h3 className="font-lexend text-lg font-semibold text-blue-coral mb-2">
              {t('benefits.cards.evidenceDecision.title')}
            </h3>
            <p className="font-comfortaa text-corpo text-rich-soil">
              {t('benefits.cards.evidenceDecision.text')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
