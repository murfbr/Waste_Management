import React from 'react';
import { useTranslation } from 'react-i18next';
import PedroImg from '../../pages/site/img/pedro.png';
import JuliaImg from '../../pages/site/img/julia.png';
import GustavoImg from '../../pages/site/img/gustavo.png';

const teamMembers = [
  {
    name: 'Pedro Arthur Campos',
    role: 'CEO',
    imageUrl: PedroImg,
    bioKey: 'teamSection.members.pedro.bio',
  },
  {
    name: 'Gustavo Ferracioli',
    role: 'CTO',
    imageUrl: GustavoImg,
    bioKey: 'teamSection.members.gustavo.bio',
  },
  {
    name: 'Julia Pfeiffer',
    role: 'CCO',
    imageUrl: JuliaImg,
    bioKey: 'teamSection.members.julia.bio',
  },
];

export default function TeamSection() {
  const { t } = useTranslation('site');

  return (
    <section className="bg-white py-16 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 lg:px-4">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="font-lexend text-subtitulo font-bold tracking-tight text-blue-coral">
            {t('teamSection.title')}
          </h2>
        </div>
        <ul
          role="list"
          className="mx-auto mt-20 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3"
        >
          {teamMembers.map((person) => (
            <li key={person.name}>
<img className="w-full h-72 rounded-2xl object-contain" src={person.imageUrl} alt={`Foto de ${person.name}`} />
              <h3 className="mt-6 font-lexend text-lg font-semibold leading-8 tracking-tight text-blue-coral">{person.name}</h3>
              <p className="font-comfortaa text-base leading-7 text-apricot-orange">{person.role}</p>
              <p className="mt-4 font-comfortaa text-corpo leading-7 text-rich-soil">{t(person.bioKey)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
