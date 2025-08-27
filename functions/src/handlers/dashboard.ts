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
 * Contém todos os dados pré-calculados que o dashboard precisa.
 */
interface MonthlySummary {
    clienteId: string;
    ano: number;
    mes: number; // 0 (Janeiro) a 11 (Dezembro)
    totalGeralKg: number;
    totalOrganicoKg: number;
    totalReciclavelKg: number;
    totalRejeitoKg: number;
    composicaoPorTipo: { [wasteType: string]: { value: number, subtypes: { [subType: string]: number } } };
    composicaoPorArea: { [area: string]: { value: number, breakdown: { [wasteType: string]: number } } };
    meta: {
        totalRegistros: number;
        primeiroRegistro: admin.firestore.Timestamp | null;
        ultimoRegistro: admin.firestore.Timestamp | null;
        geradoEm: admin.firestore.FieldValue;
    };
}

/**
 * LÓGICA CENTRAL DE AGREGAÇÃO
 * Esta função agora lê o cadastro do cliente para inicializar o resumo.
 * @param clienteId O ID do cliente a ser processado.
 * @param ano O ano a ser processado.
 * @param mes O mês a ser processado (0-11).
 * @returns O objeto de resumo mensal pronto para ser salvo.
 */
async function generateSummaryForClient(clienteId: string, ano: number, mes: number): Promise<MonthlySummary> {
    logger.info(`Iniciando geração de resumo para cliente ${clienteId}, período: ${mes + 1}/${ano}`);

    // --- PASSO 1: Buscar os dados do cliente para usar como base ---
    const clienteRef = db.collection("clientes").doc(clienteId);
    const clienteDoc = await clienteRef.get();
    if (!clienteDoc.exists) {
        const errorMessage = `Cliente com ID ${clienteId} não encontrado.`;
        logger.error(errorMessage);
        throw new Error(errorMessage);
    }
    const clienteData = clienteDoc.data();
    // Assumindo que a lista de resíduos está em um campo chamado 'tiposDeResiduosPersonalizados'
    // e que cada item da lista é um objeto com a propriedade 'nome'.
    // **Ajuste o nome 'tiposDeResiduosPersonalizados' e 'tipo.nome' se necessário.**
    const tiposDeResiduosBase: any[] = clienteData?.tiposDeResiduosPersonalizados || [];
    
    // --- PASSO 2: Inicializar o resumo com base nos tipos de resíduo do cliente ---
    const initialComposicaoPorTipo: { [wasteType: string]: { value: number, subtypes: { [subType: string]: number } } } = {};
    tiposDeResiduosBase.forEach(tipo => {
        // Usamos 'tipo.nome' para pegar o nome do resíduo do objeto
        initialComposicaoPorTipo[tipo.nome] = { value: 0, subtypes: {} };
    });

    // --- PASSO 3: Buscar os registros de resíduos do período ---
    const startDate = new Date(ano, mes, 1);
    const endDate = new Date(ano, mes + 1, 1);
    const snapshot = await db.collection("allWasteRecords")
        .where("clienteId", "==", clienteId)
        .where("timestamp", ">=", startDate.getTime())
        .where("timestamp", "<", endDate.getTime())
        .get();

    // Inicializa o objeto de resumo principal
    const summary: MonthlySummary = {
        clienteId, ano, mes, totalGeralKg: 0, totalOrganicoKg: 0, totalReciclavelKg: 0,
        totalRejeitoKg: 0, composicaoPorTipo: initialComposicaoPorTipo, composicaoPorArea: {},
        meta: {
            totalRegistros: snapshot.docs.length,
            primeiroRegistro: snapshot.empty ? null : Firestore.Timestamp.fromMillis(snapshot.docs[0].data().timestamp),
            ultimoRegistro: snapshot.empty ? null : Firestore.Timestamp.fromMillis(snapshot.docs[snapshot.docs.length - 1].data().timestamp),
            geradoEm: Firestore.FieldValue.serverTimestamp()
        }
    };

    if (snapshot.empty) {
        logger.warn(`Nenhum registro encontrado para o cliente ${clienteId} no período. O resumo conterá apenas zeros.`);
        return summary; // Retorna o resumo zerado, mas com as categorias já listadas.
    }

    // --- PASSO 4: Iterar sobre cada registro para fazer a agregação ---
    for (const doc of snapshot.docs) {
        const record = doc.data();
        const weight = parseFloat(record.peso || 0);
        if (isNaN(weight)) continue;

        const wasteType = record.wasteType || "Nao Especificado";
        const wasteSubType = record.wasteSubType || wasteType;
        const area = record.areaLancamento || "Nao Especificado";

        // Calcula Totais Gerais
        summary.totalGeralKg += weight;
        const typeLower = wasteType.toLowerCase();
        if (typeLower.includes("orgânico") || typeLower.includes("compostavel")) {
            summary.totalOrganicoKg += weight;
        } else if (typeLower.includes("rejeito")) {
            summary.totalRejeitoKg += weight;
        } else {
            summary.totalReciclavelKg += weight;
        }

        // Calcula Composição por Tipo/Subtipo (com a lógica de flexibilidade)
        if (!summary.composicaoPorTipo[wasteType]) {
            // Este IF agora só será ativado se um resíduo aparecer nos registros
            // mas não estiver no cadastro do cliente (um tipo novo).
            logger.info(`Tipo de resíduo '${wasteType}' encontrado nos registros, mas não no cadastro do cliente. Adicionando dinamicamente.`);
            summary.composicaoPorTipo[wasteType] = { value: 0, subtypes: {} };
        }
        summary.composicaoPorTipo[wasteType].value += weight;
        summary.composicaoPorTipo[wasteType].subtypes[wasteSubType] = (summary.composicaoPorTipo[wasteType].subtypes[wasteSubType] || 0) + weight;

        // Calcula Composição por Área
        if (!summary.composicaoPorArea[area]) {
            summary.composicaoPorArea[area] = { value: 0, breakdown: {} };
        }
        summary.composicaoPorArea[area].value += weight;
        summary.composicaoPorArea[area].breakdown[wasteType] = (summary.composicaoPorArea[area].breakdown[wasteType] || 0) + weight;
    }
    
    // Arredondar valores
    summary.totalGeralKg = parseFloat(summary.totalGeralKg.toFixed(2));
    summary.totalOrganicoKg = parseFloat(summary.totalOrganicoKg.toFixed(2));
    summary.totalReciclavelKg = parseFloat(summary.totalReciclavelKg.toFixed(2));
    summary.totalRejeitoKg = parseFloat(summary.totalRejeitoKg.toFixed(2));

    logger.info(`Resumo para cliente ${clienteId} gerado com sucesso. Total: ${summary.totalGeralKg}kg`);
    return summary;
}

/**
 * FUNÇÃO #1: AGENDADA (AUTOMÁTICA)
 * Roda todo dia 2 de cada mês, às 5 da manhã, para processar o mês anterior.
 * Expressão Cron: Minuto (0), Hora (5), Dia do Mês (2), Mês (*), Dia da Semana (*)
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
            
            // Salva o resumo na nova coleção
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
 * Permite que um admin gere/recalcule o resumo para um cliente/mês específico.
 */
export const generateMonthlySummaryOnDemand = onCall(functionOptions, async (request: CallableRequest) => {
    // Verificação de permissão (apenas admin/master)
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
        throw new HttpsError("internal", "Ocorreu um erro ao gerar o resumo.");
    }
});