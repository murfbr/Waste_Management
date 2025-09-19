    import React, { useState } from 'react';

    export default function ReportGeneratorButton({ filters, clienteNames }) {
        const [isGenerating, setIsGenerating] = useState(false);
        const [error, setError] = useState('');

        const handleGenerateReport = async () => {
            setError('');
            if (!filters || !filters.selectedClienteIds || filters.selectedClienteIds.length === 0) {
                setError('Por favor, selecione pelo menos um cliente.');
                return;
            }
            if (!filters.selectedYears || filters.selectedYears.length === 0) {
                setError('Por favor, selecione pelo menos um ano.');
                return;
            }
            setIsGenerating(true);
            try {
                const reportPayload = {
                    clienteId: filters.selectedClienteIds[0],
                    ano: filters.selectedYears[0],
                };
                const response = await fetch('/api/generate-report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(reportPayload),
                });
                if (response.headers.get("Content-Type") !== "application/pdf") {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Ocorreu um erro no servidor.');
                }
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const safeClienteName = (clienteNames || 'relatorio').replace(/[^a-zA-Z0-9]/g, '_');
                a.download = `relatorio_${reportPayload.ano}_${safeClienteName}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } catch (err) {
                setError(err.message);
                console.error("Erro ao chamar a API de relatório:", err);
            } finally {
                setIsGenerating(false);
            }
        };

        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <button onClick={handleGenerateReport} disabled={isGenerating} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', backgroundColor: isGenerating ? '#ccc' : '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>
                    {isGenerating ? 'A gerar Relatório...' : 'Gerar Relatório em PDF'}
                </button>
                {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
            </div>
        );
    }
    
