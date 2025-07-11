// src/components/app/SyncStatusIndicator.jsx

import React, { useContext } from 'react';
import AuthContext from '../../context/AuthContext';

// Ícone de Nuvem Sincronizada (Verde)
const CloudUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 11v6m0 0l-3-3m3 3l3-3" />
  </svg>
);

// Ícone de Nuvem com Alerta (Amarelo)
const CloudAlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
  </svg>
);

// Ícone de Sem Sinal (Vermelho)
const NoSignalIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m-12.728 0a9 9 0 010-12.728m12.728 0L5.636 18.364" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m-7.072 0a5 5 0 010-7.072m7.072 0l-7.072 7.072" />
    </svg>
);

export default function SyncStatusIndicator() {
  const { isOnline, pendingRecordsCount } = useContext(AuthContext);

  if (!isOnline) {
    return (
      <div className="flex items-center text-red-500" title="Você está offline. Os lançamentos estão sendo salvos localmente.">
        <NoSignalIcon />
      </div>
    );
  }

  if (pendingRecordsCount > 0) {
    return (
      <div className="relative flex items-center text-yellow-500 animate-pulse" title={`${pendingRecordsCount} lançamento(s) pendente(s) para sincronizar.`}>
        <CloudAlertIcon />
        <div className="absolute -top-1 -right-2 bg-yellow-400 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
          {pendingRecordsCount}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center text-green-500" title="Todos os lançamentos estão sincronizados.">
      <CloudUpIcon />
    </div>
  );
}