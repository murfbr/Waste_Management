// src/App.jsx

import React, { useState, useEffect, useContext } from 'react'; // Removido 'createContext' daqui
// Importa as instâncias do Firebase inicializadas
import { app, db, auth } from './firebase/init';
// Importa as configurações e variáveis de ambiente
import { appId, initialAuthToken } from './firebase/config';
// Importa funções de autenticação do Firebase
import { signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth';
// Importa funções do Firestore
import { collection, addDoc, onSnapshot, deleteDoc, doc, query } from 'firebase/firestore';

// Importa os novos componentes que serão criados
import MessageBox from './components/MessageBox'; // Componente de mensagens
import Login from './components/Login'; // Componente de login
import WasteForm from './components/WasteForm'; // Componente do formulário de resíduos
import WasteRecordsList from './components/WasteRecordsList'; // Componente da lista de registros de resíduos

import AuthContext from './context/AuthContext'; // Importa o AuthContext AGORA COMO EXPORTAÇÃO PADRÃO

// Componente principal do aplicativo React
export default function App() {
    // Estados para armazenar o usuário atual e se a autenticação foi inicializada
    const [currentUser, setCurrentUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false); // Indica se a autenticação foi inicializada

    // useEffect para configurar o ouvinte de autenticação do Firebase
    // Este hook é executado apenas uma vez, após a montagem inicial do componente.
    useEffect(() => {
        // onAuthStateChanged é crucial para reagir a logins/logouts
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Usuário autenticado (pode ser anônimo ou outro método)
                setCurrentUser(user);
                setIsAuthReady(true);
                console.log('Firebase Init Debug: Usuário autenticado:', user.uid);
            } else {
                // Nenhum usuário logado, tenta autenticar
                setCurrentUser(null);
                if (initialAuthToken) {
                    // Tenta autenticar com o token personalizado do Canvas
                    console.log('Firebase Init Debug: Tentando autenticar com token personalizado.');
                    await signInWithCustomToken(auth, initialAuthToken);
                } else {
                    // Se não houver token, tenta autenticar anonimamente
                    console.log('Firebase Init Debug: Tentando autenticar anonimamente.');
                    await signInAnonymously(auth);
                }
                setIsAuthReady(true); // Autenticação tentada, agora está pronta
            }
        });

        // Retorna uma função de limpeza para desinscrever o ouvinte quando o componente é desmontado
        return () => unsubscribe();
    }, []); // Array de dependências vazio significa que este efeito roda apenas uma vez

    // Renderiza o componente principal do aplicativo
    return (
        // AuthContext.Provider torna as instâncias do Firebase e o usuário disponíveis para todos os componentes filhos
        <AuthContext.Provider value={{ app, db, auth, currentUser, isAuthReady, appId }}>
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="container">
                    {/* Exibe o ID do usuário se estiver autenticado */}
                    {isAuthReady && currentUser && (
                        <div className="mb-4 text-center text-sm text-gray-600">
                            Seu ID de Usuário: <span className="font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded">{currentUser.uid}</span>
                            {/* Botão de Logout */}
                            <button
                                onClick={() => signOut(auth)} // Usa a instância 'auth' importada
                                className="ml-4 bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-lg text-sm transition duration-200"
                            >
                                Sair
                            </button>
                        </div>
                    )}

                    {/* Renderiza o componente de Login ou o WasteTracker, dependendo do estado de autenticação */}
                    {!isAuthReady ? (
                        <div className="text-center text-gray-600 text-lg">
                            Carregando aplicativo...
                        </div>
                    ) : currentUser ? (
                        // Se o usuário estiver autenticado, renderiza o WasteTracker principal
                        <WasteTrackerContent /> // Renomeado para evitar conflito com o componente WasteTracker
                    ) : (
                        // Se não estiver autenticado, renderiza a tela de Login
                        <Login />
                    )}
                </div>
            </div>
        </AuthContext.Provider>
    );
}

// Novo componente para o conteúdo principal do rastreador de resíduos
// Isso separa a lógica de exibição do formulário e lista do componente App
function WasteTrackerContent() {
    const { db, currentUser, appId } = useContext(AuthContext);

    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [wasteRecords, setWasteRecords] = useState([]);
    const [loadingRecords, setLoadingRecords] = useState(true);

    // Função para exibir mensagens (sucesso/erro)
    const showMessage = (msg, error = false) => {
        setMessage(msg);
        setIsError(error);
        setTimeout(() => setMessage(''), 5000);
    };

    // useEffect para configurar o ouvinte de registros do Firestore em tempo real
    useEffect(() => {
        if (!db || !currentUser) {
            console.warn('Firestore ou usuário não disponíveis para configurar o ouvinte de registros.');
            return;
        }

        setLoadingRecords(true);
        const wasteRecordsCollectionRef = collection(db, `artifacts/${appId}/public/data/wasteRecords`);
        const q = query(wasteRecordsCollectionRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const records = [];
            snapshot.forEach(doc => {
                records.push({ id: doc.id, ...doc.data() });
            });
            records.sort((a, b) => b.timestamp - a.timestamp);
            setWasteRecords(records);
            setLoadingRecords(false);
        }, (error) => {
            console.error("Erro ao buscar registros em tempo real:", error);
            showMessage('Erro ao carregar registros. Tente recarregar a página.', true);
            setLoadingRecords(false);
        });

        return () => unsubscribe();
    }, [db, currentUser, appId]);

    // Função para lidar com o envio do formulário de resíduos
    const handleAddWasteRecord = async (newRecordData) => {
        if (!currentUser) {
            showMessage('Você precisa estar logado para registrar resíduos.', true);
            return;
        }
        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/wasteRecords`), {
                ...newRecordData,
                timestamp: Date.now(),
                userId: currentUser.uid
            });
            showMessage('Resíduo registrado com sucesso!');
            return true; // Indica sucesso
        } catch (error) {
            console.error('Erro ao registrar resíduo:', error);
            showMessage('Erro ao registrar resíduo. Tente novamente.', true);
            return false; // Indica falha
        }
    };

    // Função para lidar com a exclusão de um registro
    const handleDeleteRecord = async (recordId) => {
        if (window.confirm('Tem certeza que deseja excluir este registro?')) {
            try {
                const recordRef = doc(db, `artifacts/${appId}/public/data/wasteRecords`, recordId);
                await deleteDoc(recordRef);
                showMessage('Registro excluído com sucesso!');
            } catch (error) {
                console.error('Erro ao excluir registro:', error);
                showMessage('Erro ao excluir registro. Tente novamente.', true);
            }
        }
    };

    return (
        <>
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Controle de Resíduos do Hotel</h1>

            {/* Componente de Mensagens */}
            <MessageBox message={message} isError={isError} />

            {/* Componente do Formulário de Resíduos */}
            <WasteForm onAddWaste={handleAddWasteRecord} />

            <h2 className="text-2xl font-bold text-gray-800 mb-4">Registros Recentes</h2>
            {/* Componente da Lista de Registros de Resíduos */}
            <WasteRecordsList
                records={wasteRecords}
                loading={loadingRecords}
                onDelete={handleDeleteRecord}
                showMessage={showMessage} // Passa a função showMessage para o componente filho
            />
        </>
    );
}