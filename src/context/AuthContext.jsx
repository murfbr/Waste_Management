// src/context/AuthContext.jsx

import React, { createContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
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

    const refreshAllowedClientes = useCallback(async () => {
        if (!auth.currentUser) {
            setUserAllowedClientes([]);
            return;
        }
        try {
            setLoadingAllowedClientes(true);
            const userProfileRef = doc(db, `users/${auth.currentUser.uid}`);
            const docSnap = await getDoc(userProfileRef);
            if (docSnap.exists()) {
                const profileData = docSnap.data();
                let loadedClientes = [];
                const clientesPermitidos = profileData.clientesPermitidos || [];
                if (profileData.role === 'master') {
                    const q = query(collection(db, "clientes"), where("ativo", "==", true), orderBy("nome"));
                    const querySnapshot = await getDocs(q);
                    loadedClientes = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                } else if (clientesPermitidos.length > 0) {
                    const CHUNK_SIZE = 30;
                    for (let i = 0; i < clientesPermitidos.length; i += CHUNK_SIZE) {
                        const chunk = clientesPermitidos.slice(i, i + CHUNK_SIZE);
                        const q = query(collection(db, "clientes"), where(documentId(), "in", chunk), where("ativo", "==", true), orderBy("nome"));
                        const querySnapshot = await getDocs(q);
                        loadedClientes.push(...querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
                    }
                }
                setUserAllowedClientes(loadedClientes);
            } else {
                setUserAllowedClientes([]);
            }
        } catch (error) {
            console.error('Erro CRÍTICO ao buscar clientes:', error);
            setUserAllowedClientes([]);
        } finally {
            setLoadingAllowedClientes(false);
        }
    }, []);

    // Lógica de Sincronização
    useEffect(() => {
        const handleSyncAndQueueUpdate = async () => {
            if (isSyncing.current) return;
            isSyncing.current = true;

            const initialCount = await getPendingRecordsCount();
            setPendingRecordsCount(initialCount);

            if (navigator.onLine && db && appId && initialCount > 0) {
                console.log('AuthContext: Tentando sincronizar...');
                const changesWereMade = await syncPendingRecords(db, appId);
                
                if (changesWereMade) {
                    console.log('AuthContext: Sincronização concluída, notificando a UI para atualizar.');
                    // Dispara o mesmo evento para forçar a recontagem e a atualização da lista
                    window.dispatchEvent(new CustomEvent('pending-records-updated'));
                }
            }
            
            isSyncing.current = false;
        };

        const handleOnline = () => {
            setIsOnline(true);
            console.log("AuthContext: Status -> Online");
            handleSyncAndQueueUpdate();
        };
        const handleOffline = () => setIsOnline(false);

        // Listeners
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('pending-records-updated', handleSyncAndQueueUpdate);

        // Verificação inicial
        handleSyncAndQueueUpdate();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('pending-records-updated', handleSyncAndQueueUpdate);
        };
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setLoadingAuth(true);
            if (user) {
                setCurrentUser(user);
                const userProfileRef = doc(db, `users/${user.uid}`);
                const docSnap = await getDoc(userProfileRef);
                if (docSnap.exists()) {
                    const newProfileData = { id: docSnap.id, ...docSnap.data() };
                    setUserProfile(newProfileData);
                    await refreshAllowedClientes(); 
                } else {
                    setUserProfile(null);
                    setUserAllowedClientes([]);
                }
            } else {
                setCurrentUser(null);
                setUserProfile(null);
                setUserAllowedClientes([]);
            }
            setIsAuthReady(true); 
            setLoadingAuth(false);
        });
        return () => unsubscribe();
    }, [refreshAllowedClientes]);

    const contextValue = useMemo(() => ({
        db, auth, functions, appId,
        currentUser, userProfile, isAuthReady, loadingAuth,
        userAllowedClientes, loadingAllowedClientes,
        isOnline, pendingRecordsCount,
        refreshAllowedClientes
    }), [currentUser, userProfile, isAuthReady, loadingAuth, userAllowedClientes, loadingAllowedClientes, isOnline, pendingRecordsCount, refreshAllowedClientes]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;