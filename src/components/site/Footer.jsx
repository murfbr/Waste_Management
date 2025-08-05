import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const lang = i18n.language;
  const prefix = lang === 'pt' ? '' : `/${lang}`;
  const currentYear = new Date().getFullYear();

  const linkClasses = "font-comfortaa text-early-frost hover:text-apricot-orange transition-colors duration-300";

  return (
    <footer className="bg-blue-coral text-white">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <h3 className="text-2xl font-bold">Ctrl+Waste</h3>
            <p className="text-early-frost mt-2">{t('footer.slogan')}</p>
          </div>
          <div className="flex space-x-6">
            <Link to={`${prefix}/`} className={linkClasses}>{t('footer.links.home')}</Link>
            <Link to={`${prefix}/produto`} className={linkClasses}>{t('footer.links.product')}</Link>
            <Link to={`${prefix}/contato`} className={linkClasses}>{t('footer.links.contact')}</Link>
          </div>
        </div>
        <p className="text-center text-early-frost text-sm mt-6">
          &copy; {currentYear} Ctrl+Waste. {t('footer.rights')}
        </p>
      </div>
    </footer>
  );
}
