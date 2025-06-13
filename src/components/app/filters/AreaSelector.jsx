// src/components/filters/AreaSelector.jsx
import React, { useState, useEffect, useRef } from 'react';

export default function AreaSelector({
  availableAreas = [],
  selectedAreas = [],
  onSelectedAreasChange = () => {},
}) {
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  const areaDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (areaDropdownRef.current && !areaDropdownRef.current.contains(event.target)) {
        setIsAreaDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [areaDropdownRef]); // A dependência está correta

  const handleAreaSelectionToggle = (areaName) => {
    let newSelectedAreas;
    if (areaName === 'ALL') {
      // Se 'Todas as Áreas' for clicado, e já estiver selecionado (selectedAreas.length === 0),
      // não faz nada. Se não, limpa as seleções.
      // Ou, se quiser permitir desmarcar 'Todas as Áreas' para selecionar específicas,
      // a lógica pode ser ajustada. A lógica atual do DashboardFilters parece boa:
      newSelectedAreas = []; // Selecionar 'ALL' sempre limpa e define como "todas" (array vazio)
    } else {
      // Se 'Todas as Áreas' está atualmente ativo (selectedAreas.length === 0)
      const currentIsAll = selectedAreas.length === 0;
      if (currentIsAll) {
        // Ao clicar numa área específica quando "Todas" está ativo, seleciona apenas essa área.
        newSelectedAreas = [areaName];
      } else {
        // Caso contrário, alterna a seleção da área específica.
        if (selectedAreas.includes(areaName)) {
          newSelectedAreas = selectedAreas.filter(a => a !== areaName);
        } else {
          newSelectedAreas = [...selectedAreas, areaName];
        }
      }
    }
    onSelectedAreasChange(newSelectedAreas);
    // Poderia fechar o dropdown após a seleção, se desejado:
    // if (newSelectedAreas.length > 0 && newSelectedAreas.length !== availableAreas.length) {
    //   setIsAreaDropdownOpen(false);
    // }
  };

  const getAreaDisplayValue = () => {
    if (selectedAreas.length === 0 && availableAreas.length > 0) { // Modificado para ser mais preciso
      return "Todas as Áreas";
    }
    if (selectedAreas.length === 0 && availableAreas.length === 0) {
        return "Nenhuma área disponível";
    }
    if (selectedAreas.length === 1) {
      return selectedAreas[0];
    }
    return `Áreas Selecionadas (${selectedAreas.length})`;
  };

  return (
    <div className="relative" ref={areaDropdownRef}>
      <label htmlFor="areaFilterButton" className="block text-sm font-medium text-gray-700 mb-1">Área de Lançamento</label>
      <button
        type="button"
        id="areaFilterButton"
        onClick={() => setIsAreaDropdownOpen(!isAreaDropdownOpen)}
        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        aria-haspopup="listbox"
        aria-expanded={isAreaDropdownOpen}
        disabled={availableAreas.length === 0 && selectedAreas.length === 0} // Desabilita se não há áreas
      >
        <span className="block truncate">{getAreaDisplayValue()}</span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </span>
      </button>

      {isAreaDropdownOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {availableAreas.length > 0 && (
            <label className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-2"
                checked={selectedAreas.length === 0} // "Todas as Áreas" está checado se selectedAreas for vazio
                onChange={() => handleAreaSelectionToggle('ALL')}
              />
              Todas as Áreas
            </label>
          )}
          {Array.isArray(availableAreas) && availableAreas.map(area => (
            <label key={area} className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-2"
                value={area}
                checked={selectedAreas.includes(area)}
                onChange={() => handleAreaSelectionToggle(area)}
                // Não desabilitar quando "Todas as Áreas" está ativo, para permitir mudar para uma específica
              />
              {area}
            </label>
          ))}
           {Array.isArray(availableAreas) && availableAreas.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">Nenhuma área específica disponível.</div>
          )}
        </div>
      )}
    </div>
  );
}