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
        {/* A mudança principal está aqui: de 'items-center' para 'items-start' para alinhar os blocos pelo topo. */}
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-12 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 items-start">
          <div className="lg:pr-8 lg:pt-4">
            <div className="lg:max-w-lg">
              <h2 className="text-base font-semibold leading-7 text-green-600">Nossos Princípios</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Nossos valores</p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Acreditamos que a tecnologia deve servir a um propósito maior. Nossos valores guiam cada linha de código, cada funcionalidade e cada interação que temos com nossos clientes e com o planeta.
              </p>
            </div>
          </div>
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
