// src/components/app/DashboardFilters.jsx

import React, { useState, useEffect, useRef } from 'react';
import MonthSelector from './MonthSelector';

// Ícones
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const MapPinIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-400"><polyline points="6 9 12 15 18 9"></polyline></svg>;

// Componente Dropdown para as Áreas (Lógica de texto atualizada)
const AreaFilterDropdown = ({ availableAreas = [], selectedAreas = [], onSelectedAreasChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelection = (area) => {
        const newSelection = selectedAreas.includes(area) ? selectedAreas.filter(a => a !== area) : [...selectedAreas, area];
        onSelectedAreasChange(newSelection);
    };

    const handleSelectAll = () => {
        onSelectedAreasChange(selectedAreas.length === availableAreas.length ? [] : availableAreas);
    };
    
    // LÓGICA ATUALIZADA: Exibe "Todas as Áreas" quando tudo está selecionado
    const displayValue = (selectedAreas.length === availableAreas.length && availableAreas.length > 0)
        ? "Todas as Áreas"
        : selectedAreas.length === 0 ? "Todas as Áreas"
        : selectedAreas.length === 1 ? selectedAreas[0]
        : `${selectedAreas.length} áreas selecionadas`;

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm">
                <span className="flex items-center"><MapPinIcon /> {displayValue}</span>
                <ChevronDownIcon />
            </button>
            {isOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white rounded-md shadow-lg border">
                    <ul className="max-h-60 overflow-auto p-2">
                        {availableAreas.length > 0 && (
                            <li className="p-2 hover:bg-gray-100 rounded-md"><label className="flex items-center cursor-pointer"><input type="checkbox" className="h-4 w-4 rounded" checked={availableAreas.length > 0 && selectedAreas.length === availableAreas.length} onChange={handleSelectAll} /><span className="ml-3 text-sm">Selecionar Todas</span></label></li>
                        )}
                        {availableAreas.map(area => (
                             <li key={area} className="p-2 hover:bg-gray-100 rounded-md"><label className="flex items-center cursor-pointer"><input type="checkbox" className="h-4 w-4 rounded" checked={selectedAreas.includes(area)} onChange={() => handleSelection(area)} /><span className="ml-3 text-sm">{area}</span></label></li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};


export default function DashboardFilters({ 
    selectedYears, 
    onYearToggle, 
    availableYears, 
    selectedMonths, 
    onSelectedMonthsChange,
    selectedAreas, 
    onSelectedAreasChange,
    availableAreas,
    onQuickPeriodSelect,
}) {
    const [activePeriod, setActivePeriod] = useState('thisMonth');

    const handleQuickPeriodClick = (period) => {
        setActivePeriod(period);
        onQuickPeriodSelect(period);
    };
    
    const handleManualYearToggle = (year) => {
        setActivePeriod(null); 
        onYearToggle(year);
    };
    
    const handleManualMonthChange = (months) => {
        setActivePeriod(null);
        onSelectedMonthsChange(months);
    };

    const hasLastYearData = availableYears.includes(new Date().getFullYear() - 1);

    const FilterButton = ({ period, label }) => (
        <button
            onClick={() => handleQuickPeriodClick(period)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                ${activePeriod === period ? 'bg-indigo-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm space-y-6">
            {/* LAYOUT ATUALIZADO: Períodos rápidos no topo */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                 <span className="flex items-center text-sm font-semibold text-gray-700 mb-2 sm:mb-0 flex-shrink-0">
                    <CalendarIcon /> Períodos Rápidos
                </span>
                <div className="flex items-center p-1 bg-gray-100 rounded-lg w-full sm:w-auto">
                    <FilterButton period="thisMonth" label="Este Mês" />
                    <FilterButton period="last3Months" label="Últimos 3 Meses" />
                    <FilterButton period="thisYear" label="Este Ano" />
                    {/* Botão condicional */}
                    {hasLastYearData && <FilterButton period="lastYear" label="Ano Passado" />}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-gray-200 pt-6">
                {/* Coluna da Esquerda: Filtro de Áreas */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Filtrar por Área</label>
                    <AreaFilterDropdown
                        availableAreas={availableAreas}
                        selectedAreas={selectedAreas}
                        onSelectedAreasChange={onSelectedAreasChange}
                    />
                </div>

                {/* Coluna da Direita: Seleção Manual */}
                <div className="space-y-4">
                    <MonthSelector
                        selectedMonths={selectedMonths}
                        onSelectedMonthsChange={handleManualMonthChange}
                        availableYears={availableYears}
                        selectedYears={selectedYears}
                        onYearToggle={handleManualYearToggle}
                    />
                </div>
            </div>
        </div>
    );
}
