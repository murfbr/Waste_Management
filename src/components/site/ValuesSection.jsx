// src/components/site/ValuesSection.jsx
import React from 'react';

// Componente para um único item da lista de valores
const ValueItem = ({ icon, text }) => (
  <div className="flex items-start gap-x-4">
    <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-green-600">
      <span className="text-2xl">{icon}</span>
    </div>
    <div>
      <p className="text-lg font-semibold text-gray-900">{text}</p>
    </div>
  </div>
);

export default function ValuesSection() {
  const values = [
    {
      text: 'Sustentabilidade prática e mensurável',
      icon: '🌱',
    },
    {
      text: 'Inovação com propósito',
      icon: '🚀',
    },
    {
      text: 'Excelência no que entregamos',
      icon: '💡',
    },
    {
      text: 'Transparência nos dados e processos',
      icon: '🔍',
    },
    {
      text: 'Escalabilidade que acompanha seu crescimento',
      icon: '📈',
    },
  ];

  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-12 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 items-start">
          {/* Bloco de texto à esquerda, agora com o padding e a ordem dos elementos ajustados */}
          <div className="lg:pr-8 lg:pt-2">
            <div className="lg:max-w-lg">
              {/* O título principal agora vem primeiro para alinhar com os ícones */}
              <p className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Nossos valores</p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Acreditamos que a tecnologia deve servir a um propósito maior. Nossos valores guiam cada linha de código, cada funcionalidade e cada interação que temos com nossos clientes e com o planeta.
              </p>
               {/* O subtítulo "Nossos Princípios" foi movido para baixo para não interferir no alinhamento */}
              <h2 className="mt-10 text-base font-semibold leading-7 text-green-600">Nossos Princípios</h2>
            </div>
          </div>
          
          {/* Bloco de valores à direita, com o mesmo padding superior para garantir o alinhamento */}
          <dl className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:pt-2">
            {values.map((value) => (
              <ValueItem key={value.text} icon={value.icon} text={value.text} />
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
