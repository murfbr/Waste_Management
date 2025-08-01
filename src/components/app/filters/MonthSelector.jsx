// src/components/app/filters/MonthSelector.jsx
import React from 'react';

const MESES_FILTRO = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const TODOS_OS_MESES = Array.from({ length: 12 }, (_, i) => i);

export default function MonthSelector({
  selectedMonths,
  onSelectedMonthsChange,
}) {
  const allMonthsSelected = selectedMonths.length === MESES_FILTRO.length;

  const handleMonthToggle = (toggledMonthIndex) => {
    let newSelectedMonths;
    if (allMonthsSelected) {
      newSelectedMonths = [toggledMonthIndex];
    } else {
      if (selectedMonths.includes(toggledMonthIndex)) {
        newSelectedMonths = selectedMonths.filter(m => m !== toggledMonthIndex);
        if (newSelectedMonths.length === 0) newSelectedMonths = TODOS_OS_MESES;
      } else {
        newSelectedMonths = [...selectedMonths, toggledMonthIndex];
      }
    }
    onSelectedMonthsChange(newSelectedMonths);
  };

  const handleSelectAllToggle = () => {
    onSelectedMonthsChange(allMonthsSelected ? [] : TODOS_OS_MESES);
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-bold text-rich-soil mb-2">Mês</label>
      <div className="p-3 bg-white border border-early-frost rounded-md shadow-sm">
        <label className="flex items-center cursor-pointer mb-3">
          <input
            type="checkbox"
            checked={allMonthsSelected}
            onChange={handleSelectAllToggle}
            className="h-4 w-4 text-apricot-orange border-early-frost rounded focus:ring-apricot-orange"
          />
          <span className="ml-2 text-sm text-blue-coral">Todos os Meses</span>
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {MESES_FILTRO.map((month, index) => (
            <button
              key={index}
              onClick={() => handleMonthToggle(index)}
              className={`p-2 text-xs font-bold rounded-md transition-colors duration-200
                ${selectedMonths.includes(index)
                  ? 'bg-blue-coral text-white'
                  : 'bg-early-frost bg-opacity-50 text-rich-soil hover:bg-blue-coral hover:text-white'
                }`}
            >
              {month}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
