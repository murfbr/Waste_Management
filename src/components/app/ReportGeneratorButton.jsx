    import React, { useState, useRef } from 'react';
    import html2canvas from 'html2canvas';
    import jsPDF from 'jspdf';
    import ClientReport from './ClientReport';
    
    // O botão agora recebe os dados diretamente do dashboard
    export default function ReportGeneratorButton({ clienteData, recordsData, ano }) {
        const [isGenerating, setIsGenerating] = useState(false);
        const reportRef = useRef();
    
        const handleGenerateReport = async () => {
            if (!reportRef.current) {
                alert("O componente do relatório não está pronto.");
                return;
            }
    
            setIsGenerating(true);
            
            try {
                const canvas = await html2canvas(reportRef.current, {
                    scale: 2, // Melhora a resolução da imagem capturada
                    useCORS: true
                });
    
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });
    
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`relatorio_${clienteData.nome}_${ano}.pdf`);
    
            } catch (error) {
                console.error("Erro ao gerar PDF:", error);
                alert("Ocorreu um erro ao gerar o PDF.");
            } finally {
                setIsGenerating(false);
            }
        };
    
        return (
            <div>
                {/* O botão que o utilizador vê e clica */}
                <button
                    onClick={handleGenerateReport}
                    disabled={isGenerating || !clienteData || !recordsData || recordsData.length === 0}
                    className="px-4 py-2 bg-blue-coral hover:bg-exotic-plume text-white font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-coral disabled:opacity-50"
                >
                    {isGenerating ? 'A Gerar...' : 'Gerar Relatório em PDF'}
                </button>
                
                {/* O componente do relatório, escondido fora do ecrã, pronto para ser "fotografado" */}
                <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1 }}>
                    <ClientReport
                        ref={reportRef}
                        clienteData={clienteData}
                        recordsData={recordsData}
                        ano={ano}
                    />
                </div>
            </div>
        );
    }
    

