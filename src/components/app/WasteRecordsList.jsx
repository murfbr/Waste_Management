// src/components/app/WasteRecordsList.jsx

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-golden-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
  const { t, i18n } = useTranslation('wasteRegister');
  const [exportPeriod, setExportPeriod] = useState('7days');
  const [isExportVisible, setIsExportVisible] = useState(false);

  // --- CORREÇÃO APLICADA AQUI ---
  const localeMap = {
    pt: 'pt-BR',
    en: 'en-GB', // Usando o locale do Reino Unido para manter o formato DD/MM/YYYY
    es: 'es-ES',
  };
  const currentLocale = localeMap[i18n.language] || 'pt-BR';

  const handleExportClick = () => {
    if (onExport) {
      onExport(exportPeriod, clienteNome);
    }
  };

  if (loading && records.length === 0) { 
    return <div className="text-center text-rich-soil py-4 font-comfortaa">{t('wasteRecordsListComponent.loading')}</div>;
  }

  if (!loading && records.length === 0) {
    return <p className="text-center text-rich-soil py-4 font-comfortaa">{t('wasteRecordsListComponent.noRecords')}</p>;
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-early-frost mb-6">
        <button
            onClick={() => setIsExportVisible(!isExportVisible)}
            className="w-full flex justify-between items-center p-4 text-left focus:outline-none"
            aria-expanded={isExportVisible}
        >
            <h3 className="text-lg font-lexend text-rain-forest flex items-center">
                <ExportIcon />
                {t('wasteRecordsListComponent.exportTitle')}
            </h3>
            <span className="text-xl text-exotic-plume transform transition-transform duration-200">
                {isExportVisible ? '▲' : '▼'}
            </span>
        </button>

        {isExportVisible && (
            <div className="p-4 border-t border-early-frost">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div className="flex-grow">
                        <label htmlFor="exportPeriod" className="block text-sm font-comfortaa text-rich-soil mb-1">{t('wasteRecordsListComponent.periodLabel')}</label>
                        <select 
                            id="exportPeriod" 
                            value={exportPeriod}
                            onChange={(e) => setExportPeriod(e.target.value)}
                            className="block w-full p-2 border border-early-frost rounded-md shadow-sm focus:ring-blue-coral focus:border-blue-coral font-comfortaa"
                        >
                            <option value="today">{t('wasteRecordsListComponent.periods.today')}</option>
                            <option value="7days">{t('wasteRecordsListComponent.periods.7days')}</option>
                            <option value="30days">{t('wasteRecordsListComponent.periods.30days')}</option>
                        </select>
                    </div>
                    <div className="flex-shrink-0">
                        <button 
                          onClick={handleExportClick} 
                          disabled={isExporting}
                          className="w-full sm:w-auto px-4 py-2 bg-abundant-green border border-transparent rounded-md shadow-sm text-sm font-lexend text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-abundant-green disabled:opacity-50 flex items-center justify-center"
                        >
                          <ExportIcon />
                          {isExporting ? t('wasteRecordsListComponent.exportingButton') : t('wasteRecordsListComponent.exportButton')}
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>

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