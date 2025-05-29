// src/components/MonthSelector.jsx
import React from 'react';

const MESES_FILTRO = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function MonthSelector({
  selectedMonths,
  onMonthToggle,
  allMonthsSelected,
  onSelectAllMonthsToggle,
}) {
  return (
    <div> {/* Este componente será colocado em um wrapper div com md:col-span-2 no DashboardFilters */}
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
        {/* Com a largura total, md:grid-cols-4 e lg:grid-cols-6 devem funcionar bem */}
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
  );
}