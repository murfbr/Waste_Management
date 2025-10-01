// src/components/app/filters/AreaSelector.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboardFilters } from '../../../context/DashboardFilterContext';

const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-400"><polyline points="6 9 12 15 18 9"></polyline></svg>;

export default function AreaSelector({ availableAreas = [] }) {
  const { t } = useTranslation('dashboard');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Pega o estado e a função diretamente do contexto
  const { selectedAreas, handleManualAreaChange } = useDashboardFilters();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectionToggle = (areaName) => {
    const newSelectedAreas = selectedAreas.includes(areaName)
      ? selectedAreas.filter(a => a !== areaName)
      : [...selectedAreas, areaName];
    handleManualAreaChange(newSelectedAreas); // Usa a função do contexto
  };

  const handleSelectAll = () => {
    handleManualAreaChange(selectedAreas.length === availableAreas.length ? [] : availableAreas.map(a => a)); // Usa a função do contexto
  };

  const getDisplayValue = () => {
    if (selectedAreas.length === 0 || selectedAreas.length === availableAreas.length) {
      return t('filtersComponent.areaSelector.allAreas');
    }
    if (selectedAreas.length === 1) {
      return selectedAreas[0];
    }
    return t('filtersComponent.areaSelector.multipleSelected', { count: selectedAreas.length });
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label htmlFor="area-selector-button" className="block text-sm font-bold text-rich-soil mb-2">{t('filtersComponent.areaSelector.label')}</label>
      <button
        id="area-selector-button"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-2 bg-white border border-early-frost rounded-md shadow-sm text-sm text-blue-coral"
        disabled={availableAreas.length === 0}
      >
        <span>{getDisplayValue()}</span>
        <ChevronDownIcon />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto">
          {availableAreas.length > 0 && (
              <label className="flex items-center px-3 py-2 text-sm font-bold text-blue-coral hover:bg-golden-orange hover:bg-opacity-20 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-apricot-orange border-early-frost rounded focus:ring-apricot-orange"
                  checked={selectedAreas.length === availableAreas.length}
                  onChange={handleSelectAll}
                />
                <span className="ml-3">{t('filtersComponent.areaSelector.allAreas')}</span>
              </label>
          )}
          {availableAreas.map(area => (
            <label key={area} className="flex items-center px-3 py-2 text-sm text-blue-coral hover:bg-golden-orange hover:bg-opacity-20 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 text-apricot-orange border-early-frost rounded focus:ring-apricot-orange"
                checked={selectedAreas.includes(area)}
                onChange={() => handleSelectionToggle(area)}
              />
              <span className="ml-3">{area}</span>
            </label>
          ))}
           {availableAreas.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">{t('filtersComponent.areaSelector.noneAvailable')}</div>
          )}
        </div>
      )}
    </div>
  );
}