// src/context/AuthContext.jsx

import React, { createContext, useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, documentId, orderBy, getDocs } from 'firebase/firestore'; 

// As importações de db e appId estão corretas
import { app, db, auth } from '../firebase/init'; 
import { appId } from '../firebase/config'; 

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [loadingAuth, setLoadingAuth] = useState(true);
    
    const [userAllowedClientes, setUserAllowedClientes] = useState([]);
    const [loadingAllowedClientes, setLoadingAllowedClientes] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setLoadingAuth(true);
            setLoadingAllowedClientes(true);
            
            setCurrentUser(null); 
            setUserProfile(null);
            setUserAllowedClientes([]);

            if (user) {
                setCurrentUser(user); 
                try {
                    const userProfileRef = doc(db, `users/${user.uid}`); 
                    const docSnap = await getDoc(userProfileRef);

                    if (docSnap.exists()) {
                        const newProfileData = { id: docSnap.id, ...docSnap.data() };
                        setUserProfile(newProfileData);

                        let loadedClientes = [];
                        if (newProfileData.role === 'master') {
                            const q = query(collection(db, "clientes"), where("ativo", "==", true), orderBy("nome"));
                            const querySnapshot = await getDocs(q);
                            loadedClientes = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                        } else if (newProfileData.clientesPermitidos && newProfileData.clientesPermitidos.length > 0) {
                            const q = query(collection(db, "clientes"), where(documentId(), "in", newProfileData.clientesPermitidos), where("ativo", "==", true), orderBy("nome"));
                            const querySnapshot = await getDocs(q);
                            loadedClientes = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                        }
                        
                        setUserAllowedClientes(loadedClientes);

                    } else {
                        setUserProfile(null);
                        setUserAllowedClientes([]);
                    }
                } catch (profileError) {
                    console.error('AuthContext: Erro ao buscar perfil ou clientes:', profileError);
                    setUserProfile(null);
                    setUserAllowedClientes([]);
                }
            }
            
            setLoadingAllowedClientes(false); 
            setIsAuthReady(true); 
            setLoadingAuth(false);
        });

        return () => unsubscribe();
    }, []);

    // CORREÇÃO: Adicionando db e appId de volta ao valor do contexto.
    const contextValue = useMemo(() => {
        return {
            db, // <-- Adicionado de volta
            appId, // <-- Adicionado de volta
            currentUser, 
            userProfile, 
            isAuthReady, 
            loadingAuth,
            userAllowedClientes, 
            loadingAllowedClientes
        };
    }, [currentUser, userProfile, isAuthReady, loadingAuth, userAllowedClientes, loadingAllowedClientes]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
