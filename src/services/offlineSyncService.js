// src/services/offlineSyncService.js

import Dexie from 'dexie';
import { collection, addDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const localDb = new Dexie('ctrlwaste_offline_db');

localDb.version(1).stores({
  pending_records: '++id, localId',
});

export const addPendingRecord = async (recordData) => {
  try {
    const localId = uuidv4();
    const recordWithLocalId = { ...recordData, localId };
    await localDb.pending_records.add(recordWithLocalId);
    console.log('Registro salvo localmente com sucesso!', recordWithLocalId);
    window.dispatchEvent(new CustomEvent('pending-records-updated'));
    return { success: true, message: 'Lançamento salvo localmente! Sincronizando...' };
  } catch (error) {
    console.error('Erro ao salvar registro localmente:', error);
    return { success: false, message: 'Falha ao salvar o lançamento localmente.' };
  }
};

export const syncPendingRecords = async (firestoreDb, appId) => {
  if (!firestoreDb || !appId) return false; // Retorna false se não puder sincronizar
  const pending = await localDb.pending_records.toArray();
  if (pending.length === 0) {
    return false; // Retorna false pois nenhuma ação foi tomada
  }

  console.log(`Sincronizando ${pending.length} registros pendentes...`);
  let changesMade = false;
  for (const record of pending) {
    try {
      const recordsCollectionRef = collection(firestoreDb, `artifacts/${appId}/public/data/wasteRecords`);
      const { id, ...dataToUpload } = record;
      await addDoc(recordsCollectionRef, dataToUpload);
      await localDb.pending_records.delete(record.id);
      console.log(`Registro ${record.localId} sincronizado e removido da fila local.`);
      changesMade = true;
    } catch (error) {
      console.error(`Falha ao sincronizar o registro ${record.localId}:`, error);
      // Se der erro, o loop para e tentará novamente mais tarde.
      // Retorna o status atual de 'changesMade' para que a UI possa reagir se algo já foi sincronizado.
      return changesMade; 
    }
  }
  
  // A linha que disparava o evento foi REMOVIDA para quebrar o loop.
  // Em vez disso, retornamos um booleano para indicar se a sincronização fez alguma alteração.
  return changesMade;
};

export const getPendingRecordsCount = async () => {
    try {
        return await localDb.pending_records.count();
    } catch (error) {
        console.error("Erro ao contar registros pendentes:", error);
        return 0;
    }
};

export const getPendingRecords = async () => {
    try {
        return await localDb.pending_records.toArray();
    } catch (error) {
        console.error("Erro ao buscar registros pendentes:", error);
        return [];
    }
};

export const deletePendingRecord = async (localId) => {
    try {
        const recordToDelete = await localDb.pending_records.where('localId').equals(localId).first();
        if (recordToDelete) {
            await localDb.pending_records.delete(recordToDelete.id);
            console.log(`Registro pendente ${localId} deletado com sucesso.`);
            window.dispatchEvent(new CustomEvent('pending-records-updated'));
        }
    } catch (error) {
        console.error(`Erro ao deletar registro pendente ${localId}:`, error);
    }
};
