// src/hooks/useWasteData.js
import { useState, useEffect, useContext } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import AuthContext from '../context/AuthContext'; // Para pegar db e appId

export default function useWasteData(selectedClienteIds) {
  const { db, appId, currentUser } = useContext(AuthContext); // Pegando db e appId do contexto

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
    console.log("HOOK useWasteData: Buscando registros para clientes:", selectedClienteIds);

    const q = query(
      collection(db, `artifacts/${appId}/public/data/wasteRecords`),
      where("clienteId", "in", selectedClienteIds),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newRecords = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        // Converte o timestamp do Firebase para milissegundos, se necessário
        const timestamp = data.timestamp?.toDate?.().getTime() || data.timestamp || null;
        return { id: docSnap.id, ...data, timestamp };
      });
      setAllWasteRecords(newRecords);
      setLoadingRecords(false);
      console.log("HOOK useWasteData: Registros carregados:", newRecords.length);
    }, (error) => {
      console.error("HOOK useWasteData: Erro ao buscar todos os registros:", error);
      setAllWasteRecords([]);
      setLoadingRecords(false);
    });

    // Função de limpeza para cancelar a inscrição do listener do Firestore
    return () => {
      console.log("HOOK useWasteData: Cancelando inscrição do listener.");
      unsubscribe();
    };
  }, [db, appId, currentUser, selectedClienteIds]); // Dependências do useEffect

  return { allWasteRecords, loadingRecords };
}
