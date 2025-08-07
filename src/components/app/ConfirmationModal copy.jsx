// src/components/app/ConfirmationModal.jsx

import React from 'react';

// Objeto de configuração para os diferentes temas do modal
const THEMES = {
  danger: {
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    // AJUSTE: Cor 100% no mobile, 80% no desktop (md:), 100% no hover.
    confirmBtnBg: 'bg-red-600 md:bg-red-600/80 hover:bg-red-600',
    icon: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
  },
  warning: {
    iconBg: 'bg-early-frost/80',
    iconColor: 'text-apricot-orange',
    // AJUSTE: Cor 100% no mobile, 80% no desktop (md:), 100% no hover.
    confirmBtnBg: 'bg-apricot-orange md:bg-apricot-orange/80 hover:bg-apricot-orange',
    icon: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  info: {
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    // AJUSTE: Cor 100% no mobile, 80% no desktop (md:), 100% no hover.
    confirmBtnBg: 'bg-blue-600 md:bg-blue-600/80 hover:bg-blue-600',
    icon: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
  },
};

export default function ConfirmationModal({
  isOpen,
  onCancel,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  theme = 'info', // 'info', 'warning', 'danger'
  children, // Para conteúdo customizado, como os detalhes do limite
}) {
  if (!isOpen) return null;

  const currentTheme = THEMES[theme] || THEMES.info;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full mx-4 text-center transform transition-all duration-300 ease-out scale-100 opacity-100">
        <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${currentTheme.iconBg} mb-4`}>
          <div className={currentTheme.iconColor}>
            {currentTheme.icon()}
          </div>
        </div>
        
        {/* TIPOGRAFIA APLICADA */}
        <h2 className="font-lexend text-acao font-bold text-gray-800 mb-2">{title}</h2>
        
        {/* TIPOGRAFIA APLICADA */}
        <p className="font-comfortaa text-corpo text-gray-600 mb-6">{message}</p>

        {children}
        
        <div className="flex justify-center space-x-4 mt-6">
          {/* TIPOGRAFIA APLICADA */}
          <button 
            onClick={onCancel} 
            className="px-8 py-3 rounded-lg text-gray-700 bg-early-frost md:bg-early-frost/80 hover:bg-early-frost font-lexend text-corpo font-bold transition-transform transform hover:scale-105"
          >
            {cancelText}
          </button>
          {/* TIPOGRAFIA APLICADA */}
          <button 
            onClick={onConfirm} 
            className={`px-8 py-3 rounded-lg text-white ${currentTheme.confirmBtnBg} font-lexend text-corpo font-bold transition-transform transform hover:scale-105`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
