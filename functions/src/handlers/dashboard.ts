// functions/src/handlers/dashboard.ts
import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import { db } from "../core/admin";
import { functionOptions } from "../core/config";
import * as admin from "firebase-admin";

const Firestore = admin.firestore;

/**
 * Interface para a estrutura do documento de resumo que será salvo no Firestore.
 * Contém todos os dados pré-calculados que o dashboard precisa, preservando as relações.
 */
interface MonthlySummary {
    clienteId: string;
    ano: number;
    mes: number; // 0 (Janeiro) a 11 (Dezembro)
    totalGeralKg: number;
    totalOrganicoKg: number;
    totalReciclavelKg: number;
    totalRejeitoKg: number;
    composicaoPorTipo: { 
        [wasteType: string]: { 
            value: number, 
            subtypes: { [subType: string]: number } 
        } 
    };
    composicaoPorArea: {
        [area: string]: {
            value: number,
            breakdown: {
                [wasteType: string]: {
                    value: number,
                    subtypes: { [subType: string]: number }
                }
            }
        }
    };
    // NOVO CAMPO ADICIONADO À INTERFACE
    composicaoPorEmpresa: {
        [empresaId: string]: {
            [wasteType: string]: number
        }
    };
    composicaoPorDestinacao: {
        recovery: {
            value: number,
            breakdown: {
                [destination: string]: {
                    value: number,
                    wasteTypes: { [wasteType: string]: number }
                }
            }
        };
        disposal: {
            value: number,
            breakdown: {
                [destination: string]: {
                    value: number,
                    wasteTypes: { [wasteType: string]: number }
                }
            }
        };
    };
    meta: {
        totalRegistros: number;
        primeiroRegistro: admin.firestore.Timestamp | null;
        ultimoRegistro: admin.firestore.Timestamp | null;
        geradoEm: admin.firestore.FieldValue;
    };
}

/**
 * LÓGICA CENTRAL DE AGREGAÇÃO (VERSÃO FINAL)
 * Esta função agora gera um resumo completo preservando as relações entre os dados.
 */
async function generateSummaryForClient(clienteId: string, ano: number, mes: number): Promise<MonthlySummary> {
    logger.info(`Iniciando geração de resumo para cliente ${clienteId}, período: ${mes + 1}/${ano}`);

    // --- PASSO 1: Buscar dados de apoio ---
    const clienteRef = db.collection("clientes").doc(clienteId);
    const empresasColetaRef = db.collection("empresasColeta");

    const [clienteDoc, empresasColetaSnapshot] = await Promise.all([
        clienteRef.get(),
        empresasColetaRef.get()
    ]);

    if (!clienteDoc.exists) {
        throw new Error(`Cliente com ID ${clienteId} não encontrado.`);
    }

    const empresasMap = new Map(empresasColetaSnapshot.docs.map(doc => [doc.id, doc.data()]));
    const tiposDeResiduosBase: any[] = clienteDoc.data()?.tiposDeResiduosPersonalizados || [];

    // --- PASSO 2: Inicializar o resumo ---
    const initialComposicaoPorTipo: { [wasteType: string]: { value: number, subtypes: { [subType: string]: number } } } = {};
    tiposDeResiduosBase.forEach(tipo => {
        initialComposicaoPorTipo[tipo.nome] = { value: 0, subtypes: {} };
    });

    const summary: MonthlySummary = {
        clienteId, ano, mes, totalGeralKg: 0, totalOrganicoKg: 0, totalReciclavelKg: 0,
        totalRejeitoKg: 0, composicaoPorTipo: initialComposicaoPorTipo,
        composicaoPorArea: {},
        composicaoPorEmpresa: {}, // INICIALIZAÇÃO DO NOVO CAMPO
        composicaoPorDestinacao: {
            recovery: { value: 0, breakdown: {} },
            disposal: { value: 0, breakdown: {} }
        },
        meta: { totalRegistros: 0, primeiroRegistro: null, ultimoRegistro: null, geradoEm: Firestore.FieldValue.serverTimestamp() }
    };

    // --- PASSO 3: Buscar os registros de resíduos do período ---
    const startDate = new Date(ano, mes, 1);
    const endDate = new Date(ano, mes + 1, 1);
    
    const snapshot = await db.collectionGroup("wasteRecords")
        .where("clienteId", "==", clienteId)
        .where("timestamp", ">=", startDate.getTime())
        .where("timestamp", "<", endDate.getTime())
        .get();

    if (snapshot.empty) {
        logger.warn(`Nenhum registro encontrado para o cliente ${clienteId} no período. O resumo conterá apenas zeros.`);
        return summary;
    }
    
    summary.meta.totalRegistros = snapshot.docs.length;
    // Ordenação agora é necessária para garantir primeiro/último registro corretos
    const sortedDocs = snapshot.docs.sort((a, b) => a.data().timestamp - b.data().timestamp);
    summary.meta.primeiroRegistro = Firestore.Timestamp.fromMillis(sortedDocs[0].data().timestamp);
    summary.meta.ultimoRegistro = Firestore.Timestamp.fromMillis(sortedDocs[sortedDocs.length - 1].data().timestamp);
    
    const disposalDestinations = ['Aterro Sanitário', 'Incineração'];

    // --- PASSO 4: Iterar sobre cada registro para fazer a agregação aprimorada ---
    for (const doc of sortedDocs) { // Iterar sobre os documentos ordenados
        const record = doc.data();
        const weight = parseFloat(record.peso || 0);
        if (isNaN(weight)) continue;

        const wasteType = record.wasteType || "Nao Especificado";
        const wasteSubType = record.wasteSubType || wasteType;
        const area = record.areaLancamento || "Nao Especificado";
        const empresaId = record.empresaColetaId; // Pega o ID da empresa

        // 4.1, 4.2, 4.3: Lógica existente (sem alterações)
        summary.totalGeralKg += weight;
        const typeLower = wasteType.toLowerCase();
        if (typeLower.includes("orgânico") || typeLower.includes("compostavel")) summary.totalOrganicoKg += weight;
        else if (typeLower.includes("rejeito")) summary.totalRejeitoKg += weight;
        else summary.totalReciclavelKg += weight;
        
        if (!summary.composicaoPorTipo[wasteType]) {
            summary.composicaoPorTipo[wasteType] = { value: 0, subtypes: {} };
        }
        summary.composicaoPorTipo[wasteType].value += weight;
        summary.composicaoPorTipo[wasteType].subtypes[wasteSubType] = (summary.composicaoPorTipo[wasteType].subtypes[wasteSubType] || 0) + weight;
        
        if (!summary.composicaoPorArea[area]) {
            summary.composicaoPorArea[area] = { value: 0, breakdown: {} };
        }
        summary.composicaoPorArea[area].value += weight;
        if (!summary.composicaoPorArea[area].breakdown[wasteType]) {
            summary.composicaoPorArea[area].breakdown[wasteType] = { value: 0, subtypes: {} };
        }
        summary.composicaoPorArea[area].breakdown[wasteType].value += weight;
        summary.composicaoPorArea[area].breakdown[wasteType].subtypes[wasteSubType] = (summary.composicaoPorArea[area].breakdown[wasteType].subtypes[wasteSubType] || 0) + weight;

        // --- NOVA LÓGICA 4.4: Composição por Empresa ---
        if (empresaId) {
            let mainWasteType = wasteType;
            if (mainWasteType.startsWith('Reciclável')) mainWasteType = 'Reciclável';
            else if (mainWasteType.startsWith('Orgânico')) mainWasteType = 'Orgânico';

            if (!summary.composicaoPorEmpresa[empresaId]) {
                summary.composicaoPorEmpresa[empresaId] = {};
            }
            summary.composicaoPorEmpresa[empresaId][mainWasteType] = (summary.composicaoPorEmpresa[empresaId][mainWasteType] || 0) + weight;
        }

        // 4.5: Composição por Destinação (Lógica anterior, agora 4.5)
        const empresa = empresasMap.get(empresaId);
        if (empresa?.destinacoes) {
            let mainWasteType = wasteType;
            if (mainWasteType.startsWith('Reciclável')) mainWasteType = 'Reciclável';
            else if (mainWasteType.startsWith('Orgânico')) mainWasteType = 'Orgânico';

            const destinacoesDoTipo = empresa.destinacoes[mainWasteType] || [];
            const isDisposal = destinacoesDoTipo.some((dest: string) => disposalDestinations.includes(dest));
            const destinationName = destinacoesDoTipo[0] || 'Não especificado';
            
            const category = isDisposal ? summary.composicaoPorDestinacao.disposal : summary.composicaoPorDestinacao.recovery;
            category.value += weight;

            if (!category.breakdown[destinationName]) {
                category.breakdown[destinationName] = { value: 0, wasteTypes: {} };
            }
            category.breakdown[destinationName].value += weight;
            category.breakdown[destinationName].wasteTypes[mainWasteType] = (category.breakdown[destinationName].wasteTypes[mainWasteType] || 0) + weight;
        }
    }
    
    // --- PASSO 5: Arredondar valores ---
    const round = (num: number) => parseFloat(num.toFixed(2));
    summary.totalGeralKg = round(summary.totalGeralKg);
    summary.totalOrganicoKg = round(summary.totalOrganicoKg);
    summary.totalReciclavelKg = round(summary.totalReciclavelKg);
    summary.totalRejeitoKg = round(summary.totalRejeitoKg);

    logger.info(`Resumo aprimorado para cliente ${clienteId} gerado com sucesso. Total: ${summary.totalGeralKg}kg`);
    return summary;
}

/**
 * FUNÇÃO #1: AGENDADA (AUTOMÁTICA)
 */
export const generateMonthlySummariesScheduled = onSchedule("0 5 2 * *", async () => {
    logger.info("Executando tarefa agendada: Gerar Resumos Mensais.");

    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const ano = targetDate.getFullYear();
    const mes = targetDate.getMonth();

    try {
        const clientesSnapshot = await db.collection("clientes").get();
        if (clientesSnapshot.empty) {
            logger.warn("Nenhum cliente encontrado para processar.");
            return;
        }

        const promises = clientesSnapshot.docs.map(async (doc) => {
            const clienteId = doc.id;
            const summaryData = await generateSummaryForClient(clienteId, ano, mes);
            const docId = `${clienteId}_${ano}_${mes}`;
            return db.collection("dashboardResumosMensais").doc(docId).set(summaryData);
        });

        await Promise.all(promises);
        logger.info(`Todos os resumos para ${mes + 1}/${ano} foram gerados com sucesso para ${promises.length} clientes.`);

    } catch (error) {
        logger.error("Erro catastrófico ao gerar resumos mensais agendados:", error);
    }
});


/**
 * FUNÇÃO #2: CHAMADA MANUAL (ON-DEMAND)
 */
export const generateMonthlySummaryOnDemand = onCall(functionOptions, async (request: CallableRequest) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "O usuário precisa estar autenticado.");
    }
    const callerProfileSnap = await db.collection("users").doc(request.auth.uid).get();
    const callerProfile = callerProfileSnap.data();
    if (callerProfile?.role !== 'master') {
        throw new HttpsError("permission-denied", "Apenas administradores podem executar esta função.");
    }

    const { clienteId, ano, mes } = request.data;
    if (!clienteId || typeof ano !== 'number' || typeof mes !== 'number') {
        throw new HttpsError("invalid-argument", "Argumentos inválidos. 'clienteId', 'ano' e 'mes' são obrigatórios.");
    }

    try {
        const summaryData = await generateSummaryForClient(clienteId, ano, mes);
        const docId = `${clienteId}_${ano}_${mes}`;

        await db.collection("dashboardResumosMensais").doc(docId).set(summaryData);
        logger.info(`Resumo sob demanda gerado e salvo em ${docId}`);

        return { success: true, message: `Resumo para o cliente ${clienteId} para ${mes + 1}/${ano} foi gerado com sucesso.` };

    } catch (error) {
        logger.error(`Falha ao gerar resumo sob demanda para ${clienteId}:`, error);
        if (error instanceof Error) {
            throw new HttpsError("internal", error.message);
        }
        throw new HttpsError("internal", "Ocorreu um erro desconhecido ao gerar o resumo.");
    }
});
