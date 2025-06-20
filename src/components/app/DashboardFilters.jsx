// src/components/app/DashboardFilters.jsx

import React from 'react';

// Importa os seletores individuais que agora serão usados
import YearSelector from '../app/filters/YearSelector';
import MonthSelector from '../app/filters/MonthSelector';
import AreaSelector from '../app/filters/AreaSelector';

/**
 * Componente contêiner para os filtros do dashboard.
 */
export default function DashboardFilters({
  // Props para o YearSelector
  selectedYears,
  onYearToggle,
  availableYears,

  // Props para o MonthSelector
  selectedMonths,
  onMonthToggle,
  allMonthsSelected,
  onSelectAllMonthsToggle,

  // Props para o AreaSelector
  selectedAreas,
  onSelectedAreasChange,
  availableAreas,
  
  // Controle geral
  isLoading,
}) {
  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtros</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Coluna 1: Seletor de Ano */}
        <div className="md:col-span-1">
          <YearSelector
            selectedYears={selectedYears}
            onYearToggle={onYearToggle}
            availableYears={availableYears}
            disabled={isLoading || availableYears.length === 0}
          />
        </div>

        {/* Coluna 2 e 3: Seletor de Mês */}
        <div className="md:col-span-1 lg:col-span-2">
          <MonthSelector
            selectedMonths={selectedMonths}
            onMonthToggle={onMonthToggle}
            allMonthsSelected={allMonthsSelected}
            onSelectAllMonthsToggle={onSelectAllMonthsToggle}
          />
        </div>

        {/* Coluna 4: Seletor de Área */}
        <div className="md:col-span-1">
          <AreaSelector
            selectedAreas={selectedAreas}
            onSelectedAreasChange={onSelectedAreasChange}
            availableAreas={availableAreas}
          />
        </div>
      </div>
    </div>
  );
}
