// src/pages/PaginaLogin.jsx

import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import AuthContext from '../context/AuthContext';
import MessageBox from '../components/app/MessageBox';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

export default function PaginaLogin() {
    const { auth, isAuthReady } = useContext(AuthContext);
    const { t } = useTranslation('site');
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/app';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [loadingLogin, setLoadingLogin] = useState(false);

    const { installPrompt, handleInstallClick } = useInstallPrompt();

    const showMessage = (msg, error = false) => {
        setMessage(msg);
        setIsError(error);
        setTimeout(() => setMessage(''), 5000);
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!auth || !isAuthReady) {
            showMessage(t('loginPage.messages.authNotReady'), true);
            return;
        }

        if (!email || !password) {
            showMessage(t('loginPage.messages.fillFields'), true);
            return;
        }

        setLoadingLogin(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate(from, { replace: true });
        } catch (error) {
            console.error('Erro no login:', error);
            let errorMessage = t('loginPage.messages.genericError');
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                errorMessage = t('loginPage.messages.invalidCredentials');
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = t('loginPage.messages.tooManyRequests');
            }
            showMessage(errorMessage, true);
        } finally {
            setLoadingLogin(false);
        }
    };

    const inputStyle = "appearance-none relative block w-full px-3 py-3 border border-early-frost placeholder-gray-500 text-rich-soil focus:outline-none focus:ring-apricot-orange focus:border-apricot-orange focus:z-10 sm:text-sm font-comfortaa";

    return (
        <div className="bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 min-h-full">
            
            <div className="max-w-md w-full space-y-8">
                <div className="bg-white p-8 rounded-2xl shadow-lg">
                    <div className="text-center">
                        <h2 className="font-lexend text-subtitulo text-rain-forest">{t('loginPage.title')}</h2>
                        <p className="mt-2 font-comfortaa text-corpo text-rich-soil">
                            {t('loginPage.welcome')}
                        </p>
                    </div>

                    <div className="mt-8">
                        <MessageBox message={message} isError={isError} onClose={() => setMessage('')} />
                    </div>

                    <form onSubmit={handleLogin} className="mt-8 space-y-6">
                        <input type="hidden" name="remember" defaultValue="true" />
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <label htmlFor="email-address" className="sr-only">{t('loginPage.form.emailLabel')}</label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className={`${inputStyle} rounded-t-md`}
                                    placeholder={t('loginPage.form.emailPlaceholder')}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="sr-only">{t('loginPage.form.passwordLabel')}</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className={`${inputStyle} rounded-b-md`}
                                    placeholder={t('loginPage.form.passwordPlaceholder')}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-md text-white bg-apricot-orange hover:bg-golden-orange focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-apricot-orange disabled:bg-early-frost disabled:cursor-not-allowed font-lexend"
                                disabled={!isAuthReady || loadingLogin}
                            >
                                {loadingLogin ? t('loginPage.form.submittingButton') : t('loginPage.form.submitButton')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {installPrompt && (
                <div className="max-w-md w-full text-center mt-8 bg-white p-6 rounded-2xl shadow-lg">
                    <p className="font-comfortaa text-sm text-rich-soil">
                        {t('loginPage.pwa.installPrompt')}
                    </p>
                    <button
                        onClick={handleInstallClick}
                        className="mt-4 w-full sm:w-auto inline-flex justify-center py-2 px-6 border border-transparent text-sm font-medium rounded-md text-white bg-rain-forest hover:bg-abundant-green focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rain-forest font-lexend"
                    >
                        {t('loginPage.pwa.installButton')}
                    </button>
                </div>
            )}
        </div>
    );
}