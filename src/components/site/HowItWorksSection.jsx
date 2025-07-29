// src/components/site/HowItWorksSection.jsx
import React from 'react';

const Step = ({ number, title, children }) => (
    <div className="flex">
        <div className="flex-shrink-0">
            {/* ANTES: bg-green-600 */}
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-golden-orange text-white font-bold text-xl">
                {number}
            </div>
        </div>
        <div className="ml-4">
            {/* ANTES: text-xl font-semibold text-gray-900 */}
            <h3 className="font-lexend text-acao font-bold text-rain-forest">{title}</h3>
            {/* ANTES: mt-2 text-base text-gray-600 */}
            <div className="mt-2 font-comfortaa text-corpo text-rich-soil space-y-2">{children}</div>
        </div>
    </div>
);

export default function HowItWorksSection() {
    return (
        <section className="bg-gray-100 py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="lg:text-center">
                    <h2 className="font-lexend text-subtitulo font-bold tracking-tight text-rain-forest">Como funciona na prática?</h2>
                    <p className="mt-4 max-w-2xl font-comfortaa text-corpo text-rich-soil lg:mx-auto">
                        Transformar resíduos em dados e dados em economia é simples com o Ctrl Waste. Veja como sua operação funciona em 5 passos:
                    </p>
                </div>

                <div className="mt-20">
                    <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
                        <Step number="1" title="Instale e personalize">
                            <ul className="list-disc list-inside">
                                <li>Ative o Ctrl Waste no seu tablet, celular ou desktop.</li>
                                <li>Personalize as categorias de resíduos e áreas da sua operação.</li>
                                <li>Registe os seus fornecedores de coleta.</li>
                            </ul>
                        </Step>
                        <Step number="2" title="Registre as pesagens">
                            <p>Na rotina diária, os colaboradores pesam os resíduos em balanças próprias e inserem os dados em tempo real no sistema, com até 3 cliques.</p>
                        </Step>
                        <Step number="3" title="Visualize os dados">
                            <p>Os dashboards mostram a composição dos resíduos, geração por área, taxa de desvio de aterro e a destinação final.</p>
                        </Step>
                        <Step number="4" title="Gere relatórios e MTRs">
                           <p>Emita relatórios técnicos com um clique e deixe o sistema automatizar a geração do Manifesto de Transporte de Resíduos (MTR).</p>
                        </Step>
                        <Step number="5" title="Tome decisões estratégicas">
                            <p>Use os insights da plataforma para reduzir desperdícios, revisar processos, planejar ações e economizar recursos.</p>
                        </Step>
                    </div>
                </div>
            </div>
        </section>
    );
}