import React, { useState, useContext, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { FaCalculator, FaUserShield, FaFileSignature, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

import AuthContext from '../../context/AuthContext';
import { appId } from '../../firebase/config';
import EditLancamentoModal from '../../components/app/admin/EditLancamentoModal';
import DeleteConfirmationModal from '../../components/app/DeleteConfirmationModal';

// --- COMPONENTES VISUAIS (Existentes e ajustados) ---

const ResultDisplay = ({ result }) => {
    if (!result) return null;
    const isError = result.status === 'error';
    const bgColor = isError ? 'bg-apricot-orange/10' : 'bg-abundant-green/10';
    const textColor = isError ? 'text-apricot-orange' : 'text-rain-forest';
    const borderColor = isError ? 'border-apricot-orange' : 'border-abundant-green';

    return (
        <div className={`mt-4 p-4 border-l-4 rounded-r-lg ${bgColor} ${borderColor}`}>
            <p className={`text-sm font-medium ${textColor}`}>{result.message}</p>
        </div>
    );
};

const AdminCard = ({ icon, title, description, children, className = '' }) => (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden flex flex-col ${className}`}>
        <div className="p-5 bg-blue-coral flex items-center space-x-4">
            <div className="flex-shrink-0 bg-white/20 p-3 rounded-full">{icon}</div>
            <div>
                <h3 className="text-xl font-lexend font-bold text-white">{title}</h3>
                <p className="text-sm text-white/80 font-comfortaa">{description}</p>
            </div>
        </div>
        <div className="p-6 flex-grow">{children}</div>
    </div>
);

// --- NOVO COMPONENTE PARA EDIÇÃO DE LANÇAMENTOS ---

const LancamentosEditorCard = () => {
    const { db, userAllowedClientes, loadingAllowedClientes } = useContext(AuthContext);

    const [selectedClienteId, setSelectedClienteId] = useState('');
    const [clienteData, setClienteData] = useState(null);
    const [loadingCliente, setLoadingCliente] = useState(false); // Estado para o loading do cliente
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    
    const [lancamentos, setLancamentos] = useState([]);
    const [loading, setLoading] = useState(false);
    const fetchKeyRef = useRef(0);

    const [editingLancamento, setEditingLancamento] = useState(null);
    const [deletingLancamento, setDeletingLancamento] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    useEffect(() => {
        if (!selectedClienteId) {
            setClienteData(null);
            setLancamentos([]); // Limpa os lançamentos se o cliente for desmarcado
            return;
        }
        const fetchClienteData = async () => {
            setLoadingCliente(true);
            const clienteRef = doc(db, 'clientes', selectedClienteId);
            const docSnap = await getDoc(clienteRef);
            if (docSnap.exists()) {
                setClienteData({ id: docSnap.id, ...docSnap.data() });
            } else {
                setClienteData(null);
            }
            setLoadingCliente(false);
        };
        fetchClienteData();
    }, [selectedClienteId, db]);


    const handleBuscarLancamentos = useCallback(async () => {
        if (!selectedClienteId) { alert('Por favor, selecione um cliente.'); return; }
        const myKey = ++fetchKeyRef.current;
        setLoading(true);
        setLancamentos([]);
        const dataInicio = new Date(startDate); dataInicio.setHours(0, 0, 0, 0);
        const dataFim = new Date(endDate); dataFim.setHours(23, 59, 59, 999);
        try {
            const q = query(
                collection(db, `artifacts/${appId}/public/data/wasteRecords`),
                where('clienteId', '==', selectedClienteId),
                where('timestamp', '>=', dataInicio.getTime()),
                where('timestamp', '<=', dataFim.getTime()),
                orderBy('timestamp', 'desc')
            );
            const querySnapshot = await getDocs(q);
            if (myKey === fetchKeyRef.current) {
                const records = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setLancamentos(records);
            }
        } catch (error) {
            console.error("Erro ao buscar lançamentos:", error);
            alert("Falha ao buscar os lançamentos.");
        } finally {
            if (myKey === fetchKeyRef.current) setLoading(false);
        }
    }, [db, selectedClienteId, startDate, endDate]);

    const handleOpenEditModal = (lancamento) => { setEditingLancamento(lancamento); setIsEditModalOpen(true); };
    const handleOpenDeleteModal = (lancamento) => { setDeletingLancamento(lancamento); setIsDeleteModalOpen(true); };

    const handleSaveChanges = async (updatedData) => {
        if (!editingLancamento) return;
        const { id, ...dataToUpdate } = updatedData;
        try {
            const docRef = doc(db, `artifacts/${appId}/public/data/wasteRecords`, id);
            await updateDoc(docRef, dataToUpdate);
            setLancamentos(prev => prev.map(l => l.id === id ? { ...l, ...dataToUpdate } : l));
            alert('Lançamento atualizado com sucesso!');
        } catch (error) {
            console.error("Erro ao atualizar o documento: ", error);
            alert('Falha ao atualizar o lançamento.');
        } finally {
            setIsEditModalOpen(false); setEditingLancamento(null);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deletingLancamento) return;
        try {
            const docRef = doc(db, `artifacts/${appId}/public/data/wasteRecords`, deletingLancamento.id);
            await deleteDoc(docRef);
            setLancamentos(prev => prev.filter(l => l.id !== deletingLancamento.id));
            alert('Lançamento excluído com sucesso!');
        } catch (error) {
            console.error("Erro ao excluir o documento: ", error);
            alert('Falha ao excluir o lançamento.');
        } finally {
            setIsDeleteModalOpen(false); setDeletingLancamento(null);
        }
    };

    return (
        <>
            <AdminCard 
                icon={<FaFileSignature className="h-8 w-8 text-white" />} 
                title="Editor de Lançamentos Individuais" 
                description="Ferramenta para corrigir ou remover registros de pesagem. Use com cuidado."
                className="col-span-1 md:col-span-2 lg:col-span-3"
            >
                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end mb-6">
                    <div>
                        <label htmlFor="cliente-selector" className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                        <select id="cliente-selector" value={selectedClienteId} onChange={(e) => setSelectedClienteId(e.target.value)} disabled={loadingAllowedClientes} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-apricot-orange focus:border-apricot-orange disabled:bg-gray-100">
                            <option value="" disabled>{loadingAllowedClientes ? 'Carregando...' : 'Selecione'}</option>
                            {userAllowedClientes.map(c => (<option key={c.id} value={c.id}>{c.nome}</option>))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
                        <input type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div>
                        <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
                        <input type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <button onClick={handleBuscarLancamentos} disabled={loading || loadingCliente || !selectedClienteId} className="w-full h-10 bg-apricot-orange text-white font-lexend py-2 px-4 rounded-md hover:opacity-90 transition-opacity disabled:bg-early-frost disabled:cursor-not-allowed">
                        {loading || loadingCliente ? 'Carregando...' : 'Buscar'}
                    </button>
                </div>

                {/* Tabela de Resultados */}
                {loading && <p className="text-center text-gray-500 py-8">Buscando lançamentos...</p>}
                {!loading && lancamentos.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left font-lexend text-rich-soil uppercase">Data/Hora</th>
                                    <th className="px-4 py-3 text-left font-lexend text-rich-soil uppercase">Área</th>
                                    <th className="px-4 py-3 text-left font-lexend text-rich-soil uppercase">Tipo</th>
                                    <th className="px-4 py-3 text-right font-lexend text-rich-soil uppercase">Peso (kg)</th>
                                    <th className="px-4 py-3 text-center font-lexend text-rich-soil uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {lancamentos.map(lanc => (
                                    <tr key={lanc.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 whitespace-nowrap">{new Date(lanc.timestamp).toLocaleString('pt-BR')}</td>
                                        <td className="px-4 py-3">{lanc.areaLancamento || '-'}</td>
                                        <td className="px-4 py-3">{lanc.wasteType} {lanc.wasteSubType && `(${lanc.wasteSubType})`}</td>
                                        <td className="px-4 py-3 text-right font-semibold">{lanc.peso}</td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex justify-center items-center gap-3">
                                                <button onClick={() => handleOpenEditModal(lanc)} className="text-exotic-plume hover:opacity-75 disabled:text-gray-300 disabled:cursor-not-allowed" title="Editar Lançamento" disabled={loadingCliente || !clienteData}><FaEdit size={18} /></button>
                                                <button onClick={() => handleOpenDeleteModal(lanc)} className="text-apricot-orange hover:opacity-75" title="Excluir Lançamento"><FaTrash size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {!loading && lancamentos.length === 0 && selectedClienteId && (
                    <div className="text-center py-10 border-t mt-4">
                        <p className="text-gray-500">Nenhum lançamento encontrado para os filtros selecionados.</p>
                    </div>
                )}
            </AdminCard>

            {/* Modais */}
            {isEditModalOpen && <EditLancamentoModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleSaveChanges} lancamento={editingLancamento} cliente={clienteData} />}
            {isDeleteModalOpen && <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} clienteNome={`o lançamento de ${deletingLancamento?.peso}kg de ${deletingLancamento?.wasteType} do dia ${new Date(deletingLancamento?.timestamp).toLocaleDateString('pt-BR')}`} />}
        </>
    );
};


// --- COMPONENTE PRINCIPAL DA PÁGINA ---

export default function PaginaAdminMaster() {
    const { userAllowedClientes, loadingAllowedClientes } = useContext(AuthContext);

    const [isLoadingRetro, setIsLoadingRetro] = useState(false);
    const [resultRetro, setResultRetro] = useState(null);
    const [isLoadingInea, setIsLoadingInea] = useState(false);
    const [resultInea, setResultInea] = useState(null);
    
    const [selectedClientRetro, setSelectedClientRetro] = useState('');
    const [selectedClientInea, setSelectedClientInea] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    
    const app = getApp();
    const functions = getFunctions(app, "southamerica-east1");
    
    const generateMonthlySummary = httpsCallable(functions, 'generateMonthlySummaryOnDemand');
    const testIneaConnection = httpsCallable(functions, 'testIneaConnection');

    const handleSumMonths = async () => {
        if (!selectedClientRetro || !selectedMonth) return;
        setIsLoadingRetro(true); setResultRetro(null);
        const [yearStr, monthStr] = selectedMonth.split('-');
        const payload = { clienteId: selectedClientRetro, ano: parseInt(yearStr, 10), mes: parseInt(monthStr, 10) - 1 };
        try {
            const response = await generateMonthlySummary(payload);
            setResultRetro({ status: 'success', message: response.data.message });
        } catch (error) {
            console.error("Erro ao gerar resumo:", error);
            setResultRetro({ status: 'error', message: `Falha: ${error.message}` });
        } finally { setIsLoadingRetro(false); }
    };
    
    const handleCheckInea = async () => {
        if (!selectedClientInea) return;
        setIsLoadingInea(true); setResultInea(null);
        try {
            const response = await testIneaConnection({ clienteId: selectedClientInea });
            setResultInea({ status: 'success', message: response.data.message });
        } catch (error) {
            console.error("Erro ao testar conexão INEA:", error);
            setResultInea({ status: 'error', message: `Falha: ${error.message}` });
        } finally { setIsLoadingInea(false); }
    };

    return (
        <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-full font-comfortaa">
            <header className="mb-8">
                <h1 className="text-3xl font-lexend font-bold text-blue-coral">Painel de Administração Master</h1>
                <p className="text-md text-gray-600 mt-1">Ferramentas e funções avançadas para gerenciamento do sistema.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                
                {/* Card 1: Cálculo Retroativo */}
                <AdminCard icon={<FaCalculator className="h-8 w-8 text-white" />} title="Cálculo Retroativo" description="Recalcular manualmente os dados do dashboard para um cliente e mês.">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="client-select-retro" className="block text-sm font-medium text-gray-700 mb-1">Cliente:</label>
                            <select id="client-select-retro" value={selectedClientRetro} onChange={(e) => setSelectedClientRetro(e.target.value)} disabled={loadingAllowedClientes || isLoadingRetro} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-apricot-orange focus:border-apricot-orange disabled:bg-gray-100">
                                <option value="" disabled>{loadingAllowedClientes ? 'Carregando...' : 'Selecione'}</option>
                                {userAllowedClientes.map(c => (<option key={c.id} value={c.id}>{c.nome}</option>))}
                            </select>
                        </div>
                        <div>
                             <label htmlFor="retro-month" className="block text-sm font-medium text-gray-700 mb-1">Mês para cálculo:</label>
                            <input type="month" id="retro-month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} disabled={isLoadingRetro} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" />
                        </div>
                        <button onClick={handleSumMonths} disabled={!selectedClientRetro || !selectedMonth || isLoadingRetro} className="w-full bg-apricot-orange text-white font-lexend py-2 px-4 rounded-md hover:opacity-90 transition-opacity disabled:bg-early-frost disabled:cursor-not-allowed">
                            {isLoadingRetro ? 'Processando...' : 'Iniciar Cálculo'}
                        </button>
                        <ResultDisplay result={resultRetro} />
                    </div>
                </AdminCard>

                {/* Card 2: Verificador de Conexão INEA */}
                <AdminCard icon={<FaUserShield className="h-8 w-8 text-white" />} title="Verificador de Conexão INEA" description="Teste a conexão com a API do INEA usando as credenciais do cliente.">
                    <div className="space-y-4">
                         <div>
                            <label htmlFor="client-select-inea" className="block text-sm font-medium text-gray-700 mb-1">Cliente:</label>
                            <select id="client-select-inea" value={selectedClientInea} onChange={(e) => setSelectedClientInea(e.target.value)} disabled={loadingAllowedClientes || isLoadingInea} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-apricot-orange focus:border-apricot-orange disabled:bg-gray-100">
                                <option value="" disabled>{loadingAllowedClientes ? 'Carregando...' : 'Selecione'}</option>
                                {userAllowedClientes.map(c => (<option key={c.id} value={c.id}>{c.nome}</option>))}
                            </select>
                        </div>
                        <button onClick={handleCheckInea} disabled={!selectedClientInea || isLoadingInea} className="w-full bg-apricot-orange text-white font-lexend py-2 px-4 rounded-md hover:opacity-90 transition-opacity disabled:bg-early-frost disabled:cursor-not-allowed">
                            {isLoadingInea ? 'Verificando...' : 'Testar Conexão'}
                        </button>
                        <ResultDisplay result={resultInea} />
                    </div>
                </AdminCard>

                {/* Card Futuro (Placeholder) */}
                 <AdminCard icon={<FaPlus className="h-8 w-8 text-white" />} title="Futura Função" description="Espaço reservado para uma nova ferramenta de sistema.">
                     <div className="text-center text-gray-500 flex items-center justify-center h-full"><p>Aguardando implementação.</p></div>
                </AdminCard>

                {/* NOVO CARD DE EDIÇÃO DE LANÇAMENTOS */}
                <LancamentosEditorCard />

            </div>
        </div>
    );
}

