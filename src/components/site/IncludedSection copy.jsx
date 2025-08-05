import React from 'react';

// Ícones atualizados para usar as cores da marca
const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-coral" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Componente reutilizável de item de lista
const ListItem = ({ icon, text }) => (
  <li className="flex items-center">
    <div className="flex-shrink-0 text-xl">{icon}</div>
    <span className="ml-3 font-comfortaa text-corpo text-rich-soil">{text}</span>
  </li>
);

export default function IncludedSection() {
  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-12 items-start">
          
          {/* Seção 1: O que está incluso */}
          <div>
            <h2 className="font-lexend text-subtitulo font-bold text-blue-coral mt-0">
              O que está incluso?
            </h2>
            <p className="mt-4 font-comfortaa text-corpo text-rich-soil">
              Com o Ctrl Waste, sua operação conta com uma solução completa para transformar dados em decisões eficientes:
            </p>
            <ul className="mt-8 space-y-4">
              <ListItem icon={<CheckCircleIcon />} text="Software como Serviço (SaaS) com acesso multiusuário" />
              <ListItem icon={<CheckCircleIcon />} text="Dashboards em tempo real para monitoramento e análise dos resíduos" />
              <ListItem icon={<CheckCircleIcon />} text="Emissão automática e personalizada de MTR (Manifesto de Transporte de Resíduos)" />
            </ul>
          </div>

          {/* Seção 2: O que você precisa ter */}
          <div className="pl-8 bg-gray-50 rounded-2xl">
            <h2 className="font-lexend text-subtitulo font-bold text-blue-coral mt-0">
              O que você precisa ter?
            </h2>
            <p className="mt-4 font-comfortaa text-corpo text-rich-soil">
              Para utilizar o Ctrl Waste com total eficiência, sua estrutura deve contar com:
            </p>
            <ul className="mt-8 space-y-4">
              <ListItem icon="📱" text="Tablet ou celular para registro diário das pesagens" />
              <ListItem icon="⚖️" text="Balança para pesagem dos resíduos" />
              <ListItem icon="⏱️" text="Acesso operacional: basta que uma pessoa registre o peso no sistema em 3 cliques: simples, rápido e sem complicação." />
            </ul>
          </div>
          
        </div>
      </div>
    </section>
  );
}