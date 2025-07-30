// src/components/site/TeamSection.jsx
import React from 'react';

const teamMembers = [
  {
    name: 'Pedro Arthur Campos',
    role: 'CEO',
    imageUrl: 'https://placehold.co/400x400/A3E6CB/1F2937?text=PAC',
    bio: 'Pedro é engenheiro de bioprocessos (UFRJ), mestre em Ciência da Sustentabilidade (PUC-Rio) e especialista em Design de Sustentabilidade. Fundador do HUBIS, foi reconhecido por liderar projetos premiados de impacto ambiental e social. Na Ctrl Waste, une visão estratégica, inovação e propósito para transformar o setor de resíduos com soluções escaláveis e sustentáveis.',
  },
  {
    name: 'Gustavo Ferracioli',
    role: 'CTO',
    imageUrl: 'https://placehold.co/400x400/BAE6FD/1F2937?text=GF',
    bio: 'Gustavo é especialista em tecnologia com experiência em desenvolvimento no-code, liderança de times ágeis e gestão de projetos digitais. Com vivência internacional na Irlanda e atuação em empresas de marketing, traz uma abordagem centrada no usuário e na eficiência. Na Ctrl Waste, é responsável por soluções tecnológicas que impulsionam impacto ambiental com inovação acessível.',
  },
  {
    name: 'Julia Pfeiffer',
    role: 'CMO',
    imageUrl: 'https://placehold.co/400x400/FBCFE8/1F2937?text=JP',
    bio: 'Com formação em Publicidade e especializações em Branding (University of Amsterdam) e Business Management (ESS – Praga), Júlia integra criatividade, estratégia e sustentabilidade. Sua trajetória inclui projetos premiados que conectam marketing e ESG. Na Ctrl Waste, lidera a construção da marca e a estratégia comercial, promovendo crescimento ético e impacto positivo.',
  },
];

export default function TeamSection() {
  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="font-lexend text-subtitulo font-bold tracking-tight text-blue-coral">Quem somos</h2>
        </div>
        <ul
          role="list"
          className="mx-auto mt-20 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3"
        >
          {teamMembers.map((person) => (
            <li key={person.name}>
              <img className="aspect-[3/2] w-full rounded-2xl object-cover" src={person.imageUrl} alt={`Foto de ${person.name}`} />
              {/* Nome do Membro */}
              {/* ANTES: className="mt-6 text-lg ... text-gray-900" */}
              <h3 className="mt-6 font-lexend text-lg font-semibold leading-8 tracking-tight text-blue-coral">{person.name}</h3>
              
              {/* Função do Membro */}
              {/* ANTES: className="text-base ... text-green-600" */}
              <p className="font-comfortaa text-base leading-7 text-apricot-orange">{person.role}</p>
              
              {/* Bio do Membro */}
              {/* ANTES: className="mt-4 text-base ... text-gray-600" */}
              <p className="mt-4 font-comfortaa text-corpo leading-7 text-rich-soil">{person.bio}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}