// src/utils/csvExport.js

/**
 * Função robusta para exportar um array de objetos para um arquivo CSV.
 * Trata dados ausentes, formata colunas e adiciona um BOM para compatibilidade com Excel.
 *
 * @param {Array<object>} records - Os registros de resíduos a serem exportados.
 * @param {string} clientName - O nome do cliente para usar no nome do arquivo.
 * @param {function} showMessage - Função para exibir mensagens na UI.
 */
export const exportToCsv = (records, clientName = 'cliente', showMessage) => {
  if (!records || records.length === 0) {
    showMessage('Não há registros para exportar no período selecionado.', true);
    return;
  }

  // Cabeçalhos claros e completos para o CSV.
  const headers = [
    "Data",
    "Hora",
    "Tipo de Resíduo",
    "Subtipo",
    "Peso (kg)",
    "Área de Lançamento",
    "Status",
    "Lançado por (Email)",
    "ID do Usuário"
  ];

  let csvContent = headers.join(";") + "\n";

  // Itera sobre cada registro para construir uma linha do CSV.
  records.forEach(record => {
    const recordDate = new Date(record.timestamp);

    // Combina o tipo principal com o subtipo, se existir.
    const fullWasteType = record.wasteSubType
      ? `${record.wasteType} (${record.wasteSubType})`
      : record.wasteType;

    const row = [
      recordDate.toLocaleDateString('pt-BR'), // Coluna "Data"
      recordDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), // Coluna "Hora"
      record.wasteType || '', // Garante que não haverá 'null' ou 'undefined'
      record.wasteSubType || '', // Coluna "Subtipo" separada
      (record.peso || 0).toFixed(2).replace('.', ','), // Formata o peso com vírgula
      record.areaLancamento || 'N/A', // Trata área ausente
      record.isPending ? 'Pendente' : 'Sincronizado', // Coluna "Status"
      record.userEmail || '', // Email do usuário
      record.userId || '' // ID do usuário
    ];

    // Escapa aspas duplas e envolve cada item em aspas para segurança.
    csvContent += row.map(item => `"${String(item || '').replace(/"/g, '""')}"`).join(";") + "\n";
  });

  // Adiciona o BOM (Byte Order Mark) para garantir que o Excel abra o UTF-8 corretamente.
  const BOM = '\ufeff';
  const finalCsvContent = BOM + csvContent;

  const blob = new Blob([finalCsvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  // Cria um nome de arquivo dinâmico.
  const formattedDate = new Date().toISOString().slice(0, 10);
  const fileName = `Relatorio_Pesagem_${clientName.replace(/\s+/g, '_')}_${formattedDate}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showMessage('Relatório CSV gerado com sucesso!');
};
