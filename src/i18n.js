import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import sitePT from './locales/pt/sitePT.json';
import siteEN from './locales/en/siteEN.json';
import siteES from './locales/es/siteES.json';

import dashboardPT from './locales/pt/dashboardPT.json';
import dashboardEN from './locales/en/dashboardEN.json';
import dashboardES from './locales/es/dashboardES.json';

import wasteRegisterPT from './locales/pt/wasteRegisterPT.json';
import wasteRegisterEN from './locales/en/wasteRegisterEN.json';
import wasteRegisterES from './locales/es/wasteRegisterES.json';

import sidebarPT from './locales/pt/sidebarPT.json';
import sidebarEN from './locales/en/sidebarEN.json';
import sidebarES from './locales/es/sidebarES.json';

const resources = {
  pt: {
    site: sitePT,
    dashboard: dashboardPT,
    wasteRegister: wasteRegisterPT,
    sidebar: sidebarPT
  },
  en: {
    site: siteEN,
    dashboard: dashboardEN,
    wasteRegister: wasteRegisterEN,
    sidebar: sidebarEN 
  },
  es: {
    site: siteES,
    dashboard: dashboardES,
    wasteRegister: wasteRegisterES,
    sidebar: sidebarES
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt',
    ns: ['site', 'dashboard', 'wasteRegister', 'sidebar'],
    defaultNS: 'site',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
