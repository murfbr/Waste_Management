// src/context/AuthContext.jsx

import React, { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { app, db, auth } from '../firebase/init'; 
import { appId } from '../firebase/config'; // Importa o appId aqui no topo

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [loadingAuth, setLoadingAuth] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setLoadingAuth(true); 
            if (user) {
                setCurrentUser(user);
                console.log('DEBUG: AuthContext - Utilizador autenticado UID:', user.uid);

                try {
                    const userProfileRef = doc(db, `users/${user.uid}`); 
                    console.log('DEBUG: AuthContext - Tentando buscar perfil em:', userProfileRef.path);
                    const docSnap = await getDoc(userProfileRef);

                    if (docSnap.exists()) {
                        const profileData = docSnap.data();
                        setUserProfile({ id: docSnap.id, ...profileData });
                        console.log('DEBUG: AuthContext - Perfil do utilizador carregado de /users:', { id: docSnap.id, ...profileData });
                    } else {
                        console.warn(`DEBUG: AuthContext - Perfil NÃO encontrado em /users para UID: ${user.uid}`);
                        setUserProfile(null);
                    }
                } catch (profileError) {
                    console.error('DEBUG: AuthContext - Erro ao buscar perfil em /users:', profileError);
                    setUserProfile(null);
                }
            } else {
                setCurrentUser(null);
                setUserProfile(null);
                console.log('DEBUG: AuthContext - Nenhum utilizador logado.');
            }
            setIsAuthReady(true);
            setLoadingAuth(false);
        });

        return () => {
            unsubscribe();
        };
    }, [auth, db]);

    // appId é importado no topo do ficheiro e já está no escopo aqui.
    const contextValue = {
        app, 
        db, 
        auth, 
        currentUser, 
        userProfile, 
        isAuthReady, 
        loadingAuth,
        appId // appId (importado no topo) é incluído no contexto
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
