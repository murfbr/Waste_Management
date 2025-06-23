// src/components/WasteRecordsList.jsx

import React from 'react';
import { exportToCsv } from '../../utils/csvExport';

/**
 * Componente para exibir a lista de registros de resíduos.
 *
 * @param {object} props
 * @param {Array} props.records
 * @param {boolean} props.loading - Loading principal da lista
 * @param {function} props.onDelete
 * @param {string | null} props.userRole
 * @param {function} [props.showMessage]
 * @param {boolean} props.hasMoreRecords
 * @param {function} props.onLoadMore
 * @param {boolean} props.loadingMore
 */
function WasteRecordsList({ 
    records, 
    loading, 
    onDelete, 
    userRole, 
    showMessage,
    hasMoreRecords, 
    onLoadMore,     
    loadingMore     
}) {

  const handleExportClick = () => {
    if (records && records.length > 0) {
      // Lembrete: A função exportToCsv pode precisar ser atualizada para incluir a nova coluna "wasteSubType"
      exportToCsv(records, showMessage || alert); 
    } else {
      if (showMessage) { showMessage("Não há registos para exportar.", true); } 
      else { alert("Não há registos para exportar."); }
    }
  };

  const btnExportStyle = "w-full mb-4 px-4 py-2 bg-green-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500";
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
      {records && records.length > 0 && (
        <button 
          onClick={handleExportClick} 
          className={btnExportStyle}
        >
          Exportar para CSV
        </button>
      )}

      <div className="space-y-3">
        {records.map((record) => (
          <div 
            key={record.id} 
            className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center"
          >
            <div className="flex-grow mb-2 sm:mb-0">
              {record.areaLancamento && <p><strong className="text-gray-700">Área:</strong> {record.areaLancamento}</p>}
              
              {/* LÓGICA DE EXIBIÇÃO ATUALIZADA */}
              {record.wasteType && (
                <p>
                  <strong className="text-gray-700">Tipo:</strong> {record.wasteType}
                  {/* Adiciona o subtipo entre parênteses se ele existir no registro */}
                  {record.wasteSubType && <span className="text-gray-600"> ({record.wasteSubType})</span>}
                </p>
              )}

              {record.peso && <p><strong className="text-gray-700">Peso:</strong> {record.peso} kg</p>}
              {record.timestamp && <p className="text-xs text-gray-500">Data: {new Date(record.timestamp).toLocaleString('pt-BR')}</p>}
            </div>
            {userRole === 'master' && (
              <button
                onClick={() => onDelete(record.id)}
                className={btnDeleteStyle}
              >
                Excluir
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Botão "Carregar Mais Registos" */}
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
