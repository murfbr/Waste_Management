// src/components/Login.jsx

import React, { useState, useContext } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth'; // Importa a função de login com e-mail e senha
import AuthContext from '../context/AuthContext'; // Importa o AuthContext
import MessageBox from './MessageBox'; // Importa o componente MessageBox

/**
 * Componente para a tela de login do aplicativo.
 * Agora suporta login com e-mail e senha.
 */
function Login() {
    // Usa o contexto para acessar a instância de autenticação do Firebase e o estado de prontidão.
    const { auth, isAuthReady } = useContext(AuthContext);
    // Estados locais para e-mail, senha, mensagem de feedback e se é um erro.
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [loadingLogin, setLoadingLogin] = useState(false); // Novo estado para indicar carregamento do login

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
     * Lida com o processo de login com e-mail e senha.
     * @param {Event} e - O evento de envio do formulário.
     */
    const handleLogin = async (e) => {
        e.preventDefault(); // Previne o recarregamento da página ao enviar o formulário

        if (!auth || !isAuthReady) {
            showMessage('Serviços de autenticação não prontos. Tente novamente.', true);
            return;
        }

        if (!email || !password) {
            showMessage('Por favor, preencha o e-mail e a senha.', true);
            return;
        }

        setLoadingLogin(true); // Inicia o estado de carregamento
        try {
            // Tenta realizar o login com e-mail e senha usando a instância 'auth' do Firebase.
            await signInWithEmailAndPassword(auth, email, password);
            showMessage('Login realizado com sucesso!');
            // O AuthContext.Provider detectará a mudança de usuário e redirecionará.
        } catch (error) {
            console.error('Erro no login:', error);
            let errorMessage = 'Erro ao fazer login. Verifique suas credenciais.';
            // Mensagens de erro mais específicas do Firebase
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                errorMessage = 'E-mail ou senha inválidos.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Muitas tentativas de login. Tente novamente mais tarde.';
            }
            showMessage(errorMessage, true);
        } finally {
            setLoadingLogin(false); // Finaliza o estado de carregamento
        }
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Bem-vindo ao Controle de Resíduos</h2>
            <p className="text-gray-600 mb-6">
                Faça login para acessar o aplicativo.
            </p>

            {/* Renderiza o componente MessageBox se houver uma mensagem */}
            <MessageBox message={message} isError={isError} />

            <form onSubmit={handleLogin} className="space-y-4">
                <div className="form-group">
                    <label htmlFor="email">E-mail:</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="seu.email@exemplo.com"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Senha:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="Sua senha"
                    />
                </div>
                <button
                    type="submit"
                    className="btn-primary w-full"
                    disabled={!isAuthReady || loadingLogin} // Desabilita o botão durante o carregamento ou se a autenticação não estiver pronta
                >
                    {loadingLogin ? 'Entrando...' : 'Entrar'}
                </button>
            </form>

            <div className="mt-6 text-gray-600 text-sm">
                <p>Não tem uma conta? Entre em contato com o administrador para criar uma.</p>
                {/* Futuramente, um botão ou link para a tela de registro de usuários */}
                {/* <button className="text-blue-600 hover:underline mt-2">Registrar-se</button> */}
            </div>
        </div>
    );
}

export default Login;