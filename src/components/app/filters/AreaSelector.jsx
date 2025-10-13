import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaChevronDown } from 'react-icons/fa';
import { useDashboardFilters } from '../../../context/DashboardFilterContext';

export default function AreaSelector({ areaFilterData = { isMultiClient: false, areas: [] } }) {
  const { t } = useTranslation('dashboard');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  const handleToggleSingleArea = (clientId, areaName) => {
    const uniqueId = `${clientId}_${areaName}`;
    const newSelectedAreas = selectedAreas.includes(uniqueId)
      ? selectedAreas.filter(a => a !== uniqueId)
      : [...selectedAreas, uniqueId];
    handleManualAreaChange(newSelectedAreas);
  };

  const handleToggleAllForClient = (clientId, areas) => {
    if (!clientId) return;

    const clientUniqueIds = areas.map(area => `${clientId}_${area}`);
    const allSelectedForThisClient = clientUniqueIds.length > 0 && clientUniqueIds.every(id => selectedAreas.includes(id));

    let newSelectedAreas;
    if (allSelectedForThisClient) {
      newSelectedAreas = selectedAreas.filter(id => !id.startsWith(`${clientId}_`));
    } else {
      const otherClientAreas = selectedAreas.filter(id => !id.startsWith(`${clientId}_`));
      newSelectedAreas = [...new Set([...otherClientAreas, ...clientUniqueIds])];
    }
    handleManualAreaChange(newSelectedAreas);
  };

  const getDisplayValue = () => {
    const totalAvailableAreas = areaFilterData.isMultiClient
      ? areaFilterData.clients.reduce((acc, client) => acc + client.areas.length, 0)
      : areaFilterData.areas.length;

    if (selectedAreas.length === totalAvailableAreas && totalAvailableAreas > 0) {
      return t('filtersComponent.areaSelector.allAreas', 'Todas as Áreas');
    }
    if (selectedAreas.length === 1) {
      const areaName = selectedAreas[0].substring(selectedAreas[0].indexOf('_') + 1);
      return areaName || selectedAreas[0];
    }
    if (selectedAreas.length > 1) {
      return t('filtersComponent.areaSelector.multipleSelected', { count: selectedAreas.length });
    }
    return t('filtersComponent.areaSelector.noneSelected', 'Nenhuma área selecionada');
  };

  const totalAvailableAreas = areaFilterData.isMultiClient
    ? areaFilterData.clients.reduce((acc, client) => acc + client.areas.length, 0)
    : areaFilterData.areas.length;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label htmlFor="area-selector-button" className="block text-sm font-bold text-rich-soil mb-2">{t('filtersComponent.areaSelector.label')}</label>
      <button
        id="area-selector-button"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-2 bg-white border border-early-frost rounded-md shadow-sm text-sm text-blue-coral"
        disabled={totalAvailableAreas === 0}
      >
        <span>{getDisplayValue()}</span>
        <FaChevronDown className="h-5 w-5 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto">
          {totalAvailableAreas === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">{t('filtersComponent.areaSelector.noneAvailable')}</div>
          ) : areaFilterData.isMultiClient ? (
            areaFilterData.clients.map(client => (
              <div key={client.clientId} className="border-b border-gray-200 last:border-b-0">
                <div className="px-3 pt-2 pb-1 font-bold text-sm text-blue-coral">{client.clientName}</div>
                <label className="flex items-center px-3 py-2 text-sm text-blue-coral hover:bg-golden-orange hover:bg-opacity-20 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-apricot-orange border-early-frost rounded focus:ring-apricot-orange"
                    checked={client.areas.length > 0 && client.areas.every(area => selectedAreas.includes(`${client.clientId}_${area}`))}
                    onChange={() => handleToggleAllForClient(client.clientId, client.areas)}
                    disabled={client.areas.length === 0}
                  />
                  <span className="ml-3">(Totais)</span>
                </label>
                {client.areas.map(area => (
                  <label key={`${client.clientId}_${area}`} className="flex items-center pl-8 pr-3 py-2 text-sm text-blue-coral hover:bg-golden-orange hover:bg-opacity-20 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-apricot-orange border-early-frost rounded focus:ring-apricot-orange"
                      checked={selectedAreas.includes(`${client.clientId}_${area}`)}
                      onChange={() => handleToggleSingleArea(client.clientId, area)}
                    />
                    <span className="ml-3">{area}</span>
                  </label>
                ))}
              </div>
            ))
          ) : (
            <>
              <label className="flex items-center px-3 py-2 text-sm font-bold text-blue-coral hover:bg-golden-orange hover:bg-opacity-20 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-apricot-orange border-early-frost rounded focus:ring-apricot-orange"
                  checked={areaFilterData.areas.length > 0 && areaFilterData.areas.every(area => selectedAreas.includes(`${areaFilterData.clientId}_${area}`))}
                  onChange={() => handleToggleAllForClient(areaFilterData.clientId, areaFilterData.areas)}
                />
                <span className="ml-3">{t('filtersComponent.areaSelector.allAreas')}</span>
              </label>
              {areaFilterData.areas.map(area => (
                <label key={area} className="flex items-center px-3 py-2 text-sm text-blue-coral hover:bg-golden-orange hover:bg-opacity-20 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-apricot-orange border-early-frost rounded focus:ring-apricot-orange"
                    checked={selectedAreas.includes(`${areaFilterData.clientId}_${area}`)}
                    onChange={() => handleToggleSingleArea(areaFilterData.clientId, area)}
                  />
                  <span className="ml-3">{area}</span>
                </label>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}