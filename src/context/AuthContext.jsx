// src/context/AuthContext.jsx

import React, { createContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, documentId, orderBy, getDocs } from 'firebase/firestore'; 

import { app, db, auth, functions } from '../firebase/init'; 
import { appId } from '../firebase/config'; 

// A importação do serviço de sincronização permanece a mesma.
import { syncPendingRecords, getPendingRecordsCount } from '../services/offlineSyncService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [loadingAuth, setLoadingAuth] = useState(true);
    
    const [userAllowedClientes, setUserAllowedClientes] = useState([]);
    const [loadingAllowedClientes, setLoadingAllowedClientes] = useState(true);

    // Estado para o status da conexão e contagem de registros pendentes.
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingRecordsCount, setPendingRecordsCount] = useState(0);
    
    // Ref para evitar múltiplas chamadas de sincronização simultâneas.
    const isSyncing = useRef(false);

    // A função de carregar clientes permitidos permanece a mesma.
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
                    const CHUNK_SIZE = 30; // Firestore 'in' query limit is 30 in v9+
                    for (let i = 0; i < clientesPermitidos.length; i += CHUNK_SIZE) {
                        const chunk = clientesPermitidos.slice(i, i + CHUNK_SIZE);
                        const q = query(collection(db, "clientes"), where(documentId(), "in", chunk), where("ativo", "==", true));
                        const querySnapshot = await getDocs(q);
                        loadedClientes.push(...querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
                    }
                    // Sort locally since ordering by name isn't possible with 'in' queries
                    loadedClientes.sort((a, b) => a.nome.localeCompare(b.nome));
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

    // Função dedicada para atualizar a contagem de pendentes na UI.
    const updatePendingCount = useCallback(async () => {
        const count = await getPendingRecordsCount();
        setPendingRecordsCount(count);
    }, []);

    // --- LÓGICA DE SINCRONIZAÇÃO E ORQUESTRAÇÃO (FINAL) ---
    useEffect(() => {
        // Função interna para lidar com a tentativa de sincronização.
        const handleSync = async () => {
            // Prevenção de múltiplas execuções: não roda se estiver offline,
            // sem as dependências ou se uma sincronização já estiver em andamento.
            if (!navigator.onLine || !db || !appId || isSyncing.current) return;

            isSyncing.current = true; // Trava para evitar nova chamada.
            console.log('AuthContext: Disparando sincronização...');
            
            // Chama o serviço e verifica se ele realmente fez alguma alteração.
            const changesWereMade = await syncPendingRecords(db, appId);
            
            isSyncing.current = false; // Libera a trava.

            // Se a sincronização resultou em mudanças, notifica a aplicação.
            // Isso fará com que a PaginaLancamento recarregue os dados e
            // o contador de pendentes seja atualizado para 0.
            if (changesWereMade) {
                console.log('AuthContext: Sincronização concluída. Notificando a aplicação.');
                window.dispatchEvent(new CustomEvent('pending-records-updated'));
            }
        };

        const handleOnline = () => {
            setIsOnline(true);
            console.log("AuthContext: Status -> Online. Tentando sincronizar.");
            handleSync(); 
        };

        const handleOffline = () => {
            setIsOnline(false);
            console.log("AuthContext: Status -> Offline");
        };
        
        // CORREÇÃO: Handler para o evento de atualização de pendentes.
        // Agora, além de atualizar a contagem, ele também TENTA sincronizar.
        const onPendingRecordsUpdated = () => {
            updatePendingCount();
            handleSync(); // <<-- ESTA É A LINHA QUE RESOLVE O BUG
        };

        // Listeners para o status da rede e para atualizações na fila local.
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('pending-records-updated', onPendingRecordsUpdated);

        // Ações Iniciais ao carregar o contexto:
        updatePendingCount(); // Busca a contagem inicial de pendentes.
        handleSync();         // Tenta uma sincronização inicial se estiver online.

        // Limpeza dos listeners ao desmontar o componente.
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('pending-records-updated', onPendingRecordsUpdated);
        };
    }, [db, appId, updatePendingCount]); // Dependências do useEffect.

    // Lógica de autenticação (permanece a mesma).
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

    // O valor do contexto fornecido aos componentes filhos.
    const contextValue = useMemo(() => ({
        db, auth, functions, appId,
        currentUser, userProfile, isAuthReady, loadingAuth,
        userAllowedClientes, loadingAllowedClientes: loadingAllowedClientes,
        isOnline, pendingRecordsCount,
        refreshAllowedClientes
    }), [
        currentUser, userProfile, isAuthReady, loadingAuth, 
        userAllowedClientes, loadingAllowedClientes, 
        isOnline, pendingRecordsCount, 
        refreshAllowedClientes
    ]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
