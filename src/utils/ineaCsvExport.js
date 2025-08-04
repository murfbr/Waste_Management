import Papa from 'papaparse';

// Mapeamentos simplificados baseados nos seus tipos de resíduo.
// O ideal é que venham dos seus "modelos" no futuro.
const mapeamentoResiduos = {
    'Reciclável': { acondicionamento: 'Caixa de papelão', classe: 'Classe II A - Não Inertes', tecnologia: 'Reciclagem' },
    'Orgânico': { acondicionamento: 'Contentor plástico', classe: 'Classe II A - Não Inertes', tecnologia: 'Compostagem' },
    'Rejeito': { acondicionamento: 'Saco de lixo', classe: 'Classe II B - Inertes', tecnologia: 'Aterro Sanitário' }
};

/**
 * Consolida registros e gera um CSV para preenchimento manual no INEA.
 * @param {Array} records - A lista de registros de pesagem (unifiedRecords).
 * @param {Object} cliente - O objeto do cliente selecionado.
 * @param {Array} empresasColeta - A lista de todas as empresas de coleta disponíveis.
 */
export function exportarParaIneaCSV(records, cliente, empresasColeta, showMessage) {
    if (!records || records.length === 0) {
        showMessage('Não há registros para exportar.', true);
        return;
    }

    try {
        const transportadorMap = new Map(empresasColeta.map(e => [e.id, e]));

        // 1. Agrupar registros por transportador e tipo principal
        const mtrsAgrupados = records.reduce((acc, record) => {
            const transportadorId = record.empresaColetaId || 'sem_transportador';
            const chave = `${transportadorId}_${record.wasteType}`;

            if (!acc[chave]) {
                const transportador = transportadorMap.get(transportadorId);
                const destInfo = transportador?.destinacoes?.[record.wasteType]?.[0] || 'Não especificada';

                acc[chave] = {
                    info: {
                        'Data Emissão MTR': new Date().toLocaleDateString('pt-BR'),
                        'Gerador (Cliente)': cliente.nome,
                        'CNPJ Gerador': cliente.cnpj,
                        'Transportador': transportador ? transportador.nomeFantasia : 'N/A',
                        'CNPJ Transportador': transportador ? transportador.cnpj : 'N/A',
                        'Placa Veículo': '', // Campo para preenchimento manual
                        'Nome Motorista': '', // Campo para preenchimento manual
                        'Destinação': destInfo,
                    },
                    items: []
                };
            }
            acc[chave].items.push(record);
            return acc;
        }, {});

        // 2. Montar os dados para o CSV
        const csvData = [];
        for (const chave in mtrsAgrupados) {
            const mtr = mtrsAgrupados[chave];
            
            // Adiciona uma linha de cabeçalho para cada MTR diferente
            csvData.push(['--- INÍCIO MTR ---']);
            Object.entries(mtr.info).forEach(([key, value]) => {
                csvData.push([key, value]);
            });
            
            // Adiciona os cabeçalhos dos itens
            csvData.push([
                'Tipo de Resíduo', 
                'Detalhe do Resíduo', 
                'Quantidade (kg)', 
                'Acondicionamento Sugerido', 
                'Classe Sugerida',
                'Tecnologia Sugerida'
            ]);

            // Adiciona as linhas de itens
            mtr.items.forEach(item => {
                const mapping = mapeamentoResiduos[item.wasteType] || {};
                csvData.push([
                    item.wasteType,
                    item.wasteSubType || '-',
                    String(item.peso).replace('.', ','), // Formato brasileiro
                    mapping.acondicionamento || 'Não definido',
                    mapping.classe || 'Não definida',
                    mapping.tecnologia || 'Não definida'
                ]);
            });
            csvData.push(['--- FIM MTR ---']);
            csvData.push([]); // Linha em branco para separar
        }

        // 3. Gerar e baixar o CSV
        const csvString = Papa.unparse(csvData, { header: false });
        const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `MTR_Manual_${cliente.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showMessage('CSV para o INEA gerado com sucesso!');

    } catch (error) {
        console.error("Erro ao gerar CSV para o INEA:", error);
        showMessage('Falha ao gerar o arquivo CSV.', true);
    }
}