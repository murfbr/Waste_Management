// src/services/dashboardProcessor.js

/**
 * @fileoverview Este arquivo centraliza todas as funções de processamento de dados para o dashboard.
 * A ideia é manter a lógica de negócio ("business logic") separada dos componentes de UI ("view logic").
 * Cada função aqui é "pura", ou seja, ela recebe dados como entrada e retorna um novo dado como saída,
 * sem causar efeitos colaterais.
 */

/**
 * Converte uma string para o formato camelCase.
 * É essencial para padronizar chaves de objetos ou para buscar traduções
 * a partir de textos que vêm do banco de dados (ex: "Papelão" -> "papelao").
 * @param {string} str A string de entrada.
 * @returns {string} A string convertida para camelCase.
 */
export const toCamelCaseKey = (str) => {
    if (!str) return 'naoEspecificado';
    // Normaliza a string para remover acentos, converte para minúsculas
    const s = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    // Divide a string por espaços ou hífens
    const parts = s.split(/[\s-]+/);
    // Junta as partes, capitalizando a primeira letra de cada parte exceto a primeira.
    return parts[0] + parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
};

/**
 * Transforma uma lista de registros de resíduos em dados agregados para o gráfico de pizza por TIPO.
 * Ele agrupa os pesos por tipo principal (Orgânico, Reciclável, Rejeito) e também
 * mantém um detalhamento ("breakdown") por subtipos dentro de cada fatia.
 * @param {Array<Object>} records A lista de registros de resíduos vinda do banco de dados.
 * @param {Function} t A função de tradução (t) do i18next, para garantir que os nomes sejam internacionalizados.
 * @returns {Array<Object>} Um array de objetos no formato que o componente de gráfico (Recharts) espera.
 */
export const processDataForAggregatedPieChart = (records, t) => {
    // Implementação da função (a mesma de antes)...
    if (!Array.isArray(records) || records.length === 0) return [];
    const aggregation = records.reduce((acc, record) => {
      if (!record || !record.wasteType) return acc;
      let mainType = record.wasteType;
      let subType = record.wasteSubType;
      const weight = parseFloat(record.peso || 0);
      if (isNaN(weight)) return acc;

      let translatedMainType;
      if (mainType.startsWith('Reciclável')) {
        if (!subType) { const match = mainType.match(/\((.*)\)/); if (match) subType = match[1]; }
        translatedMainType = t('charts:wasteTypes.reciclavel');
      } else if (mainType.startsWith('Orgânico')) {
        if (!subType) { const match = mainType.match(/\((.*)\)/); if (match) subType = match[1]; }
        translatedMainType = t('charts:wasteTypes.organico');
      } else {
        translatedMainType = t(`charts:wasteTypes.${toCamelCaseKey(mainType)}`, mainType);
      }

      const translatedSubType = subType ? t(`charts:wasteSubTypes.${toCamelCaseKey(subType)}`, subType) : translatedMainType;

      if (!acc[translatedMainType]) {
        acc[translatedMainType] = { name: translatedMainType, value: 0, subtypes: {} };
      }
      acc[translatedMainType].value += weight;

      if (!acc[translatedMainType].subtypes[translatedSubType]) {
        acc[translatedMainType].subtypes[translatedSubType] = { name: translatedSubType, value: 0 };
      }
      acc[translatedMainType].subtypes[translatedSubType].value += weight;
      return acc;
    }, {});

    for (const mainType in aggregation) {
        const subtypes = aggregation[mainType].subtypes;
        const subtypeKeys = Object.keys(subtypes);
        if (subtypeKeys.length > 1 && subtypes[mainType]) {
            delete subtypes[mainType];
        }
    }
    return Object.values(aggregation).map(mainCategory => ({
      ...mainCategory,
      value: parseFloat(mainCategory.value.toFixed(2)),
      subtypes: Object.values(mainCategory.subtypes).map(sub => ({ ...sub, value: parseFloat(sub.value.toFixed(2)) })).sort((a, b) => b.value - a.value)
    }));
};


/**
 * Transforma uma lista de registros em dados agregados para o gráfico de pizza por ÁREA.
 * Semelhante à função anterior, mas o agrupamento principal é feito pelo campo `areaLancamento`.
 * O detalhamento ("breakdown") de cada fatia é feito por tipo de resíduo.
 * @param {Array<Object>} records A lista de registros de resíduos.
 * @param {Function} t A função de tradução (t) do i18next.
 * @returns {Array<Object>} Dados formatados para o gráfico de pizza por área.
 */
export const processDataForAreaChartWithBreakdown = (records, t) => {
    // Implementação da função (a mesma de antes)...
    if (!Array.isArray(records) || records.length === 0) return [];
    const aggregation = records.reduce((acc, record) => {
        if (!record || !record.areaLancamento || !record.wasteType) return acc;
        const areaName = record.areaLancamento;
        const weight = parseFloat(record.peso || 0);
        if (isNaN(weight)) return acc;

        let mainWasteType = record.wasteType;
        let translatedWasteType;
        if (mainWasteType.startsWith('Reciclável')) { translatedWasteType = t('charts:wasteTypes.reciclavel'); }
        else if (mainWasteType.startsWith('Orgânico')) { translatedWasteType = t('charts:wasteTypes.organico'); }
        else {
            translatedWasteType = t(`charts:wasteTypes.${toCamelCaseKey(mainWasteType)}`, mainWasteType);
        }

        if (!acc[areaName]) { acc[areaName] = { name: areaName, value: 0, breakdown: {} }; }
        acc[areaName].value += weight;
        if (!acc[areaName].breakdown[translatedWasteType]) { acc[areaName].breakdown[translatedWasteType] = { name: translatedWasteType, value: 0 }; }
        acc[areaName].breakdown[translatedWasteType].value += weight;
        return acc;
    }, {});
    return Object.values(aggregation).map(areaData => ({
        ...areaData,
        value: parseFloat(areaData.value.toFixed(2)),
        breakdown: Object.values(areaData.breakdown).map(b => ({ ...b, value: parseFloat(b.value.toFixed(2)) })).filter(b => b.value > 0).sort((a, b) => b.value - a.value)
    }));
};

/**
 * Calcula a taxa de desvio de aterro ao longo do tempo.
 * A função primeiro agrupa os resíduos por dia, calculando o total e a quantidade de rejeito.
 * Em seguida, calcula a taxa de desvio diária (100% - %rejeito) e a média móvel dessa taxa.
 * @param {Array<Object>} records A lista de registros de resíduos.
 * @param {string} rejectCategoryName O nome exato da categoria de resíduo considerada como "Rejeito".
 * @returns {Array<Object>} Dados formatados para o gráfico de linhas de Desvio de Aterro.
 */
export const processDataForDesvioDeAterro = (records, rejectCategoryName) => {
    // Implementação da função (a mesma de antes)...
    if (!Array.isArray(records) || records.length === 0) return [];
    const dailyDataAggregated = records.reduce((acc, record) => {
        if (!record || !record.timestamp) return acc;
        const recordTimestamp = typeof record.timestamp === 'number' ? record.timestamp : record.timestamp?.toDate?.().getTime();
        if (!recordTimestamp) return acc;
        const dateKey = new Date(recordTimestamp).toISOString().split('T')[0];
        const weight = parseFloat(record.peso || 0);
        if (isNaN(weight)) return acc;
        acc[dateKey] = acc[dateKey] || { total: 0, rejeito: 0 };
        acc[dateKey].total += weight;
        if (record.wasteType === rejectCategoryName) {
            acc[dateKey].rejeito += weight;
        }
        return acc;
    }, {});
    const sortedDailyData = Object.entries(dailyDataAggregated).map(([dateKey, data]) => {
        const percentualRejeito = data.total > 0 ? (data.rejeito / data.total) * 100 : 0;
        const taxaDesvio = 100 - percentualRejeito;
        return {
            dateKey,
            name: new Date(dateKey).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit' }),
            taxaDesvio: parseFloat(taxaDesvio.toFixed(2)),
        };
    }).sort((a, b) => new Date(a.dateKey) - new Date(b.dateKey));
    let acumuladoSomaTaxaDesvio = 0;
    return sortedDailyData.map((dataPoint, index) => {
        acumuladoSomaTaxaDesvio += dataPoint.taxaDesvio;
        const mediaTaxaDesvio = acumuladoSomaTaxaDesvio / (index + 1);
        return { ...dataPoint, mediaTaxaDesvio: parseFloat(mediaTaxaDesvio.toFixed(2)) };
    });
};

/**
 * Prepara os dados para o gráfico de comparação de geração mensal entre diferentes anos.
 * A estrutura de dados resultante é um array de meses, onde cada objeto de mês contém
 * os dados de geração total e o breakdown para cada ano selecionado.
 * @param {Array<Object>} records A lista de registros de resíduos.
 * @param {Function} t A função de tradução (t) do i18next.
 * @returns {Object} Um objeto contendo `{ data, years }`, onde `data` é para o gráfico e `years` é uma lista dos anos encontrados.
 */
export const processDataForMonthlyYearlyComparison = (records, t) => {
    // Implementação da função (a mesma de antes)...
      if (!Array.isArray(records) || !records.length) return { data: [], years: [] };
      const MESES_COMPLETOS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
      const monthlyData = {};
      const RECICLAVEL = t('charts:wasteTypes.reciclavel', 'Reciclável');
      const ORGANICO = t('charts:wasteTypes.organico', 'Orgânico');
      const REJEITO = t('charts:wasteTypes.rejeito', 'Rejeito');
      records.forEach(record => {
        if (!record || !record.timestamp || typeof record.peso !== 'number') return;
        const recordDate = new Date(record.timestamp);
        const recordYear = recordDate.getFullYear();
        const recordMonth = recordDate.getMonth();
        const weight = parseFloat(record.peso || 0);
        if (isNaN(weight)) return;

        if (!monthlyData[recordMonth]) { monthlyData[recordMonth] = {}; }
        if (!monthlyData[recordMonth][recordYear]) {
          monthlyData[recordMonth][recordYear] = {
            total: 0,
            breakdown: { [RECICLAVEL]: 0, [ORGANICO]: 0, [REJEITO]: 0 }
          };
        }
        monthlyData[recordMonth][recordYear].total += weight;
        const type = record.wasteType ? record.wasteType.toLowerCase() : '';
        if (type.includes('orgânico') || type.includes('compostavel')) {
            monthlyData[recordMonth][recordYear].breakdown[ORGANICO] += weight;
        } else if (type.includes('rejeito')) {
            monthlyData[recordMonth][recordYear].breakdown[REJEITO] += weight;
        } else {
            monthlyData[recordMonth][recordYear].breakdown[RECICLAVEL] += weight;
        }
      });

      const yearsInDate = [...new Set(records.map(r => new Date(r.timestamp).getFullYear()))].sort((a,b) => b - a);

      const chartData = MESES_COMPLETOS.map((monthName, index) => {
        const dataPoint = { month: monthName };
        if (monthlyData[index]) {
            yearsInDate.forEach(year => {
                if (monthlyData[index][year] !== undefined) {
                    const yearData = monthlyData[index][year];
                    dataPoint[year.toString()] = {
                        total: parseFloat(yearData.total.toFixed(2)),
                        breakdown: {
                            [RECICLAVEL]: parseFloat(yearData.breakdown[RECICLAVEL].toFixed(2)),
                            [ORGANICO]: parseFloat(yearData.breakdown[ORGANICO].toFixed(2)),
                            [REJEITO]: parseFloat(yearData.breakdown[REJEITO].toFixed(2)),
                        }
                    };
                }
            });
        }
        return dataPoint;
      });

      return { data: chartData, years: yearsInDate.map(y => y.toString()) };
};

/**
 * Calcula os dados agregados para os cartões de resumo no topo do dashboard.
 * Fornece o total geral de resíduos e a distribuição (Kg e %) entre as três categorias principais.
 * @param {Array<Object>} records A lista de registros de resíduos.
 * @returns {Object} Um objeto com os totais para os `SummaryCards`.
 */
export const processDataForSummaryCards = (records) => {
    // Implementação da função (a mesma de antes)...
      if (!Array.isArray(records) || records.length === 0) return { totalGeralKg: 0, organico: {}, reciclavel: {}, rejeito: {} };
      let totalGeralKg = 0, totalOrganicoKg = 0, totalReciclavelKg = 0, totalRejeitoKg = 0;
      records.forEach(record => {
        const weight = parseFloat(record.peso || 0);
        if (isNaN(weight)) return;
        totalGeralKg += weight;
        const type = record.wasteType ? record.wasteType.toLowerCase() : '';
        if (type.includes('orgânico') || type.includes('compostavel')) {
            totalOrganicoKg += weight;
        }
        else if (type.includes('rejeito')) {
            totalRejeitoKg += weight;
        }
        else {
            totalReciclavelKg += weight;
        }
      });

      const percentOrganico = totalGeralKg > 0 ? (totalOrganicoKg / totalGeralKg) * 100 : 0;
      const percentReciclavel = totalGeralKg > 0 ? (totalReciclavelKg / totalGeralKg) * 100 : 0;
      const percentRejeito = totalGeralKg > 0 ? (totalRejeitoKg / totalGeralKg) * 100 : 0;

      return {
        totalGeralKg: parseFloat(totalGeralKg.toFixed(2)),
        organico: { kg: parseFloat(totalOrganicoKg.toFixed(2)), percent: parseFloat(percentOrganico.toFixed(2)) },
        reciclavel: { kg: parseFloat(totalReciclavelKg.toFixed(2)), percent: parseFloat(percentReciclavel.toFixed(2)) },
        rejeito: { kg: parseFloat(totalRejeitoKg.toFixed(2)), percent: parseFloat(percentRejeito.toFixed(2)) },
      };
};

/**
 * Calcula a distribuição de resíduos entre "Valorização" (Recovery) e "Descarte" (Disposal).
 * A função utiliza a lista de empresas de coleta para determinar o destino final de cada tipo de resíduo.
 * @param {Array<Object>} records A lista de registros de resíduos.
 * @param {Array<Object>} empresasColeta A lista de empresas de coleta, contendo suas destinações.
 * @param {Function} t A função de tradução (t) do i18next.
 * @returns {Array<Object>} Dados formatados para o gráfico de Destinação.
 */
export const processDataForDestinacaoChart = (records, empresasColeta, t) => {
    // Implementação da função (a mesma de antes)...
    if (records.length === 0 || empresasColeta.length === 0) {
        return [];
    }

    const empresasMap = new Map(empresasColeta.map(e => [e.id, e]));
    const disposalDestinations = ['Aterro Sanitário', 'Incineração'];

    const recoveryData = { value: 0, breakdown: {} };
    const disposalData = { value: 0, breakdown: {} };

    records.forEach(record => {
        const empresa = empresasMap.get(record.empresaColetaId);
        if (!empresa?.destinacoes || !record.wasteType) return;

        let mainWasteType = record.wasteType;
        if (mainWasteType.startsWith('Reciclável')) { mainWasteType = 'Reciclável'; }
        else if (mainWasteType.startsWith('Orgânico')) { mainWasteType = 'Orgânico'; }

        const destinacoesDoTipo = empresa.destinacoes[mainWasteType] || [];
        const isDisposal = destinacoesDoTipo.some(dest => disposalDestinations.includes(dest));

        const destinationName = destinacoesDoTipo[0] || 'Não especificado';

        const destinationKey = toCamelCaseKey(destinationName);
        const translatedDestination = t(`charts:destinations.${destinationKey}`, destinationName);

        const weight = record.peso;

        if (isDisposal) {
            disposalData.value += weight;
            disposalData.breakdown[translatedDestination] = (disposalData.breakdown[translatedDestination] || 0) + weight;
        } else {
            recoveryData.value += weight;
            recoveryData.breakdown[translatedDestination] = (recoveryData.breakdown[translatedDestination] || 0) + weight;
        }
    });

    const formatBreakdown = (breakdown) => {
        return Object.entries(breakdown)
            .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
            .sort((a, b) => b.value - a.value);
    };

    const totalValue = recoveryData.value + disposalData.value;
    const result = [];

    if (recoveryData.value > 0) {
        const percent = totalValue > 0 ? (recoveryData.value / totalValue) * 100 : 0;
        result.push({
          key: 'recovery',
            name: t('charts:chartLabels.recovery', 'Recovery'),
            value: parseFloat(recoveryData.value.toFixed(2)),
            percent: parseFloat(percent.toFixed(2)),
            breakdown: formatBreakdown(recoveryData.breakdown)
        });
    }
    if (disposalData.value > 0) {
        const percent = totalValue > 0 ? (disposalData.value / totalValue) * 100 : 0;
        result.push({
          key: 'disposal',
            name: t('charts:chartLabels.disposal', 'Disposal'),
            value: parseFloat(disposalData.value.toFixed(2)),
            percent: parseFloat(percent.toFixed(2)),
            breakdown: formatBreakdown(disposalData.breakdown)
        });
    }

    return result;
};

/**
 * Calcula os dados de impacto de carbono para o CO2ImpactCard.
 * Lida com a lógica complexa de distinguir entre o modo de cálculo "resumo" e "detalhado",
 * aplicando fatores de emissão com base na destinação e composição gravimétrica.
 * @param {Object} params - Objeto com todos os parâmetros necessários.
 * @param {Array} params.records - Registros de resíduos (detalhados ou resumidos).
 * @param {Array} params.userAllowedClientes - Lista de clientes permitidos com seus dados.
 * @param {Array} params.empresasColeta - Lista de empresas de coleta.
 * @param {Object} params.co2Config - Objeto com as configurações de fatores de emissão.
 * @returns {Object} Dados calculados para o card de impacto de CO₂.
 */
export const calculateCO2Impact = ({ records, userAllowedClientes, empresasColeta, co2Config }) => {
    // A lógica interna é a mesma do seu useMemo, agora isolada aqui.
    const clientesMap = new Map(userAllowedClientes.map(c => [c.id, c]));
    const empresasMap = new Map(empresasColeta.map(e => [e.id, e]));
    
    let totalEvitadas = 0;
    let totalDiretas = 0;
    let usaEstudoProprio = false;
    
    const isSummaryMode = records.length > 0 && records[0]?.hasOwnProperty('composicaoPorTipo');

    if (isSummaryMode) {
        for (const summary of records) {
            const cliente = clientesMap.get(summary.clienteId);
            if (!cliente) continue;
            const pesoRecicladoKg = summary.composicaoPorDestinacao?.recovery?.breakdown?.Reciclagem?.value || 0;
            if (pesoRecicladoKg > 0) {
                const pesoRecicladoToneladas = pesoRecicladoKg / 1000;
                if (cliente.composicaoGravimetricaPropria) {
                    usaEstudoProprio = true;
                    for (const [material, percent] of Object.entries(cliente.composicaoGravimetricaPropria)) {
                        if (!percent || percent <= 0) continue;
                        const pesoMaterial = pesoRecicladoToneladas * (percent / 100);
                        const fatorKey = material.toLowerCase().includes('plástico') ? 'Plástico (Mix)' : material;
                        const fator = co2Config.fatoresEmissaoEvitada[fatorKey] || co2Config.fatoresEmissaoEvitada['Geral (Média Ponderada)'];
                        if (fator) totalEvitadas += pesoMaterial * fator;
                    }
                } else {
                    const fatorMedio = co2Config.fatoresEmissaoEvitada['Geral (Média Ponderada)'];
                    if (fatorMedio) totalEvitadas += pesoRecicladoToneladas * fatorMedio;
                }
            }
            const pesoRejeitoKg = summary.totalRejeitoKg || 0;
            const pesoOrganicoTotalKg = summary.totalOrganicoKg || 0;
            const pesoOrganicoCompostadoKg = summary.composicaoPorDestinacao?.recovery?.breakdown?.Compostagem?.value || 0;
            const pesoOrganicoBiometanizadoKg = summary.composicaoPorDestinacao?.recovery?.breakdown?.Biometanização?.value || 0;
            const pesoOrganicoRecuperadoKg = pesoOrganicoCompostadoKg + pesoOrganicoBiometanizadoKg;
            const pesoOrganicoAterradoKg = pesoOrganicoTotalKg - pesoOrganicoRecuperadoKg;

            if (pesoRejeitoKg > 0) totalDiretas += (pesoRejeitoKg / 1000) * co2Config.fatoresEmissaoDireta['aterro-rejeito'];
            if (pesoOrganicoAterradoKg > 0) totalDiretas += (pesoOrganicoAterradoKg / 1000) * co2Config.fatoresEmissaoDireta['aterro-organico'];
            if (pesoOrganicoCompostadoKg > 0) totalDiretas += (pesoOrganicoCompostadoKg / 1000) * co2Config.fatoresEmissaoDireta['compostagem'];
            if (pesoOrganicoBiometanizadoKg > 0) totalDiretas += (pesoOrganicoBiometanizadoKg / 1000) * co2Config.fatoresEmissaoDireta['biometanizacao'];
        }
    } else if (records.length > 0) {
        for (const record of records) {
            const cliente = clientesMap.get(record.clienteId);
            const empresa = empresasMap.get(record.empresaColetaId);
            if (!cliente || !empresa) continue;
            let lookupWasteType = record.wasteType;
            if (lookupWasteType.startsWith('Reciclável')) lookupWasteType = 'Reciclável';
            else if (lookupWasteType.startsWith('Orgânico')) lookupWasteType = 'Orgânico';
            const pesoToneladas = (record.peso || 0) / 1000;
            const destinacoes = empresa.destinacoes?.[lookupWasteType] || [];
            const isReciclagem = destinacoes.includes('Reciclagem');
            const isCompostagem = destinacoes.includes('Compostagem');
            const isBiometanizacao = destinacoes.includes('Biometanização');
            const isAterro = destinacoes.includes('Aterro Sanitário');
            const isIncineracao = destinacoes.includes('Incineração');
            if (isReciclagem) {
                const composicao = cliente.composicaoGravimetricaPropria || co2Config.composicaoGravimetricaNacional;
                if (cliente.composicaoGravimetricaPropria) usaEstudoProprio = true;
                for (const [material, percent] of Object.entries(composicao)) {
                    if (!percent || percent <= 0) continue;
                    const pesoMaterial = pesoToneladas * (percent / 100);
                    let fatorKey = material;
                    if (material.toLowerCase().includes('plástico')) fatorKey = 'Plástico (Mix)';
                    const fator = co2Config.fatoresEmissaoEvitada[fatorKey] || co2Config.fatoresEmissaoEvitada['Geral (Média Ponderada)'];
                    if (fator) totalEvitadas += pesoMaterial * fator;
                }
            } else if (lookupWasteType === 'Orgânico' && (isCompostagem || isBiometanizacao)) {
                const fator = isBiometanizacao ? co2Config.fatoresEmissaoDireta.biometanizacao : co2Config.fatoresEmissaoDireta.compostagem;
                if(fator) totalDiretas += pesoToneladas * fator;
            } else if (isAterro) {
                let fatorKey = 'aterro-rejeito';
                if (lookupWasteType === 'Orgânico') fatorKey = 'aterro-organico';
                const fator = co2Config.fatoresEmissaoDireta[fatorKey];
                if(fator) totalDiretas += pesoToneladas * fator;
            } else if (isIncineracao) {
                 const fator = co2Config.fatoresEmissaoDireta.incineracao;
                 if(fator) totalDiretas += pesoToneladas * fator;
            }
        }
    }

    return {
        netImpact: totalEvitadas + totalDiretas,
        totalEvitadas,
        totalDiretas,
        metodologia: usaEstudoProprio 
            ? 'Cálculo baseado em estudo gravimétrico próprio do cliente.'
            : 'Cálculo baseado na composição gravimétrica média nacional.'
    };
};

/**
 * Calcula os dados para o gráfico de evolução do balanço de CO₂.
 * Agrega o impacto líquido de CO₂ por dia para exibição em um gráfico de linha.
 * @param {Object} params - Objeto com todos os parâmetros necessários.
 * @returns {Array<Object>} Dados formatados para o gráfico de evolução de CO₂.
 */
export const calculateCO2Evolution = ({ records, userAllowedClientes, empresasColeta, co2Config }) => {
    // A lógica interna é a mesma do seu useMemo, agora isolada aqui.
    const calculateImpactForRecord = (record, cliente, empresa) => {
        let netImpact = 0;
        if (!cliente || !empresa) return 0;
        let lookupWasteType = record.wasteType;
        if (lookupWasteType.startsWith('Reciclável')) lookupWasteType = 'Reciclável';
        else if (lookupWasteType.startsWith('Orgânico')) lookupWasteType = 'Orgânico';
        const pesoToneladas = (record.peso || 0) / 1000;
        const destinacoes = empresa.destinacoes?.[lookupWasteType] || [];
        if (destinacoes.includes('Reciclagem')) {
            const composicao = cliente.composicaoGravimetricaPropria || co2Config.composicaoGravimetricaNacional;
            for (const [material, percent] of Object.entries(composicao)) {
                if (!percent || percent <= 0) continue;
                const pesoMaterial = pesoToneladas * (percent / 100);
                const fatorKey = material.toLowerCase().includes('plástico') ? 'Plástico (Mix)' : material;
                const fator = co2Config.fatoresEmissaoEvitada[fatorKey] || co2Config.fatoresEmissaoEvitada['Geral (Média Ponderada)'];
                if (fator) netImpact += pesoMaterial * fator;
            }
        }
        return netImpact * -1;
    };
    
    const dailyData = records.reduce((acc, record) => {
        if (!record.timestamp) return acc;
        const date = new Date(record.timestamp).toISOString().split('T')[0];
        if (!acc[date]) {
            acc[date] = { name: new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }), netImpact: 0 };
        }
        const cliente = userAllowedClientes.find(c => c.id === record.clienteId);
        const empresa = empresasColeta.find(e => e.id === record.empresaColetaId);
        acc[date].netImpact += calculateImpactForRecord(record, cliente, empresa);
        return acc;
    }, {});

    const sortedDailyData = Object.values(dailyData).sort((a, b) => new Date(a.name.split('/').reverse().join('-')) - new Date(b.name.split('/').reverse().join('-')));

    // ALTERAÇÃO: Lógica para calcular o impacto acumulado
    let cumulativeImpact = 0;
    return sortedDailyData.map(dataPoint => {
        cumulativeImpact += dataPoint.netImpact;
        return {
            ...dataPoint,
            netImpact: parseFloat(cumulativeImpact.toFixed(3)),
        };
    });
};