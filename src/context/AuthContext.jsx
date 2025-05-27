// src/context/AuthContext.jsx

import React, { createContext, useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, documentId, orderBy, getDocs } from 'firebase/firestore'; // Adicionado getDocs, etc.

import { app, db, auth } from '../firebase/init'; 
import { appId } from '../firebase/config'; 

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [loadingAuth, setLoadingAuth] = useState(true);
    
    const [userAllowedClientes, setUserAllowedClientes] = useState([]);
    const [loadingAllowedClientes, setLoadingAllowedClientes] = useState(true); // Inicia como true


    useEffect(() => {
        console.log("AUTH_CONTEXT: Listener onAuthStateChanged configurado.");
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log("AUTH_CONTEXT: Estado de autenticação mudou. Utilizador:", user ? user.uid : null);
            setLoadingAuth(true);
            setLoadingAllowedClientes(true);
            
            // Limpa estados anteriores para evitar dados inconsistentes durante o carregamento
            setCurrentUser(null); 
            setUserProfile(null);
            setUserAllowedClientes([]);

            if (user) {
                // Define currentUser imediatamente
                setCurrentUser(user); 
                try {
                    const userProfileRef = doc(db, `users/${user.uid}`); 
                    const docSnap = await getDoc(userProfileRef);

                    if (docSnap.exists()) {
                        const newProfileData = { id: docSnap.id, ...docSnap.data() };
                        setUserProfile(currentProfile => {
                            const changed = JSON.stringify(currentProfile) !== JSON.stringify(newProfileData);
                            if(changed) console.log('AUTH_CONTEXT: Perfil do utilizador atualizado:', newProfileData);
                            return changed ? newProfileData : currentProfile;
                        });

                        // Carregar os OBJETOS de cliente permitidos
                        let loadedClientes = [];
                        if (newProfileData.role === 'master') {
                            const q = query(collection(db, "clientes"), where("ativo", "==", true), orderBy("nome"));
                            const querySnapshot = await getDocs(q);
                            loadedClientes = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                            console.log("AUTH_CONTEXT: Master - Todos clientes carregados:", loadedClientes.length);
                        } else if (newProfileData.clientesPermitidos && newProfileData.clientesPermitidos.length > 0) {
                            // Para queries 'in' com mais de 10 itens, pode precisar de múltiplas queries ou reestruturação.
                            // Assumindo que clientesPermitidos não excederá o limite do Firestore para 'in' (atualmente 30).
                            const q = query(collection(db, "clientes"), where(documentId(), "in", newProfileData.clientesPermitidos), where("ativo", "==", true), orderBy("nome"));
                            const querySnapshot = await getDocs(q);
                            loadedClientes = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                            console.log("AUTH_CONTEXT: Clientes permitidos carregados:", loadedClientes.length);
                        } else {
                            console.log("AUTH_CONTEXT: Nenhum cliente permitido para este utilizador ou perfil não é master.");
                        }
                        
                        setUserAllowedClientes(currentAllowed => {
                            const changed = JSON.stringify(currentAllowed) !== JSON.stringify(loadedClientes);
                            if(changed) console.log("AUTH_CONTEXT: userAllowedClientes atualizado. Quantidade:", loadedClientes.length);
                            return changed ? loadedClientes : currentAllowed;
                        });

                    } else {
                        console.warn(`AUTH_CONTEXT: Perfil NÃO encontrado em /users para UID: ${user.uid}`);
                        setUserProfile(null); // Garante que é null
                        setUserAllowedClientes([]); // Garante que é array vazio
                    }
                } catch (profileError) {
                    console.error('AUTH_CONTEXT: Erro ao buscar perfil ou clientes permitidos:', profileError);
                    setUserProfile(null);
                    setUserAllowedClientes([]);
                }
            } else {
                // Nenhum utilizador logado
                setCurrentUser(null); // Já definido acima, mas para clareza
                setUserProfile(null);
                setUserAllowedClientes([]);
                console.log('AUTH_CONTEXT: Nenhum utilizador logado.');
            }
            setLoadingAllowedClientes(false); 
            setIsAuthReady(true); 
            setLoadingAuth(false); 
        });

        return () => {
            console.log("AUTH_CONTEXT: Limpando listener de onAuthStateChanged.");
            unsubscribe();
        };
    }, [auth, db]);

    const contextValue = useMemo(() => {
        // console.log("AUTH_CONTEXT: Recalculando contextValue. loadingAuth:", loadingAuth, "loadingAllowedClientes:", loadingAllowedClientes, "userAllowedClientes:", userAllowedClientes.length);
        return {
            app, 
            db, 
            auth, 
            currentUser, 
            userProfile, 
            isAuthReady, 
            loadingAuth, // Loading geral da autenticação
            appId,
            userAllowedClientes, 
            loadingAllowedClientes // Loading específico dos clientes permitidos
        };
    }, [currentUser, userProfile, isAuthReady, loadingAuth, userAllowedClientes, loadingAllowedClientes, appId]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
