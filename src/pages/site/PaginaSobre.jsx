// Crie este novo arquivo em: src/pages/site/PaginaSobre.jsx

import React from 'react';

export default function PaginaSobre() {
  return (
    <div className="relative bg-white py-16 sm:py-24">
      <div className="lg:mx-auto lg:max-w-7xl lg:px-8 lg:grid lg:grid-cols-2 lg:gap-24 lg:items-start">
        <div className="relative sm:py-16 lg:py-0">
          <div className="relative mx-auto max-w-md px-4 sm:max-w-3xl sm:px-6 lg:px-0 lg:max-w-none lg:py-20">
            {/* Placeholder para uma imagem */}
            <div className="relative pt-[100%] rounded-2xl shadow-xl overflow-hidden">
                <div className="absolute inset-0 bg-green-200 flex items-center justify-center">
                    <p className="text-green-700 text-xl font-semibold">[Imagem da Equipe ou Escritório]</p>
                </div>
            </div>
          </div>
        </div>

        <div className="relative mx-auto max-w-md px-4 sm:max-w-3xl sm:px-6 lg:px-0">
          <div className="pt-12 sm:pt-16 lg:pt-20">
            <h2 className="text-3xl text-gray-900 font-extrabold tracking-tight sm:text-4xl">Nossa Missão</h2>
            <div className="mt-6 text-gray-500 space-y-6">
              <p className="text-lg">
                Texto genérico sobre a missão da CtrlWaste. Acreditamos que a gestão de resíduos pode e deve ser mais inteligente, eficiente e sustentável. Nossa missão é fornecer tecnologia de ponta que capacite as empresas a transformarem seus desafios de resíduos em oportunidades de crescimento e responsabilidade ambiental.
              </p>
              <p className="text-base leading-7">
                Texto genérico sobre a nossa visão. Visamos um futuro onde nenhuma empresa veja os resíduos como um mero subproduto, mas como um recurso valioso a ser gerenciado com precisão. Buscamos ser o parceiro tecnológico líder na jornada para a economia circular.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
