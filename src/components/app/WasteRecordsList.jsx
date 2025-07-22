// src/components/app/WasteRecordsList.jsx

import React, { useState } from 'react';

// Ícones para uma UI mais clara
const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const ExportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const isToday = (timestamp) => {
    if (!timestamp) return false;
    const recordDate = new Date(timestamp);
    const today = new Date();
    return recordDate.toDateString() === today.toDateString();
};

function WasteRecordsList({ 
    records, 
    loading, 
    onDelete, 
    userRole, 
    hasMoreRecords, 
    onLoadMore,     
    loadingMore,
    onExport,
    isExporting,
    clienteNome
}) {
  const [exportPeriod, setExportPeriod] = useState('7days');
  // NOVO ESTADO: controla a visibilidade da seção de exportação
  const [isExportVisible, setIsExportVisible] = useState(false);

  const handleExportClick = () => {
    if (onExport) {
      onExport(exportPeriod, clienteNome);
    }
  };

  const btnDeleteStyle = "px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-md shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500";
  const btnLoadMoreStyle = "w-full mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50";

  if (loading && records.length === 0) { 
    return <div className="text-center text-gray-500 py-4">Carregando registos...</div>;
  }

  if (!loading && records.length === 0) {
    return <p className="text-center text-gray-500 py-4">Nenhum registo encontrado para a seleção atual.</p>;
  }

  return (
    <>
      {/* --- SEÇÃO DE EXPORTAÇÃO COLAPSÁVEL E ALINHADA --- */}
      <div className="bg-gray-100 rounded-lg border border-gray-200 mb-6">
        <button
            onClick={() => setIsExportVisible(!isExportVisible)}
            className="w-full flex justify-between items-center p-4 text-left focus:outline-none"
            aria-expanded={isExportVisible}
        >
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <ExportIcon />
                Exportar Relatório
            </h3>
            <span className="text-xl text-gray-600 transform transition-transform duration-200">
                {isExportVisible ? '▲' : '▼'}
            </span>
        </button>

        {isExportVisible && (
            <div className="p-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div className="flex-grow">
                        <label htmlFor="exportPeriod" className="block text-sm font-medium text-gray-700 mb-1">Período:</label>
                        <select 
                            id="exportPeriod" 
                            value={exportPeriod}
                            onChange={(e) => setExportPeriod(e.target.value)}
                            className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="today">Hoje</option>
                            <option value="7days">Últimos 7 dias</option>
                            <option value="30days">Últimos 30 dias</option>
                        </select>
                    </div>
                    <div className="flex-shrink-0">
                        <button 
                          onClick={handleExportClick} 
                          disabled={isExporting}
                          className="w-full sm:w-auto px-4 py-2 bg-green-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300 flex items-center justify-center"
                        >
                          <ExportIcon />
                          {isExporting ? 'A exportar...' : 'Gerar CSV'}
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
      {/* --- FIM DA SEÇÃO DE EXPORTAÇÃO --- */}


      <div className="space-y-3">
        {records.map((record) => {
          const canUserDelete = 
            userRole === 'master' || 
            userRole === 'gerente' ||
            (userRole === 'operacional' && (record.isPending || isToday(record.timestamp)));

          return (
            <div 
              key={record.id} 
              className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center ${record.isPending ? 'opacity-75 border-l-4 border-yellow-400' : ''}`}
            >
              <div className="flex-grow mb-2 sm:mb-0">
                {record.areaLancamento && <p><strong className="text-gray-700">Área:</strong> {record.areaLancamento}</p>}
                
                <p>
                  <strong className="text-gray-700">Tipo:</strong> {record.wasteType}
                  {record.wasteSubType && <span className="text-gray-600"> ({record.wasteSubType})</span>}
                </p>

                <p><strong className="text-gray-700">Peso:</strong> {record.peso} kg</p>
                <div className="flex items-center space-x-2">
                    <p className="text-xs text-gray-500">Data: {new Date(record.timestamp).toLocaleString('pt-BR')}</p>
                    {record.isPending && (
                        <div title="Aguardando sincronização" className="flex items-center">
                            <ClockIcon />
                        </div>
                    )}
                </div>
              </div>
              
              {canUserDelete && (
                <button
                  onClick={() => onDelete(record)}
                  className={btnDeleteStyle}
                >
                  Excluir
                </button>
              )}
            </div>
          );
        })}
      </div>

      {hasMoreRecords && (
        <div className="mt-6 text-center">
          <button
            onClick={onLoadMore}
            disabled={loadingMore || loading}
            className={btnLoadMoreStyle}
          >
            {loadingMore ? 'A Carregar...' : 'Carregar Mais Registos'}
          </button>
        </div>
      )}
    </>
  );
}

export default WasteRecordsList;
