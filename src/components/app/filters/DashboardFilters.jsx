// src/components/app/filters/DashboardFilters.jsx

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MonthSelector from './MonthSelector';
import AreaSelector from './AreaSelector';
import YearSelector from './YearSelector';

// Ícones
const FilterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>;
const ChevronDownIcon = ({ isOpen }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-6 w-6 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);

export default function DashboardFilters({ 
    selectedYears, 
    onYearToggle, 
    availableYears, 
    selectedMonths, 
    onSelectedMonthsChange,
    selectedAreas, 
    onSelectedAreasChange,
    availableAreas, // A prop que estamos investigando
    onQuickPeriodSelect,
}) {

    const { t } = useTranslation('dashboard');
    const [isExpanded, setIsExpanded] = useState(true);
    const [activePeriod, setActivePeriod] = useState('thisMonth');

    const handleQuickPeriodClick = (period) => {
        setActivePeriod(period);
        onQuickPeriodSelect(period);
    };
    
    const handleManualChange = (action) => (...args) => {
        setActivePeriod(null); 
        action(...args);
    };

    const hasLastYearData = availableYears.includes(new Date().getFullYear() - 1);

    const FilterButton = ({ period, label }) => (
        <button
            onClick={() => handleQuickPeriodClick(period)}
            className={`px-4 py-2 text-sm font-bold rounded-md transition-all duration-200 transform hover:scale-105
                ${activePeriod === period 
                    ? 'bg-apricot-orange text-white shadow-md' 
                    : 'bg-early-frost bg-opacity-50 text-blue-coral hover:bg-apricot-orange hover:text-white'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="bg-white rounded-lg shadow-lg font-comfortaa">
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex justify-between items-center p-4 text-left"
                aria-expanded={isExpanded}
            >
                <div className="flex items-center">
                    <FilterIcon />
                    <h2 className="font-lexend text-acao text-blue-coral font-semibold">{t('filtersComponent.title')}</h2>
                </div>
                <ChevronDownIcon isOpen={isExpanded} />
            </button>

            {isExpanded && (
                <div className="p-4 border-t border-early-frost">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        <div className="lg:col-span-2">
                             <label className="block text-sm font-bold text-rich-soil mb-2">{t('filtersComponent.quickPeriods.label')}</label>
                            <div className="flex flex-wrap items-center gap-2">
                                <FilterButton period="thisMonth" label={t('filtersComponent.quickPeriods.thisMonth')} />
                                <FilterButton period="last3Months" label={t('filtersComponent.quickPeriods.last3Months')} />
                                <FilterButton period="thisYear" label={t('filtersComponent.quickPeriods.thisYear')} />
                                {hasLastYearData && <FilterButton period="lastYear" label={t('filtersComponent.quickPeriods.lastYear')} />}
                            </div>
                        </div>
                        <YearSelector 
                            availableYears={availableYears}
                            selectedYears={selectedYears}
                            onYearToggle={handleManualChange(onYearToggle)}
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-early-frost">
                        <MonthSelector
                            selectedMonths={selectedMonths}
                            onSelectedMonthsChange={handleManualChange(onSelectedMonthsChange)}
                        />
                        <AreaSelector
                            availableAreas={availableAreas}
                            selectedAreas={selectedAreas}
                            onSelectedAreasChange={handleManualChange(onSelectedAreasChange)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}