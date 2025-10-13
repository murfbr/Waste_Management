// src/hooks/useAggregatedData.js
// Versão 3.0.0 - Corrigido bug na busca de dados mensais e adicionado log de validação.

import { useState, useEffect, useContext } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import AuthContext from '../context/AuthContext';

export default function useAggregatedData(selectedClienteIds, selectedYears, selectedMonths) {
    const { db } = useContext(AuthContext);
    const [dailyData, setDailyData] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db || selectedClienteIds.length === 0 || selectedYears.length === 0 ) {
            setLoading(false);
            setDailyData([]);
            setMonthlyData([]);
            return;
        }

        setLoading(true);
        const allDailyResults = {};
        const allMonthlyResults = {};
        const unsubscribes = [];

        selectedClienteIds.forEach(clienteId => {
            // --- Lógica de busca de dados DIÁRIOS (inalterada) ---
            if (selectedMonths.length > 0) {
                const dailyRanges = selectedYears.flatMap(year => 
                    selectedMonths.map(month => ({
                        start: `${year}-${String(month + 1).padStart(2, '0')}-01`,
                        end: `${year}-${String(month + 1).padStart(2, '0')}-31`
                    }))
                );

                dailyRanges.forEach((range, index) => {
                    const dailyRef = collection(db, `daily_totals/${clienteId}/days`);
                    const q = query(dailyRef, where('__name__', '>=', range.start), where('__name__', '<=', range.end));
                    
                    const dailyUnsubscribe = onSnapshot(q, (snapshot) => {
                        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        allDailyResults[`${clienteId}-${index}`] = results;
                        setDailyData(Object.values(allDailyResults).flat());
                        setLoading(false);
                    }, (error) => {
                        console.error(`[useAggregatedData] Erro no listener diário:`, error);
                        setLoading(false);
                    });
                    unsubscribes.push(dailyUnsubscribe);
                });
            } else {
                 setDailyData([]);
            }

            // --- Lógica de busca de dados MENSAIS (CORRIGIDA) ---
            // CORREÇÃO: Trocado .flatMap por .map para criar os ranges de ano corretamente.
            const monthRanges = selectedYears.map(year => ({
                start: `${year}-01`,
                end: `${year}-12`
            }));

            monthRanges.forEach((range, index) => {
                const monthlyRef = collection(db, `monthly_totals/${clienteId}/months`);
                const q = query(monthlyRef, where('__name__', '>=', range.start), where('__name__', '<=', range.end));

                const monthlyUnsubscribe = onSnapshot(q, (snapshot) => {
                    const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    
                    allMonthlyResults[`${clienteId}-${index}`] = results;
                    setMonthlyData(Object.values(allMonthlyResults).flat());
                }, (error) => {
                    console.error(`[useAggregatedData] Erro no listener mensal:`, error);
                });
                unsubscribes.push(monthlyUnsubscribe);
            });
        });

        if (unsubscribes.length === 0) {
            setLoading(false);
            setDailyData([]);
            setMonthlyData([]);
        }

        return () => {
            unsubscribes.forEach(unsub => unsub());
        };

    }, [db, selectedClienteIds, selectedYears, selectedMonths]);

    return { dailyData, monthlyData, loading };
}