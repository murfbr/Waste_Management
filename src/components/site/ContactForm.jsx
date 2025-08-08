import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function FormularioContato() {
  const { t } = useTranslation('site');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    company: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmissionStatus(null);

    try {
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
        setFormData({ fullName: '', email: '', company: '', message: '' });
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

  const labelStyle = "block font-comfortaa text-corpo text-abundant-green font-medium mb-1";
  const inputStyle = "mt-1 block w-full p-2 border border-early-frost rounded-md shadow-sm focus:ring-apricot-orange focus:border-apricot-orange sm:text-sm font-comfortaa bg-white";

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-xl shadow-lg space-y-6">
        <div className="text-center">
          <h2 className="font-lexend text-subtitulo text-rain-forest">{t('contact.title')}</h2>
          <p className="mt-2 font-comfortaa text-corpo text-gray-600">{t('contact.subtitle')}</p>
        </div>

        <fieldset className="border border-early-frost p-4 rounded-lg">
          <legend className="text-lg font-lexend text-exotic-plume px-2">{t('contact.legend')}</legend>
          <div className="space-y-4 pt-3">
            <div>
              <label htmlFor="fullName" className={labelStyle}>{t('contact.fullName')}*</label>
              <input type="text" name="fullName" id="fullName" value={formData.fullName} onChange={handleChange} autoComplete="name" required className={inputStyle} placeholder={t('contact.fullNamePlaceholder')} />
            </div>
            <div>
              <label htmlFor="email" className={labelStyle}>{t('contact.email')}*</label>
              <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} autoComplete="email" required className={inputStyle} placeholder={t('contact.emailPlaceholder')} />
            </div>
            <div>
              <label htmlFor="company" className={labelStyle}>{t('contact.company')}</label>
              <input type="text" name="company" id="company" value={formData.company} onChange={handleChange} autoComplete="organization" className={inputStyle} placeholder={t('contact.companyPlaceholder')} />
            </div>
            <div>
              <label htmlFor="message" className={labelStyle}>{t('contact.message')}*</label>
              <textarea id="message" name="message" rows={4} value={formData.message} onChange={handleChange} required className={inputStyle} placeholder={t('contact.messagePlaceholder')}></textarea>
            </div>
          </div>
        </fieldset>

        {submissionStatus === 'success' && (
          <div className="text-center p-3 rounded-md bg-green-50 text-abundant-green font-semibold">
            {t('contact.successMessage')}
          </div>
        )}
        {submissionStatus === 'error' && (
          <div className="text-center p-3 rounded-md bg-red-50 text-apricot-orange font-semibold">
            {t('contact.errorMessage')}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-8 py-3 bg-apricot-orange border border-transparent rounded-md shadow-sm font-lexend text-base font-medium text-white hover:bg-golden-orange focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-apricot-orange disabled:bg-early-frost disabled:cursor-not-allowed"
          >
            {isSubmitting ? t('contact.sending') : t('contact.send')}
          </button>
        </div>
      </form>
    </div>
  );
}
