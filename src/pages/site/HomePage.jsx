// src/pages/site/HomePage.jsx

import React from 'react';

// Importando os componentes de seção atualizados e novos
import HeroSection from '../../components/site/HeroSection';
import BenefitsSection from '../../components/site/BenefitsSection';
import PlatformSection from '../../components/site/PlatformSection';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <BenefitsSection />
      <PlatformSection />
    </>
  );
}
