// src/pages/site/PaginaProduto.jsx

import React from 'react';

// Importando os novos componentes de seção
import ProductHeroSection from '../../components/site/ProductHeroSection';
import IncludedSection from '../../components/site/IncludedSection';
import HowItWorksSection from '../../components/site/HowItWorksSection';
import KeyFeaturesSection from '../../components/site/KeyFeaturesSection';

export default function PaginaProduto() {
  return (
    <>
      <ProductHeroSection />
      <IncludedSection />
      <HowItWorksSection />
      <KeyFeaturesSection />
    </>
  );
}
