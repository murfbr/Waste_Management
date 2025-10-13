import React, { createContext, useState, useContext, useCallback } from 'react';

const DashboardFilterContext = createContext();
const TODOS_OS_MESES_INDICES = Array.from({ length: 12 }, (_, i) => i);

export function DashboardFilterProvider({ children }) {
  const now = new Date();
  const [selectedYears, setSelectedYears] = useState([now.getFullYear()]);
  const [selectedMonths, setSelectedMonths] = useState([now.getMonth()]);
  const [selectedAreas, setSelectedAreas] = useState([]);
  
  // AQUI ESTÁ A GARANTIA QUE O BOTÃO COMEÇA SELECIONADO
  const [activePeriod, setActivePeriod] = useState('thisMonth');

  
  const handleManualYearToggle = useCallback((year) => {
    // Ao selecionar ano manual, desmarca o botão "Este Mês"
    setActivePeriod(null);
    setSelectedYears(prev => {
      const newSelection = prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year];
      return newSelection.length === 0 ? prev : newSelection;
    });
  }, []);

  const handleManualMonthChange = useCallback((months) => {
    // Ao selecionar mês manual, desmarca o botão "Este Mês"
    setActivePeriod(null);
    setSelectedMonths(months);
  }, []);

  const handleManualAreaChange = useCallback((areas) => {
    // A seleção de área NÃO mexe na seleção de período rápido
    setSelectedAreas(areas);
  }, []);

  const handleQuickPeriodSelect = useCallback((period) => {
    setActivePeriod(period);
    const currentDate = new Date();
    let years = [];
    let months = [];

    switch (period) {
      case 'thisMonth':
        years = [currentDate.getFullYear()];
        months = [currentDate.getMonth()];
        break;
      case 'last3Months':
        let tempDate = new Date();
        for (let i = 0; i < 3; i++) { 
          years.push(tempDate.getFullYear()); 
          months.push(tempDate.getMonth()); 
          tempDate.setMonth(tempDate.getMonth() - 1); 
        }
        years = [...new Set(years)]; 
        months = [...new Set(months)];
        break;
      case 'thisYear':
        years = [currentDate.getFullYear()]; 
        months = TODOS_OS_MESES_INDICES;
        break;
      case 'lastYear':
        years = [currentDate.getFullYear() - 1]; 
        months = TODOS_OS_MESES_INDICES;
        break;
      default:
        years = [currentDate.getFullYear()]; 
        months = [currentDate.getMonth()];
    }
    setSelectedYears(years);
    setSelectedMonths(months);
  }, []);

  const value = {
    selectedYears,
    selectedMonths,
    selectedAreas,
    activePeriod,
    handleManualYearToggle,
    handleManualMonthChange,
    handleManualAreaChange,
    handleQuickPeriodSelect,
  };

  return (
    <DashboardFilterContext.Provider value={value}>
      {children}
    </DashboardFilterContext.Provider>
  );
}

export const useDashboardFilters = () => {
  const context = useContext(DashboardFilterContext);
  if (context === undefined) {
    throw new Error('useDashboardFilters must be used within a DashboardFilterProvider');
  }
  return context;
};