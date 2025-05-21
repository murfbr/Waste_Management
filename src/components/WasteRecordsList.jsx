// src/components/WasteRecordsList.jsx

import React from 'react';
import { exportToCsv } from '../utils/csvExport'; // Importa a função de exportação CSV
import MessageBox from './MessageBox'; // Importa o componente MessageBox

/**
 * Componente para exibir a lista de registros de resíduos.
 *
 * @param {object} props - As propriedades do componente.
 * @param {Array} props.records - Um array de objetos de registro de resíduos.
 * @param {boolean} props.loading - True se os registros estiverem sendo carregados.
 * @param {function} props.onDelete - Função de callback para excluir um registro.
 * @param {function} props.showMessage - Função para exibir mensagens na UI (sucesso/erro).
 */
function WasteRecordsList({ records, loading, onDelete, showMessage }) {

    /**
     * Lida com o clique no botão de exportar para CSV.
     */
    const handleExportClick = () => {
        // Chama a função utilitária de exportação, passando os registros e a função showMessage.
        exportToCsv(records, showMessage);
    };

    return (
        <>
            {/* Botão para exportar dados para CSV */}
            <button onClick={handleExportClick} className="btn-export w-full mb-4">
                Exportar para CSV
            </button>

            {/* Indicador de carregamento */}
            {loading ? (
                <div className="text-center text-gray-500 mb-4">Carregando registros...</div>
            ) : records.length === 0 ? (
                // Mensagem se não houver registros
                <p className="text-center text-gray-500">Nenhum registro encontrado.</p>
            ) : (
                // Lista de registros
                <div className="space-y-4">
                    {records.map((record) => (
                        <div key={record.id} className="record-item">
                            <p><strong>Área:</strong> {record.area}</p>
                            <p><strong>Tipo:</strong> {record.wasteType}</p>
                            <p><strong>Peso:</strong> {record.weight} kg</p>
                            <p><span>Data: {new Date(record.timestamp).toLocaleString('pt-BR')}</span></p>
                            <button
                                onClick={() => onDelete(record.id)} // Chama a função onDelete passada como prop
                                className="delete-btn"
                            >
                                Excluir
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}

export default WasteRecordsList;