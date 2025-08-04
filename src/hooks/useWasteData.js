// src/hooks/useWasteData.js
import { useState, useEffect, useContext } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import AuthContext from '../context/AuthContext';

/**
 * Hook robusto para buscar registros de resíduos.
 * AGORA FILTRA OS DADOS POR DATA DIRETAMENTE NO FIREBASE.
 * @param {string[]} selectedClienteIds - Array de IDs dos clientes selecionados.
 * @param {number[]} selectedYears - Array de anos selecionados.
 * @param {number[]} selectedMonths - Array de meses (0-11) selecionados.
 * @returns {{allWasteRecords: object[], loadingRecords: boolean}}
 */
export default function useWasteData(selectedClienteIds, selectedYears, selectedMonths) {
  const { db, appId, currentUser } = useContext(AuthContext);

  const [allWasteRecords, setAllWasteRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!db || !appId || !currentUser || !selectedClienteIds || selectedClienteIds.length === 0 || selectedYears.length === 0 || selectedMonths.length === 0) {
        setAllWasteRecords([]);
        setLoadingRecords(false);
        return;
      }

      setLoadingRecords(true);
      console.log('[PASSO 1.2 - CORREÇÃO] Iniciando busca de dados com filtro de data...');

      try {
        const minYear = Math.min(...selectedYears);
        const maxYear = Math.max(...selectedYears);
        const minMonth = Math.min(...selectedMonths);
        const maxMonth = Math.max(...selectedMonths);
        
        // CORREÇÃO CONFIRMADA: Convertendo as datas para NÚMEROS (Unix Timestamp em milissegundos)
        const startDate = new Date(minYear, minMonth, 1).getTime();
        const endDate = new Date(maxYear, maxMonth + 1, 1).getTime();

        console.log(`[PASSO 1.2 - CORREÇÃO] Buscando registros com timestamp entre ${startDate} e ${endDate}`);

        const collectionPath = `artifacts/${appId}/public/data/wasteRecords`;
        const q = query(
          collection(db, collectionPath),
          where("clienteId", "in", selectedClienteIds),
          where("timestamp", ">=", startDate),
          where("timestamp", "<", endDate),
          orderBy("timestamp", "desc")
        );

        const querySnapshot = await getDocs(q);

        const newRecords = querySnapshot.docs.map(docSnap => {
          const data = docSnap.data();
          const timestamp = data.timestamp?.toDate?.().getTime() || data.timestamp || null;
          return { id: docSnap.id, ...data, timestamp };
        });

        setAllWasteRecords(newRecords);
        console.log(`[PASSO 1.2 - CORREÇÃO] Busca concluída. ${newRecords.length} registros carregados (filtrados na origem).`);
      
      } catch (error) {
        console.error("[PASSO 1.2 - CORREÇÃO] Erro ao buscar registros de resíduos:", error);
        if (error.code === 'failed-precondition') {
          console.error("ERRO ESPERADO: Você precisa criar um índice composto no Firestore. Procure por um link no erro acima para criá-lo automaticamente.");
        }
        setAllWasteRecords([]);
      
      } finally {
        setLoadingRecords(false);
      }
    };

    fetchData();

    return () => {};
    
  }, [db, appId, currentUser, selectedClienteIds, selectedYears, selectedMonths]);

  return { allWasteRecords, loadingRecords };
}