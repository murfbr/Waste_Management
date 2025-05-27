// src/context/DashboardFiltersContext.jsx
import React, { createContext, useState, useMemo, useContext, useEffect } from 'react';
import AuthContext from './AuthContext'; 
import { collection, query, where, getDocs, documentId, orderBy } from 'firebase/firestore'; // Importações não usadas aqui, podem ser removidas

const MESES_COMPLETOS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const DashboardFiltersContext = createContext(null);

export const DashboardFiltersProvider = ({ children }) => {
    // Obtém userAllowedClientes e o estado de loading DELES do AuthContext
    const { userAllowedClientes, loadingAllowedClientes } = useContext(AuthContext);

    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();

    // Estados para os filtros que são geridos por este contexto
    const [selectedClienteIds, setSelectedClienteIds] = useState([]);
    const [selectAllClientesToggle, setSelectAllClientesToggle] = useState(false); 
    
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonths, setSelectedMonths] = useState([currentMonthIndex]);
    const [allMonthsSelected, setAllMonthsSelected] = useState(false); 
    
    const [availableAreas, setAvailableAreas] = useState([]); 
    const [selectedAreaLixoZero, setSelectedAreaLixoZero] = useState('ALL');

    // Efeito para inicializar selectedClienteIds quando userAllowedClientes (do AuthContext) é carregado
    useEffect(() => {
        // console.log("FILTERS_CONTEXT: userAllowedClientes (do AuthContext) mudou:", userAllowedClientes);
        if (userAllowedClientes && userAllowedClientes.length > 0) {
            const initialSelectedIds = userAllowedClientes.map(c => c.id);
            setSelectedClienteIds(initialSelectedIds);
            setSelectAllClientesToggle(true);
        } else {
            setSelectedClienteIds([]);
            setSelectAllClientesToggle(false);
        }
        // Não há mais setLoadingUserClientes(false) aqui. O loading vem do AuthContext.
    }, [userAllowedClientes]); // Depende apenas do userAllowedClientes do AuthContext


    const handleClienteSelectionChange = (clienteId) => {
        setSelectedClienteIds(prev => {
            const newSelection = prev.includes(clienteId)
                ? prev.filter(id => id !== clienteId)
                : [...prev, clienteId];
            if (userAllowedClientes) { 
                setSelectAllClientesToggle(newSelection.length === userAllowedClientes.length && userAllowedClientes.length > 0);
            }
            return newSelection;
        });
    };

    const handleSelectAllClientesToggleChange = () => {
        setSelectAllClientesToggle(prev => {
            const newToggleState = !prev;
            if (newToggleState && userAllowedClientes) {
                setSelectedClienteIds(userAllowedClientes.map(c => c.id));
            } else {
                setSelectedClienteIds([]);
            }
            return newToggleState;
        });
    };

    const handleMonthToggle = (monthIndex) => {
        setSelectedMonths(prev => {
            const newSelection = prev.includes(monthIndex)
                ? prev.filter(m => m !== monthIndex)
                : [...prev, monthIndex];
            setAllMonthsSelected(newSelection.length === MESES_COMPLETOS.length);
            return newSelection;
        });
    };

    const handleSelectAllMonthsToggle = () => {
        setAllMonthsSelected(prev => {
            const newToggleState = !prev;
            if (newToggleState) {
                setSelectedMonths(MESES_COMPLETOS.map((_, index) => index));
            } else {
                setSelectedMonths([]);
            }
            return newToggleState;
        });
    };

    const contextValue = useMemo(() => ({
        // userAllowedClientes não precisa ser exposto por este contexto, 
        // pois DashboardFilters o obterá diretamente do AuthContext.
        loadingUserClientes: loadingAllowedClientes, // USA O ESTADO DE LOADING DO AUTHCONTEXT
        selectedClienteIds,
        setSelectedClienteIds, 
        selectAllClientesToggle,
        handleClienteSelectionChange,
        handleSelectAllClientesToggleChange,
        
        selectedYear,
        setSelectedYear, 
        selectedMonths,
        setSelectedMonths, 
        allMonthsSelected,
        onMonthToggle: handleMonthToggle, 
        onSelectAllMonthsToggle: handleSelectAllMonthsToggle,
        
        availableAreas,       
        setAvailableAreas,    
        selectedAreaLixoZero,
        setSelectedAreaLixoZero

    }), [
        loadingAllowedClientes, // Dependência do AuthContext
        selectedClienteIds, selectAllClientesToggle, 
        selectedYear, selectedMonths, allMonthsSelected,
        availableAreas, selectedAreaLixoZero
        // userAllowedClientes não precisa estar aqui se não for exposto diretamente
    ]);

    return (
        <DashboardFiltersContext.Provider value={contextValue}>
            {children}
        </DashboardFiltersContext.Provider>
    );
};

export default DashboardFiltersContext;
