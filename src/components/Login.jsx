// src/components/Login.jsx

import React, { useState, useContext } from 'react';
import { signInAnonymously } from 'firebase/auth'; // Importa apenas a função de login anônimo
import AuthContext from '../context/AuthContext'; // Importa o AuthContext (CORRIGIDO: sem chaves)
import MessageBox from './MessageBox'; // Importa o componente MessageBox

/**
 * Componente para a tela de login do aplicativo.
 * Atualmente, suporta apenas login anônimo.
 */
function Login() {
    // Usa o contexto para acessar a instância de autenticação do Firebase e o estado de prontidão.
    const { auth, isAuthReady } = useContext(AuthContext);
    // Estados locais para a mensagem de feedback e se é um erro.
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

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
     * Lida com o processo de login anônimo.
     */
    const handleAnonymousLogin = async () => {
        // Verifica se o serviço de autenticação está disponível e pronto.
        if (!auth || !isAuthReady) {
            showMessage('Serviços de autenticação não prontos. Tente novamente.', true);
            return;
        }
        try {
            // Tenta realizar o login anônimo usando a instância 'auth' do Firebase.
            await signInAnonymously(auth);
            showMessage('Login anônimo realizado com sucesso!');
        } catch (error) {
            // Em caso de erro, exibe a mensagem de erro.
            console.error('Erro no login anônimo:', error);
            showMessage(`Erro no login anônimo: ${error.message}`, true);
        }
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Bem-vindo ao Controle de Resíduos</h2>
            <p className="text-gray-600 mb-6">
                Para continuar, faça login. Atualmente, apenas o login anônimo está disponível.
                Futuramente, você poderá adicionar opções de login para clientes.
            </p>
            {/* Renderiza o componente MessageBox se houver uma mensagem */}
            <MessageBox message={message} isError={isError} />
            <button
                onClick={handleAnonymousLogin}
                className="btn-primary w-full"
                disabled={!isAuthReady} // Desabilita o botão se a autenticação não estiver pronta
            >
                Entrar como Anônimo
            </button>
            {/* Placeholder para futuras opções de login (comentado) */}
            <div className="mt-4 text-gray-500 text-sm">
                {/* <p>Ou faça login com e-mail e senha (futuramente)</p> */}
            </div>
        </div>
    );
}

export default Login;