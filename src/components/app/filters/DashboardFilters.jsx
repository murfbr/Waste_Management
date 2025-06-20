// Salve este código como: src/components/app/DashboardFilters.jsx

import React, { useState, useEffect, useRef } from 'react';

// Ícones (substitua por sua biblioteca de ícones preferida, como lucide-react ou heroicons)
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const MapPinIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-400"><polyline points="6 9 12 15 18 9"></polyline></svg>;

// Componente Dropdown para as Áreas
const AreaFilterDropdown = ({ availableAreas = [], selectedAreas = [], onSelectedAreasChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelection = (area) => {
        const newSelection = selectedAreas.includes(area)
            ? selectedAreas.filter(a => a !== area)
            : [...selectedAreas, area];
        onSelectedAreasChange(newSelection);
    };

    const handleSelectAll = () => {
        if (selectedAreas.length === availableAreas.length) {
            onSelectedAreasChange([]);
        } else {
            onSelectedAreasChange(availableAreas);
        }
    };
    
    const displayValue = selectedAreas.length === 0 ? "Todas as Áreas" 
        : selectedAreas.length === 1 ? selectedAreas[0]
        : `${selectedAreas.length} áreas selecionadas`;

    return (
        <div className="relative w-full md:w-64" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm">
                <span className="flex items-center"><MapPinIcon /> {displayValue}</span>
                <ChevronDownIcon />
            </button>
            {isOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white rounded-md shadow-lg border">
                    <ul className="max-h-60 overflow-auto p-2">
                        {Array.isArray(availableAreas) && availableAreas.length > 0 && (
                            <li className="p-2 hover:bg-gray-100 rounded-md">
                                <label className="flex items-center cursor-pointer">
                                    <input type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        checked={availableAreas.length > 0 && selectedAreas.length === availableAreas.length}
                                        onChange={handleSelectAll}
                                    />
                                    <span className="ml-3 text-sm text-gray-700">Selecionar Todas</span>
                                </label>
                            </li>
                        )}
                        {Array.isArray(availableAreas) && availableAreas.map(area => (
                             <li key={area} className="p-2 hover:bg-gray-100 rounded-md">
                                <label className="flex items-center cursor-pointer">
                                     <input type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        checked={selectedAreas.includes(area)}
                                        onChange={() => handleSelection(area)}
                                     />
                                     <span className="ml-3 text-sm text-gray-700">{area}</span>
                                </label>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

// Componente principal de Filtros
export default function DashboardFilters({ 
    availableAreas, 
    selectedAreas, 
    onSelectedAreasChange = () => {},
    onDateChange = () => {}
}) {
    const [activePeriod, setActivePeriod] = useState('thisMonth');

    const setPeriod = (period) => {
        setActivePeriod(period);
        const now = new Date();
        let year = now.getFullYear();
        let months = [];

        switch (period) {
            case 'thisMonth':
                months = [now.getMonth()];
                break;
            case 'last3Months':
                months = [];
                let tempDateThreeMonths = new Date();
                year = tempDateThreeMonths.getFullYear(); // Começa com o ano atual
                for (let i = 0; i < 3; i++) {
                    months.push(tempDateThreeMonths.getMonth());
                    tempDateThreeMonths.setMonth(tempDateThreeMonths.getMonth() - 1);
                     // Se o mês mudou para 11 (Dezembro), significa que o ano mudou
                    if (tempDateThreeMonths.getMonth() === 11 && months.includes(0)) {
                        year = now.getFullYear() -1;
                    }
                }
                months = [...new Set(months)]; // Garante meses únicos
                break;
            case 'thisYear':
                year = now.getFullYear();
                months = Array.from({ length: 12 }, (_, i) => i);
                break;
            case 'lastYear':
                year = now.getFullYear() - 1;
                months = Array.from({ length: 12 }, (_, i) => i);
                break;
            default:
                months = [now.getMonth()];
        }
        onDateChange({ year, months });
    };
    
    useEffect(() => {
        setPeriod('thisMonth');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const FilterButton = ({ period, label }) => (
        <button
            onClick={() => setPeriod(period)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                ${activePeriod === period
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
        >
            {label}
        </button>
    );

    return (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtros</h3>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center text-sm font-semibold text-gray-700 mr-2"><CalendarIcon /> Período</span>
                    <div className="flex items-center p-1 bg-gray-200 rounded-lg">
                        <FilterButton period="thisMonth" label="Este Mês" />
                        <FilterButton period="last3Months" label="Últimos 3 Meses" />
                        <FilterButton period="thisYear" label="Este Ano" />
                        <FilterButton period="lastYear" label="Ano Passado" />
                    </div>
                </div>

                <div className="flex items-center">
                    <AreaFilterDropdown
                        availableAreas={availableAreas}
                        selectedAreas={selectedAreas}
                        onSelectedAreasChange={onSelectedAreasChange}
                    />
                </div>
            </div>
        </div>
    );
}
