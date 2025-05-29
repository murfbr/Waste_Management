// src/components/DashboardFilters.jsx
import React from 'react'; // Removido useState, useEffect, useRef
import YearSelector from './filters/YearSelector';
import MonthSelector from './filters/MonthSelector';
import AreaSelector from './filters/AreaSelector';

export default function DashboardFilters({
  userProfile, // Pode ser removido se não for usado para alguma lógica de permissão de filtro aqui
  availableYears,
  selectedYear,
  onYearChange = () => {},
  selectedMonths = [],
  onMonthToggle = () => {},
  allMonthsSelected = false,
  onSelectAllMonthsToggle = () => {},
  availableAreas = [],
  selectedAreas = [],
  onSelectedAreasChange = () => {},
}) {
  // Toda a lógica de estado e manipulação do dropdown de área foi movida para AreaSelector.jsx

  return (
    <>
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-2">Filtrar Período e Área</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <YearSelector
            availableYears={availableYears}
            selectedYear={selectedYear}
            onYearChange={onYearChange}
            disabled={!availableYears || availableYears.length === 0}
          />

          <AreaSelector
            availableAreas={availableAreas}
            selectedAreas={selectedAreas}
            onSelectedAreasChange={onSelectedAreasChange}
          />

          <div className="md:col-span-2">
            <MonthSelector
              selectedMonths={selectedMonths}
              onMonthToggle={onMonthToggle}
              allMonthsSelected={allMonthsSelected}
              onSelectAllMonthsToggle={onSelectAllMonthsToggle}
            />
          </div>
        </div>
      </div>
    </>
  );
}