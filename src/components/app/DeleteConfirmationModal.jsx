// src/components/app/DeleteConfirmationModal.jsx

import React, { useState, useEffect } from 'react';

export default function DeleteConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  clienteNome 
}) {
  const [inputValue, setInputValue] = useState('');
  const confirmationText = 'deletar';

  // Reseta o campo de texto toda vez que o modal for aberto
  useEffect(() => {
    if (isOpen) {
      setInputValue('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const isButtonDisabled = inputValue.toLowerCase() !== confirmationText;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Confirmar Exclusão</h2>
        <p className="text-gray-600 mb-4">
          Esta ação é <span className="font-bold text-red-600">permanente</span> e não pode ser desfeita. O cliente <strong className="text-gray-900">{clienteNome}</strong> será excluído.
        </p>
        <p className="text-gray-600 mb-4">
          Para confirmar, por favor, digite "<strong className="text-red-700">{confirmationText}</strong>" no campo abaixo.
        </p>
        
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md mb-4"
          autoComplete="off"
          autoFocus
        />

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isButtonDisabled}
            className={`px-4 py-2 font-semibold text-white rounded-md ${isButtonDisabled ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
          >
            Excluir Permanentemente
          </button>
        </div>
      </div>
    </div>
  );
}