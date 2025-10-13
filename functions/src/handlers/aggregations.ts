// functions/src/handlers/aggregations.ts
// Versão 3.0 - Adicionada a estrutura de subtipo aninhada em byArea.

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
        // --- NOVA LINHA ADICIONADA ---
        [`byArea.${record.areaLancamento}.byWasteType.${record.wasteType}.byWasteSubType.${wasteSubType}.totalKg`]: increment,
        [`byArea.${record.areaLancamento}.byWasteType.${record.wasteType}.byDestination.${destination}.totalKg`]: increment,
        [`byDestination.${destination}.totalKg`]: increment,
        [`byDestination.${destination}.byWasteType.${record.wasteType}.totalKg`]: increment,
    };
}

// --- GATILHOS (TRIGGERS) ---
// Nenhuma alteração necessária nos gatilhos, pois eles usam a função createUpdateObject.

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

        const updateData = await createUpdateObject(record, 1);
        if (!updateData) return;

        await firestore.runTransaction(async (transaction) => {
            const dailyDoc = await transaction.get(dailyRef);
            const monthlyDoc = await transaction.get(monthlyRef);
            
            if (dailyDoc.exists) {
                transaction.update(dailyRef, updateData);
            } else {
                transaction.set(dailyRef, updateData);
            }

            if (monthlyDoc.exists) {
                transaction.update(monthlyRef, updateData);
            } else {
                transaction.set(monthlyRef, updateData);
            }
        });
    }
);

export const onWasteRecordUpdated = onDocumentUpdated(
    "artifacts/default-app-id/public/data/wasteRecords/{recordId}",
    async (event) => {
        if (!event.data) return;
        const before = event.data.before.data();
        const after = event.data.after.data();

        const oldUpdate = await createUpdateObject(before, -1);
        const newUpdate = await createUpdateObject(after, 1);

        if (!oldUpdate || !newUpdate) {
            logger.error("Não foi possível criar os objetos de atualização para o registro.", { before, after });
            return;
        }

        await firestore.runTransaction(async (transaction) => {
            const oldDate = new Date(before.timestamp);
            const oldDayId = `${oldDate.getFullYear()}-${String(oldDate.getMonth() + 1).padStart(2, '0')}-${String(oldDate.getDate()).padStart(2, '0')}`;
            const oldMonthId = `${oldDate.getFullYear()}-${String(oldDate.getMonth() + 1).padStart(2, '0')}`;
            const oldDailyRef = db.doc(`daily_totals/${before.clienteId}/days/${oldDayId}`);
            const oldMonthlyRef = db.doc(`monthly_totals/${before.clienteId}/months/${oldMonthId}`);
            
            const newDate = new Date(after.timestamp);
            const newDayId = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}`;
            const newMonthId = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
            const newDailyRef = db.doc(`daily_totals/${after.clienteId}/days/${newDayId}`);
            const newMonthlyRef = db.doc(`monthly_totals/${after.clienteId}/months/${newMonthId}`);

            const [oldDailyDoc, oldMonthlyDoc, newDailyDoc, newMonthlyDoc] = await Promise.all([
                transaction.get(oldDailyRef),
                transaction.get(oldMonthlyRef),
                oldDayId === newDayId ? Promise.resolve(null) : transaction.get(newDailyRef),
                oldMonthId === newMonthId ? Promise.resolve(null) : transaction.get(newMonthlyRef)
            ]);

            if (oldDailyDoc.exists) {
                transaction.update(oldDailyRef, oldUpdate);
            }
            if (oldMonthlyDoc.exists) {
                transaction.update(oldMonthlyRef, oldUpdate);
            }

            const finalNewDailyDoc = newDailyDoc || (oldDayId === newDayId ? oldDailyDoc : null);
            if (finalNewDailyDoc?.exists) {
                transaction.update(newDailyRef, newUpdate);
            } else {
                transaction.set(newDailyRef, newUpdate);
            }
            
            const finalNewMonthlyDoc = newMonthlyDoc || (oldMonthId === newMonthId ? oldMonthlyDoc : null);
            if (finalNewMonthlyDoc?.exists) {
                transaction.update(newMonthlyRef, newUpdate);
            } else {
                transaction.set(newMonthlyRef, newUpdate);
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
        if (!update) return;
        
        const date = new Date(deletedRecord.timestamp);
        const dayId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const monthId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        const dailyRef = db.doc(`daily_totals/${deletedRecord.clienteId}/days/${dayId}`);
        const monthlyRef = db.doc(`monthly_totals/${deletedRecord.clienteId}/months/${monthId}`);

        await firestore.runTransaction(async (transaction) => {
            const dailyDoc = await transaction.get(dailyRef);
            const monthlyDoc = await transaction.get(monthlyRef);

            if (dailyDoc.exists) {
                transaction.update(dailyRef, update);
            }
            if (monthlyDoc.exists) {
                transaction.update(monthlyRef, update);
            }
        });
    }
);