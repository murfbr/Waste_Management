// src/components/DashboardFilters.jsx
import React, { useState, useEffect, useRef } from 'react'; 

const MESES_FILTRO = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function DashboardFilters({
  availableYears,
  userProfile,
  userAllowedClientes,
  selectedClienteIds = [],
  onClienteSelectionChange = () => {},
  selectAllToggle = false,
  onSelectAllToggleChange = () => {},
  selectedYear,
  onYearChange = () => {},
  selectedMonths = [],
  onMonthToggle = () => {},
  allMonthsSelected = false,
  onSelectAllMonthsToggle = () => {},
  availableAreas = [],
  // MODIFICADO: Props para seleção múltipla de áreas
  selectedAreas = [], // Espera um array de strings. Array vazio significa "Todas as Áreas"
  onSelectedAreasChange = () => {}, // Função para atualizar o array de áreas selecionadas
  loadingUserClientes
}) {

  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  const areaDropdownRef = useRef(null);

  // Efeito para fechar o dropdown de área ao clicar fora dele
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
  }, [areaDropdownRef]);

  const handleAreaSelectionToggle = (areaName) => {
    let newSelectedAreas;
    if (areaName === 'ALL') {
      newSelectedAreas = []; // Selecionar "Todas as Áreas" limpa as seleções individuais
    } else {
      // Se 'ALL' estava implícito (array vazio), e uma área específica é selecionada,
      // começamos uma nova seleção com essa área.
      const currentIsAll = selectedAreas.length === 0;
      if (currentIsAll) {
        newSelectedAreas = [areaName];
      } else {
        // Senão, alterna a área na seleção atual
        if (selectedAreas.includes(areaName)) {
          newSelectedAreas = selectedAreas.filter(a => a !== areaName);
        } else {
          newSelectedAreas = [...selectedAreas, areaName];
        }
      }
    }
    onSelectedAreasChange(newSelectedAreas);
  };

  const getAreaDisplayValue = () => {
    if (selectedAreas.length === 0) {
      return "Todas as Áreas";
    }
    if (selectedAreas.length === 1) {
      return selectedAreas[0];
    }
    return `Áreas Selecionadas (${selectedAreas.length})`;
  };

  if (loadingUserClientes && (!userAllowedClientes || userAllowedClientes.length === 0)) {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <p className="text-sm text-gray-500">A carregar lista de clientes para filtro...</p>
      </div>
    );
  }

  return (
    <>
      {userAllowedClientes && userAllowedClientes.length > 0 ? (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-3">Selecionar Cliente(s)</h3>
          <div className="mb-3">
            <label htmlFor="selectAllClientesFilterToggle" className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="selectAllClientesFilterToggle"
                checked={selectAllToggle} 
                onChange={onSelectAllToggleChange} 
                className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                {userProfile && userProfile.role === 'master' ? 'Selecionar Todos os Clientes Ativos' : 'Selecionar Todos os Meus Clientes'}
              </span>
            </label>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-2 border p-3 rounded-md">
            {userAllowedClientes.map(cliente => (
              <label key={cliente.id} htmlFor={`filter-cliente-cb-${cliente.id}`} className="flex items-center cursor-pointer p-1 hover:bg-gray-100 rounded">
                <input
                  type="checkbox"
                  id={`filter-cliente-cb-${cliente.id}`}
                  value={cliente.id}
                  checked={selectedClienteIds.includes(cliente.id)} 
                  onChange={() => onClienteSelectionChange(cliente.id)} 
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">{cliente.nome} ({cliente.cidade || 'N/A'})</span>
              </label>
            ))}
          </div>
        </div>
      ) : (
         !loadingUserClientes && userAllowedClientes && userAllowedClientes.length === 0 &&
         <div className="bg-white p-4 rounded-lg shadow mb-6"><p className="text-sm text-gray-500">Nenhum cliente disponível para seleção.</p></div>
      )}
      
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-2">Filtrar Período e Área</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="yearFilterSelect" className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
            <select 
              id="yearFilterSelect" 
              value={selectedYear || new Date().getFullYear()} 
              onChange={(e) => onYearChange(parseInt(e.target.value))} 
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              disabled={!availableYears || availableYears.length === 0}
            >
              {Array.isArray(availableYears) && availableYears.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>

          {/* Dropdown Multi-Select Customizado para Áreas */}
          <div className="relative" ref={areaDropdownRef}>
            <label htmlFor="areaFilterButton" className="block text-sm font-medium text-gray-700 mb-1">Área de Lançamento</label>
            <button
              type="button"
              id="areaFilterButton"
              onClick={() => setIsAreaDropdownOpen(!isAreaDropdownOpen)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              aria-haspopup="listbox"
              aria-expanded={isAreaDropdownOpen}
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
                <label className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-2"
                    checked={selectedAreas.length === 0}
                    onChange={() => handleAreaSelectionToggle('ALL')}
                  />
                  Todas as Áreas
                </label>
                {Array.isArray(availableAreas) && availableAreas.map(area => (
                  <label key={area} className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-2"
                      value={area}
                      checked={selectedAreas.includes(area)}
                      onChange={() => handleAreaSelectionToggle(area)}
                      // Se "Todas as Áreas" estiver selecionado (selectedAreas é vazio), desabilita checkboxes individuais
                     // disabled={selectedAreas.length === 0 && !selectedAreas.includes(area)} 
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

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Mês/Meses</label>
            <div className="mb-2">
                <label htmlFor="selectAllMonthsFilterToggle" className="flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        id="selectAllMonthsFilterToggle"
                        checked={allMonthsSelected} 
                        onChange={onSelectAllMonthsToggle} 
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Ano Inteiro (Todos os Meses)</span>
                </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-2 border p-3 rounded-md max-h-48 overflow-y-auto">
              {MESES_FILTRO.map((month, index) => (
                <label key={index} htmlFor={`filter-month-cb-${index}`} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id={`filter-month-cb-${index}`}
                    value={index}
                    checked={Array.isArray(selectedMonths) && selectedMonths.includes(index)}
                    onChange={() => onMonthToggle(index)} 
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{month}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
