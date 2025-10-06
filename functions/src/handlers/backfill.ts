// functions/src/handlers/backfill.ts
// Versão 1.1.1 - Removida a função 'createIncrements' não utilizada.

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { db } from "../core/admin";
import { functionOptions } from "../core/config";
import * as admin from "firebase-admin";

const FieldValue = admin.firestore.FieldValue;
const TIMEZONE = "America/Sao_Paulo";

interface WasteRecord {
    clienteId: string;
    timestamp: number;
    peso: number;
    areaLancamento: string;
    wasteType: string;
    wasteSubType: string;
    empresaColetaId: string;
}

// --- FUNÇÕES AUXILIARES ---

function deepSet(obj: any, path: string[], value: any) {
    let schema = obj;
    for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (!schema[key]) schema[key] = {};
        schema = schema[key];
    }
    const finalKey = path[path.length - 1];
    schema[finalKey] = (schema[finalKey] || 0) + value;
}

async function fetchEmpresasMap(): Promise<Map<string, any>> {
    logger.info("fetchEmpresasMap: Buscando todos os documentos de 'empresasColeta'.");
    const snapshot = await db.collection('empresasColeta').get();
    const map = new Map();
    snapshot.forEach(doc => map.set(doc.id, doc.data()));
    logger.info(`fetchEmpresasMap: Mapa criado com ${map.size} empresas.`);
    return map;
}

// SUBSTITUA A FUNÇÃO ANTIGA POR ESTA VERSÃO COMPLETA E CORRIGIDA
async function recalculateMonthFromDailies(clienteId: string, ano: number, mes: number) {
    const monthId = `${ano}-${String(mes + 1).padStart(2, '0')}`;
    logger.info(`recalculateMonthFromDailies: Iniciando recálculo com ESTRUTURA COMPLETA para ${monthId}.`);
    
    const dailyTotalsRef = db.collection(`daily_totals/${clienteId}/days`);
    const startOfMonth = `${monthId}-01`;
    const endOfMonth = `${monthId}-31`;

    const snapshot = await dailyTotalsRef
        .where(admin.firestore.FieldPath.documentId(), '>=', startOfMonth)
        .where(admin.firestore.FieldPath.documentId(), '<=', endOfMonth)
        .get();

    const monthlyTotalObject: { [key: string]: any } = {
        totalKg: 0,
        entryCount: 0,
        byArea: {},
        byWasteType: {},
        byDestination: {},
    };

    if (snapshot.empty) {
        logger.warn(`recalculateMonthFromDailies: Nenhum total diário encontrado para ${monthId}. Deletando documento mensal.`);
        await db.doc(`monthly_totals/${clienteId}/months/${monthId}`).delete();
        return;
    }
    logger.info(`recalculateMonthFromDailies: ${snapshot.size} docs diários encontrados para agregar.`);

    snapshot.forEach(doc => {
        const day = doc.data();
        monthlyTotalObject.totalKg += day.totalKg || 0;
        monthlyTotalObject.entryCount += day.entryCount || 0;

        // Agregação completa para byWasteType (incluindo subtipos)
        if (day.byWasteType) {
            for (const type in day.byWasteType) {
                deepSet(monthlyTotalObject, ['byWasteType', type, 'totalKg'], day.byWasteType[type].totalKg || 0);
                if (day.byWasteType[type].byWasteSubType) {
                    for (const subType in day.byWasteType[type].byWasteSubType) {
                        deepSet(monthlyTotalObject, ['byWasteType', type, 'byWasteSubType', subType, 'totalKg'], day.byWasteType[type].byWasteSubType[subType].totalKg || 0);
                    }
                }
            }
        }
        
        // Agregação completa para byArea (incluindo byWasteType interno)
        if (day.byArea) {
            for (const area in day.byArea) {
                deepSet(monthlyTotalObject, ['byArea', area, 'totalKg'], day.byArea[area].totalKg || 0);
                deepSet(monthlyTotalObject, ['byArea', area, 'entryCount'], day.byArea[area].entryCount || 0);
                if (day.byArea[area].byWasteType) {
                    for (const type in day.byArea[area].byWasteType) {
                        deepSet(monthlyTotalObject, ['byArea', area, 'byWasteType', type, 'totalKg'], day.byArea[area].byWasteType[type].totalKg || 0);
                    }
                }
            }
        }
        
        // Agregação completa para byDestination (incluindo byWasteType interno)
        if (day.byDestination) {
            for (const dest in day.byDestination) {
                deepSet(monthlyTotalObject, ['byDestination', dest, 'totalKg'], day.byDestination[dest].totalKg || 0);
                if (day.byDestination[dest].byWasteType) {
                    for (const type in day.byDestination[dest].byWasteType) {
                        deepSet(monthlyTotalObject, ['byDestination', dest, 'byWasteType', type, 'totalKg'], day.byDestination[dest].byWasteType[type].totalKg || 0);
                    }
                }
            }
        }
    });

    monthlyTotalObject.updatedAt = FieldValue.serverTimestamp();
    const monthlyDocRef = db.doc(`monthly_totals/${clienteId}/months/${monthId}`);
    
    logger.info(`recalculateMonthFromDailies: Salvando (sobrescrevendo) total mensal com estrutura completa.`);
    
    await monthlyDocRef.set(monthlyTotalObject); 

    logger.info(`recalculateMonthFromDailies: Recálculo para ${monthId} concluído.`);
}


// --- FUNÇÕES CHAMÁVEIS (ON CALL) ---

export const backfillMonthlyOnDemand = onCall(functionOptions, async (request) => {
    logger.info("backfillMonthlyOnDemand: >>> Função acionada.", { data: request.data });
    
    if (!request.auth) throw new HttpsError("unauthenticated", "O usuário precisa estar autenticado.");
    const callerProfileSnap = await db.collection("users").doc(request.auth.uid).get();
    if (callerProfileSnap.data()?.role !== 'master') throw new HttpsError("permission-denied", "Apenas administradores podem executar esta função.");

    const { clienteId, ano, mes } = request.data;
    if (!clienteId || typeof ano !== 'number' || typeof mes !== 'number') {
        throw new HttpsError("invalid-argument", "'clienteId', 'ano' e 'mes' (0-11) são obrigatórios.");
    }

    try {
        logger.info(`backfillMonthlyOnDemand: Iniciando para cliente ${clienteId}, período: ${mes + 1}/${ano}.`);
        const startDate = new Date(Date.UTC(ano, mes, 1));
        const endDate = new Date(Date.UTC(ano, mes + 1, 1));
        
        const recordsSnapshot = await db.collectionGroup("wasteRecords")
            .where("clienteId", "==", clienteId)
            .where("timestamp", ">=", startDate.getTime())
            .where("timestamp", "<", endDate.getTime())
            .get();

        if (recordsSnapshot.empty) {
            logger.warn("backfillMonthlyOnDemand: Nenhum registro encontrado para o período. Nada a fazer.");
            return { success: true, message: "Nenhum registro encontrado para o período." };
        }
        logger.info(`backfillMonthlyOnDemand: ${recordsSnapshot.size} registros encontrados. Iniciando processamento.`);

        const empresasMap = await fetchEmpresasMap();
        const recordsByDay: Map<string, WasteRecord[]> = new Map();
        recordsSnapshot.forEach(doc => {
            const record = doc.data() as WasteRecord;
            if (record.timestamp) {
                const recordDate = new Date(record.timestamp);
                const dayId = recordDate.toLocaleDateString("en-CA", { timeZone: TIMEZONE });
                if (!recordsByDay.has(dayId)) recordsByDay.set(dayId, []);
                recordsByDay.get(dayId)?.push(record);
            }
        });

        logger.info(`backfillMonthlyOnDemand: Registros agrupados em ${recordsByDay.size} dias. Processando cada dia.`);
        const batch = db.batch();

        for (const [dayId, dailyRecords] of recordsByDay.entries()) {
            logger.info(`backfillMonthlyOnDemand: Processando dia ${dayId} com ${dailyRecords.length} registros.`);
            const dailyTotals: { [key: string]: any } = {};
            dailyRecords.forEach(record => {
                const peso = parseFloat(String(record.peso || 0));
                if (isNaN(peso)) return;
                const wasteSubType = record.wasteSubType || 'Geral';
                const empresa = empresasMap.get(record.empresaColetaId);
                let mainWasteType = record.wasteType.startsWith('Reciclável') ? 'Reciclável' : record.wasteType.startsWith('Orgânico') ? 'Orgânico' : record.wasteType;
                const destination = empresa?.destinacoes?.[mainWasteType]?.[0] || 'Nao Especificado';
                
                deepSet(dailyTotals, ['totalKg'], peso);
                deepSet(dailyTotals, ['entryCount'], 1);
                deepSet(dailyTotals, ['byWasteType', record.wasteType, 'totalKg'], peso);
                deepSet(dailyTotals, ['byWasteType', record.wasteType, 'byWasteSubType', wasteSubType, 'totalKg'], peso);
                deepSet(dailyTotals, ['byArea', record.areaLancamento, 'totalKg'], peso);
                deepSet(dailyTotals, ['byArea', record.areaLancamento, 'byWasteType', record.wasteType, 'totalKg'], peso);
                deepSet(dailyTotals, ['byDestination', destination, 'totalKg'], peso);
                deepSet(dailyTotals, ['byDestination', destination, 'byWasteType', record.wasteType, 'totalKg'], peso);
            });
            dailyTotals.clienteId = clienteId;
            dailyTotals.updatedAt = FieldValue.serverTimestamp();
            const dailyDocRef = db.doc(`daily_totals/${clienteId}/days/${dayId}`);
            batch.set(dailyDocRef, dailyTotals); // Sobrescreve completamente
        }
        
        await batch.commit();
        logger.info(`backfillMonthlyOnDemand: Batch com ${recordsByDay.size} totais diários concluído.`);

        await recalculateMonthFromDailies(clienteId, ano, mes);
        
        const message = `Backfill mensal concluído para ${mes + 1}/${ano}. ${recordsByDay.size} placares diários reprocessados e 1 placar mensal atualizado.`;
        logger.info(`backfillMonthlyOnDemand: SUCESSO! ${message}`);
        return { success: true, message };

    } catch (error: any) {
        logger.error("backfillMonthlyOnDemand: ERRO CRÍTICO:", { error: error.message, stack: error.stack });
        throw new HttpsError("internal", error.message);
    }
});


export const backfillDailyOnDemand = onCall(functionOptions, async (request) => {
    logger.info("backfillDailyOnDemand: >>> Função acionada.", { data: request.data });

    if (!request.auth) throw new HttpsError("unauthenticated", "O usuário precisa estar autenticado.");
    const callerProfileSnap = await db.collection("users").doc(request.auth.uid).get();
    if (callerProfileSnap.data()?.role !== 'master') throw new HttpsError("permission-denied", "Apenas administradores podem executar esta função.");

    const { clienteId, date } = request.data; // date no formato 'YYYY-MM-DD'
    if (!clienteId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new HttpsError("invalid-argument", "'clienteId' e 'date' (YYYY-MM-DD) são obrigatórios.");
    }

    try {
        logger.info(`backfillDailyOnDemand: Iniciando para cliente ${clienteId}, data: ${date}.`);
        const [year, month, day] = date.split('-').map(Number);
        const startDate = new Date(Date.UTC(year, month - 1, day));
        const endDate = new Date(Date.UTC(year, month - 1, day + 1));
        
        const recordsSnapshot = await db.collectionGroup("wasteRecords")
            .where("clienteId", "==", clienteId)
            .where("timestamp", ">=", startDate.getTime())
            .where("timestamp", "<", endDate.getTime())
            .get();
        logger.info(`backfillDailyOnDemand: ${recordsSnapshot.size} registros encontrados para ${date}.`);

        const empresasMap = await fetchEmpresasMap();
        const dailyTotals: { [key: string]: any } = {};
        recordsSnapshot.forEach(doc => {
            const record = doc.data() as WasteRecord;
            const peso = parseFloat(String(record.peso || 0));
            if (isNaN(peso)) return;
            const wasteSubType = record.wasteSubType || 'Geral';
            const empresa = empresasMap.get(record.empresaColetaId);
            let mainWasteType = record.wasteType.startsWith('Reciclável') ? 'Reciclável' : record.wasteType.startsWith('Orgânico') ? 'Orgânico' : record.wasteType;
            const destination = empresa?.destinacoes?.[mainWasteType]?.[0] || 'Nao Especificado';
            
            deepSet(dailyTotals, ['totalKg'], peso);
            deepSet(dailyTotals, ['entryCount'], 1);
            deepSet(dailyTotals, ['byWasteType', record.wasteType, 'totalKg'], peso);
            deepSet(dailyTotals, ['byWasteType', record.wasteType, 'byWasteSubType', wasteSubType, 'totalKg'], peso);
            deepSet(dailyTotals, ['byArea', record.areaLancamento, 'totalKg'], peso);
            deepSet(dailyTotals, ['byArea', record.areaLancamento, 'byWasteType', record.wasteType, 'totalKg'], peso);
            deepSet(dailyTotals, ['byDestination', destination, 'totalKg'], peso);
            deepSet(dailyTotals, ['byDestination', destination, 'byWasteType', record.wasteType, 'totalKg'], peso);
        });

        dailyTotals.clienteId = clienteId;
        dailyTotals.updatedAt = FieldValue.serverTimestamp();
        const dailyDocRef = db.doc(`daily_totals/${clienteId}/days/${date}`);
        
        logger.info(`backfillDailyOnDemand: Salvando total diário reprocessado para ${date}.`, { dailyTotals });
        await dailyDocRef.set(dailyTotals); // Sobrescreve completamente o documento do dia

        await recalculateMonthFromDailies(clienteId, year, month - 1);

        const message = `Backfill diário concluído para ${date}. ${recordsSnapshot.size} registros processados.`;
        logger.info(`backfillDailyOnDemand: SUCESSO! ${message}`);
        return { success: true, message };

    } catch (error: any) {
        logger.error("backfillDailyOnDemand: ERRO CRÍTICO:", { error: error.message, stack: error.stack });
        throw new HttpsError("internal", error.message);
    }
});