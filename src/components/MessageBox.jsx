// src/components/MessageBox.jsx

import React from 'react';

/**
 * Componente reutilizável para exibir mensagens de sucesso ou erro.
 *
 * @param {object} props - As propriedades do componente.
 * @param {string} props.message - A mensagem a ser exibida.
 * @param {boolean} props.isError - True se a mensagem for de erro, false para sucesso.
 */
function MessageBox({ message, isError }) {
    // Se não houver mensagem, o componente não renderiza nada.
    if (!message) {
        return null;
    }

    // Define as classes CSS dinamicamente com base no tipo de mensagem (erro ou sucesso).
    const classes = `message-box ${isError ? 'error' : ''} mb-4`;

    return (
        <div className={classes}>
            {message}
        </div>
    );
}

export default MessageBox;