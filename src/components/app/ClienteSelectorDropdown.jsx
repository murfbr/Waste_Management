// src/components/ClienteSelectorDropdown.jsx
import React, { useState, useEffect, useRef } from 'react';

export default function ClienteSelectorDropdown({
  userAllowedClientes = [],
  selectedClienteIds = [],
  onClienteSelectionChange,
  selectAllClientesToggle,
  onSelectAllClientesToggleChange,
  loadingAllowedClientes,
  userProfile, // Para determinar o texto "Todos Clientes Ativos" vs "Todos Seus Clientes"
}) {
  const [isClienteDropdownOpen, setIsClienteDropdownOpen] = useState(false);
  const clienteDropdownRef = useRef(null);

  // Efeito para fechar dropdown de cliente ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (clienteDropdownRef.current && !clienteDropdownRef.current.contains(event.target)) {
        setIsClienteDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [clienteDropdownRef]); // A dependência está correta

  const getClienteDisplayValue = () => {
    if (loadingAllowedClientes) return "Carregando clientes...";
    if (!userAllowedClientes || userAllowedClientes.length === 0) return "Nenhum cliente disponível";

    if (selectAllClientesToggle || selectedClienteIds.length === userAllowedClientes.length) {
      return userProfile?.role === 'master' ? "Todos Clientes Ativos" : "Todos Seus Clientes";
    }
    if (selectedClienteIds.length === 1) {
      const cliente = userAllowedClientes.find(c => c.id === selectedClienteIds[0]);
      return cliente ? cliente.nome : "1 cliente selecionado";
    }
    if (selectedClienteIds.length > 1) {
      return `${selectedClienteIds.length} clientes selecionados`;
    }
    return "Selecionar cliente(s)";
  };

  // Handler para o toggle "Selecionar Todos" dentro do dropdown
  const handleSelectAllToggleWithClose = () => {
    if (onSelectAllClientesToggleChange) {
      onSelectAllClientesToggleChange();
    }
  };

  // Handler para seleção individual de cliente dentro do dropdown
  const handleIndividualClienteSelection = (clienteId) => {
    if (onClienteSelectionChange) {
      onClienteSelectionChange(clienteId);
    }
  };


  if (loadingAllowedClientes) {
    return <div className="text-sm text-gray-500 mt-1 sm:ml-4 w-full sm:w-auto sm:min-w-[250px] p-2 text-center">Carregando clientes...</div>;
  }

  if (!userAllowedClientes || userAllowedClientes.length === 0) {
    return <div className="text-sm text-orange-500 mt-1 sm:ml-4 w-full sm:w-auto sm:min-w-[250px] p-2 text-center">Nenhum cliente associado.</div>;
  }

  return (
    <div className="relative w-full sm:w-auto sm:min-w-[250px]" ref={clienteDropdownRef}>
      <button
        type="button"
        onClick={() => setIsClienteDropdownOpen(!isClienteDropdownOpen)}
        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        aria-haspopup="listbox"
        aria-expanded={isClienteDropdownOpen}
        disabled={loadingAllowedClientes || !userAllowedClientes || userAllowedClientes.length === 0}
      >
        <span className="block truncate">{getClienteDisplayValue()}</span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </span>
      </button>

      {isClienteDropdownOpen && (
        <div className="absolute z-20 mt-1 w-full sm:w-72 bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {userAllowedClientes.length > 1 && ( // Só mostra "Todos" se houver mais de 1 cliente
            <label className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-2"
                checked={selectAllClientesToggle}
                onChange={handleSelectAllToggleWithClose} // Usando o handler adaptado
              />
              {userProfile?.role === 'master' ? "Todos Clientes Ativos" : "Todos Seus Clientes"}
            </label>
          )}
          {userAllowedClientes.map(cliente => (
            <label key={cliente.id} className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-2"
                value={cliente.id}
                checked={selectedClienteIds.includes(cliente.id)}
                onChange={() => handleIndividualClienteSelection(cliente.id)} // Usando o handler adaptado
                disabled={selectAllClientesToggle && userAllowedClientes.length > 1} // Desabilita individual se "todos" estiver marcado E houver mais de um cliente
              />
              {cliente.nome}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
