import React, { useState, useContext } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import AuthContext from '../../context/AuthContext.jsx';
import { exportarParaAuditoriaCSV } from '../../utils/relatorioCsvExport.js';

export default function ExportarHistoricoCliente({ cliente, isOpen, onClose, empresasColeta }) {
  // Pega também o appId do contexto, que é fundamental para o caminho da coleção
  const { db, appId } = useContext(AuthContext);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState('');

  const handleClose = () => {
    setStartDate('');
    setEndDate('');
    setIsExporting(false);
    setMessage('');
    onClose();
  };
  
  const handleExport = async () => {
    if (!startDate || !endDate) {
      setMessage("Por favor, selecione a data de início e de fim.");
      return;
    }
    
    setIsExporting(true);
    setMessage('Buscando lançamentos...');

    try {
      const startTimestamp = new Date(startDate + 'T00:00:00').getTime();
      const endTimestamp = new Date(endDate + 'T23:59:59').getTime();

      // CORREÇÃO: Constrói o caminho completo para a subcoleção de registros
      const recordsCollectionPath = `artifacts/${appId}/public/data/wasteRecords`;

      const q = query(
        collection(db, recordsCollectionPath),
        where("clienteId", "==", cliente.id),
        where("timestamp", ">=", startTimestamp),
        where("timestamp", "<=", endTimestamp),
        orderBy("timestamp", "asc")
      );

      const querySnapshot = await getDocs(q);
      const lancamentos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (lancamentos.length === 0) {
        setMessage('Nenhum lançamento encontrado para o período selecionado.');
        setIsExporting(false);
        return;
      }
      
      setMessage(`Exportando ${lancamentos.length} registros...`);

      const empresasMap = new Map((empresasColeta || []).map((e) => [e.id, e.nomeFantasia]));

      exportarParaAuditoriaCSV(lancamentos, empresasMap, cliente);
      
      handleClose();

    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      setMessage(`Erro ao exportar: ${error.message}`);
      setIsExporting(false);
    }
  };


  if (!isOpen || !cliente) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 font-comfortaa">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg space-y-4">
        <h2 className="text-xl font-semibold font-lexend text-blue-coral">
          Exportar Lançamentos de: <span className="font-bold">{cliente.nome}</span>
        </h2>
        
        <div className="text-sm text-gray-600 space-y-1">
            <p>Selecione o período desejado para exportar os lançamentos em formato CSV.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Data de Início</label>
                <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>
            <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Data de Fim</label>
                <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>
        </div>

        {message && (
            <div className={`p-3 rounded-md text-sm ${message.startsWith('Erro') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                {message}
            </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
            <button 
                onClick={handleClose}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
                Cancelar
            </button>
            <button 
                onClick={handleExport} 
                disabled={!startDate || !endDate || isExporting}
                className="px-4 py-2 bg-apricot-orange border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isExporting ? "Exportando..." : "Exportar para CSV"}
            </button>
        </div>
      </div>
    </div>
  );
}
