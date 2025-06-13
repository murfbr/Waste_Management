// Salve este arquivo como: src/pages/site/HomePage.jsx

import React from 'react';

// Importando os componentes de seção que vamos criar
import HeroSection from '../../components/site/HeroSection';
import FeaturesSection from '../../components/site/FeaturesSection';
import CallToActionSection from '../../components/site/CallToActionSection';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <CallToActionSection />
    </>
  );
}
