import React from 'react';

// Um pequeno sub-componente para cada item da feature, para evitar repetição de código.
const FeatureItem = ({ icon, title, text }) => (
    <div className="p-4 md:w-1/3 flex flex-col text-center items-center">
        <div className="w-20 h-20 inline-flex items-center justify-center rounded-full bg-green-100 text-green-600 mb-5 flex-shrink-0">
            {icon}
        </div>
        <div className="flex-grow">
            <h2 className="text-gray-900 text-lg title-font font-medium mb-3">{title}</h2>
            <p className="leading-relaxed text-base text-gray-600">{text}</p>
        </div>
    </div>
);


export default function FeaturesSection() {
    return (
        <section className="text-gray-600 body-font bg-gray-50">
            <div className="container px-5 py-24 mx-auto">
                <div className="text-center mb-20">
                    <h1 className="sm:text-3xl text-2xl font-medium title-font text-gray-900 mb-4">A Plataforma Completa para sua Gestão de Resíduos</h1>
                    <p className="text-base leading-relaxed xl:w-2/4 lg:w-3/4 mx-auto text-gray-500">Do lançamento à análise de dados, o CtrlWaste oferece controle total e insights valiosos para sua operação.</p>
                    <div className="flex mt-6 justify-center">
                        <div className="w-16 h-1 rounded-full bg-green-600 inline-flex"></div>
                    </div>
                </div>
                <div className="flex flex-wrap sm:-m-4 -mx-4 -mb-10 -mt-4 md:space-y-0 space-y-6">
                    <FeatureItem
                        icon={<svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-10 h-10" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>}
                        title="Dashboards Intuitivos"
                        text="Visualize dados de geração, desvio de aterro e composição de resíduos em tempo real com gráficos interativos e fáceis de entender."
                    />
                    <FeatureItem
                        icon={<svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-10 h-10" viewBox="0 0 24 24"><path d="M4 7v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V7M15 1v4M9 1v4M4 11h16"></path></svg>}
                        title="Lançamento Simplificado"
                        text="Registre pesagens de forma rápida e precisa, seja no desktop ou em dispositivos móveis, com um formulário adaptado à sua operação."
                    />
                    <FeatureItem
                        icon={<svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-10 h-10" viewBox="0 0 24 24"><path d="M9 17v-4m-3.5 1.5L12 9l6.5 5.5M12 21v-8"></path></svg>}
                        title="Relatórios e Exportação"
                        text="Gere relatórios detalhados e exporte seus dados para CSV com um clique, facilitando a conformidade e auditorias."
                    />
                </div>
            </div>
        </section>
    );
}
