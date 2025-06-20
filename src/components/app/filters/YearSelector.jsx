// src/components/filters/YearSelector.jsx
import React, { useState, useEffect, useRef } from 'react';

export default function YearSelector({
  availableYears = [],
  selectedYears = [],
  onYearToggle = () => {},
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Determina o que exibir no botão do dropdown
  const getDisplayValue = () => {
    if (selectedYears.length === 0) return "Selecione um ano";
    if (selectedYears.length === 1) return `Ano: ${selectedYears[0]}`;
    return `${selectedYears.length} anos selecionados`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label htmlFor="yearFilterButton" className="block text-sm font-medium text-gray-700 mb-1">Ano(s)</label>
      <button
        type="button"
        id="yearFilterButton"
        onClick={() => setIsOpen(!isOpen)}
        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled || availableYears.length === 0}
      >
        <span className="block truncate">{getDisplayValue()}</span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {availableYears.map(year => (
            <label key={year} className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-2"
                value={year}
                checked={selectedYears.includes(year)}
                onChange={() => onYearToggle(year)}
              />
              {year}
            </label>
          ))}
          {availableYears.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">Nenhum ano disponível.</div>
          )}
        </div>
      )}
    </div>
  );
}
