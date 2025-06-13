// src/components/Login.jsx

import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom'; // Importa useNavigate para redirecionamento
import { signInWithEmailAndPassword } from 'firebase/auth';
import AuthContext from '../context/AuthContext';
import MessageBox from '../components/app/MessageBox';

/**
 * Componente para a tela de login do aplicativo.
 */
function Login() {
    const { auth, isAuthReady } = useContext(AuthContext);
    const navigate = useNavigate(); // Inicializa o hook useNavigate

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [loadingLogin, setLoadingLogin] = useState(false);

    const showMessage = (msg, error = false) => {
        setMessage(msg);
        setIsError(error);
        setTimeout(() => setMessage(''), 5000);
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!auth || !isAuthReady) {
            showMessage('Serviços de autenticação não prontos. Tente novamente.', true);
            return;
        }

        if (!email || !password) {
            showMessage('Por favor, preencha o e-mail e a senha.', true);
            return;
        }

        setLoadingLogin(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Não é necessário showMessage aqui, pois o redirecionamento indicará o sucesso.
            // showMessage('Login realizado com sucesso!'); 
            
            // Redireciona para a página principal após o login bem-sucedido
            // A rota '/lancamento' é a nossa rota "index" para utilizadores logados.
            navigate('/lancamento', { replace: true }); 
        } catch (error) {
            console.error('Erro no login:', error);
            let errorMessage = 'Erro ao fazer login. Verifique suas credenciais.';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                errorMessage = 'E-mail ou senha inválidos.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Muitas tentativas de login. Tente novamente mais tarde.';
            }
            showMessage(errorMessage, true);
        } finally {
            setLoadingLogin(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Bem-vindo ao Controle de Resíduos</h2>
            <p className="text-gray-600 mb-6">
                Faça login para acessar o aplicativo.
            </p>

            <MessageBox message={message} isError={isError} />

            <form onSubmit={handleLogin} className="space-y-4">
                <div className="form-group">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 text-left mb-1">E-mail:</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="seu.email@exemplo.com"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 text-left mb-1">Senha:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Sua senha"
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out disabled:opacity-50"
                    disabled={!isAuthReady || loadingLogin}
                >
                    {loadingLogin ? 'Entrando...' : 'Entrar'}
                </button>
            </form>

            <div className="mt-6 text-gray-600 text-sm">
                <p>Não tem uma conta? Entre em contato com o administrador para criar uma.</p>
            </div>
        </div>
    );
}

export default Login;
