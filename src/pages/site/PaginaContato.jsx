// src/pages/site/PaginaContato.jsx

import React from 'react';
import FormularioContato from '../../components/site/ContactForm'; // Ajuste o caminho se necessário

export default function PaginaContato() {
  return (
    // Fundo da página e espaçamento
    <div className="bg-gray-50 py-12 sm:py-16">
      <div className="mx-auto px-4">
        {/* Renderiza o componente de formulário centralizado */}
        <FormularioContato />
      </div>
    </div>
  );
}