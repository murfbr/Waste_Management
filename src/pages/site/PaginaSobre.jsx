// src/pages/site/PaginaSobre.jsx

import React from 'react';

// Importando os novos componentes de seção
import AboutHero from '../../components/site/AboutHero';
import ValuesSection from '../../components/site/ValuesSection';
import TeamSection from '../../components/site/TeamSection';

export default function PaginaSobre() {
  return (
    <>
      <AboutHero />
      <ValuesSection />
      <TeamSection />
    </>
  );
}
