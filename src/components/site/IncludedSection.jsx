// src/components/site/IncludedSection.jsx
import React from 'react';

// Ícones para diferenciação visual
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CubeTransparentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2 1M4 7l2-1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>;

const ListItem = ({ icon, text }) => (
    <li className="flex items-start">
        <div className="flex-shrink-0 mt-1">{icon}</div>
        <span className="ml-3 text-gray-700">{text}</span>
    </li>
);

export default function IncludedSection() {
    return (
        <section className="bg-white py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-12">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">O que está incluso?</h2>
                        <p className="mt-4 text-lg text-gray-600">Com o Ctrl Waste, sua operação conta com uma solução completa para transformar dados em decisões eficientes:</p>
                        <ul className="mt-8 space-y-4 text-lg">
                            <ListItem icon={<CheckCircleIcon />} text="Software como Serviço (SaaS) com acesso multiusuário" />
                            <ListItem icon={<CheckCircleIcon />} text="Dashboards em tempo real para monitoramento e análise dos resíduos" />
                            <ListItem icon={<CheckCircleIcon />} text="Emissão automática e personalizada de MTR (Manifesto de Transporte de Resíduos)" />
                            
                        </ul>
                    </div>
                    <div className="p-8 bg-gray-50 rounded-2xl">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">O que você precisa ter?</h2>
                        <p className="mt-4 text-lg text-gray-600">Para utilizar o Ctrl Waste com total eficiência, sua estrutura deve contar com:</p>
                        <ul className="mt-8 space-y-4 text-lg">
                            <ListItem icon={<CubeTransparentIcon />} text="Tablet ou celular para registro diário das pesagens" />
                            <ListItem icon={<CubeTransparentIcon />} text="Balança para pesagem dos resíduos" />
                            <ListItem icon={<CubeTransparentIcon />} text="Acesso operacional: basta que uma pessoa registre o peso no sistema em 3 cliques: simples, rápido e sem complicação." />
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
