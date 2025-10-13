import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaFilter, FaChevronDown } from 'react-icons/fa';
import { useDashboardFilters } from '../../../context/DashboardFilterContext';
import MonthSelector from './MonthSelector';
import AreaSelector from './AreaSelector';
import YearSelector from './YearSelector';

// A linha 'export default' é a chave aqui.
export default function DashboardFilters({ availableYears, areaFilterData }) {
    const { t } = useTranslation('dashboard');
    const [isExpanded, setIsExpanded] = useState(true);

    const { activePeriod, handleQuickPeriodSelect } = useDashboardFilters();

    const FilterButton = ({ period, label }) => (
        <button
            onClick={() => handleQuickPeriodSelect(period)}
            className={`px-4 py-2 text-sm font-bold rounded-md transition-colors duration-200
                ${activePeriod === period 
                    ? 'bg-orange-600 text-white shadow' 
                    : 'bg-sky-100 text-sky-800 hover:bg-orange-500 hover:text-white'}`}
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
                    <FaFilter className="w-5 h-5 mr-2" />
                    <h2 className="font-lexend text-acao text-blue-coral font-semibold">{t('filtersComponent.title')}</h2>
                </div>
                <FaChevronDown className={`h-6 w-6 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
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
                            </div>
                        </div>
                        <YearSelector availableYears={availableYears} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-early-frost">
                        <MonthSelector />
                        <AreaSelector areaFilterData={areaFilterData} />
                    </div>
                </div>
            )}
        </div>
    );
}