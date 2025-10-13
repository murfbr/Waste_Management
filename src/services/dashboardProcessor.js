// src/services/dashboardProcessor.js

/**
 * @fileoverview Versão refatorada para trabalhar com dados pré-agregados.
 * As funções agora recebem arrays de documentos `daily_totals` ou `monthly_totals`
 * e somam os valores, em vez de processar registos individuais.
 */


const unflattenObject = (flatObj) => {
    if (typeof flatObj !== 'object' || flatObj === null) return {};
    const nestedObj = {};
    for (const key in flatObj) {
        if (Object.prototype.hasOwnProperty.call(flatObj, key)) {
            const keys = key.split('.');
            let current = nestedObj;
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]] = current[keys[i]] || {};
            }
            current[keys[keys.length - 1]] = flatObj[key];
        }
    }
    if (flatObj.id) {
        nestedObj.id = flatObj.id;
    }
    return nestedObj;
};

export const toCamelCaseKey = (str) => {
    if (!str) return 'naoEspecificado';
    const s = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const parts = s.split(/[\s-]+/);
    return parts[0] + parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
};

const parseSelectedAreas = (selectedAreas) => {
    if (!selectedAreas || selectedAreas.length === 0) return null;
    const selectionMap = new Map();
    selectedAreas.forEach(id => {
        const firstUnderscoreIndex = id.indexOf('_');
        if (firstUnderscoreIndex === -1) return;
        
        const clientId = id.substring(0, firstUnderscoreIndex);
        const areaName = id.substring(firstUnderscoreIndex + 1);

        if (!selectionMap.has(clientId)) {
            selectionMap.set(clientId, new Set());
        }
        selectionMap.get(clientId).add(areaName);
    });
    return selectionMap;
};

const buildFilteredDay = (day, selectedAreasForClient) => {
    const filteredDay = {
        id: day.id,
        clienteId: day.clienteId,
        totalKg: 0,
        byWasteType: {},
        byDestination: {},
        byArea: {}
    };

    if (!day.byArea) return filteredDay;

    selectedAreasForClient.forEach(areaName => {
        const areaData = day.byArea[areaName];
        if (!areaData) return;

        filteredDay.byArea[areaName] = areaData;
        filteredDay.totalKg += areaData.totalKg || 0;

        if (areaData.byWasteType) {
            Object.entries(areaData.byWasteType).forEach(([wasteType, typeData]) => {
                if (!filteredDay.byWasteType[wasteType]) {
                    filteredDay.byWasteType[wasteType] = { totalKg: 0, byDestination: {} };
                }
                const wasteKg = typeData.totalKg || 0;
                filteredDay.byWasteType[wasteType].totalKg += wasteKg;

                if (typeData.byDestination) {
                     Object.entries(typeData.byDestination).forEach(([destination, destData]) => {
                        if (!filteredDay.byDestination[destination]) {
                            filteredDay.byDestination[destination] = { totalKg: 0 };
                        }
                        const destKg = destData.totalKg || 0;
                        filteredDay.byDestination[destination].totalKg += destKg;

                        if (!filteredDay.byWasteType[wasteType].byDestination[destination]) {
                           filteredDay.byWasteType[wasteType].byDestination[destination] = { totalKg: 0};
                        }
                        filteredDay.byWasteType[wasteType].byDestination[destination].totalKg += destKg;
                    });
                }
            });
        }
    });

    return filteredDay;
};


export const processDataForAggregatedPieChart = (dailyData, t, selectedAreas = []) => {
    if (!Array.isArray(dailyData) || dailyData.length === 0) return [];
    
    const finalAggregation = {};
    const areaSelection = parseSelectedAreas(selectedAreas);

    dailyData.forEach(rawDay => {
        let dayToProcess = unflattenObject(rawDay);
        
        if (areaSelection) {
            const selectedAreasForClient = areaSelection.get(dayToProcess.clienteId);
            if (selectedAreasForClient) {
                dayToProcess = buildFilteredDay(dayToProcess, selectedAreasForClient);
            } else {
                return;
            }
        }
        
        if (!dayToProcess.byWasteType) return;
        Object.entries(dayToProcess.byWasteType).forEach(([wasteType, typeData]) => {
            const translatedMainType = t(`charts:wasteTypes.${toCamelCaseKey(wasteType)}`, wasteType);
            if (!finalAggregation[translatedMainType]) {
                finalAggregation[translatedMainType] = { name: translatedMainType, value: 0, subtypes: {} };
            }
            finalAggregation[translatedMainType].value += typeData.totalKg || 0;

            if (typeData.byWasteSubType) {
                Object.entries(typeData.byWasteSubType).forEach(([subType, subTypeData]) => {
                    const translatedSubType = t(`charts:wasteSubTypes.${toCamelCaseKey(subType)}`, subType);
                    if (!finalAggregation[translatedMainType].subtypes[translatedSubType]) {
                        finalAggregation[translatedMainType].subtypes[translatedSubType] = { name: translatedSubType, value: 0 };
                    }
                    finalAggregation[translatedMainType].subtypes[translatedSubType].value += subTypeData.totalKg || 0;
                });
            }
        });
    });

    return Object.values(finalAggregation).map(mainCategory => ({
      ...mainCategory,
      value: parseFloat(mainCategory.value.toFixed(2)),
      subtypes: Object.values(mainCategory.subtypes).map(sub => ({ ...sub, value: parseFloat(sub.value.toFixed(2)) })).sort((a, b) => b.value - a.value)
    }));
};


export const processDataForAreaChartWithBreakdown = (dailyData, t, selectedAreas = []) => {
    if (!Array.isArray(dailyData) || dailyData.length === 0) return [];

    const finalAggregation = {};
    const areaSelection = parseSelectedAreas(selectedAreas);

    dailyData.forEach(rawDay => {
        let dayToProcess = unflattenObject(rawDay);

        if (areaSelection) {
            const selectedAreasForClient = areaSelection.get(dayToProcess.clienteId);
            if (selectedAreasForClient) {
                dayToProcess = buildFilteredDay(dayToProcess, selectedAreasForClient);
            } else {
                return;
            }
        }
        
        if (!dayToProcess.byArea) return;

        Object.entries(dayToProcess.byArea).forEach(([areaName, areaData]) => {
            if (!finalAggregation[areaName]) {
                finalAggregation[areaName] = { name: areaName, value: 0, breakdown: {} };
            }
            finalAggregation[areaName].value += areaData.totalKg || 0;

            if (areaData.byWasteType) {
                Object.entries(areaData.byWasteType).forEach(([wasteType, typeData]) => {
                    const translatedWasteType = t(`charts:wasteTypes.${toCamelCaseKey(wasteType)}`, wasteType);
                    if (!finalAggregation[areaName].breakdown[translatedWasteType]) {
                        finalAggregation[areaName].breakdown[translatedWasteType] = { name: translatedWasteType, value: 0 };
                    }
                    finalAggregation[areaName].breakdown[translatedWasteType].value += typeData.totalKg || 0;
                });
            }
        });
    });

    return Object.values(finalAggregation).map(areaData => ({
        ...areaData,
        value: parseFloat(areaData.value.toFixed(2)),
        breakdown: Object.values(areaData.breakdown).map(b => ({ ...b, value: parseFloat(b.value.toFixed(2)) })).filter(b => b.value > 0).sort((a, b) => b.value - a.value)
    }));
};

export const processDataForDesvioDeAterro = (dailyData, rejectCategoryName, selectedAreas = []) => {
    console.log('[DEPURAÇÃO GRÁFICO DESVIO] Iniciando processamento.');
    if (!Array.isArray(dailyData) || dailyData.length === 0) return [];
    
    const areaSelection = parseSelectedAreas(selectedAreas);
    const dataPoints = [];

    dailyData.forEach(rawDay => {
        let dayToProcess = unflattenObject(rawDay);

        if (areaSelection) {
            const selectedAreasForClient = areaSelection.get(dayToProcess.clienteId);
            if (selectedAreasForClient) {
                dayToProcess = buildFilteredDay(dayToProcess, selectedAreasForClient);
            } else {
                dayToProcess = { totalKg: 0, byWasteType: {} };
            }
        }
        
        const total = dayToProcess.totalKg || 0;
        const rejeito = dayToProcess.byWasteType?.[rejectCategoryName]?.totalKg || 0;
        
        console.log(`[DEPURAÇÃO GRÁFICO DESVIO] Dia ${rawDay.id}: Total=${total}, Rejeito=${rejeito}`);
        const percentualRejeito = total > 0 ? (rejeito / total) * 100 : 0;
        const taxaDesvio = 100 - percentualRejeito;
        dataPoints.push({
            dateKey: rawDay.id,
            name: new Date(`${rawDay.id}T12:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit' }),
            taxaDesvio: parseFloat(taxaDesvio.toFixed(2)),
        });
    });

    const sortedDailyData = dataPoints.sort((a, b) => new Date(a.dateKey) - new Date(b.dateKey));
    console.log('[DEPURAÇÃO GRÁFICO DESVIO] Pontos de dados ordenados:', sortedDailyData);

    let acumuladoSomaTaxaDesvio = 0;
    const finalData = sortedDailyData.map((dataPoint, index) => {
        acumuladoSomaTaxaDesvio += dataPoint.taxaDesvio;
        const mediaTaxaDesvio = acumuladoSomaTaxaDesvio / (index + 1);
        return { ...dataPoint, mediaTaxaDesvio: parseFloat(mediaTaxaDesvio.toFixed(2)) };
    });
    
    console.log('[DEPURAÇÃO GRÁFICO DESVIO] Dados finais com média:', finalData);
    return finalData;
};

export const processDataForMonthlyYearlyComparison = (monthlyData, t, selectedAreas = []) => {
    console.log('[DEPURAÇÃO GRÁFICO MENSAL] Processor: Iniciando processamento com dados mensais:', monthlyData);
    if (!Array.isArray(monthlyData) || !monthlyData.length) return { data: [], years: [] };

    const areaSelection = parseSelectedAreas(selectedAreas);
    const MESES_COMPLETOS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const chartDataPrecursor = {};
    const yearsInDate = new Set();
    const RECICLAVEL = t('charts:wasteTypes.reciclavel', 'Reciclável');
    const ORGANICO = t('charts:wasteTypes.organico', 'Orgânico');
    const REJEITO = t('charts:wasteTypes.rejeito', 'Rejeito');

    monthlyData.forEach(rawMonthDoc => {
        let monthToProcess = unflattenObject(rawMonthDoc);
        console.log(`[DEPURAÇÃO GRÁFICO MENSAL] Processor: Documento mensal ${rawMonthDoc.id} após desachatamento:`, monthToProcess);
        
        if (areaSelection) {
            const selectedAreasForClient = areaSelection.get(monthToProcess.clienteId);
            if (selectedAreasForClient) {
                monthToProcess = buildFilteredDay(monthToProcess, selectedAreasForClient);
            } else {
                monthToProcess = { id: rawMonthDoc.id, totalKg: 0, byWasteType: {} };
            }
        }
        
        const [yearStr, monthStr] = monthToProcess.id.split('-');
        const year = parseInt(yearStr, 10);
        const monthIndex = parseInt(monthStr, 10) - 1;
        yearsInDate.add(year);

        if (!chartDataPrecursor[monthIndex]) chartDataPrecursor[monthIndex] = {};
        if (!chartDataPrecursor[monthIndex][year]) {
            chartDataPrecursor[monthIndex][year] = { total: 0, breakdown: { [RECICLAVEL]: 0, [ORGANICO]: 0, [REJEITO]: 0 } };
        }
        
        chartDataPrecursor[monthIndex][year].total += monthToProcess.totalKg || 0;
        if (monthToProcess.byWasteType) {
            console.log(`[DEPURAÇÃO GRÁFICO MENSAL] Processor: Documento ${monthToProcess.id} POSSUI 'byWasteType'.`);
            Object.entries(monthToProcess.byWasteType).forEach(([wasteType, typeData]) => {
                const type = wasteType.toLowerCase();
                if (type.includes('orgânico') || type.includes('compostavel')) chartDataPrecursor[monthIndex][year].breakdown[ORGANICO] += typeData.totalKg || 0;
                else if (type.includes('rejeito')) chartDataPrecursor[monthIndex][year].breakdown[REJEITO] += typeData.totalKg || 0;
                else chartDataPrecursor[monthIndex][year].breakdown[RECICLAVEL] += typeData.totalKg || 0;
            });
        }
    });
    
    const sortedYears = Array.from(yearsInDate).sort((a,b) => b-a);
    const chartData = MESES_COMPLETOS.map((monthName, index) => {
        const dataPoint = { month: monthName };
        if (chartDataPrecursor[index]) {
            sortedYears.forEach(year => {
                if (chartDataPrecursor[index][year]) {
                    const yearData = chartDataPrecursor[index][year];
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

    return { data: chartData, years: sortedYears.map(y => y.toString()) };
};


/**
 * Calcula os dados para os cartões de resumo a partir dos TOTAIS DIÁRIOS.
 * @param {Array<Object>} dailyData Array de documentos de totais diários.
 * @returns {Object} Um objeto com os totais para os `SummaryCards`.
 */
export const processDataForSummaryCards = (dailyData, selectedAreas = []) => {
    console.log('[DEPURAÇÃO ETAPA 3] Processor: processDataForSummaryCards. Array recebido (dailyData):', JSON.parse(JSON.stringify(dailyData || [])));

    if (!Array.isArray(dailyData) || dailyData.length === 0) {
        return { totalGeralKg: 0, organico: { kg: 0, percent: 0 }, reciclavel: { kg: 0, percent: 0 }, rejeito: { kg: 0, percent: 0 } };
    }

    const areaSelection = parseSelectedAreas(selectedAreas);
    let totalGeralKg = 0, totalOrganicoKg = 0, totalReciclavelKg = 0, totalRejeitoKg = 0;

    dailyData.forEach((rawDay, index) => {
        let dayToProcess = unflattenObject(rawDay);
        
        // --- INÍCIO DA CORREÇÃO ---
        // A Visão Geral (SummaryCards) agora também é filtrada
        if (areaSelection) {
            const selectedAreasForClient = areaSelection.get(dayToProcess.clienteId);
            if (selectedAreasForClient) {
                dayToProcess = buildFilteredDay(dayToProcess, selectedAreasForClient);
            } else {
                dayToProcess = { totalKg: 0, byWasteType: {} }; // Zera os dados do dia
            }
        }
        // --- FIM DA CORREÇÃO ---

        totalGeralKg += dayToProcess.totalKg || 0;
        if (dayToProcess.byWasteType) {
            Object.entries(dayToProcess.byWasteType).forEach(([wasteType, typeData]) => {
                const type = wasteType.toLowerCase();
                if (type.includes('orgânico') || type.includes('compostavel')) {
                    totalOrganicoKg += typeData.totalKg || 0;
                } else if (type.includes('rejeito')) {
                    totalRejeitoKg += typeData.totalKg || 0;
                } else {
                    totalReciclavelKg += typeData.totalKg || 0;
                }
            });
        }
    });

    console.log('[DEPURAÇÃO ETAPA 5] Processor: Totais calculados antes da porcentagem.', { totalGeralKg, totalOrganicoKg, totalReciclavelKg, totalRejeitoKg });

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
 * Calcula a distribuição por Destinação a partir dos TOTAIS DIÁRIOS.
 * @param {Array<Object>} dailyData Array de documentos de totais diários.
 * @param {Function} t A função de tradução (t) do i18next.
 * @returns {Array<Object>} Dados formatados para o gráfico de Destinação.
 */
export const processDataForDestinacaoChart = (dailyData, t, selectedAreas = []) => {
    console.log('[DEPURAÇÃO GRÁFICO DESTINAÇÃO] Iniciando processamento.');
    if (!dailyData || dailyData.length === 0) return [];
    
    const areaSelection = parseSelectedAreas(selectedAreas);
    const disposalDestinations = ['Aterro Sanitário', 'Incineração'];
    const recoveryData = { value: 0, breakdown: {} };
    const disposalData = { value: 0, breakdown: {} };

    dailyData.forEach(rawDay => {
        let dayToProcess = unflattenObject(rawDay);

        if (areaSelection) {
            const selectedAreasForClient = areaSelection.get(dayToProcess.clienteId);
            if (selectedAreasForClient) {
                dayToProcess = buildFilteredDay(dayToProcess, selectedAreasForClient);
            } else {
                return;
            }
        }
        
        if (!dayToProcess.byDestination) return;

        Object.entries(dayToProcess.byDestination).forEach(([destinationName, destData]) => {
            const isDisposal = disposalDestinations.includes(destinationName);
            const destinationKey = toCamelCaseKey(destinationName);
            const translatedDestination = t(`charts:destinations.${destinationKey}`, destinationName);
            const weight = destData.totalKg || 0;
            
            if (isDisposal) {
                disposalData.value += weight;
                disposalData.breakdown[translatedDestination] = (disposalData.breakdown[translatedDestination] || 0) + weight;
            } else {
                recoveryData.value += weight;
                recoveryData.breakdown[translatedDestination] = (recoveryData.breakdown[translatedDestination] || 0) + weight;
            }
        });
    });

    console.log('[DEPURAÇÃO GRÁFICO DESTINAÇÃO] Dados agregados:', { recoveryData, disposalData });

    const formatBreakdown = (breakdown) => Object.entries(breakdown)
        .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
        .sort((a, b) => b.value - a.value);

    const totalValue = recoveryData.value + disposalData.value;
    const result = [];

    if (recoveryData.value > 0) {
        result.push({
            key: 'recovery', name: t('charts:chartLabels.recovery', 'Recovery'),
            value: parseFloat(recoveryData.value.toFixed(2)),
            percent: parseFloat((totalValue > 0 ? (recoveryData.value / totalValue) * 100 : 0).toFixed(2)),
            breakdown: formatBreakdown(recoveryData.breakdown)
        });
    }
    if (disposalData.value > 0) {
        result.push({
            key: 'disposal', name: t('charts:chartLabels.disposal', 'Disposal'),
            value: parseFloat(disposalData.value.toFixed(2)),
            percent: parseFloat((totalValue > 0 ? (disposalData.value / totalValue) * 100 : 0).toFixed(2)),
            breakdown: formatBreakdown(disposalData.breakdown)
        });
    }

    return result;
};


export const calculateCO2Impact = ({ dailyData, userAllowedClientes, co2Config, selectedAreas = [] }) => {
    console.log('[DEPURAÇÃO CO2 IMPACTO] Iniciando cálculo.');
    if (!dailyData || dailyData.length === 0 || !userAllowedClientes || !co2Config) {
        return { netImpact: 0, totalEvitadas: 0, totalDiretas: 0, metodologia: 'Dados insuficientes.' };
    }
    
    const areaSelection = parseSelectedAreas(selectedAreas);
    const clientesMap = new Map(userAllowedClientes.map(c => [c.id, c]));
    let totalEvitadas = 0;
    let totalDiretas = 0;
    let usaEstudoProprio = false;

    const dataByClient = dailyData.reduce((acc, rawDay) => {
        const day = unflattenObject(rawDay);
        const clienteId = day.clienteId;
        if (!acc[clienteId]) acc[clienteId] = [];
        acc[clienteId].push(day);
        return acc;
    }, {});

    for (const clienteId in dataByClient) {
        const cliente = clientesMap.get(clienteId);
        if (!cliente) continue;
        
        const { totalRecicladoKg, totalRejeitoKg, totalOrganicoAterradoKg, totalOrganicoCompostadoKg, totalOrganicoBiometanizadoKg } = dataByClient[clienteId].reduce((totals, day) => {
            let dayToProcess = day;
            if (areaSelection) {
                const selectedAreasForClient = areaSelection.get(dayToProcess.clienteId);
                if (selectedAreasForClient) {
                    dayToProcess = buildFilteredDay(dayToProcess, selectedAreasForClient);
                } else {
                    return totals;
                }
            }
            
            const pesoOrganicoTotal = dayToProcess.byWasteType?.Orgânico?.totalKg || 0;
            const pesoOrganicoCompostado = dayToProcess.byDestination?.Compostagem?.totalKg || 0;
            const pesoOrganicoBiometanizado = dayToProcess.byDestination?.Biometanização?.totalKg || 0;
            
            totals.totalRecicladoKg += dayToProcess.byDestination?.Reciclagem?.totalKg || 0;
            totals.totalRejeitoKg += dayToProcess.byWasteType?.Rejeito?.totalKg || 0;
            totals.totalOrganicoCompostadoKg += pesoOrganicoCompostado;
            totals.totalOrganicoBiometanizadoKg += pesoOrganicoBiometanizado;
            totals.totalOrganicoAterradoKg += pesoOrganicoTotal - (pesoOrganicoCompostado + pesoOrganicoBiometanizado);
            
            return totals;
        }, { totalRecicladoKg: 0, totalRejeitoKg: 0, totalOrganicoAterradoKg: 0, totalOrganicoCompostadoKg: 0, totalOrganicoBiometanizadoKg: 0 });

        if (totalRecicladoKg > 0) {
            const pesoRecicladoToneladas = totalRecicladoKg / 1000;
            const composicao = cliente.composicaoGravimetricaPropria || co2Config.composicaoGravimetricaNacional;
            if (cliente.composicaoGravimetricaPropria) usaEstudoProprio = true;

            for (const [material, percent] of Object.entries(composicao)) {
                if (!percent || percent <= 0) continue;
                const pesoMaterial = pesoRecicladoToneladas * (percent / 100);
                const fatorKey = material.toLowerCase().includes('plástico') ? 'Plástico (Mix)' : material;
                const fator = co2Config.fatoresEmissaoEvitada[fatorKey] || co2Config.fatoresEmissaoEvitada['Geral (Média Ponderada)'];
                if (fator) totalEvitadas += pesoMaterial * fator;
            }
        }

        if (totalRejeitoKg > 0) totalDiretas += (totalRejeitoKg / 1000) * co2Config.fatoresEmissaoDireta['aterro-rejeito'];
        if (totalOrganicoAterradoKg > 0) totalDiretas += (totalOrganicoAterradoKg / 1000) * co2Config.fatoresEmissaoDireta['aterro-organico'];
        if (totalOrganicoCompostadoKg > 0) totalDiretas += (totalOrganicoCompostadoKg / 1000) * co2Config.fatoresEmissaoDireta['compostagem'];
        if (totalOrganicoBiometanizadoKg > 0) totalDiretas += (totalOrganicoBiometanizadoKg / 1000) * co2Config.fatoresEmissaoDireta['biometanizacao'];
         console.log(`[DEPURAÇÃO CO2 IMPACTO] Pesos calculados para cliente ${clienteId}:`, { totalRecicladoKg, totalRejeitoKg });
    }

    const netImpact = totalEvitadas + totalDiretas;

    return {
        netImpact: parseFloat(netImpact.toFixed(3)),
        totalEvitadas: parseFloat(totalEvitadas.toFixed(3)),
        totalDiretas: parseFloat(totalDiretas.toFixed(3)),
        metodologia: usaEstudoProprio 
            ? 'Cálculo baseado em estudo gravimétrico próprio do cliente.'
            : 'Cálculo baseado na composição gravimétrica média nacional.'
    };
};

export const calculateCO2Evolution = ({ dailyData, userAllowedClientes, co2Config, selectedAreas = [] }) => {
    if (!dailyData || dailyData.length === 0 || !userAllowedClientes || !co2Config) {
        return [];
    }
    const impactByDay = {};
    dailyData.forEach(rawDay => {
        const dayImpact = calculateCO2Impact({ dailyData: [rawDay], userAllowedClientes, co2Config, selectedAreas });
        const date = rawDay.id;
        if (!impactByDay[date]) {
            impactByDay[date] = { 
                name: new Date(`${date}T12:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' }), 
                netImpact: 0 
            };
        }
        impactByDay[date].netImpact += dayImpact.netImpact;
    });

    const sortedDailyData = Object.values(impactByDay).sort((a, b) => {
        const dateA = new Date(a.name.split('/').reverse().join('-'));
        const dateB = new Date(b.name.split('/').reverse().join('-'));
        return dateA - dateB;
    });
    
    let cumulativeImpact = 0;
    return sortedDailyData.map(dataPoint => {
        cumulativeImpact += dataPoint.netImpact;
        return {
            ...dataPoint,
            netImpact: parseFloat(cumulativeImpact.toFixed(3)),
        };
    });
};