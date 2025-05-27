// src/components/DashboardFilters.jsx
import React from 'react'; // useContext não é mais necessário aqui se todas as props vierem de PaginaDashboard

const MESES_FILTRO = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function DashboardFilters({
  // Props recebidas de PaginaDashboard
  availableYears,
  userProfile,
  userAllowedClientes,
  selectedClienteIds = [],
  onClienteSelectionChange = () => {},
  selectAllToggle = false,
  onSelectAllToggleChange = () => {},
  selectedYear,
  onYearChange = () => {}, // Anteriormente setSelectedYear em PaginaDashboard, nomeado como handler
  selectedMonths = [],
  onMonthToggle = () => {},
  allMonthsSelected = false,
  onSelectAllMonthsToggle = () => {},
  availableAreas = [],
  selectedAreaLixoZero,
  onAreaLixoZeroChange = () => {}, // Anteriormente setSelectedAreaLixoZero, nomeado como handler
  loadingUserClientes
}) {

  // Mensagem de console para depuração, pode ser mantida ou removida
  // console.log("DASHBOARD_FILTERS (Render): loadingUserClientes:", loadingUserClientes, "userAllowedClientes length:", userAllowedClientes?.length);

  // Condição de loading para a secção de clientes
  // Se loadingUserClientes for true E (userAllowedClientes não existir OU estiver vazio)
  if (loadingUserClientes && (!userAllowedClientes || userAllowedClientes.length === 0)) {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <p className="text-sm text-gray-500">A carregar lista de clientes para filtro...</p>
      </div>
    );
  }

  return (
    <>
      {/* Seleção de Clientes com Checkboxes */}
      {/* Renderiza se userAllowedClientes (das props) tiver itens */}
      {userAllowedClientes && userAllowedClientes.length > 0 ? (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-3">Selecionar Cliente(s)</h3>
          <div className="mb-3">
            <label htmlFor="selectAllClientesFilterToggle" className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="selectAllClientesFilterToggle"
                checked={selectAllToggle} // Controlado pelas props de PaginaDashboard
                onChange={onSelectAllToggleChange} // Função das props de PaginaDashboard
                className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                {userProfile && userProfile.role === 'master' ? 'Selecionar Todos os Clientes Ativos' : 'Selecionar Todos os Meus Clientes'}
              </span>
            </label>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-2 border p-3 rounded-md">
            {/* Mapeia sobre userAllowedClientes das props */}
            {userAllowedClientes.map(cliente => (
              <label key={cliente.id} htmlFor={`filter-cliente-cb-${cliente.id}`} className="flex items-center cursor-pointer p-1 hover:bg-gray-100 rounded">
                <input
                  type="checkbox"
                  id={`filter-cliente-cb-${cliente.id}`}
                  value={cliente.id}
                  checked={selectedClienteIds.includes(cliente.id)} // Controlado pelas props
                  onChange={() => onClienteSelectionChange(cliente.id)} // Função das props
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">{cliente.nome} ({cliente.cidade || 'N/A'})</span>
              </label>
            ))}
          </div>
        </div>
      ) : (
         // Exibe esta mensagem se não estiver carregando e não houver clientes permitidos
         !loadingUserClientes && userAllowedClientes && userAllowedClientes.length === 0 &&
         <div className="bg-white p-4 rounded-lg shadow mb-6">
            <p className="text-sm text-gray-500">Nenhum cliente disponível para seleção.</p>
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
              onChange={(e) => onYearChange(parseInt(e.target.value))} // Handler das props
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
              onChange={(e) => onAreaLixoZeroChange(e.target.value)} // Handler das props
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              disabled={(!availableAreas || availableAreas.length === 0) && (selectedAreaLixoZero || 'ALL') === 'ALL'}
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
                        checked={allMonthsSelected} // Controlado pelas props
                        onChange={onSelectAllMonthsToggle} // Handler das props
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
                    checked={Array.isArray(selectedMonths) && selectedMonths.includes(index)} // Controlado pelas props
                    onChange={() => onMonthToggle(index)} // Handler das props
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
