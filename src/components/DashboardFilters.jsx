// src/components/DashboardFilters.jsx
import React from 'react';

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function DashboardFilters({
  userProfile,
  userAllowedClientes,
  selectedClienteIds,
  onClienteSelectionChange,
  selectAllToggle,
  onSelectAllToggleChange,
  availableYears,
  selectedYear,
  onYearChange,
  selectedMonth,
  onMonthChange,
  availableAreas,
  selectedAreaLixoZero,
  onAreaLixoZeroChange,
  loadingUserClientes // Para desabilitar seleção de cliente enquanto carrega
}) {
  
  if (loadingUserClientes && userAllowedClientes.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <p className="text-sm text-gray-500">A carregar filtros de cliente...</p>
      </div>
    );
  }

  return (
    <>
      {/* Seleção de Clientes com Checkboxes */}
      {userAllowedClientes.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-3">Selecionar Cliente(s)</h3>
          <div className="mb-3">
            <label htmlFor="selectAllClientesToggle" className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="selectAllClientesToggle"
                checked={selectAllToggle}
                onChange={onSelectAllToggleChange}
                className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                disabled={loadingUserClientes}
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                {userProfile.role === 'master' ? 'Selecionar Todos os Clientes Ativos' : 'Selecionar Todos os Meus Clientes'}
              </span>
            </label>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-2 border p-3 rounded-md">
            {userAllowedClientes.map(cliente => (
              <label key={cliente.id} htmlFor={`cliente-cb-${cliente.id}`} className="flex items-center cursor-pointer p-1 hover:bg-gray-100 rounded">
                <input
                  type="checkbox"
                  id={`cliente-cb-${cliente.id}`}
                  value={cliente.id}
                  checked={selectedClienteIds.includes(cliente.id)}
                  onChange={() => onClienteSelectionChange(cliente.id)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  disabled={loadingUserClientes}
                />
                <span className="ml-2 text-sm text-gray-700">{cliente.nome} ({cliente.cidade || 'N/A'})</span>
              </label>
            ))}
          </div>
        </div>
      )}
      
      {/* Filtros de Período e Área */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-2">Filtrar Período e Área (Gráficos de Barras e Lixo Zero)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="yearSelect" className="block text-sm font-medium text-gray-700">Ano</label>
            <select 
              id="yearSelect" 
              value={selectedYear} 
              onChange={(e) => onYearChange(parseInt(e.target.value))} 
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              disabled={availableYears.length === 0}
            >
              {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="monthSelect" className="block text-sm font-medium text-gray-700">Mês</label>
            <select 
              id="monthSelect" 
              value={selectedMonth} 
              onChange={(e) => onMonthChange(parseInt(e.target.value))} 
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              {MESES.map((month, index) => <option key={index} value={index}>{month}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="areaLixoZeroSelect" className="block text-sm font-medium text-gray-700">Área (Lixo Zero)</label>
            <select 
              id="areaLixoZeroSelect" 
              value={selectedAreaLixoZero} 
              onChange={(e) => onAreaLixoZeroChange(e.target.value)} 
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              disabled={availableAreas.length === 0 && selectedAreaLixoZero === 'ALL'}
            >
              <option value="ALL">Todas as Áreas</option>
              {availableAreas.map(area => <option key={area} value={area}>{area}</option>)}
            </select>
          </div>
        </div>
      </div>
    </>
  );
}
