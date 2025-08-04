// src/hooks/useWasteData.js
import { useState, useEffect, useContext } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'; // << MUDANÇA AQUI
import AuthContext from '../context/AuthContext';

/**
 * Hook robusto para buscar registros de resíduos.
 * Busca todos os registros dos clientes selecionados e os mantém atualizados.
 * @param {string[]} selectedClienteIds - Array de IDs dos clientes selecionados.
 * @returns {{allWasteRecords: object[], loadingRecords: boolean}}
 */
export default function useWasteData(selectedClienteIds) {
  const { db, appId, currentUser } = useContext(AuthContext);

  const [allWasteRecords, setAllWasteRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  useEffect(() => {
    // --- Início da Lógica Alterada ---

    // Definimos uma função assíncrona para buscar os dados.
    const fetchData = async () => {
      // A verificação de pré-requisitos continua a mesma.
      if (!db || !appId || !currentUser || !selectedClienteIds || selectedClienteIds.length === 0) {
        setAllWasteRecords([]);
        setLoadingRecords(false);
        return;
      }

      setLoadingRecords(true);
      console.log('[PASSO 1.1] Iniciando busca de dados sob demanda (getDocs)...');

      try {
        const collectionPath = `artifacts/${appId}/public/data/wasteRecords`;
        const q = query(
          collection(db, collectionPath),
          where("clienteId", "in", selectedClienteIds),
          orderBy("timestamp", "desc")
        );

        // AQUI ESTÁ A MUDANÇA PRINCIPAL: trocamos onSnapshot por getDocs.
        // Isso executa a consulta uma única vez.
        const querySnapshot = await getDocs(q);

        const newRecords = querySnapshot.docs.map(docSnap => {
          const data = docSnap.data();
          const timestamp = data.timestamp?.toDate?.().getTime() || data.timestamp || null;
          return { id: docSnap.id, ...data, timestamp };
        });

        setAllWasteRecords(newRecords);
        console.log(`[PASSO 1.1] Busca concluída. ${newRecords.length} registros carregados.`);
      
      } catch (error) {
        console.error("[PASSO 1.1] Erro ao buscar registros de resíduos:", error);
        setAllWasteRecords([]);
      
      } finally {
        setLoadingRecords(false);
      }
    };

    fetchData(); // Executamos a função de busca.

    // A função de limpeza do useEffect agora está vazia, pois não há mais um listener para cancelar.
    return () => {};
    
    // --- Fim da Lógica Alterada ---
    
  }, [db, appId, currentUser, selectedClienteIds]);

  return { allWasteRecords, loadingRecords };
}