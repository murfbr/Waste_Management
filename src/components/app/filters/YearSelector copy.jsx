// src/components/app/filters/YearSelector.jsx
import React, { useState, useEffect, useRef } from 'react';

const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-400"><polyline points="6 9 12 15 18 9"></polyline></svg>;

export default function YearSelector({
  availableYears = [],
  selectedYears = [],
  onYearToggle = () => {},
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDisplayValue = () => {
    if (selectedYears.length === 0) return "Selecione o ano";
    if (selectedYears.length === 1) return selectedYears[0];
    return `${selectedYears.length} anos selecionados`;
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label htmlFor="year-selector-button" className="block text-sm font-bold text-rich-soil mb-2">Ano</label>
      <button
        id="year-selector-button"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-2 bg-white border border-early-frost rounded-md shadow-sm text-sm text-blue-coral"
        disabled={availableYears.length === 0}
      >
        <span>{getDisplayValue()}</span>
        <ChevronDownIcon />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto">
          {availableYears.map(year => (
            <label key={year} className="flex items-center px-3 py-2 text-sm text-blue-coral hover:bg-golden-orange hover:bg-opacity-20 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 text-apricot-orange border-early-frost rounded focus:ring-apricot-orange"
                checked={selectedYears.includes(year)}
                onChange={() => onYearToggle(year)}
              />
              <span className="ml-3">{year}</span>
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
