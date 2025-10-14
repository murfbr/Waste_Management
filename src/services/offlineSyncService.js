// src/services/offlineSyncService.js

import Dexie from 'dexie';
// IMPORTAÇÕES ADICIONADAS: writeBatch e doc para operações em lote.
import { collection, writeBatch, doc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

// A inicialização do Dexie permanece a mesma.
const localDb = new Dexie('ctrlwaste_offline_db');

localDb.version(1).stores({
  // A chave primária 'id' auto-incrementada é ótima.
  // O 'localId' indexado permite buscas rápidas, como na exclusão.
  pending_records: '++id, localId',
});

/**
 * Adiciona um novo registro de resíduo à fila de sincronização local (IndexedDB).
 * @param {object} recordData - Os dados do registro a serem salvos.
 * @returns {{success: boolean, message: string}}
 */
export const addPendingRecord = async (recordData) => {
  try {
    // Gera um ID único universal (UUID) para rastrear este registro
    // desde a criação local até a confirmação no Firestore.
    const localId = uuidv4();
    const recordWithLocalId = { ...recordData, localId };
    
    await localDb.pending_records.add(recordWithLocalId);
    
    // Notifica a aplicação que a lista de registros pendentes mudou.
    // Isso permite que a UI (ex: o contador de status) se atualize imediatamente.
    window.dispatchEvent(new CustomEvent('pending-records-updated'));
    
    return { success: true, message: 'Lançamento salvo localmente! Sincronizando...' };
  } catch (error) {
    console.error('Erro ao salvar registro localmente:', error);
    return { success: false, message: 'Falha ao salvar o lançamento localmente.' };
  }
};

/**
 * Sincroniza todos os registros pendentes do IndexedDB com o Firestore.
 * Utiliza uma operação de "WriteBatch" para garantir atomicidade: ou todos os
 * registros são salvos com sucesso, ou nenhum é. Isso previne duplicatas.
 * @param {object} firestoreDb - A instância do Firestore.
 * @param {string} appId - O ID da aplicação para o caminho da coleção.
 * @returns {Promise<boolean>} - Retorna `true` se alguma alteração foi sincronizada, `false` caso contrário.
 */
export const syncPendingRecords = async (firestoreDb, appId) => {
  // Guarda de segurança: não tenta sincronizar sem as dependências necessárias.
  if (!firestoreDb || !appId) return false;

  const pending = await localDb.pending_records.toArray();
  if (pending.length === 0) {
    // Não há nada a fazer.
    return false;
  }

  // Cria um "lote" de escrita. Todas as operações são agrupadas.
  const batch = writeBatch(firestoreDb);
  const recordsCollectionRef = collection(firestoreDb, `artifacts/${appId}/public/data/wasteRecords`);

  pending.forEach(record => {
    // Cria uma referência para um novo documento com ID gerado pelo Firestore.
    const docRef = doc(recordsCollectionRef);
    
    // Remove o 'id' do Dexie antes de enviar para o Firestore.
    // O 'localId' (uuid) é mantido, o que é crucial para a UI não exibir duplicatas.
    const { id, ...dataToUpload } = record;
    batch.set(docRef, dataToUpload);
  });

  try {
    // Executa o lote. Esta é uma ÚNICA chamada para o Firestore.
    // É uma operação atômica: ou tudo funciona, ou nada é salvo.
    await batch.commit();

    // Se o lote foi salvo com sucesso, remove os registros correspondentes do IndexedDB.
    const idsToDelete = pending.map(record => record.id);
    await localDb.pending_records.bulkDelete(idsToDelete);

    return true; // Indica que a sincronização realizou alterações.

  } catch (error) {
    console.error('Falha CRÍTICA ao sincronizar o lote de registros:', error);
    // Se o `commit` falhar, NADA é salvo no Firestore e NADA é removido do
    // banco local. A integridade dos dados é mantida, e a sincronização
    // pode ser tentada novamente mais tarde sem risco.
    return false;
  }
};


// --- As funções auxiliares abaixo estão corretas e foram mantidas ---

/**
 * Retorna a contagem de registros na fila de sincronização.
 * @returns {Promise<number>}
 */
export const getPendingRecordsCount = async () => {
    try {
        return await localDb.pending_records.count();
    } catch (error) {
        console.error("Erro ao contar registros pendentes:", error);
        return 0;
    }
};

/**
 * Retorna todos os registros da fila de sincronização.
 * @returns {Promise<Array<object>>}
 */
export const getPendingRecords = async () => {
    try {
        return await localDb.pending_records.toArray();
    } catch (error) {
        console.error("Erro ao buscar registros pendentes:", error);
        return [];
    }
};

/**
 * Exclui um registro específico da fila de sincronização local.
 * @param {string} localId - O UUID do registro a ser excluído.
 */
export const deletePendingRecord = async (localId) => {
    try {
        // Encontra o registro pelo 'localId' para obter sua chave primária 'id'.
        const recordToDelete = await localDb.pending_records.where('localId').equals(localId).first();
        if (recordToDelete) {
            await localDb.pending_records.delete(recordToDelete.id);
            // Notifica a aplicação para atualizar a UI.
            window.dispatchEvent(new CustomEvent('pending-records-updated'));
        }
    } catch (error) {
        console.error(`Erro ao deletar registro pendente ${localId}:`, error);
    }
};
