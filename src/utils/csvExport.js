// src/utils/csvExport.js

/**
 * Função para exportar um array de objetos para um arquivo CSV.
 *
 * @param {Array} records - Um array de objetos de registro de resíduos a serem exportados.
 * @param {function} showMessage - Função para exibir mensagens na UI (sucesso/erro).
 */
export const exportToCsv = (records, showMessage) => {
    // Verifica se há registros para exportar.
    if (records.length === 0) {
        showMessage('Não há registros para exportar.', true);
        return;
    }

    // Define o cabeçalho do CSV.
    // ALTERAÇÃO AQUI: "Data e Hora" foi dividido em "Data" e "Hora".
    const headers = ["Area", "Tipo de Resíduo", "Peso (kg)", "Data", "Hora", "ID do Usuário"];
    // Inicia o conteúdo CSV com o cabeçalho, unido por ponto e vírgula, seguido de uma nova linha.
    let csvContent = headers.join(";") + "\n";

    // Itera sobre cada registro para formatar os dados e adicioná-los ao conteúdo CSV.
    records.forEach(record => {
        // Cria um objeto Date a partir do timestamp para formatar data e hora separadamente.
        const recordDate = new Date(record.timestamp);

        const row = [
            record.area,
            record.wasteType,
            record.weight,
            // ALTERAÇÃO AQUI: Converte apenas a parte da data para uma string legível.
            recordDate.toLocaleDateString('pt-BR'),
            // ALTERAÇÃO AQUI: Converte apenas a parte da hora para uma string legível.
            recordDate.toLocaleTimeString('pt-BR'),
            record.userId
        ];
        // Mapeia cada item da linha:
        // 1. Converte o item para string.
        // 2. Escapa quaisquer aspas duplas dentro do item (substitui " por "").
        // 3. Envolve o item em aspas duplas para garantir que valores com vírgulas ou pontos e vírgulas
        //    não quebrem a estrutura do CSV.
        // 4. Junta os itens da linha com ponto e vírgula.
        csvContent += row.map(item => `"${String(item).replace(/"/g, '""')}"`).join(";") + "\n";
    });

    // Adicionando o BOM para UTF-8.
    // O Byte Order Mark (BOM) para UTF-8 é '\ufeff'.
    // Ele é adicionado no início do conteúdo CSV para indicar a codificação.
    const BOM = '\ufeff';
    const finalCsvContent = BOM + csvContent;

    // Cria um Blob (objeto de dados imutável) com o conteúdo CSV.
    // Define o tipo MIME como 'text/csv' e o charset como 'utf-8' para garantir a codificação correta.
    const blob = new Blob([finalCsvContent], { type: 'text/csv;charset=utf-8;' });
    // Cria um URL temporário para o Blob. Este URL pode ser usado para download.
    const url = URL.createObjectURL(blob);

    // Cria um elemento <a> (link) temporário no DOM.
    const link = document.createElement('a');
    // Define o atributo 'href' do link para o URL do Blob, que será o arquivo a ser baixado.
    link.setAttribute('href', url);
    // Define o atributo 'download' para sugerir um nome de arquivo ao navegador.
    link.setAttribute('download', 'registros_residuos.csv');

    // Adiciona o link ao corpo do documento (necessário para que o clique funcione em alguns navegadores).
    document.body.appendChild(link);
    // Simula um clique no link para iniciar o download do arquivo.
    link.click();
    // Remove o link temporário do DOM após o clique.
    document.body.removeChild(link);
    // Libera o URL do Blob, pois ele não é mais necessário.
    URL.revokeObjectURL(url);

    // Exibe uma mensagem de sucesso na interface do usuário.
    showMessage('Dados exportados para CSV com sucesso!');
};
