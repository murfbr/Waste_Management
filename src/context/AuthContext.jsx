// src/context/AuthContext.jsx

import React, { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { app, db, auth } from '../firebase/init'; // Supondo que 'app' seja inicializado aqui
import { appId } from '../firebase/config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [loadingAuth, setLoadingAuth] = useState(true);

    useEffect(() => {
        // console.log('DEBUG: AuthProvider - useEffect para onAuthStateChanged EXECUTADO');
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setLoadingAuth(true); // Inicia o carregamento ao detectar mudança no auth
            if (user) {
                setCurrentUser(user);
                // console.log('DEBUG: AuthProvider - Usuário autenticado:', user.uid);

                try {
                    const userProfileRef = doc(db, `artifacts/${appId}/users/${user.uid}`);
                    // console.log('DEBUG: AuthProvider - Tentando buscar perfil em:', userProfileRef.path);
                    const docSnap = await getDoc(userProfileRef);

                    if (docSnap.exists()) {
                        const profileData = docSnap.data();
                        setUserProfile({ id: docSnap.id, ...profileData });
                        console.log('DEBUG: AuthProvider - Perfil do usuário carregado:', { id: docSnap.id, ...profileData });
                    } else {
                        console.warn(`DEBUG: AuthProvider - Perfil NÃO encontrado para UID: ${user.uid} em ${userProfileRef.path}`);
                        setUserProfile(null);
                    }
                } catch (profileError) {
                    console.error('DEBUG: AuthProvider - Erro ao buscar perfil:', profileError);
                    setUserProfile(null);
                }
            } else {
                setCurrentUser(null);
                setUserProfile(null);
                // console.log('DEBUG: AuthProvider - Nenhum usuário logado.');
            }
            setIsAuthReady(true);
            setLoadingAuth(false); // Finaliza o carregamento
        });

        // Função de limpeza para desinscrever o listener quando o componente for desmontado
        return () => {
            // console.log('DEBUG: AuthProvider - useEffect para onAuthStateChanged LIMPO (unsubscribe)');
            unsubscribe();
        };
    }, [auth]); // Dependência: 'auth' - se a instância de auth mudar, o efeito re-executa.

    const contextValue = {
        app, db, auth, currentUser, userProfile, isAuthReady, loadingAuth
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;