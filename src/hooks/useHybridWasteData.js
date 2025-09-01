// src/hooks/useHybridWasteData.js
import { useState, useEffect, useContext } from 'react';
import { getDoc, getDocs, collectionGroup, doc, where, query, onSnapshot } from 'firebase/firestore';
import AuthContext from '../context/AuthContext';

/**
 * Hook Híbrido que suporta os modos 'realtime' e 'ondemand'.
 * - Busca dados em tempo real (registros individuais) para o mês atual, se o modo for 'realtime'.
 * - Busca dados pré-agregados (resumos mensais) para os meses passados.
 * @param {string[]} selectedClienteIds - IDs dos clientes selecionados.
 * @param {number[]} selectedYears - Anos selecionados.
 * @param {number[]} selectedMonths - Meses selecionados (0-11).
 * @param {string} dashboardMode - 'realtime' ou 'ondemand'.
 * @returns {{allWasteRecords: object[], loadingRecords: boolean}}
 */
export default function useHybridWasteData(selectedClienteIds, selectedYears, selectedMonths, dashboardMode) {
  const { db } = useContext(AuthContext);
  const [allWasteRecords, setAllWasteRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  useEffect(() => {
    setLoadingRecords(true);

    if (!db || selectedClienteIds.length === 0 || selectedYears.length === 0 || selectedMonths.length === 0) {
      setAllWasteRecords([]);
      setLoadingRecords(false);
      return;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const isCurrentMonthSelected = selectedYears.includes(currentYear) && selectedMonths.includes(currentMonth);
    const realtimeEnabled = dashboardMode === 'realtime' && isCurrentMonthSelected;

    let unsubscribeRealtime = () => {}; // Função de cleanup vazia por padrão

    const fetchData = async () => {
      const pastMonthsPromises = [];
      let recordsFromPast = [];

      selectedClienteIds.forEach(clienteId => {
        selectedYears.forEach(year => {
          selectedMonths.forEach(month => {
            // A lógica para meses passados NUNCA é em tempo real
            if (year !== currentYear || month !== currentMonth) {
              const docId = `${clienteId}_${year}_${month}`;
              const summaryDocRef = doc(db, "dashboardResumosMensais", docId);
              pastMonthsPromises.push(getDoc(summaryDocRef));
            }
          });
        });
      });
      
      try {
        const pastMonthsResults = await Promise.all(pastMonthsPromises);
        pastMonthsResults.forEach(result => {
          if (result && result.exists()) {
              const summaryData = result.data();
              const { ano, mes, composicaoPorArea } = summaryData;
              for (const areaName in composicaoPorArea) {
                  const areaData = composicaoPorArea[areaName];
                  for (const mainType in areaData.breakdown) {
                      const typeData = areaData.breakdown[mainType];
                      for (const subType in typeData.subtypes) {
                          const weight = typeData.subtypes[subType];
                          if (weight > 0) {
                              recordsFromPast.push({
                                  peso: weight,
                                  wasteType: mainType,
                                  wasteSubType: subType,
                                  areaLancamento: areaName,
                                  timestamp: new Date(ano, mes, 15).getTime(),
                                  empresaColetaId: 'agregado',
                              });
                          }
                      }
                  }
              }
          }
        });

        // Se o modo REALTIME estiver ativo para o mês atual, configura o listener
        if (realtimeEnabled) {
          setLoadingRecords(true);
          const startDate = new Date(currentYear, currentMonth, 1).getTime();
          const endDate = new Date(currentYear, currentMonth + 1, 1).getTime();
          const recordsQuery = query(
            collectionGroup(db, "wasteRecords"),
            where("clienteId", "in", selectedClienteIds),
            where("timestamp", ">=", startDate),
            where("timestamp", "<", endDate)
          );

          unsubscribeRealtime = onSnapshot(recordsQuery, (querySnapshot) => {
            const recordsFromCurrent = [];
            querySnapshot.forEach(doc => {
              recordsFromCurrent.push({ id: doc.id, ...doc.data() });
            });
            setAllWasteRecords([...recordsFromPast, ...recordsFromCurrent]);
            setLoadingRecords(false);
          }, (error) => {
            console.error("Erro no listener em tempo real:", error);
            setLoadingRecords(false);
          });

        } else { // Modo ONDEMAND (busca única para todos os meses selecionados)
          const currentMonthPromises = [];
          if (isCurrentMonthSelected) {
            selectedClienteIds.forEach(clienteId => {
              const startDate = new Date(currentYear, currentMonth, 1).getTime();
              const endDate = new Date(currentYear, currentMonth + 1, 1).getTime();
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
            if (snapshot) {
              snapshot.forEach(doc => {
                recordsFromCurrent.push({ id: doc.id, ...doc.data() });
              });
            }
          });
          
          setAllWasteRecords([...recordsFromPast, ...recordsFromCurrent]);
          setLoadingRecords(false);
        }
      } catch (error) {
        console.error("Erro ao buscar dados do dashboard:", error);
        setAllWasteRecords([]);
        setLoadingRecords(false);
      }
    };

    fetchData();

    // Função de cleanup do useEffect: desinscreve do listener se ele foi ativado
    return () => {
      unsubscribeRealtime();
    };

  }, [db, selectedClienteIds, selectedYears, selectedMonths, dashboardMode]);

  return { allWasteRecords, loadingRecords };
}