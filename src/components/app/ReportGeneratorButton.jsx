import React, { useState } from 'react';

// NOTE: Não precisamos mais de jsPDF ou html2canvas aqui. O frontend ficou mais simples.

export default function ReportGeneratorButton({ filters, clienteNames }) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleGenerateReport = async () => {
        // Limpa mensagens antigas
        setError('');
        setSuccessMessage('');

        // Validação simples para garantir que os filtros foram selecionados
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
            // Monta o pacote de dados para enviar ao backend.
            // Vamos enviar apenas o primeiro cliente e ano selecionado por enquanto para simplificar.
            const reportPayload = {
                clienteId: filters.selectedClienteIds[0],
                ano: filters.selectedYears[0],
                nomeCliente: clienteNames,
                // Adicione outros filtros que o backend precise, como `meses: filters.selectedMonths`
            };

            // 2. Chamar a nossa API no backend
            const response = await fetch('/api/generate-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reportPayload),
            });

            // Se a resposta NÃO for um PDF, significa que houve um erro no backend.
            if (response.headers.get("Content-Type") !== "application/pdf") {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ocorreu um erro no servidor.');
            }

            // 3. Se a resposta for um PDF, processa o download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `relatorio-${clienteNames.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            
            // Limpa o link temporário
            a.remove();
            window.URL.revokeObjectURL(url);
            
            setSuccessMessage("Relatório gerado com sucesso!");

        } catch (err) {
            setError(err.message);
            console.error("Erro ao chamar a API de relatório:", err);
        } finally {
            setIsGenerating(false);
        }
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
            {successMessage && <p style={{ color: 'green', marginTop: '10px' }}>{successMessage}</p>}
        </div>
    );
}