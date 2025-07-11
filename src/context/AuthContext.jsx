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

    // --> NOVO: Função dedicada para atualizar a contagem de pendentes na UI.
    const updatePendingCount = useCallback(async () => {
        const count = await getPendingRecordsCount();
        setPendingRecordsCount(count);
    }, []);

    // --> MODIFICADO: Lógica de Sincronização refatorada para ser mais segura e eficiente.
    useEffect(() => {
        // Função para lidar apenas com a sincronização de rede
        const handleSync = async () => {
            // Não tenta sincronizar se estiver offline, sem as dependências ou se já estiver em progresso
            if (!navigator.onLine || !db || !appId || isSyncing.current) return;

            isSyncing.current = true;
            console.log('AuthContext: Tentando sincronizar...');
            
            const changesWereMade = await syncPendingRecords(db, appId);
            
            isSyncing.current = false; // Libera a trava após a tentativa de sincronização

            // Se a sincronização fez alterações, chama a atualização da UI diretamente
            if (changesWereMade) {
                console.log('AuthContext: Sincronização concluída. Atualizando contagem na UI.');
                updatePendingCount(); // Chamada direta para atualizar o estado, sem disparar novo evento
            }
        };

        const handleOnline = () => {
            setIsOnline(true);
            console.log("AuthContext: Status -> Online");
            handleSync(); // Tenta sincronizar assim que fica online
        };

        const handleOffline = () => {
            setIsOnline(false);
            console.log("AuthContext: Status -> Offline");
        };

        // Listeners com responsabilidades separadas
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        // Este listener agora só atualiza a contagem, não dispara uma nova sincronização
        window.addEventListener('pending-records-updated', updatePendingCount);

        // Ações Iniciais ao carregar o contexto
        updatePendingCount(); // Busca a contagem inicial de pendentes
        handleSync();         // Tenta uma sincronização inicial se estiver online

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('pending-records-updated', updatePendingCount);
        };
    }, [updatePendingCount]); // Adiciona a dependência do useCallback

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