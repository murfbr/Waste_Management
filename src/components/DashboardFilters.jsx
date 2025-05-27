// src/components/DashboardFilters.jsx
import React, { useContext } from 'react'; 
import DashboardFiltersContext from '../context/DashboardFiltersContext';
import AuthContext from '../context/AuthContext'; // Para obter userProfile

// MESES_FILTRO pode ser movido para um ficheiro de constantes se usado em mais locais,
// ou mantido aqui se específico para este componente.
const MESES_FILTRO = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function DashboardFilters({
  // A prop availableYears ainda vem da PaginaDashboard, pois é calculada lá
  availableYears,
}) {
  
  // Consome os valores e funções do DashboardFiltersContext
  const {
    userAllowedClientes = [], // Valor padrão
    loadingUserClientes = true,
    selectedClienteIds = [],
    selectAllToggle = false, // Nome da prop no contexto é selectAllToggle
    handleClienteSelectionChange = () => {},
    handleSelectAllClientesToggleChange = () => {}, // Nome da função no contexto
    
    selectedYear,
    setSelectedYear = () => {},
    
    selectedMonths = [], 
    allMonthsSelected = false,
    onMonthToggle = () => {}, // Nome da função no contexto
    onSelectAllMonthsToggle = () => {}, // Nome da função no contexto
    
    availableAreas = [],      
    selectedAreaLixoZero,
    setSelectedAreaLixoZero = () => {}
  } = useContext(DashboardFiltersContext) || {}; // Fallback para o contexto se for null/undefined

  // userProfile é necessário para a lógica de exibição do checkbox "Selecionar Todos..."
  const { userProfile } = useContext(AuthContext);


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
            <label htmlFor="selectAllClientesFilterToggle" className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="selectAllClientesFilterToggle"
                checked={selectAllToggle}
                onChange={handleSelectAllClientesToggleChange} 
                className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                disabled={loadingUserClientes}
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
                  onChange={() => handleClienteSelectionChange(cliente.id)} 
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="yearFilterSelect" className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
            <select 
              id="yearFilterSelect" 
              value={selectedYear || new Date().getFullYear()} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))} 
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              disabled={!availableYears || availableYears.length === 0}
            >
              {Array.isArray(availableYears) && availableYears.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="areaLixoZeroFilterSelect" className="block text-sm font-medium text-gray-700 mb-1">Área (Lixo Zero)</label>
            <select 
              id="areaLixoZeroFilterSelect" 
              value={selectedAreaLixoZero || 'ALL'} 
              onChange={(e) => setSelectedAreaLixoZero(e.target.value)} 
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              disabled={availableAreas.length === 0 && (selectedAreaLixoZero || 'ALL') === 'ALL'}
            >
              <option value="ALL">Todas as Áreas</option>
              {Array.isArray(availableAreas) && availableAreas.map(area => <option key={area} value={area}>{area}</option>)}
            </select>
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
