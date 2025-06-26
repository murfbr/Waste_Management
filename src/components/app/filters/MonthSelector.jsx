// src/components/MonthSelector.jsx
import React from 'react';

const MESES_FILTRO = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const TODOS_OS_MESES = MESES_FILTRO.map((_, index) => index);

export default function MonthSelector({
  selectedMonths,
  onSelectedMonthsChange,
  // Novas props para o seletor de ano
  availableYears,
  selectedYears,
  onYearToggle,
}) {
  const allMonthsSelected = selectedMonths.length === MESES_FILTRO.length;

  const handleMonthToggle = (toggledMonthIndex) => {
    let newSelectedMonths;
    if (allMonthsSelected) {
      newSelectedMonths = [toggledMonthIndex];
    } else {
      if (selectedMonths.includes(toggledMonthIndex)) {
        newSelectedMonths = selectedMonths.filter(m => m !== toggledMonthIndex);
        if (newSelectedMonths.length === 0) {
          newSelectedMonths = TODOS_OS_MESES;
        }
      } else {
        newSelectedMonths = [...selectedMonths, toggledMonthIndex];
      }
    }
    onSelectedMonthsChange(newSelectedMonths);
  };

  const handleSelectAllToggle = () => {
    const newSelectedMonths = allMonthsSelected ? [] : TODOS_OS_MESES;
    onSelectedMonthsChange(newSelectedMonths);
  };

  return (
    <div>
      {/* CABEÇALHO ATUALIZADO: Título e seletor de ano na mesma linha */}
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-700">Mês/Meses</label>
        <div className="flex flex-wrap gap-2">
          {availableYears.map(year => (
              <button key={year} onClick={() => onYearToggle(year)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${selectedYears.includes(year) ? 'bg-blue-600 text-white font-semibold' : 'bg-white border hover:bg-gray-100'}`}>
                  {year}
              </button>
          ))}
        </div>
      </div>
      
      <div className="mb-2">
        <label htmlFor="selectAllMonthsFilterToggle" className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            id="selectAllMonthsFilterToggle"
            checked={allMonthsSelected}
            onChange={handleSelectAllToggle}
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
              checked={selectedMonths.includes(index)}
              onChange={() => handleMonthToggle(index)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="ml-2 text-sm text-gray-700">{month}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
