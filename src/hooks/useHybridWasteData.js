// src/hooks/useHybridWasteData.js
import { useState, useEffect, useContext } from 'react';
import { getDoc, getDocs, collectionGroup, doc, where, query, onSnapshot } from 'firebase/firestore';
import AuthContext from '../context/AuthContext';

/**
 * Hook Híbrido que suporta os modos 'realtime' e 'ondemand'.
 * - Busca dados em tempo real (registros individuais) para o mês atual.
 * - Para meses passados, tenta buscar dados pré-agregados. Se o resumo for antigo (sem dados de empresa),
 * ele faz um fallback para buscar os dados brutos daquele mês.
 * @param {string[]} selectedClienteIds - IDs dos clientes selecionados.
 * @param {number[]} selectedYears - Anos selecionados.
 * @param {number[]} selectedMonths - Meses selecionados (0-11).
 * @param {string} dashboardMode - 'realtime' ou 'ondemand'.
 * @returns {{wasteRecords: object[], loading: boolean}}
 */
export default function useHybridWasteData(selectedClienteIds, selectedYears, selectedMonths, dashboardMode) {
  const { db } = useContext(AuthContext);
  const [wasteRecords, setWasteRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    if (!db || selectedClienteIds.length === 0 || selectedYears.length === 0 || selectedMonths.length === 0) {
      setWasteRecords([]);
      setLoading(false);
      return;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let unsubscribeRealtime = () => {};

    const fetchData = async () => {
      let recordsFromPast = [];
      const fallbackFetchPromises = []; // Para buscar dados brutos se o resumo for antigo

      // Cria uma lista de promises para buscar os resumos dos meses passados
      const pastMonthSummaryPromises = selectedClienteIds.flatMap(clienteId =>
        selectedYears.flatMap(year =>
          selectedMonths
            .filter(month => year !== currentYear || month !== currentMonth)
            .map(month => {
              const docId = `${clienteId}_${year}_${month}`;
              return getDoc(doc(db, "dashboardResumosMensais", docId));
            })
        )
      );
      
      try {
        const pastMonthsResults = await Promise.all(pastMonthSummaryPromises);
        
        pastMonthsResults.forEach(result => {
          if (result && result.exists()) {
              const summaryData = result.data();
              const { ano, mes, composicaoPorEmpresa, composicaoPorArea, clienteId } = summaryData;

              // Se o resumo tem a nova estrutura de dados por área, usamos ele.
              if (composicaoPorArea && Object.keys(composicaoPorArea).length > 0) {
                for (const areaName in composicaoPorArea) {
                  const areaData = composicaoPorArea[areaName];
                  for (const wasteType in areaData.breakdown) {
                    const typeData = areaData.breakdown[wasteType];
                    for (const subType in typeData.subtypes) {
                        const weight = typeData.subtypes[subType];
                        // Heurística para encontrar o ID da empresa (pode não ser perfeito, mas funciona para destinação)
                        const empresaId = composicaoPorEmpresa && Object.keys(composicaoPorEmpresa).length > 0
                            ? Object.keys(composicaoPorEmpresa).find(id => composicaoPorEmpresa[id][wasteType]) || 'agregado'
                            : 'agregado';

                        if (weight > 0) {
                            recordsFromPast.push({
                                peso: weight,
                                wasteType: wasteType,
                                wasteSubType: subType,
                                areaLancamento: areaName,
                                timestamp: new Date(ano, mes, 15).getTime(),
                                empresaColetaId: empresaId
                            });
                        }
                    }
                  }
                }
              } else {
                // FALLBACK: O resumo é antigo. Adicionamos uma promise para buscar os dados brutos.
                console.warn(`Resumo antigo (sem composicaoPorArea) para ${clienteId} (${mes + 1}/${ano}). Buscando dados brutos como fallback.`);
                const startDate = new Date(ano, mes, 1).getTime();
                const endDate = new Date(ano, mes + 1, 1).getTime();
                const recordsQuery = query(
                  collectionGroup(db, "wasteRecords"),
                  where("clienteId", "==", clienteId),
                  where("timestamp", ">=", startDate),
                  where("timestamp", "<", endDate)
                );
                fallbackFetchPromises.push(getDocs(recordsQuery));
              }
          }
        });

        // Executa as buscas de fallback, se houver alguma
        if (fallbackFetchPromises.length > 0) {
            const fallbackResults = await Promise.all(fallbackFetchPromises);
            fallbackResults.forEach(snapshot => {
                snapshot.forEach(doc => {
                    recordsFromPast.push({ id: doc.id, ...doc.data() });
                });
            });
        }

        // Lógica para o mês atual (realtime ou ondemand)
        const isCurrentMonthSelected = selectedYears.includes(currentYear) && selectedMonths.includes(currentMonth);
        const realtimeEnabled = dashboardMode === 'realtime' && isCurrentMonthSelected;
        
        if (realtimeEnabled) {
          setLoading(true);
          const startDate = new Date(currentYear, currentMonth, 1).getTime();
          const endDate = new Date(currentYear, currentMonth + 1, 1).getTime();
          const recordsQuery = query(
            collectionGroup(db, "wasteRecords"),
            where("clienteId", "in", selectedClienteIds),
            where("timestamp", ">=", startDate),
            where("timestamp", "<", endDate)
          );

          unsubscribeRealtime = onSnapshot(recordsQuery, (querySnapshot) => {
            const recordsFromCurrent = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setWasteRecords([...recordsFromPast, ...recordsFromCurrent]);
            setLoading(false);
          });

        } else {
          const currentMonthPromises = [];
          if (isCurrentMonthSelected) {
            const startDate = new Date(currentYear, currentMonth, 1).getTime();
            const endDate = new Date(currentYear, currentMonth + 1, 1).getTime();
            selectedClienteIds.forEach(clienteId => {
              const recordsQuery = query(
                collectionGroup(db, "wasteRecords"),
                where("clienteId", "==", clienteId),
                where("timestamp", ">=", startDate),
                where("timestamp", "<", endDate)
              );
              currentMonthPromises.push(getDocs(recordsQuery));
            });
          }
          
          const currentMonthResults = await Promise.all(currentMonthPromises);
          const recordsFromCurrent = [];
          currentMonthResults.forEach(snapshot => {
            snapshot.forEach(doc => recordsFromCurrent.push({ id: doc.id, ...doc.data() }));
          });
          
          setWasteRecords([...recordsFromPast, ...recordsFromCurrent]);
          setLoading(false);
        }
      } catch (error) {
        console.error("Erro ao buscar dados do dashboard:", error);
        setWasteRecords([]);
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      unsubscribeRealtime();
    };

  }, [db, selectedClienteIds, selectedYears, selectedMonths, dashboardMode]);

  return { wasteRecords, loading };
}

