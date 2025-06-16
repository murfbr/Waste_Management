// src/pages/PaginaLogin.jsx

import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import AuthContext from '../context/AuthContext';
import MessageBox from '../components/app/MessageBox';

export default function PaginaLogin() {
    const { auth, isAuthReady } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    // Determina para onde redirecionar após o login.
    // Se o usuário foi redirecionado para o login de uma página protegida, 'from' terá essa página.
    // Caso contrário, o padrão é a página principal da aplicação, '/app'.
    const from = location.state?.from?.pathname || '/app';

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
            // Redirecionamento CORRIGIDO para a rota principal da aplicação
            navigate(from, { replace: true });
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
        <div className="bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 min-h-full">
            <div className="max-w-md w-full space-y-8">
                <div className="bg-white p-8 rounded-2xl shadow-lg">
                    <div className="text-center">
                        <h2 className="text-3xl font-extrabold text-gray-900">Acessar Sistema</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Bem-vindo de volta!
                        </p>
                    </div>

                    <div className="mt-8">
                        <MessageBox message={message} isError={isError} onClose={() => setMessage('')} />
                    </div>

                    <form onSubmit={handleLogin} className="mt-8 space-y-6">
                        <input type="hidden" name="remember" defaultValue="true" />
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <label htmlFor="email-address" className="sr-only">Email</label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="Endereço de e-mail"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="sr-only">Senha</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="Senha"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                disabled={!isAuthReady || loadingLogin}
                            >
                                {loadingLogin ? 'Entrando...' : 'Entrar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
