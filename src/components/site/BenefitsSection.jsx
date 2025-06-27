import React from 'react';

const BenefitCard = ({ title, children }) => (
    <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{children}</p>
    </div>
);

export default function BenefitsSection() {
    return (
        <section className="text-gray-600 body-font bg-gray-100">
             {/* Container principal agora usa max-w-7xl e padding responsivo para garantir a centralização */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="text-center mb-20">
                    <h2 className="sm:text-4xl text-3xl font-bold title-font text-gray-900 mb-4">
                        Por que escolher o Ctrl Waste?
                    </h2>
                    <div className="flex mt-6 justify-center">
                        <div className="w-20 h-1 rounded-full bg-green-600 inline-flex"></div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <BenefitCard title="Economia baseada em dados">
                        Identifique desperdícios por tipo, área ou período. Aja com precisão para cortar custos.
                    </BenefitCard>
                    <BenefitCard title="O poder do controle da operação">
                        Contrate os serviços de coleta com base real da quantidade de resíduos gerados.
                    </BenefitCard>
                    <BenefitCard title="Automatize obrigações legais">
                        Emissão automática de MTRs e relatórios. Menos tarefas manuais, mais produtividade.
                    </BenefitCard>
                    <BenefitCard title="Decisões com base em evidências">
                        Transforme resíduos em indicadores estratégicos para sua operação. Fácil de usar e implementar.
                    </BenefitCard>
                </div>
            </div>
        </section>
    );
}
