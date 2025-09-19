// src/components/app/ReportGeneratorButton.jsx

import React, { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// O componente recebe duas propriedades (props):
// 1. elementIdToCapture: O ID do elemento HTML que queremos "fotografar".
// 2. filters: Um objeto com os filtros, para validação.
export default function ReportGeneratorButton({ elementIdToCapture, filters }) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');

    const handleGenerateReport = () => {
        // Validação simples para garantir que os filtros foram passados
        if (!filters || filters.selectedClienteIds?.length === 0 || filters.selectedYears?.length === 0 || filters.selectedMonths?.length === 0) {
            setError('Por favor, selecione os filtros antes de gerar o relatório.');
            return;
        }

        const reportElement = document.getElementById(elementIdToCapture);

        if (!reportElement) {
            setError(`Erro: Elemento com o ID '${elementIdToCapture}' não foi encontrado.`);
            return;
        }

        setIsGenerating(true);
        setError('');

        html2canvas(reportElement, {
            useCORS: true, // Permite que imagens de outras origens sejam renderizadas
            scale: 2,      // Aumenta a resolução da captura para um PDF de melhor qualidade
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`relatorio-ctrlwaste-${new Date().toLocaleDateString()}.pdf`);
        }).catch(err => {
            setError("Ocorreu um erro ao gerar o PDF.");
            console.error(err);
        }).finally(() => {
            setIsGenerating(false);
        });
    };

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <button 
                onClick={handleGenerateReport} 
                disabled={isGenerating}
                style={{ 
                    padding: '10px 20px', 
                    fontSize: '16px', 
                    cursor: 'pointer',
                    backgroundColor: isGenerating ? '#ccc' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px'
                }}
            >
                {isGenerating ? 'Gerando Relatório...' : 'Gerar Relatório em PDF'}
            </button>
            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        </div>
    );
}