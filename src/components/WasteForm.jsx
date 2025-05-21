// src/components/WasteForm.jsx

import React, { useState } from 'react';
import MessageBox from './MessageBox'; // Importa o componente MessageBox

/**
 * Componente para o formulário de registro de resíduos.
 *
 * @param {object} props - As propriedades do componente.
 * @param {function} props.onAddWaste - Função de callback para adicionar um novo registro de resíduo.
 */
function WasteForm({ onAddWaste }) {
    // Estados locais para os campos do formulário
    const [area, setArea] = useState('');
    const [wasteType, setWasteType] = useState('');
    const [weight, setWeight] = useState('');
    // Estados para a mensagem de feedback do formulário
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    // Listas predefinidas das áreas do hotel e tipos de resíduos
    const areas = [
        "Cozinha",
        "Lavanderia",
        "Quartos",
        "Restaurante",
        "Eventos",
        "Manutenção",
        "Escritório",
        "Outros"
    ];

    const wasteTypes = [
        "Reciclável",
        "Não Reciclável",
        "Rejeito"
    ];

    /**
     * Função interna para exibir mensagens de sucesso ou erro.
     * @param {string} msg - A mensagem a ser exibida.
     * @param {boolean} error - True se a mensagem for de erro, false para sucesso.
     */
    const showMessage = (msg, error = false) => {
        setMessage(msg);
        setIsError(error);
        setTimeout(() => setMessage(''), 5000); // Esconde a mensagem após 5 segundos
    };

    /**
     * Lida com o envio do formulário de registro de resíduos.
     * @param {Event} e - O evento de envio do formulário.
     */
    const handleSubmit = async (e) => {
        e.preventDefault(); // Previne o comportamento padrão de recarregar a página

        const parsedWeight = parseFloat(weight);

        // Validação dos campos
        if (!area || !wasteType || isNaN(parsedWeight) || parsedWeight <= 0) {
            showMessage('Por favor, preencha todos os campos corretamente.', true);
            return;
        }

        // Chama a função onAddWaste (passada como prop do componente pai)
        // e espera pelo resultado para saber se o registro foi bem-sucedido.
        const success = await onAddWaste({ area, wasteType, weight: parsedWeight });

        if (success) {
            // Limpa o formulário apenas se o registro foi bem-sucedido no Firebase
            setArea('');
            setWasteType('');
            setWeight('');
        }
        // A mensagem de sucesso/erro é tratada diretamente pela função onAddWaste no componente pai
        // e repassada para o MessageBox via props.
    };

    return (
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-50 rounded-lg shadow-inner">
            {/* Componente de Mensagens para feedback do formulário */}
            <MessageBox message={message} isError={isError} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="form-group">
                    <label htmlFor="area">Área do Hotel:</label>
                    <select
                        id="area"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        required
                    >
                        <option value="">Selecione uma área</option>
                        {areas.map((a) => (
                            <option key={a} value={a}>{a}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="wasteType">Tipo de Resíduo:</label>
                    <select
                        id="wasteType"
                        value={wasteType}
                        onChange={(e) => setWasteType(e.target.value)}
                        required
                    >
                        <option value="">Selecione o tipo</option>
                        {wasteTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="form-group mb-6">
                <label htmlFor="weight">Peso Total (kg):</label>
                <input
                    type="number"
                    id="weight"
                    step="0.01"
                    min="0"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    required
                    placeholder="Ex: 10.50"
                />
            </div>

            <button type="submit" className="btn-primary w-full">Registrar Resíduo</button>
        </form>
    );
}

export default WasteForm;