import React, { useState, useEffect, useContext, useCallback } from 'react';
import { collection, query, where, orderBy, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore'; // CORREÇÃO APLICADA AQUI
import AuthContext from '../../context/AuthContext';
import { exportarParaIneaCSV } from '../../utils/ineaCsvExport'; 
import DocumentosCliente from '../../components/app/DocumentosCliente'; 

// Componente para exibir os detalhes do cliente (sem alterações)
const ClienteDetalhesCard = ({ cliente }) => {
    if (!cliente) {
        return (
            <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                Selecione um cliente para ver seus detalhes.
            </div>
        );
    }

    const { nome, cnpj, endereco, cidade, estado, configINEA } = cliente;

    return (
        <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4">{nome}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <p><strong className="text-gray-600">CNPJ:</strong> {cnpj || 'Não informado'}</p>
                <p><strong className="text-gray-600">Endereço:</strong> {`${endereco || ''}, ${cidade || ''} - ${estado || ''}`}</p>
                <div className="md:col-span-2 mt-2 pt-2 border-t">
                    <p className="font-semibold text-gray-700">Dados de Integração INEA:</p>
                    <p><strong className="text-gray-600">Login (CPF):</strong> {configINEA?.login || 'Não configurado'}</p>
                    <p><strong className="text-gray-600">CNPJ (API):</strong> {configINEA?.cnpj || 'Não configurado'}</p>
                    <p><strong className="text-gray-600">Cód. Unidade:</strong> {configINEA?.codUnidade || 'Não configurado'}</p>
                </div>
            </div>
        </div>
    );
};


export default function PaginaGestaoMTR() {
    const { db, userProfile, userAllowedClientes, loadingUserClientes } = useContext(AuthContext);

    const [selectedClienteId, setSelectedClienteId] = useState('');
    const [clienteData, setClienteData] = useState(null);
    const [empresasColeta, setEmpresasColeta] = useState([]);
    
    // Estados para o filtro e resultados
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [lancamentos, setLancamentos] = useState([]);
    const [loadingLancamentos, setLoadingLancamentos] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Carrega a lista de empresas de coleta (necessária para a exportação)
    useEffect(() => {
        if (!db) return;
        const q = query(collection(db, "empresasColeta"), orderBy("nomeFantasia"));
        // Esta função 'onSnapshot' causava o erro por não ter sido importada
        const unsub = onSnapshot(q, (qs) => {
            setEmpresasColeta(qs.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (err) => console.error("Erro ao carregar empresas de coleta:", err));
        return () => unsub();
    }, [db]);
    
    // Define o cliente padrão
    useEffect(() => {
        if (!loadingUserClientes && userAllowedClientes.length > 0 && !selectedClienteId) {
            setSelectedClienteId(userAllowedClientes[0].id);
        }
    }, [loadingUserClientes, userAllowedClientes, selectedClienteId]);

    // Busca os dados completos do cliente selecionado
    useEffect(() => {
        if (!db || !selectedClienteId) {
            setClienteData(null);
            return;
        }
        const fetchClienteData = async () => {
            const clienteRef = doc(db, "clientes", selectedClienteId);
            const docSnap = await getDoc(clienteRef);
            if (docSnap.exists()) {
                setClienteData(docSnap.data());
            } else {
                setClienteData(null);
            }
        };
        fetchClienteData();
    }, [db, selectedClienteId]);
    
    // Função para buscar os lançamentos com base no período
    const handleBuscarLancamentos = useCallback(async () => {
        if (!selectedClienteId || !startDate || !endDate) {
            alert("Por favor, selecione um cliente e um período de datas.");
            return;
        }
        setLoadingLancamentos(true);
        setLancamentos([]);

        const dataInicio = new Date(startDate);
        dataInicio.setHours(0, 0, 0, 0);

        const dataFim = new Date(endDate);
        dataFim.setHours(23, 59, 59, 999);

        try {
            const q = query(
                collection(db, `artifacts/${db.app.options.appId}/public/data/wasteRecords`),
                where("clienteId", "==", selectedClienteId),
                where("timestamp", ">=", dataInicio.getTime()),
                where("timestamp", "<=", dataFim.getTime()),
                orderBy("timestamp", "desc")
            );
            const querySnapshot = await getDocs(q);
            const records = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setLancamentos(records);
        } catch (error) {
            console.error("Erro ao buscar lançamentos:", error);
            alert("Falha ao buscar os lançamentos. Verifique o console para mais detalhes.");
        } finally {
            setLoadingLancamentos(false);
        }
    }, [db, selectedClienteId, startDate, endDate]);

    // Função para acionar a exportação
    const handleExport = () => {
        setIsExporting(true);
        // A função de exportação precisa de uma função para mostrar mensagens
        const showMessage = (msg, isError = false) => alert(msg);
        exportarParaIneaCSV(lancamentos, clienteData, empresasColeta, showMessage);
        setIsExporting(false);
    };

    // Verificação de permissão (placeholder)
    if (userProfile && userProfile.role !== 'master') {
        return <div className="p-8 text-center text-red-600">Acesso negado. Esta página é restrita a administradores.</div>;
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Gestão de MTR/CDF</h1>
            
            {/* Seção de Seleção e Validação */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                    <div>
                        <label htmlFor="cliente-selector-gestao" className="block text-sm font-medium text-gray-700 mb-1">
                            Selecione o Cliente
                        </label>
                        <select
                            id="cliente-selector-gestao"
                            value={selectedClienteId}
                            onChange={(e) => setSelectedClienteId(e.target.value)}
                            disabled={loadingUserClientes}
                            className="block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                        >
                            {loadingUserClientes ? <option>Carregando...</option> : 
                                userAllowedClientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                    </div>
                </div>
                <div className="lg:col-span-2">
                    <ClienteDetalhesCard cliente={clienteData} />
                </div>
            </div>
            
            {/* Seção de Filtro e Lançamentos */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">1. Buscar Lançamentos para Emissão de MTR</h2>
                <div className="flex flex-wrap items-end gap-4 mb-6">
                    <div>
                        <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">Data de Início</label>
                        <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 p-2 border rounded-md"/>
                    </div>
                    <div>
                        <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">Data Final</label>
                        <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 p-2 border rounded-md"/>
                    </div>
                    <button 
                        onClick={handleBuscarLancamentos} 
                        disabled={loadingLancamentos || !selectedClienteId}
                        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loadingLancamentos ? 'Buscando...' : 'Buscar Lançamentos'}
                    </button>
                </div>

                {/* Tabela de Lançamentos */}
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Lançamentos Encontrados ({lancamentos.length})</h3>
                <div className="overflow-y-auto max-h-72 border rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                        {/* ... cabeçalho da tabela ... */}
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo de Resíduo</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Peso</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loadingLancamentos ? (
                                <tr><td colSpan="4" className="p-4 text-center">Buscando...</td></tr>
                            ) : lancamentos.length > 0 ? (
                                lancamentos.map(record => (
                                    <tr key={record.id}>
                                        <td className="px-4 py-2 text-sm">{new Date(record.timestamp).toLocaleDateString('pt-BR')}</td>
                                        <td className="px-4 py-2 text-sm">{record.wasteType} {record.wasteSubType && `(${record.wasteSubType})`}</td>
                                        <td className="px-4 py-2 text-sm">{record.peso} kg</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="4" className="p-4 text-center text-gray-500">Nenhum lançamento encontrado para o período.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {lancamentos.length > 0 && (
                    <div className="mt-6 text-right">
                         <button 
                            onClick={handleExport}
                            disabled={isExporting}
                            className="px-5 py-2.5 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 disabled:opacity-50"
                        >
                            {isExporting ? 'Gerando...' : '2. Gerar CSV para Emissão Manual'}
                        </button>
                    </div>
                )}
            </div>
            
            {/* Seção de Documentos Emitidos (reutilizando o componente) */}
            <div className="mt-8">
                {selectedClienteId ? (
                    <DocumentosCliente clienteId={selectedClienteId} clienteNome={clienteData?.nome} />
                ) : (
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <p className="text-center text-gray-500">Selecione um cliente para ver o histórico de documentos.</p>
                    </div>
                )}
            </div>
        </div>
    );
}