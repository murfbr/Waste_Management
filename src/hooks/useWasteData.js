// src/hooks/useWasteData.js
import { useState, useEffect, useContext } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
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
    // Se não houver db, appId, currentUser ou clientes selecionados,
    // limpa os registros e para o carregamento.
    if (!db || !appId || !currentUser || !selectedClienteIds || selectedClienteIds.length === 0) {
      setAllWasteRecords([]);
      setLoadingRecords(false);
      return;
    }

    setLoadingRecords(true);

    const collectionPath = `artifacts/${appId}/public/data/wasteRecords`;
    const q = query(
      collection(db, collectionPath),
      where("clienteId", "in", selectedClienteIds),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newRecords = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const timestamp = data.timestamp?.toDate?.().getTime() || data.timestamp || null;
        return { id: docSnap.id, ...data, timestamp };
      });
      setAllWasteRecords(newRecords);
      setLoadingRecords(false);
    }, (error) => {
      console.error("Erro ao buscar registros de resíduos:", error);
      setAllWasteRecords([]);
      setLoadingRecords(false);
    });

    // Função de limpeza para cancelar a inscrição do listener do Firestore
    return () => unsubscribe();
    
  }, [db, appId, currentUser, selectedClienteIds]);

  return { allWasteRecords, loadingRecords };
}
