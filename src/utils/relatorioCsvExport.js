/**
 * Exporta uma lista de lançamentos brutos para um arquivo CSV para fins de auditoria.
 * @param {Array} lancamentos - A lista de lançamentos do período.
 * @param {Map} empresasMap - Um mapa de ID da empresa para nomeFantasia.
 * @param {Object} clienteData - Os dados do cliente selecionado (usado para o nome do arquivo).
 */
export const exportarParaAuditoriaCSV = (lancamentos, empresasMap, clienteData) => {
  try {
    // 1. Define os cabeçalhos do CSV
    const headers = [
      'Data',
      'Hora',
      'Área de Lançamento',
      'Tipo de Resíduo',
      'Subtipo de Resíduo',
      'Peso (kg)',
      'Empresa de Coleta'
    ];

    // 2. Mapeia os lançamentos para as linhas do CSV
    const rows = lancamentos.map(record => {
      const data = new Date(record.timestamp);
      const empresaColeta = record.empresaColetaId 
        ? empresasMap.get(record.empresaColetaId) || 'ID não encontrado' 
        : 'N/A';

      // Retorna um array de valores para a linha
      return [
        data.toLocaleDateString('pt-BR'),
        data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        record.areaLancamento || '',
        record.wasteType || '',
        record.wasteSubType || '',
        String(record.peso).replace('.', ','), // Troca ponto por vírgula para padrão Excel brasileiro
        empresaColeta
      ];
    });

    // 3. Monta o conteúdo do arquivo CSV, usando ponto e vírgula como separador
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    // 4. Cria um Blob e aciona o link de download
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    
    const dataFiltro = new Date().toISOString().slice(0, 10);
    const nomeCliente = clienteData?.nome?.replace(/\s+/g, '_') || 'cliente';
    link.setAttribute("download", `auditoria_lancamentos_${nomeCliente}_${dataFiltro}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (error) {
    console.error("Erro ao gerar o arquivo CSV de auditoria:", error);
    alert("Ocorreu um erro ao gerar o arquivo CSV. Verifique o console para mais detalhes.");
  }
};