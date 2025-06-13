// Crie este novo arquivo em: src/pages/site/PaginaContato.jsx

import React from 'react';

export default function PaginaContato() {
  // A lógica de envio do formulário será adicionada posteriormente
  const handleSubmit = (event) => {
    event.preventDefault();
    alert('Funcionalidade de envio em desenvolvimento.');
  };

  return (
    <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto">
        <h2 className="text-2xl font-extrabold text-center text-gray-900 sm:text-3xl">Entre em Contato</h2>
        <p className="mt-4 text-center text-lg text-gray-500">
          Tem alguma pergunta ou gostaria de solicitar uma demonstração? Preencha o formulário abaixo e nossa equipe retornará em breve.
        </p>

        <form onSubmit={handleSubmit} className="mt-9 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
          <div className="sm:col-span-2">
            <label htmlFor="full-name" className="block text-sm font-medium text-gray-700">Nome Completo</label>
            <div className="mt-1">
              <input type="text" name="full-name" id="full-name" autoComplete="name" required className="py-3 px-4 block w-full shadow-sm text-gray-900 focus:ring-green-500 focus:border-green-500 border-gray-300 rounded-md" />
            </div>
          </div>
          
          <div className="sm:col-span-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <div className="mt-1">
              <input id="email" name="email" type="email" autoComplete="email" required className="py-3 px-4 block w-full shadow-sm text-gray-900 focus:ring-green-500 focus:border-green-500 border-gray-300 rounded-md" />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="company" className="block text-sm font-medium text-gray-700">Empresa</label>
            <div className="mt-1">
              <input type="text" name="company" id="company" autoComplete="organization" required className="py-3 px-4 block w-full shadow-sm text-gray-900 focus:ring-green-500 focus:border-green-500 border-gray-300 rounded-md" />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">Mensagem</label>
            <div className="mt-1">
              <textarea id="message" name="message" rows={4} required className="py-3 px-4 block w-full shadow-sm text-gray-900 focus:ring-green-500 focus:border-green-500 border border-gray-300 rounded-md"></textarea>
            </div>
          </div>
          
          <div className="sm:col-span-2">
            <button type="submit" className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              Enviar Mensagem
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
