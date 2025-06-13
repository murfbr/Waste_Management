// Crie este novo arquivo em: src/pages/site/PaginaProduto.jsx

import React from 'react';
import { Link } from 'react-router-dom';

export default function PaginaProduto() {
  return (
    <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-base font-semibold text-green-600 tracking-wide uppercase">O Produto</h2>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Soluções Completas para a Gestão de Resíduos
          </p>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            O CtrlWaste é uma plataforma SaaS projetada para simplificar e otimizar cada etapa do ciclo de vida dos resíduos.
          </p>
        </div>

        <div className="mt-12">
          <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
            <div className="p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900">Lançamento e Rastreabilidade</h3>
              <p className="mt-2 text-base text-gray-500">
                Registre cada pesagem com precisão, associe a áreas de lançamento específicas e mantenha um histórico completo para total rastreabilidade.
              </p>
            </div>

            <div className="p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900">Dashboards e Análises</h3>
              <p className="mt-2 text-base text-gray-500">
                Nossos dashboards interativos transformam dados brutos em insights valiosos, permitindo identificar gargalos, reduzir custos e alcançar metas de sustentabilidade.
              </p>
            </div>

            <div className="p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900">Conformidade e Relatórios</h3>
              <p className="mt-2 text-base text-gray-500">
                Gere relatórios de forma automática e exporte dados facilmente, garantindo a conformidade com as regulamentações ambientais e facilitando processos de auditoria.
              </p>
            </div>
            
            <div className="p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900">Configuração Flexível</h3>
              <p className="mt-2 text-base text-gray-500">
                A plataforma se adapta à sua operação. Personalize tipos de resíduos, áreas de lançamento e permissões de usuário para espelhar perfeitamente o seu fluxo de trabalho.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
            <Link to="/contato" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                Converse com um especialista
            </Link>
        </div>
      </div>
    </div>
  );
}
