// src/pages/app/PaginaAdminMaster.jsx

import React, { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { getApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';

import AuthContext from '../../context/AuthContext';

// Componente para feedback visual (sucesso ou erro)
const ResultDisplay = ({ result }) => {
    if (!result) return null;
    const isError = result.status === 'error';
    const bgColor = isError ? 'bg-red-100' : 'bg-green-100';
    const textColor = isError ? 'text-red-800' : 'text-green-800';
    const borderColor = isError ? 'border-red-400' : 'border-green-400';

    return (
        <div className={`mt-4 p-4 border-l-4 rounded-r-lg ${bgColor} ${borderColor}`}>
            <p className={`text-sm font-medium ${textColor}`}>{result.message}</p>
        </div>
    );
};

// Ícones
const CalculatorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const ShieldCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.944a11.955 11.955 0 0118-8.944c0-2.622-1.042-5.055-2.932-6.864z" /></svg>;

// Componente de Card
const AdminCard = ({ icon, title, description, children }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-5 bg-blue-coral flex items-center space-x-4">
            <div className="flex-shrink-0 bg-white/20 p-3 rounded-full">{icon}</div>
            <div>
                <h3 className="text-xl font-lexend font-bold text-white">{title}</h3>
                <p className="text-sm text-white/80 font-comfortaa">{description}</p>
            </div>
        </div>
        <div className="p-6">{children}</div>
    </div>
);

const getCurrentYearMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
};

export default function PaginaAdminMaster() {
    const { t } = useTranslation();
    const { userAllowedClientes, loadingAllowedClientes } = useContext(AuthContext);

    // Estados para controlar loading e resultados de cada card
    const [isLoadingRetro, setIsLoadingRetro] = useState(false);
    const [resultRetro, setResultRetro] = useState(null);
    const [isLoadingInea, setIsLoadingInea] = useState(false);
    const [resultInea, setResultInea] = useState(null);
    
    // Estados dos formulários
    const [selectedClientRetro, setSelectedClientRetro] = useState('');
    const [selectedClientInea, setSelectedClientInea] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(getCurrentYearMonth());
    
    // CORREÇÃO: Instanciar as Cloud Functions apontando para a região correta
    const app = getApp();
    const functions = getFunctions(app, "southamerica-east1");
    
    const generateMonthlySummary = httpsCallable(functions, 'generateMonthlySummaryOnDemand');
    const testIneaConnection = httpsCallable(functions, 'testIneaConnection');

    const handleSumMonths = async () => {
        if (!selectedClientRetro || !selectedMonth) return;
        
        setIsLoadingRetro(true);
        setResultRetro(null);

        const [yearStr, monthStr] = selectedMonth.split('-');
        const payload = {
            clienteId: selectedClientRetro,
            ano: parseInt(yearStr, 10),
            mes: parseInt(monthStr, 10) - 1, // 'mes' é 0-indexed no backend (0 = Janeiro)
        };

        try {
            const response = await generateMonthlySummary(payload);
            setResultRetro({ status: 'success', message: response.data.message });
        } catch (error) {
            console.error("Erro ao gerar resumo:", error);
            setResultRetro({ status: 'error', message: `Falha: ${error.message}` });
        } finally {
            setIsLoadingRetro(false);
        }
    };
    
    const handleCheckInea = async () => {
        if (!selectedClientInea) return;

        setIsLoadingInea(true);
        setResultInea(null);

        try {
            const response = await testIneaConnection({ clienteId: selectedClientInea });
            setResultInea({ status: 'success', message: response.data.message });
        } catch (error) {
            console.error("Erro ao testar conexão INEA:", error);
            setResultInea({ status: 'error', message: `Falha: ${error.message}` });
        } finally {
            setIsLoadingInea(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-full font-comfortaa">
            <header className="mb-8">
                <h1 className="text-3xl font-lexend font-bold text-blue-coral">Painel de Administração Master</h1>
                <p className="text-md text-gray-600 mt-1">Ferramentas e funções avançadas para gerenciamento do sistema.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                
                {/* Card 1: Cálculo Retroativo */}
                <AdminCard icon={<CalculatorIcon />} title="Cálculo Retroativo" description="Selecione o cliente e o mês para recalcular os dados do dashboard.">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="client-select-retro" className="block text-sm font-medium text-gray-700 mb-1">Cliente:</label>
                            <select id="client-select-retro" value={selectedClientRetro} onChange={(e) => setSelectedClientRetro(e.target.value)} disabled={loadingAllowedClientes || isLoadingRetro} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-apricot-orange focus:border-apricot-orange disabled:bg-gray-100">
                                <option value="" disabled>{loadingAllowedClientes ? 'Carregando...' : 'Selecione um cliente'}</option>
                                {userAllowedClientes.map(c => (<option key={c.id} value={c.id}>{c.nome}</option>))}
                            </select>
                        </div>

                        <div>
                             <label htmlFor="retro-month" className="block text-sm font-medium text-gray-700 mb-1">Mês para cálculo:</label>
                            <input type="month" id="retro-month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} disabled={isLoadingRetro} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" />
                        </div>

                        <button onClick={handleSumMonths} disabled={!selectedClientRetro || !selectedMonth || isLoadingRetro} className="w-full bg-apricot-orange text-white font-lexend py-2 px-4 rounded-md hover:opacity-90 transition-opacity disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {isLoadingRetro ? 'Processando...' : 'Iniciar Cálculo'}
                        </button>

                        <ResultDisplay result={resultRetro} />
                    </div>
                </AdminCard>

                {/* Card 2: Verificador de Conexão INEA */}
                <AdminCard icon={<ShieldCheckIcon />} title="Verificador de Conexão INEA" description="Teste a conexão com a API do INEA usando as credenciais salvas do cliente.">
                    <div className="space-y-4">
                         <div>
                            <label htmlFor="client-select-inea" className="block text-sm font-medium text-gray-700 mb-1">Cliente:</label>
                            <select id="client-select-inea" value={selectedClientInea} onChange={(e) => setSelectedClientInea(e.target.value)} disabled={loadingAllowedClientes || isLoadingInea} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-apricot-orange focus:border-apricot-orange disabled:bg-gray-100">
                                <option value="" disabled>{loadingAllowedClientes ? 'Carregando...' : 'Selecione um cliente'}</option>
                                {userAllowedClientes.map(c => (<option key={c.id} value={c.id}>{c.nome}</option>))}
                            </select>
                        </div>
                        
                        <button onClick={handleCheckInea} disabled={!selectedClientInea || isLoadingInea} className="w-full bg-apricot-orange text-white font-lexend py-2 px-4 rounded-md hover:opacity-90 transition-opacity disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {isLoadingInea ? 'Verificando...' : 'Testar Conexão'}
                        </button>
                        
                        <ResultDisplay result={resultInea} />
                    </div>
                </AdminCard>
                
                {/* Card Futuro (Placeholder) */}
                 <AdminCard icon={<div className="h-8 w-8 text-white">+</div>} title="Futura Função" description="Este é um espaço reservado para uma nova ferramenta.">
                     <div className="text-center text-gray-500"><p>Aguardando a próxima implementação.</p></div>
                </AdminCard>
            </div>
        </div>
    );
}