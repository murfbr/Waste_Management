// src/components/ContactForm.jsx

import React, { useState } from 'react';

export default function FormularioContato() {
  // Estado para gerenciar os dados do formulário
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    company: '',
    message: '',
  });

  // Estado para gerenciar o status do envio
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null); // 'success' ou 'error'

  // Função para lidar com a mudança nos inputs
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Lógica de envio do formulário
  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmissionStatus(null);

    try {
      // ***** A ÚNICA ALTERAÇÃO FOI FEITA AQUI *****
      // Usando a sua URL específica do Formspree.
      const response = await fetch('https://formspree.io/f/xdkddkap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmissionStatus('success');
        setFormData({ fullName: '', email: '', company: '', message: '' }); // Limpa o formulário
      } else {
        throw new Error('Falha no envio do formulário.');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setSubmissionStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Estilos baseados no seu tailwind.config.js
  const labelStyle = "block font-comfortaa text-corpo text-abundant-green font-medium mb-1";
  const inputStyle = "mt-1 block w-full p-2 border border-early-frost rounded-md shadow-sm focus:ring-apricot-orange focus:border-apricot-orange sm:text-sm font-comfortaa bg-white";

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Formulário principal com estilo de card */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-xl shadow-lg space-y-6">
        <div className="text-center">
          <h2 className="font-lexend text-subtitulo text-rain-forest">Fale Conosco</h2>
          <p className="mt-2 font-comfortaa text-corpo text-gray-600">
            Gostaria de solicitar uma demonstração ou tirar uma dúvida? Preencha o formulário e nossa equipe retornará em breve.
          </p>
        </div>

        {/* Fieldset para agrupar os campos de contato */}
        <fieldset className="border border-early-frost p-4 rounded-lg">
          <legend className="text-lg font-lexend text-exotic-plume px-2">Suas Informações</legend>
          <div className="space-y-4 pt-3">
            
            {/* Campo Nome Completo */}
            <div>
              <label htmlFor="fullName" className={labelStyle}>Nome Completo*</label>
              <input type="text" name="fullName" id="fullName" value={formData.fullName} onChange={handleChange} autoComplete="name" required className={inputStyle} placeholder="Seu nome completo" />
            </div>
            
            {/* Campo Email */}
            <div>
              <label htmlFor="email" className={labelStyle}>Email*</label>
              <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} autoComplete="email" required className={inputStyle} placeholder="seu.email@exemplo.com" />
            </div>

            {/* Campo Empresa */}
            <div>
              <label htmlFor="company" className={labelStyle}>Empresa</label>
              <input type="text" name="company" id="company" value={formData.company} onChange={handleChange} autoComplete="organization" className={inputStyle} placeholder="Nome da sua empresa" />
            </div>

            {/* Campo Mensagem */}
            <div>
              <label htmlFor="message" className={labelStyle}>Mensagem*</label>
              <textarea id="message" name="message" rows={4} value={formData.message} onChange={handleChange} required className={inputStyle} placeholder="Como podemos ajudar?"></textarea>
            </div>

          </div>
        </fieldset>
        
        {/* Mensagens de Feedback */}
        {submissionStatus === 'success' && (
          <div className="text-center p-3 rounded-md bg-green-50 text-abundant-green font-semibold">
            Mensagem enviada com sucesso! Agradecemos o seu contato.
          </div>
        )}
        {submissionStatus === 'error' && (
          <div className="text-center p-3 rounded-md bg-red-50 text-apricot-orange font-semibold">
            Ocorreu um erro ao enviar sua mensagem. Por favor, tente novamente mais tarde.
          </div>
        )}

        {/* Botão de Envio */}
        <div className="flex justify-end pt-2">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-8 py-3 bg-apricot-orange border border-transparent rounded-md shadow-sm font-lexend text-base font-medium text-white hover:bg-golden-orange focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-apricot-orange disabled:bg-early-frost disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
          </button>
        </div>
      </form>
    </div>
  );
}