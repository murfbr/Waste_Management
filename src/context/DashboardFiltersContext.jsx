// src/context/DashboardFiltersContext.jsx
import React, { createContext, useState, useMemo, useContext, useEffect } from 'react';
import AuthContext from './AuthContext'; // Usado para inicializar selectedClienteIds com base nos clientes permitidos

const MESES_COMPLETOS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const DashboardFiltersContext = createContext(null);

export const DashboardFiltersProvider = ({ children }) => {
    // Obtém userAllowedClientes do AuthContext APENAS para inicializar selectedClienteIds
    // e para a lógica do selectAllClientesToggle.
    // A lista de clientes para renderizar os checkboxes virá diretamente do AuthContext no DashboardFilters.jsx
    const { userAllowedClientes } = useContext(AuthContext);

    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();

    // Estados de SELEÇÃO de filtros, geridos por este contexto
    const [selectedClienteIds, setSelectedClienteIds] = useState([]);
    const [selectAllClientesToggle, setSelectAllClientesToggle] = useState(false); 
    
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonths, setSelectedMonths] = useState([currentMonthIndex]);
    const [allMonthsSelected, setAllMonthsSelected] = useState(false); 
    
    const [availableAreas, setAvailableAreas] = useState([]); 
    const [selectedAreaLixoZero, setSelectedAreaLixoZero] = useState('ALL');

    // Efeito para inicializar selectedClienteIds e selectAllClientesToggle
    // quando userAllowedClientes (do AuthContext) muda.
    useEffect(() => {
        console.log("FILTERS_CONTEXT: userAllowedClientes (do AuthContext) mudou:", userAllowedClientes);
        if (userAllowedClientes && userAllowedClientes.length > 0) {
            const initialSelectedIds = userAllowedClientes.map(c => c.id);
            setSelectedClienteIds(initialSelectedIds);
            setSelectAllClientesToggle(true); // Seleciona todos se houver clientes
        } else {
            setSelectedClienteIds([]);
            setSelectAllClientesToggle(false);
        }
    }, [userAllowedClientes]);


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
        // NÃO fornece mais userAllowedClientes nem loadingUserClientes
        // Estes virão diretamente do AuthContext para os componentes que precisam deles.
        selectedClienteIds,
        // setSelectedClienteIds, // Expor apenas se PaginaDashboard precisar de o modificar
        selectAllClientesToggle,
        handleClienteSelectionChange,
        handleSelectAllClientesToggleChange,
        
        selectedYear,
        setSelectedYear, 
        selectedMonths,
        // setSelectedMonths, 
        allMonthsSelected,
        onMonthToggle: handleMonthToggle, 
        onSelectAllMonthsToggle: handleSelectAllMonthsToggle,
        
        availableAreas,       
        setAvailableAreas, // PaginaDashboard irá definir isto
        selectedAreaLixoZero,
        setSelectedAreaLixoZero
    }), [
        selectedClienteIds, selectAllClientesToggle, 
        selectedYear, selectedMonths, allMonthsSelected,
        availableAreas, selectedAreaLixoZero
    ]);

    return (
        <DashboardFiltersContext.Provider value={contextValue}>
            {children}
        </DashboardFiltersContext.Provider>
    );
};

export default DashboardFiltersContext;
