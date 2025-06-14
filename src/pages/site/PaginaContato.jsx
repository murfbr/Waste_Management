// src/pages/site/PaginaContato.jsx

import React from 'react';

export default function PaginaContato() {
  // A lógica de envio do formulário será adicionada posteriormente
  const handleSubmit = (event) => {
    event.preventDefault();
    alert('Funcionalidade de envio em desenvolvimento.');
  };

  // Estilos baseados no ClienteForm.jsx para consistência
  const labelStyle = "block text-sm font-medium text-gray-700";
  const inputStyle = "mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";

  return (
    <div className="bg-gray-100 py-12 sm:py-16">
      <div className="max-w-2xl mx-auto px-4">

        {/* Formulário principal com estilo de card */}
        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-xl shadow-lg space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-800">Fale Conosco</h2>
            <p className="mt-2 text-base text-gray-600">
              Gostaria de solicitar uma demonstração ou tirar uma dúvida? Preencha o formulário e nossa equipe retornará em breve.
            </p>
          </div>

          {/* Fieldset para agrupar os campos de contato */}
          <fieldset className="border border-gray-300 p-4 rounded-lg">
            <legend className="text-lg font-semibold text-indigo-700 px-2">Suas Informações</legend>
            <div className="space-y-4 pt-3">
              
              {/* Campo Nome Completo */}
              <div>
                <label htmlFor="full-name" className={labelStyle}>Nome Completo*</label>
                <input type="text" name="full-name" id="full-name" autoComplete="name" required className={inputStyle} placeholder="Seu nome completo" />
              </div>
              
              {/* Campo Email */}
              <div>
                <label htmlFor="email" className={labelStyle}>Email*</label>
                <input id="email" name="email" type="email" autoComplete="email" required className={inputStyle} placeholder="seu.email@exemplo.com" />
              </div>

              {/* Campo Empresa */}
              <div>
                <label htmlFor="company" className={labelStyle}>Empresa</label>
                <input type="text" name="company" id="company" autoComplete="organization" className={inputStyle} placeholder="Nome da sua empresa" />
              </div>

              {/* Campo Mensagem */}
              <div>
                <label htmlFor="message" className={labelStyle}>Mensagem*</label>
                <textarea id="message" name="message" rows={4} required className={inputStyle} placeholder="Como podemos ajudar?"></textarea>
              </div>

            </div>
          </fieldset>
          
          {/* Botão de Envio */}
          <div className="flex justify-end pt-2">
            <button type="submit" className="px-6 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Enviar Mensagem
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
