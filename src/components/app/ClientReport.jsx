    import React from 'react';
    
    // Este é o nosso template de relatório, em formato de componente React.
    // Ele será renderizado fora do ecrã, apenas para ser capturado para o PDF.
    const ClientReport = React.forwardRef(({ clienteData, recordsData, ano }, ref) => {
      if (!clienteData || !recordsData) {
        return null;
      }
    
      // Lógica para processar os dados (pode ser expandida)
      const pesoTotal = recordsData.reduce((acc, record) => acc + (record.peso || 0), 0);
      
      return (
        <div ref={ref} style={{ width: '210mm', minHeight: '297mm', padding: '20mm', backgroundColor: 'white', color: 'black' }}>
          <div style={{ textAlign: 'center', borderBottom: '1px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>
            <h1>Relatório de Gestão de Resíduos</h1>
            <p>{clienteData.nome} - Relatório Anual de {ano}</p>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <h2>Visão Geral</h2>
            <p><strong>Peso Total Gerado:</strong> {pesoTotal.toFixed(2)} kg</p>
            <p><strong>Total de Lançamentos:</strong> {recordsData.length}</p>
          </div>
    
          {/* Espaço para futuros gráficos */}
          <div>
            <h2>Análise Detalhada</h2>
            <p><i>(Gráficos e tabelas detalhadas podem ser adicionados aqui no futuro)</i></p>
          </div>
          
          <div style={{ marginTop: '40px', paddingTop: '10px', borderTop: '1px solid #ccc', textAlign: 'center', fontSize: '12px' }}>
            <p>Relatório gerado em {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      );
    });
    
    export default ClientReport;
