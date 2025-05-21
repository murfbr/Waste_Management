// src/App.jsx

import React, { useState, useEffect, useContext } from 'react';
// Importa as instâncias do Firebase inicializadas
import { app, db, auth } from './firebase/init';
// Importa as configurações e variáveis de ambiente (initialAuthToken removido)
import { appId } from './firebase/config';
// Importa funções de autenticação do Firebase
import { signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth';
// Importa funções do Firestore
import { collection, addDoc, onSnapshot, deleteDoc, doc, query } from 'firebase/firestore';

// Importa os novos componentes que serão criados
import MessageBox from './components/MessageBox'; // Componente de mensagens
import Login from './components/Login'; // Componente de login
import WasteForm from './components/WasteForm'; // Componente do formulário de resíduos
import WasteRecordsList from './components/WasteRecordsList'; // Componente da lista de registros de resíduos

// Importa o AuthContext e o AuthProvider do arquivo de contexto
import AuthContext, { AuthProvider } from './context/AuthContext';

// Componente principal do aplicativo React
export default function App() {
    // Renderiza o componente principal do aplicativo
    return (
        // AuthProvider envolve todo o aplicativo para fornecer o contexto de autenticação e Firebase
        <AuthProvider>
            <AppContent /> {/* Componente que contém a lógica de exibição baseada na autenticação */}
        </AuthProvider>
    );
}

// Novo componente para o conteúdo principal do aplicativo, que consome o AuthContext
function AppContent() {
    const { currentUser, isAuthReady, loadingAuth, auth, userProfile } = useContext(AuthContext);

    // Renderiza o componente principal do aplicativo
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="container">
                {/* Exibe o ID do usuário e o botão de Logout se estiver autenticado */}
                {isAuthReady && currentUser && (
                    <div className="mb-4 text-center text-sm text-gray-600">
                        Seu ID de Usuário: <span className="font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded">{currentUser.uid}</span>
                        {userProfile && userProfile.role && (
                            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                                Nível: {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)} {/* Exibe o nível de acesso */}
                            </span>
                        )}
                        {/* Botão de Logout */}
                        <button
                            onClick={() => signOut(auth)} // Usa a instância 'auth' importada do contexto
                            className="ml-4 bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-lg text-sm transition duration-200"
                        >
                            Sair
                        </button>
                    </div>
                )}

                {/* Renderiza o conteúdo do aplicativo com base no estado de autenticação */}
                {loadingAuth ? (
                    <div className="text-center text-gray-600 text-lg">
                        Carregando aplicativo...
                    </div>
                ) : currentUser ? (
                    // Se o usuário estiver autenticado, renderiza o WasteTracker principal
                    <WasteTrackerContent />
                ) : (
                    // Se não estiver autenticado, renderiza a tela de Login
                    <Login />
                )}
            </div>
        </div>
    );
}


// Novo componente para o conteúdo principal do rastreador de resíduos
// Isso separa a lógica de exibição do formulário e lista do componente App
function WasteTrackerContent() {
    const { db, currentUser, appId, userProfile } = useContext(AuthContext); // Adicionado userProfile
// --- ADICIONE ESTA LINHA ABAIXO ---
    console.log('DEBUG: WasteTrackerContent - userProfile recebido:', userProfile);
    console.log('DEBUG: WasteTrackerContent - userProfile.role:', userProfile ? userProfile.role : 'N/A');
    // --- FIM DA ADIÇÃO ---

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
        // Verifica se o usuário tem permissão para adicionar (ex: Master ou Gerencial)
        if (!currentUser || (userProfile && (userProfile.role !== 'master' && userProfile.role !== 'gerencial' && userProfile.role !== 'simples'))) {
            showMessage('Você não tem permissão para registrar resíduos.', true);
            return false;
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
        // Verifica se o usuário tem permissão para excluir (ex: apenas Master)
        if (!currentUser || (userProfile && userProfile.role !== 'master')) {
            showMessage('Você não tem permissão para excluir registros.', true);
            return;
        }
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

    // Renderização condicional baseada no nível de acesso
    const canAccessPesagem = userProfile && (userProfile.role === 'master' || userProfile.role === 'gerencial' || userProfile.role === 'simples');
    const canAccessDashboards = userProfile && (userProfile.role === 'master' || userProfile.role === 'gerencial');

    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Controle de Resíduos do Hotel</h1>

            {/* Componente de Mensagens */}
            <MessageBox message={message} isError={isError} />

            {/* Formulário de Pesagem (visível para Master, Gerencial, Simples) */}
            {canAccessPesagem && (
                <>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Registro de Pesagem</h2>
                    <WasteForm onAddWaste={handleAddWasteRecord} />
                </>
            )}

            {/* Dashboards (visível para Master, Gerencial) */}
            {canAccessDashboards && (
                <>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8">Dashboards (Em Desenvolvimento)</h2>
                    <p className="text-gray-600 mb-4">Esta seção exibirá gráficos e análises dos dados de resíduos.</p>
                    {/* Aqui futuramente entrarão os componentes de dashboard */}
                </>
            )}

            <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8">Registros Recentes</h2>
            {/* Componente da Lista de Registros de Resíduos (visível para Master, Gerencial, Simples) */}
            {canAccessPesagem && ( // A lista de registros é parte da visão de pesagem
                <WasteRecordsList
                    records={wasteRecords}
                    loading={loadingRecords}
                    onDelete={handleDeleteRecord}
                    showMessage={showMessage}
                    userRole={userProfile ? userProfile.role : null} // Passa o nível de acesso para a lista
                />
            )}

            {!canAccessPesagem && !canAccessDashboards && (
                <p className="text-center text-gray-600">Você não tem permissão para acessar esta funcionalidade.</p>
            )}
        </div>
    );
}