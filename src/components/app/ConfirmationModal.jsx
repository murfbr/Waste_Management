import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaTrash, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

// Objeto de configuração para os diferentes temas do modal
const THEMES = {
  danger: {
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    confirmBtnBg: 'bg-red-600 md:bg-red-600/80 hover:bg-red-600',
    icon: FaTrash,
  },
  warning: {
    iconBg: 'bg-early-frost/80',
    iconColor: 'text-apricot-orange',
    confirmBtnBg: 'bg-apricot-orange md:bg-apricot-orange/80 hover:bg-apricot-orange',
    icon: FaExclamationTriangle,
  },
  info: {
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    confirmBtnBg: 'bg-blue-600 md:bg-blue-600/80 hover:bg-blue-600',
    icon: FaInfoCircle,
  },
};

export default function ConfirmationModal({
  isOpen,
  onCancel,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  theme = 'info',
  children,
}) {
  const { t } = useTranslation('common');

  if (!isOpen) return null;

  const currentTheme = THEMES[theme] || THEMES.info;

  const finalConfirmText = confirmText || t('confirm');
  const finalCancelText = cancelText || t('cancel');

  const Icon = currentTheme.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full mx-4 text-center transform transition-all duration-300 ease-out scale-100 opacity-100">
        <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${currentTheme.iconBg} mb-4`}>
          <div className={currentTheme.iconColor}>
            <Icon className="h-8 w-8" />
          </div>
        </div>
        
        <h2 className="font-lexend text-acao font-bold text-gray-800 mb-2">{title}</h2>
        
        <p className="font-comfortaa text-corpo text-gray-600 mb-6">{message}</p>

        {children}
        
        <div className="flex justify-center space-x-4 mt-6">
          <button 
            onClick={onCancel} 
            className="px-8 py-3 rounded-lg text-gray-700 bg-early-frost md:bg-early-frost/80 hover:bg-early-frost font-lexend text-corpo font-bold transition-transform transform hover:scale-105"
          >
            {finalCancelText}
          </button>
          <button 
            onClick={onConfirm} 
            className={`px-8 py-3 rounded-lg text-white ${currentTheme.confirmBtnBg} font-lexend text-corpo font-bold transition-transform transform hover:scale-105`}
          >
            {finalConfirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
