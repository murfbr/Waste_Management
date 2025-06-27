import React from 'react';

const FeatureDetail = ({ title, children, imageUrl, reverse = false }) => (
    <div className={`flex items-center gap-8 md:gap-16 ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} flex-col`}>
        <div className="md:w-1/2">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">{title}</h3>
            <div className="space-y-4 text-gray-600 text-lg">
                {children}
            </div>
        </div>
        <div className="md:w-1/2">
            <img className="object-cover object-center rounded-lg shadow-xl" alt={`Ilustração para ${title}`} src={imageUrl} />
        </div>
    </div>
);

export default function PlatformSection() {
    return (
        <section className="text-gray-600 body-font bg-white">
            {/* Container principal agora usa max-w-7xl e padding responsivo para garantir a centralização */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="text-center mb-20">
                    <h2 className="sm:text-4xl text-3xl font-bold title-font text-gray-900 mb-4">A plataforma completa para sua Gestão de Resíduos</h2>
                    <div className="flex mt-6 justify-center">
                        <div className="w-20 h-1 rounded-full bg-green-600 inline-flex"></div>
                    </div>
                </div>

                <div className="space-y-20">
                    <FeatureDetail title="Dashboards em tempo real" imageUrl="https://placehold.co/600x400/D1FAE5/10B981?text=Gráficos+Interativos">
                        <p>Visualize de forma clara e interativa os principais indicadores da sua operação:</p>
                        <ul className="list-disc list-inside space-y-2">
                            <li>Peso dos resíduos por tipo</li>
                            <li>Percentual de desvio de aterro (Metodologia Lixo Zero)</li>
                            <li>Acompanhamento da evolução de metas</li>
                            <li>Comparativos por área, unidade e período</li>
                        </ul>
                        <p className="font-semibold">Tudo 100% digital, atualizado em tempo real.</p>
                    </FeatureDetail>

                    <FeatureDetail title="Lançamento rápido e eficiente" imageUrl="https://placehold.co/600x400/DBEAFE/3B82F6?text=Interface+Intuitiva" reverse={true}>
                        <p>Registro de dados simplificado via:</p>
                        <ul className="list-disc list-inside space-y-2">
                            <li>Tablet, desktop ou celular (tablet opcional fornecido pela Ctrl Waste)</li>
                            <li>Balança para pesagem dos resíduos (a ser providenciada pelo cliente)</li>
                            <li>Interface intuitiva com categorias personalizáveis por operação</li>
                        </ul>
                    </FeatureDetail>

                    <FeatureDetail title="Relatórios e conformidade" imageUrl="https://placehold.co/600x400/FEF3C7/F59E0B?text=Documentos+e+MTRs">
                        <p>Acompanhe, exporte e comprove os resultados da sua gestão de resíduos:</p>
                        <ul className="list-disc list-inside space-y-2">
                            <li>Relatórios técnicos e gerenciais gerados em tempo real, com apenas um clique</li>
                            <li>Exportação CSV automatizada</li>
                            <li>Emissão instantânea do MTR (Manifesto de Transporte de Resíduos)</li>
                            <li>Base sólida para auditorias, certificações e ESG</li>
                        </ul>
                        <aside className="mt-6 p-4 bg-green-50 border-l-4 border-green-500">
                            <p className="text-green-800 font-semibold">
                                💡 Economize até 80% do tempo gasto com tarefas operacionais.
                            </p>
                        </aside>
                    </FeatureDetail>
                </div>
            </div>
        </section>
    );
}
