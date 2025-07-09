// src/context/AuthContext.jsx

import React, { createContext, useState, useEffect, useMemo, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, documentId, orderBy, getDocs } from 'firebase/firestore'; 

import { app, db, auth, functions } from '../firebase/init'; 
import { appId } from '../firebase/config'; 

import { syncPendingRecords, getPendingRecordsCount } from '../services/offlineSyncService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [loadingAuth, setLoadingAuth] = useState(true);
    
    const [userAllowedClientes, setUserAllowedClientes] = useState([]);
    const [loadingAllowedClientes, setLoadingAllowedClientes] = useState(true);

    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingRecordsCount, setPendingRecordsCount] = useState(0);
    const isSyncing = useRef(false);

    useEffect(() => {
        const handleSyncAndQueueUpdate = async () => {
            if (isSyncing.current) return;
            isSyncing.current = true;

            // Atualiza o contador primeiro
            const initialCount = await getPendingRecordsCount();
            setPendingRecordsCount(initialCount);

            if (navigator.onLine && db && appId && initialCount > 0) {
                console.log('Tentando sincronizar...');
                const changesWereMade = await syncPendingRecords(db, appId);
                
                // --- CORREÇÃO PRINCIPAL AQUI ---
                // Se a sincronização removeu itens da fila, disparamos o evento
                // para que TODAS as partes do app (a lista e o contador) se atualizem.
                if (changesWereMade) {
                    console.log('Sincronização concluída, notificando a UI para atualizar.');
                    window.dispatchEvent(new CustomEvent('pending-records-updated'));
                }
            }
            
            isSyncing.current = false;
        };
        
        // Esta função agora apenas atualiza o contador e chama a função principal.
        const handleQueueChange = async () => {
            const count = await getPendingRecordsCount();
            setPendingRecordsCount(count);
            handleSyncAndQueueUpdate(); // Tenta sincronizar após a mudança
        };

        const handleOnline = () => {
            setIsOnline(true);
            handleSyncAndQueueUpdate();
        };

        const handleOffline = () => setIsOnline(false);

        // O listener agora chama a função mais simples, que por sua vez chama a de sincronização.
        window.addEventListener('pending-records-updated', handleQueueChange);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Verificação inicial
        handleQueueChange();

        return () => {
            window.removeEventListener('pending-records-updated', handleQueueChange);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [db, appId]);

    // useEffect de autenticação (sem mudanças na sua lógica principal)
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

                        if (navigator.onLine && !isSyncing.current) {
                           syncPendingRecords(db, appId);
                        }

                        let loadedClientes = [];
                        if (newProfileData.role === 'master') {
                            const q = query(collection(db, "clientes"), where("ativo", "==", true), orderBy("nome"));
                            const querySnapshot = await getDocs(q);
                            loadedClientes = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                        } else if (newProfileData.clientesPermitidos && newProfileData.clientesPermitidos.length > 0) {
                            const CHUNK_SIZE = 30;
                            for (let i = 0; i < newProfileData.clientesPermitidos.length; i += CHUNK_SIZE) {
                                const chunk = newProfileData.clientesPermitidos.slice(i, i + CHUNK_SIZE);
                                const q = query(collection(db, "clientes"), where(documentId(), "in", chunk), where("ativo", "==", true), orderBy("nome"));
                                const querySnapshot = await getDocs(q);
                                loadedClientes.push(...querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
                            }
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
    }, [db, appId]);

    const contextValue = useMemo(() => {
        return {
            db, auth, functions, appId,
            currentUser, userProfile, isAuthReady, loadingAuth,
            userAllowedClientes, loadingAllowedClientes,
            isOnline, pendingRecordsCount
        };
    }, [currentUser, userProfile, isAuthReady, loadingAuth, userAllowedClientes, loadingAllowedClientes, isOnline, pendingRecordsCount]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
