// src/components/site/KeyFeaturesSection.jsx
import React from 'react';

// Ícones para cada funcionalidade
const ExportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const ChartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" /></svg>;
const DocumentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const ShieldIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.417l4.5-4.5M12 2.944v17.512m0 0a12.02 12.02 0 01-8.618-3.04M12 20.417l-4.5-4.5" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.975 5.975 0 0112 13a5.975 5.975 0 016-5.197" /></svg>;
const BuildingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
const BoltIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;


const FeatureCard = ({ icon, title, text }) => (
    <div>
        <div className="flex items-center justify-center h-16 w-16 rounded-xl bg-green-600">
            {icon}
        </div>
        <div className="mt-5">
            <h3 className="text-lg font-semibold leading-6 text-gray-900">{title}</h3>
            <p className="mt-2 text-base text-gray-600">{text}</p>
        </div>
    </div>
);


export default function KeyFeaturesSection() {
    return (
        <section className="bg-white py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl lg:text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Funcionalidades-chave do Ctrl Waste</h2>
                </div>
                <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                    <div className="grid grid-cols-1 gap-x-8 gap-y-16 lg:grid-cols-3">
                        <FeatureCard icon={<ExportIcon />} title="Exporte seus dados" text="Baixe todos os registos de resíduos gerados pela sua operação com facilidade em CSV." />
                        <FeatureCard icon={<ChartIcon />} title="Dados por categoria de resíduo" text="Acompanhe o volume e tipo de resíduos por área ou processo." />
                        <FeatureCard icon={<DocumentIcon />} title="Relatórios com um clique" text="Gere relatórios técnicos e gerenciais instantaneamente." />
                        <FeatureCard icon={<ShieldIcon />} title="Seus dados são seus" text="Total transparência e autonomia: os dados ficam com você." />
                        <FeatureCard icon={<UsersIcon />} title="Gestão de equipe" text="Adicione, visualize e gerencie quem está registrando os dados no sistema." />
                        <FeatureCard icon={<BuildingIcon />} title="Pronto para operações maiores" text="Recomendado para redes de hotéis, restaurantes ou unidades com grande volume de dados." />
                        <FeatureCard icon={<BoltIcon />} title="Registro rápido" text="Lançamento simplificado: registre uma nova pesagem em menos de 3 segundos." />
                        <FeatureCard icon={<DocumentIcon />} title="Não se preocupe com os MTRs" text="Emissão de MTRs automatizada e personalizada para ter certeza de que a documentação está de acordo com a realidade." />
                    </div>
                </div>
            </div>
        </section>
    );
}

