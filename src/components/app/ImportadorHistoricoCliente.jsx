import React, { useState, useContext } from 'react';
import { writeBatch, collection, doc, serverTimestamp } from 'firebase/firestore';
import Papa from 'papaparse';
import AuthContext from '../../context/AuthContext';

export default function ImportadorHistoricoCliente({ cliente, isOpen, onClose, onImportSuccess }) {
  const { db, appId, currentUser } = useContext(AuthContext);

  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const [processedRows, setProcessedRows] = useState(0);

  const handleFileChange = (event) => {
    setImportFile(event.target.files[0]);
    setImportErrors([]);
    setProcessedRows(0);
  };

  const handleClose = () => {
    setImportFile(null);
    setIsImporting(false);
    setImportErrors([]);
    setProcessedRows(0);
    onClose();
  };

  const processAndImportCSV = async () => {
    if (!importFile || !cliente || !db || !currentUser) {
      setImportErrors([{ message: "Selecione um cliente e um arquivo, ou permissão negada." }]);
      return;
    }

    setIsImporting(true);
    setImportErrors([]);
    setProcessedRows(0);

    Papa.parse(importFile, {
      header: true,
      skipEmptyLines: true,
      delimiter: ";", // Adicionado para processar CSVs com ponto e vírgula
      encoding: "ISO-8859-1", // Adicionado para corrigir problemas de acentuação
      complete: async (results) => {
        const { data, errors: parseErrors } = results;
        let localErrors = [];
        let validRecords = [];

        if (parseErrors.length > 0) {
          parseErrors.forEach(err => localErrors.push({ row: err.row, message: `Erro de formatação CSV: ${err.message}` }));
        }

        data.forEach((row, index) => {
          const rowIndex = index + 2;
          const { Data, Area, TipoResiduo, Peso } = row;

          if (!Data || !Area || !TipoResiduo || !Peso) {
            localErrors.push({ row: rowIndex, message: `Dados obrigatórios (Data, Area, TipoResiduo, Peso) em falta.` });
            return;
          }
          const pesoNum = parseFloat(String(Peso).replace(',', '.'));
          if (isNaN(pesoNum) || pesoNum <= 0) {
            localErrors.push({ row: rowIndex, message: `Peso inválido: "${Peso}".` });
            return;
          }
          let timestamp;
          if (String(Data).includes('/')) {
            const p = String(Data).split('/');
            if (p.length === 3) timestamp = new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0])).getTime();
          } else if (String(Data).includes('-')) {
            timestamp = new Date(Data).getTime();
          }
          if (isNaN(timestamp)) {
            localErrors.push({ row: rowIndex, message: `Formato de data inválido: "${Data}". Use DD/MM/AAAA.` });
            return;
          }
          if (cliente.areasPersonalizadas && !cliente.areasPersonalizadas.includes(Area)) {
            localErrors.push({ row: rowIndex, message: `Área "${Area}" não está configurada para este cliente.` });
            return;
          }
          const allowedWasteTypes = [...(cliente.categoriasPrincipaisResiduo || [])];
          if (cliente.fazSeparacaoReciclaveisCompleta) allowedWasteTypes.push(...(cliente.tiposReciclaveisPersonalizados || []));
          if (cliente.fazSeparacaoOrganicosCompleta) allowedWasteTypes.push(...(cliente.tiposOrganicosPersonalizados || []));
          if (!allowedWasteTypes.includes(TipoResiduo)) {
            localErrors.push({ row: rowIndex, message: `Tipo de resíduo "${TipoResiduo}" não é válido para este cliente.` });
            return;
          }
          validRecords.push({
            clienteId: cliente.id, areaLancamento: Area, wasteType: TipoResiduo, peso: pesoNum, timestamp: timestamp,
            userId: currentUser.uid, userEmail: currentUser.email, importadoEm: serverTimestamp(), appId: appId || 'default-app-id',
          });
        });
        
        setProcessedRows(data.length);
        setImportErrors(localErrors);

        if (localErrors.length > 0) {
          setIsImporting(false);
          return;
        }
        if (validRecords.length === 0) {
          setImportErrors([{ message: "Nenhum registo válido encontrado no ficheiro CSV." }]);
          setIsImporting(false);
          return;
        }

        try {
          const batch = writeBatch(db);
          const recordsCollection = collection(db, `artifacts/${appId}/public/data/wasteRecords`);
          validRecords.forEach(record => {
            const newRecordRef = doc(recordsCollection);
            batch.set(newRecordRef, record);
          });
          await batch.commit();
          onImportSuccess(`${validRecords.length} registos importados com sucesso para ${cliente.nome}!`);
          handleClose();
        } catch (error) {
          console.error("Erro ao salvar registos importados:", error);
          setImportErrors([{ message: `Erro ao salvar no banco de dados: ${error.message}` }]);
          setIsImporting(false);
        }
      },
      error: (error) => {
        console.error("Erro ao processar CSV:", error);
        setImportErrors([{ message: `Erro crítico ao ler o ficheiro CSV: ${error.message}` }]);
        setIsImporting(false);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-2xl space-y-4 font-comfortaa">
        <h2 className="text-2xl font-semibold text-blue-coral font-lexend">Importar Histórico para: <span className="text-apricot-orange">{cliente?.nome}</span></h2>
        
        <div className="text-sm text-gray-700 space-y-1 bg-gray-50 p-3 rounded-md border">
            <p className="font-bold">Instruções para o ficheiro CSV:</p>
            <ul className="list-disc list-inside pl-4">
            <li>O arquivo deve usar <strong>ponto e vírgula (;)</strong> como separador.</li>
            <li>A primeira linha deve ser o cabeçalho com os nomes exatos das colunas.</li>
            <li>Colunas obrigatórias: <strong>Data</strong>, <strong>Area</strong>, <strong>TipoResiduo</strong>, <strong>Peso</strong>.</li>
            <li>Formato da <strong>Data</strong>: DD/MM/YYYY.</li>
            <li><strong>Area</strong> e <strong>TipoResiduo</strong> devem corresponder aos valores configurados.</li>
            <li><strong>Peso</strong>: Use ponto ou vírgula como separador decimal (ex: 10.5 ou 10,5).</li>
            </ul>
        </div>

        <div>
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-coral hover:file:bg-blue-100"
          />
        </div>

        {importErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-md mt-4 max-h-48 overflow-y-auto">
            <h4 className="font-bold text-red-800 font-lexend">Erros na Validação:</h4>
            <ul className="list-disc list-inside text-sm text-red-700 mt-2">
              {importErrors.map((error, index) => (
                <li key={index}>
                  {error.row && <strong>Linha {error.row}: </strong>}
                  {error.message}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex justify-end space-x-3 pt-2">
            <button 
                onClick={handleClose}
                className="px-4 py-2 bg-white border border-early-frost rounded-md shadow-sm text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
                Cancelar
            </button>
            <button 
                onClick={processAndImportCSV} 
                disabled={!importFile || isImporting}
                className="px-4 py-2 bg-apricot-orange border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isImporting ? "Importando..." : "Validar e Importar"}
            </button>
        </div>
      </div>
    </div>
  );
}


