// src/components/WasteForm.jsx

import React, { useState } from 'react';
import MessageBox from './MessageBox'; // Importa o componente MessageBox

// Ícones de exemplo (opcional, pode instalar react-icons: npm install react-icons)
// import { FaTrashAlt, FaRecycle, FaBan } from 'react-icons/fa';

/**
 * Componente para o formulário de registo de resíduos.
 *
 * @param {object} props - As propriedades do componente.
 * @param {function} props.onAddWaste - Função de callback para adicionar um novo registo de resíduo.
 */
function WasteForm({ onAddWaste }) {
    // Estados locais para os campos do formulário
    const [area, setArea] = useState('');
    const [selectedWasteType, setSelectedWasteType] = useState('');
    const [weight, setWeight] = useState('');
    // Estados para a mensagem de feedback do formulário
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const areas = [
        "Cozinha", "Lavanderia", "Quartos", "Restaurante"
    ];

    const wasteTypeOptions = [
        { label: "Reciclável", value: "Reciclável", icon: null /* <FaRecycle className="mr-2" /> */ },
        { label: "Não Reciclável", value: "Não Reciclável", icon: null /* <FaTrashAlt className="mr-2" /> */ },
        { label: "Rejeito", value: "Rejeito", icon: null /* <FaBan className="mr-2" /> */ }
    ];

    const showMessage = (msg, error = false) => {
        setMessage(msg);
        setIsError(error);
        setTimeout(() => setMessage(''), 5000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Substitui vírgula por ponto para o parseFloat, se o utilizador digitar com vírgula
        const weightString = String(weight).replace(',', '.');
        const parsedWeight = parseFloat(weightString);

        if (!selectedWasteType) {
            showMessage('Por favor, selecione um tipo de resíduo.', true);
            return;
        }
        if (!area) {
            showMessage('Por favor, selecione uma área do hotel.', true);
            return;
        }
        if (isNaN(parsedWeight) || parsedWeight <= 0) {
            showMessage('Por favor, insira um peso válido.', true);
            return;
        }

        setSubmitting(true);
        const success = await onAddWaste({ area, wasteType: selectedWasteType, weight: parsedWeight });

        if (success) {
            setArea('');
            setSelectedWasteType('');
            setWeight('');
        }
        setSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8"> {/* Aumentado o space-y geral */}
            <MessageBox message={message} isError={isError} />

            {/* Campo de Peso (Destacado no topo) */}
            <div className="form-group"> {/* Removido text-center daqui */}
                <label htmlFor="weight" className="sr-only">Peso Total (kg):</label>
                <div className="flex items-baseline justify-center"> {/* Flex para alinhar input e "kg" */}
                    <input
                        type="text" // Alterado para text para melhor controlo da vírgula e formatação
                        inputMode="decimal" // Ajuda em teclados móveis
                        id="weight"
                        value={weight}
                        onChange={(e) => {
                            // Permite apenas números, ponto e vírgula. Substitui vírgula por ponto internamente se necessário.
                            const val = e.target.value;
                            if (/^[0-9]*[.,]?[0-9]{0,2}$/.test(val) || val === "") {
                                setWeight(val);
                            }
                        }}
                        required
                        placeholder="0,00"
                        // Ajustado padding, max-width e removido w-full para centralização via flex
                        className="w-auto max-w-[200px] p-2 border-2 border-gray-300 rounded-xl text-7xl font-bold text-center text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                    />
                    <span className="text-4xl font-semibold text-gray-600 ml-2">kg</span>
                </div>
            </div>

            {/* Botões para Tipo de Resíduo */}
            <div className="form-group">
                <label className="block text-lg font-medium text-gray-700 mb-3 text-center">Tipo de Resíduo</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto"> {/* max-w-lg e mx-auto para centralizar os botões */}
                    {wasteTypeOptions.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => setSelectedWasteType(option.value)}
                            className={`
                                flex items-center justify-center w-full p-3 border-2 rounded-xl 
                                text-base font-semibold transition-all duration-150 ease-in-out
                                focus:outline-none focus:ring-2 focus:ring-offset-2
                                ${selectedWasteType === option.value
                                    ? 'bg-indigo-600 text-white border-indigo-600 ring-indigo-500 shadow-lg' // Estilo selecionado
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400' // Estilo padrão
                                }
                            `}
                        >
                            {option.icon}
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Dropdown para Área do Hotel */}
            <div className="form-group max-w-lg mx-auto"> {/* max-w-lg e mx-auto para centralizar */}
                <label htmlFor="area" className="block text-lg font-medium text-gray-700 mb-2 text-center">Área do Hotel</label>
                <select
                    id="area"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    required
                    className="w-full p-3 border-2 border-gray-300 rounded-xl bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option value="">Selecione uma área</option>
                    {areas.map((a) => (
                        <option key={a} value={a}>{a}</option>
                    ))}
                </select>
            </div>

            {/* Botão de Submissão */}
            <div className="flex justify-center pt-2"> {/* Div para centralizar o botão */}
                <button 
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white text-xl font-bold py-3 px-10 rounded-xl shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70" // Ajustado padding e removido w-full
                    disabled={submitting}
                >
                    {submitting ? 'A Registar...' : 'Registar Pesagem'}
                </button>
            </div>
        </form>
    );
}

export default WasteForm;
