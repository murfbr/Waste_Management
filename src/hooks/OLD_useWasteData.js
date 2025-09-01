// src/hooks/useWasteData.js
import { useState, useEffect, useContext } from 'react';
import { collection, getDocs, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import AuthContext from '../context/AuthContext';

/**
 * Hook robusto para buscar registros de resíduos.
 * Busca todos os registros dos clientes selecionados e os mantém atualizados.
 * Suporta modo 'ondemand' (getDocs) e 'realtime' (onSnapshot).
 * @param {string[]} selectedClienteIds
 * @param {number[]} selectedYears
 * @param {number[]} selectedMonths
 * @param {string} mode - 'ondemand' ou 'realtime'
 * @returns {{allWasteRecords: object[], loadingRecords: boolean}}
 */
export default function useWasteData(selectedClienteIds, selectedYears, selectedMonths, mode = 'ondemand') {
  const { db, appId, currentUser } = useContext(AuthContext);

  const [allWasteRecords, setAllWasteRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  useEffect(() => {
    // Pré-requisitos para a busca
    if (!db || !appId || !currentUser || !selectedClienteIds || selectedClienteIds.length === 0 || selectedYears.length === 0 || selectedMonths.length === 0) {
      setAllWasteRecords([]);
      setLoadingRecords(false);
      return;
    }

    setLoadingRecords(true);

    // Lógica de cálculo de data, comum para ambos os modos
    const minYear = Math.min(...selectedYears);
    const maxYear = Math.max(...selectedYears);
    const minMonth = Math.min(...selectedMonths);
    const maxMonth = Math.max(...selectedMonths);
    const startDate = new Date(minYear, minMonth, 1).getTime();
    const endDate = new Date(maxYear, maxMonth + 1, 1).getTime();
    
    const collectionPath = `artifacts/${appId}/public/data/wasteRecords`;
    const q = query(
      collection(db, collectionPath),
      where("clienteId", "in", selectedClienteIds),
      where("timestamp", ">=", startDate),
      where("timestamp", "<", endDate),
      orderBy("timestamp", "desc")
    );

    const processSnapshot = (snapshot) => {
      const newRecords = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const timestamp = data.timestamp?.toDate?.().getTime() || data.timestamp || null;
        return { id: docSnap.id, ...data, timestamp };
      });
      setAllWasteRecords(newRecords);
      console.log(`[FASE 2] Busca '${mode}' concluída. ${newRecords.length} registros carregados.`);
      setLoadingRecords(false);
    };

    const handleError = (error) => {
      console.error(`[FASE 2] Erro ao buscar registros em modo '${mode}':`, error);
      if (error.code === 'failed-precondition') {
        console.error("ERRO ESPERADO: Você precisa criar um índice composto no Firestore. Procure por um link no erro acima para criá-lo automaticamente.");
      }
      setAllWasteRecords([]);
      setLoadingRecords(false);
    };

    // --- INÍCIO DA LÓGICA CONDICIONAL ---
    if (mode === 'realtime') {
      console.log(`[FASE 2] Iniciando busca em modo 'realtime' entre ${startDate} e ${endDate}`);
      const unsubscribe = onSnapshot(q, processSnapshot, handleError);
      // Retorna a função de limpeza para cancelar o listener do onSnapshot
      return () => unsubscribe();
    } else { // modo 'ondemand'
      console.log(`[FASE 2] Iniciando busca em modo 'ondemand' entre ${startDate} e ${endDate}`);
      getDocs(q).then(processSnapshot).catch(handleError);
      // Não retorna função de limpeza, pois getDocs é uma chamada única
      return () => {};
    }
    // --- FIM DA LÓGICA CONDICIONAL ---

  }, [db, appId, currentUser, selectedClienteIds, selectedYears, selectedMonths, mode]); // Adicionado 'mode' às dependências

  return { allWasteRecords, loadingRecords };
}