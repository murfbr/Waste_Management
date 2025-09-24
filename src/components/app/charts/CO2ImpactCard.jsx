import React from 'react';
import { FaLeaf, FaArrowDown, FaArrowUp } from 'react-icons/fa';

// Um componente de ícone para reutilização
const IconWrapper = ({ children, colorClass }) => (
    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${colorClass}`}>
        {children}
    </div>
);

// Formata o número para ter 2 casas decimais e usar vírgula
const formatNumber = (num) => {
    if (typeof num !== 'number') return '0,00';
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function CO2ImpactCard({ data, isLoading }) {
    if (isLoading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
                <p>Calculando impacto de CO₂...</p>
            </div>
        );
    }
    
    const { netImpact, totalEvitadas, totalDiretas, metodologia } = data;

    const isPositiveImpact = netImpact <= 0;
    const netImpactAbs = Math.abs(netImpact);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col h-full">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-lexend font-semibold text-rich-soil">Impacto de Emissões de Carbono</h3>
                    <p className="text-sm text-gray-500 font-comfortaa">Balanço de CO₂e no período</p>
                </div>
                <FaLeaf className="h-6 w-6 text-green-500" />
            </div>

            <div className="my-6 text-center">
                <p className={`text-5xl font-lexend font-bold ${isPositiveImpact ? 'text-rain-forest' : 'text-apricot-orange'}`}>
                    {formatNumber(netImpactAbs)}
                </p>
                <p className="text-lg font-semibold text-gray-700">
                    t CO₂e {isPositiveImpact ? 'Evitadas (Líquido)' : 'Emitidas (Líquido)'}
                </p>
            </div>

            <div className="mt-auto space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <IconWrapper colorClass="bg-green-100">
                            <FaArrowDown className="h-6 w-6 text-green-600" />
                        </IconWrapper>
                        <div className="ml-3">
                            <p className="font-semibold text-rich-soil">Emissões Evitadas</p>
                            <p className="text-sm text-gray-500">Reciclagem e valorização</p>
                        </div>
                    </div>
                    <p className="font-bold text-lg text-green-600">{formatNumber(Math.abs(totalEvitadas))}</p>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <IconWrapper colorClass="bg-red-100">
                            <FaArrowUp className="h-6 w-6 text-red-600" />
                        </IconWrapper>
                        <div className="ml-3">
                            <p className="font-semibold text-rich-soil">Emissões Diretas</p>
                            <p className="text-sm text-gray-500">Aterro, incineração, etc.</p>
                        </div>
                    </div>
                    <p className="font-bold text-lg text-red-600">{formatNumber(totalDiretas)}</p>
                </div>
            </div>
             <p className="text-xs text-center text-gray-400 mt-4">
                {metodologia}
            </p>
        </div>
    );
}