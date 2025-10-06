// functions/src/handlers/aggregations.ts
// Versão Final 2.0 - Lógica explícita de "Criar ou Atualizar" para garantir a soma.

import { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { db } from "../core/admin";
import { getFirestore } from "firebase-admin/firestore";

const firestore = getFirestore();

// --- As funções auxiliares (helpers) permanecem as mesmas ---

async function getDestinationFromEmpresa(empresaId: string, wasteType: string): Promise<string> {
    if (!empresaId) return 'Nao Especificado';
    try {
        const empresaDoc = await db.collection('empresasColeta').doc(empresaId).get();
        if (!empresaDoc.exists) return 'Nao Especificado';
        const empresaData = empresaDoc.data();
        let mainWasteType = wasteType;
        if (mainWasteType.startsWith('Reciclável')) mainWasteType = 'Reciclável';
        else if (mainWasteType.startsWith('Orgânico')) mainWasteType = 'Orgânico';
        const destinacoes = empresaData?.destinacoes?.[mainWasteType];
        return destinacoes?.[0] || 'Nao Especificado';
    } catch (error) {
        logger.error("getDestinationFromEmpresa: Erro.", { error });
        return 'Nao Especificado';
    }
}

async function createUpdateObject(record: any, multiplier: 1 | -1): Promise<{ [key: string]: any } | null> {
    const peso = parseFloat(record.peso || 0);
    if (isNaN(peso) || !record.clienteId || !record.areaLancamento || !record.wasteType) return null;

    const value = peso * multiplier;
    const increment = FieldValue.increment(value);
    const entryIncrement = FieldValue.increment(1 * multiplier);
    const wasteSubType = record.wasteSubType || 'Geral';
    const destination = await getDestinationFromEmpresa(record.empresaColetaId, record.wasteType);

    return {
        clienteId: record.clienteId,
        updatedAt: FieldValue.serverTimestamp(),
        totalKg: increment,
        entryCount: entryIncrement,
        [`byWasteType.${record.wasteType}.totalKg`]: increment,
        [`byWasteType.${record.wasteType}.byWasteSubType.${wasteSubType}.totalKg`]: increment,
        [`byArea.${record.areaLancamento}.totalKg`]: increment,
        [`byArea.${record.areaLancamento}.entryCount`]: entryIncrement,
        [`byArea.${record.areaLancamento}.byWasteType.${record.wasteType}.totalKg`]: increment,
        [`byDestination.${destination}.totalKg`]: increment,
        [`byDestination.${destination}.byWasteType.${record.wasteType}.totalKg`]: increment,
    };
}

// --- GATILHOS (TRIGGERS) FINAIS COM LÓGICA EXPLÍCITA ---

export const onWasteRecordCreated = onDocumentCreated(
    "artifacts/default-app-id/public/data/wasteRecords/{recordId}",
    async (event) => {
        const snapshot = event.data;
        if (!snapshot) return;
        const record = snapshot.data();
        if (!record.clienteId || !record.timestamp) return;

        const date = new Date(record.timestamp);
        const dayId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const monthId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        const dailyRef = db.doc(`daily_totals/${record.clienteId}/days/${dayId}`);
        const monthlyRef = db.doc(`monthly_totals/${record.clienteId}/months/${monthId}`);

        await firestore.runTransaction(async (transaction) => {
            const dailyDoc = await transaction.get(dailyRef);
            const monthlyDoc = await transaction.get(monthlyRef);
            
            const dailyUpdate = await createUpdateObject(record, 1);
            if (!dailyUpdate) return;

            // Lógica explícita para o total diário
            if (dailyDoc.exists) {
                transaction.update(dailyRef, dailyUpdate);
            } else {
                transaction.set(dailyRef, dailyUpdate);
            }

            // Lógica explícita para o total mensal
            if (monthlyDoc.exists) {
                transaction.update(monthlyRef, dailyUpdate);
            } else {
                transaction.set(monthlyRef, dailyUpdate);
            }
        });
    }
);

// As funções de Update e Delete já usam transações e lógica de incremento/decremento,
// o que naturalmente lida com este problema. Incluindo o código completo por segurança.
export const onWasteRecordUpdated = onDocumentUpdated(
    "artifacts/default-app-id/public/data/wasteRecords/{recordId}",
    async (event) => {
        if (!event.data) return;
        const before = event.data.before.data();
        const after = event.data.after.data();

        await firestore.runTransaction(async (transaction) => {
            const oldUpdate = await createUpdateObject(before, -1);
            if (oldUpdate) {
                const oldDate = new Date(before.timestamp);
                const oldDayId = `${oldDate.getFullYear()}-${String(oldDate.getMonth() + 1).padStart(2, '0')}-${String(oldDate.getDate()).padStart(2, '0')}`;
                const oldMonthId = `${oldDate.getFullYear()}-${String(oldDate.getMonth() + 1).padStart(2, '0')}`;
                transaction.update(db.doc(`daily_totals/${before.clienteId}/days/${oldDayId}`), oldUpdate);
                transaction.update(db.doc(`monthly_totals/${before.clienteId}/months/${oldMonthId}`), oldUpdate);
            }

            const newUpdate = await createUpdateObject(after, 1);
            if (newUpdate) {
                const newDate = new Date(after.timestamp);
                const newDayId = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}`;
                const newMonthId = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
                // Para o caso de a data mudar, precisamos ser explícitos
                const newDailyRef = db.doc(`daily_totals/${after.clienteId}/days/${newDayId}`);
                const newMonthlyRef = db.doc(`monthly_totals/${after.clienteId}/months/${newMonthId}`);
                const newDailyDoc = await transaction.get(newDailyRef);
                if (newDailyDoc.exists) {
                    transaction.update(newDailyRef, newUpdate);
                } else {
                    transaction.set(newDailyRef, newUpdate);
                }
                const newMonthlyDoc = await transaction.get(newMonthlyRef);
                if (newMonthlyDoc.exists) {
                    transaction.update(newMonthlyRef, newUpdate);
                } else {
                    transaction.set(newMonthlyRef, newUpdate);
                }
            }
        });
    }
);

export const onWasteRecordDeleted = onDocumentDeleted(
    "artifacts/default-app-id/public/data/wasteRecords/{recordId}",
    async (event) => {
        const snapshot = event.data;
        if (!snapshot) return;
        const deletedRecord = snapshot.data();

        const update = await createUpdateObject(deletedRecord, -1);
        if (update) {
            const date = new Date(deletedRecord.timestamp);
            const dayId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const monthId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            await db.doc(`daily_totals/${deletedRecord.clienteId}/days/${dayId}`).update(update);
            await db.doc(`monthly_totals/${deletedRecord.clienteId}/months/${monthId}`).update(update);
        }
    }
);