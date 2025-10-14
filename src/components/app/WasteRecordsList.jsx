// src/components/app/WasteRecordsList.jsx (versão atualizada e completa)

import React from 'react';
import { useTranslation } from 'react-i18next';

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-golden-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// O ExportIcon foi removido pois não é mais usado aqui.

const isToday = (timestamp) => {
    if (!timestamp) return false;
    const recordDate = new Date(timestamp);
    const today = new Date();
    return recordDate.toDateString() === today.toDateString();
};

// As props onExport, isExporting e clienteNome foram removidas da declaração do componente
function WasteRecordsList({ 
    records, 
    loading, 
    onDelete, 
    userRole, 
    hasMoreRecords, 
    onLoadMore,     
    loadingMore
}) {
  const { t, i18n } = useTranslation('wasteRegister');

  const localeMap = {
    pt: 'pt-BR',
    en: 'en-GB', // Usando o locale do Reino Unido para manter o formato DD/MM/YYYY
    es: 'es-ES',
  };
  const currentLocale = localeMap[i18n.language] || 'pt-BR';

  if (loading && records.length === 0) { 
    return <div className="text-center text-rich-soil py-4 font-comfortaa">{t('wasteRecordsListComponent.loading')}</div>;
  }

  if (!loading && records.length === 0) {
    return <p className="text-center text-rich-soil py-4 font-comfortaa">{t('wasteRecordsListComponent.noRecords')}</p>;
  }

  return (
    <>
      {/* O BLOCO INTEIRO DE EXPORTAÇÃO FOI REMOVIDO DESTE COMPONENTE */}

      <div className="space-y-3 font-comfortaa text-corpo">
        {records.map((record) => {
          const canUserDelete = 
            userRole === 'master' || 
            userRole === 'gerente' ||
            (userRole === 'operacional' && (record.isPending || isToday(record.timestamp)));

          return (
            <div 
              key={record.id} 
              className={`bg-white border border-early-frost rounded-lg p-4 shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center ${record.isPending ? 'opacity-75 border-l-4 border-golden-orange' : ''}`}
            >
              <div className="flex-grow mb-2 sm:mb-0">
                {record.areaLancamento && <p><strong className="text-rich-soil">{t('wasteRecordsListComponent.itemArea')}:</strong> {record.areaLancamento}</p>}
                
                <p>
                  <strong className="text-rich-soil">{t('wasteRecordsListComponent.itemType')}:</strong> {record.wasteType}
                  {record.wasteSubType && <span className="text-exotic-plume"> ({record.wasteSubType})</span>}
                </p>
                  {record.empresaColetaNome && (
                    <p><strong className="text-rich-soil">Coletora:</strong> {record.empresaColetaNome}</p>
                  )}
                  {record.destinacaoFinal && (
                    <p><strong className="text-rich-soil">Destinação:</strong> {record.destinacaoFinal}</p>
                  )}
                <p><strong className="text-rich-soil">{t('wasteRecordsListComponent.itemWeight')}:</strong> {record.peso} kg</p>
                <div className="flex items-center space-x-2">
                    <p className="text-xs text-early-frost">{t('wasteRecordsListComponent.itemDate')}: {new Date(record.timestamp).toLocaleString(currentLocale)}</p>
                    {record.isPending && (
                        <div title={t('wasteRecordsListComponent.pendingSync')} className="flex items-center">
                            <ClockIcon />
                        </div>
                    )}
                </div>
              </div>
              
              {canUserDelete && (
                <button
                  onClick={() => onDelete(record)}
                  className="px-3 py-1 bg-apricot-orange text-white text-xs font-lexend rounded-md shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-apricot-orange"
                >
                  {t('wasteRecordsListComponent.deleteButton')}
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
            className="w-full mt-4 px-4 py-2 bg-blue-coral hover:opacity-90 text-white font-lexend text-corpo rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-coral disabled:opacity-50"
          >
            {loadingMore ? t('wasteRecordsListComponent.loadingMoreButton') : t('wasteRecordsListComponent.loadMoreButton')}
          </button>
        </div>
      )}
    </>
  );
}

export default WasteRecordsList;