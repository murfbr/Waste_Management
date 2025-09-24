import React, { useState, useEffect, useCallback, useContext } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { FaSeedling } from 'react-icons/fa';
import AuthContext from '../../../context/AuthContext';
// O import abaixo vai buscar o AdminCard do PaginaAdminMaster.
// Vamos melhorar isso no próximo passo, mas por enquanto isso resolve o erro.
import AdminCard from './AdminCard'; 

const VALORES_PADRAO_2025 = {
    composicaoGravimetricaNacional: {
        "Papel / Papelão": 54,
        "Plásticos (mix)": 27,
        "Metais": 6,
        "Vidro": 13,
    },
    fatoresEmissaoEvitada: {
        "Papel / Papelão": -2.15,
        "Plástico (Mix)": -1.29,
        "PET": -1.76,
        "Aluminio": -8.11,
        "Aço": -1.52,
        "Vidro": -0.27,
        "Geral (Média Ponderada)": -1.85,
    },
    fatoresEmissaoDireta: {
        "aterro-organico": 1.15,
        "aterro-rejeito": 0.78,
        "aterro-papel": 1.34,
        "compostagem": 0.05,
        "incineracao": 0.95,
        "biometanizacao": 0.03,
    },
};

const SectionTitle = ({ children }) => <h4 className="text-md font-lexend font-semibold text-rich-soil border-b border-early-frost pb-2 mb-3">{children}</h4>;
const InputGroup = ({ label, value, onChange, type = 'number', step = '0.01', unit }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="mt-1 relative rounded-md shadow-sm">
            <input type={type} step={step} value={value} onChange={onChange} className="w-full p-2 border border-gray-300 rounded-md sm:text-sm" />
            {unit && <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500">{unit}</span>}
        </div>
    </div>
);

export default function ConfigEmissoesCard() {
    const { db } = useContext(AuthContext);
    const [ano, setAno] = useState(new Date().getFullYear());
    const [config, setConfig] = useState(VALORES_PADRAO_2025);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState({ message: '', type: '' });

    const fetchConfig = useCallback(async (anoSelecionado) => {
        if (!db) return;
        setIsLoading(true);
        setStatus({ message: '', type: '' });
        const docRef = doc(db, 'emissoesConfig', `config_${anoSelecionado}`);
        try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setConfig(docSnap.data());
                setStatus({ message: `Configurações de ${anoSelecionado} carregadas.`, type: 'success' });
            } else {
                setConfig(VALORES_PADRAO_2025);
                setStatus({ message: `Nenhuma configuração encontrada para ${anoSelecionado}. Carregando valores padrão.`, type: 'info' });
            }
        } catch (error) {
            console.error("Erro ao buscar configuração:", error);
            setStatus({ message: 'Falha ao carregar dados.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [db]);

    useEffect(() => {
        fetchConfig(ano);
    }, [ano, fetchConfig]);

    const handleFieldChange = (section, field, value) => {
        const numericValue = value === '' ? '' : parseFloat(value);
        setConfig(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: numericValue,
            }
        }));
    };

    const handleSave = async () => {
        if (!db) return;
        setIsSaving(true);
        const docRef = doc(db, 'emissoesConfig', `config_${ano}`);
        try {
            await setDoc(docRef, { ...config, ano }, { merge: true });
            setStatus({ message: 'Configurações salvas com sucesso!', type: 'success' });
        } catch (error) {
            console.error("Erro ao salvar configuração:", error);
            setStatus({ message: 'Falha ao salvar. Verifique o console.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };
    
    const availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + 1 - i);

    return (
        <AdminCard
            icon={<FaSeedling className="h-8 w-8 text-white" />}
            title="Configurações de Emissões de Carbono"
            description="Gerencie os fatores de emissão e a composição gravimétrica nacional por ano."
            className="col-span-1 md:col-span-2 lg:col-span-3"
        >
            {/* O CONTEÚDO DO CARD PERMANECE O MESMO */}
            <div className="flex items-center gap-4 mb-6">
                <label htmlFor="ano-selector" className="block text-sm font-medium text-gray-700">Ano de Referência:</label>
                <select id="ano-selector" value={ano} onChange={(e) => setAno(parseInt(e.target.value, 10))} className="px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>
            {isLoading ? <p>Carregando...</p> : (
                <div className="space-y-6">
                    <div>
                        <SectionTitle>Composição Gravimétrica Média (Nacional)</SectionTitle>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(config.composicaoGravimetricaNacional).map(([key, value]) => (
                                <InputGroup
                                    key={key}
                                    label={key}
                                    value={value}
                                    onChange={(e) => handleFieldChange('composicaoGravimetricaNacional', key, e.target.value)}
                                    unit="%"
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <SectionTitle>Fatores de Emissões Evitadas (Reciclagem)</SectionTitle>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(config.fatoresEmissaoEvitada).map(([key, value]) => (
                                <InputGroup
                                    key={key}
                                    label={key}
                                    value={value}
                                    onChange={(e) => handleFieldChange('fatoresEmissaoEvitada', key, e.target.value)}
                                    unit="t CO₂e / t"
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <SectionTitle>Fatores de Emissão Direta (Aterro, Incineração, etc.)</SectionTitle>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(config.fatoresEmissaoDireta).map(([key, value]) => (
                                <InputGroup
                                    key={key}
                                    label={key.replace('aterro-', 'Aterro ')}
                                    value={value}
                                    onChange={(e) => handleFieldChange('fatoresEmissaoDireta', key, e.target.value)}
                                    unit="t CO₂e / t"
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
            <div className="mt-6 flex items-center justify-end gap-4">
                {status.message && (
                    <p className={`text-sm ${status.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{status.message}</p>
                )}
                <button onClick={handleSave} disabled={isSaving || isLoading} className="w-48 h-10 bg-blue-coral text-white font-lexend py-2 px-4 rounded-md hover:opacity-90 disabled:bg-early-frost">
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>
        </AdminCard>
    );
}