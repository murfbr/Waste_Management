// src/components/YearSelector.jsx
import React from 'react';

export default function YearSelector({
  availableYears,
  selectedYear,
  onYearChange,
  disabled,
}) {
  return (
    <div>
      <label htmlFor="yearFilterSelect" className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
      <select
        id="yearFilterSelect"
        value={selectedYear || new Date().getFullYear()}
        onChange={(e) => onYearChange(parseInt(e.target.value))}
        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        disabled={disabled}
      >
        {Array.isArray(availableYears) && availableYears.length > 0 ? (
          availableYears.map(year => <option key={year} value={year}>{year}</option>)
        ) : (
          // Se não houver anos disponíveis (ex: durante o carregamento inicial ou nenhum dado),
          // mostra o ano selecionado (ou o atual) como uma opção desabilitada.
          <option value={selectedYear || new Date().getFullYear()} disabled>
            {selectedYear || new Date().getFullYear()}
          </option>
        )}
      </select>
    </div>
  );
}