// src/pages/PaginaDashboard.jsx

import React, { useContext, useEffect, useState } from 'react';
import AuthContext from '../context/AuthContext';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'; // Componentes da Recharts
import { collection, onSnapshot, query } from 'firebase/firestore'; // Para buscar dados

// Cores para os gráficos de pizza (pode expandir ou personalizar)
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AA336A', '#3D9140', '#FF5733', '#8333FF'];

// Função para processar dados para o gráfico de tipo de resíduo
const processDataForWasteTypeChart = (records) => {
  if (!records || records.length === 0) return [];
  const counts = records.reduce((acc, record) => {
    const type = record.wasteType || 'Não especificado'; // Assumindo que o campo é 'wasteType' - CORRETO
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
};

// Função para processar dados para o gráfico de área do hotel
const processDataForHotelAreaChart = (records) => {
  if (!records || records.length === 0) return [];
  const counts = records.reduce((acc, record) => {
    const area = record.area || 'Não especificado'; // ALTERADO de record.department para record.area
    acc[area] = (acc[area] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
};


export default function PaginaDashboard() {
  const { userProfile, db, appId, currentUser } = useContext(AuthContext);
  const [wasteRecords, setWasteRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  // Buscar os registos de resíduos
  useEffect(() => {
    if (!db || !currentUser || !userProfile || !['master', 'gerente'].includes(userProfile.role)) {
      setLoadingRecords(false);
      return;
    }

    setLoadingRecords(true);
    const wasteRecordsCollectionRef = collection(db, `artifacts/${appId}/public/data/wasteRecords`);
    const q = query(wasteRecordsCollectionRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = [];
      snapshot.forEach(doc => {
        records.push({ id: doc.id, ...doc.data() });
      });
      setWasteRecords(records);
      setLoadingRecords(false);
    }, (error) => {
      console.error("Erro ao buscar registos para dashboard:", error);
      setLoadingRecords(false);
    });

    return () => unsubscribe();
  }, [db, currentUser, appId, userProfile]);

  // Dados processados para os gráficos
  const wasteTypeData = processDataForWasteTypeChart(wasteRecords);
  const hotelAreaData = processDataForHotelAreaChart(wasteRecords);

  // Se o perfil ainda não carregou
  if (!userProfile && currentUser) { // Adicionado currentUser para garantir que o auth state já foi verificado
    return <div className="text-center text-gray-600 p-8">A carregar perfil do utilizador...</div>;
  }

  // Verifica se o utilizador tem permissão para aceder aos dashboards
  if (!userProfile || (userProfile.role !== 'master' && userProfile.role !== 'gerente')) {
    return (
      <div className="text-center text-red-500 p-8">
        Você não tem permissão para aceder a esta página de Dashboards.
        {userProfile && ` (Seu nível: ${userProfile.role})`}
      </div>
    );
  }

  if (loadingRecords) {
    return <div className="text-center text-gray-600 p-8">A carregar dados dos dashboards...</div>;
  }

  return (
    <div className="space-y-8"> {/* Aumentado o espaçamento geral */}
      <h1 className="text-3xl font-bold text-gray-800">Dashboards</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Visão Geral dos Resíduos</h2>
        
        {wasteRecords.length === 0 && !loadingRecords && (
          <p className="text-gray-600">Não há dados de resíduos suficientes para exibir os gráficos.</p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6"> {/* Aumentado o gap */}
          {/* Gráfico de Tipo de Resíduo */}
          {wasteTypeData.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg shadow h-[450px]"> {/* Altura fixa para o container do gráfico */}
              <h3 className="text-lg font-semibold text-gray-700 mb-3 text-center">Total de Resíduos por Tipo</h3>
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={wasteTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120} // Ajustado o raio
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {wasteTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Gráfico de Área do Hotel */}
          {hotelAreaData.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg shadow h-[450px]"> {/* Altura fixa */}
              <h3 className="text-lg font-semibold text-gray-700 mb-3 text-center">Resíduos por Área do Hotel</h3>
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={hotelAreaData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120} // Ajustado o raio
                    fill="#82ca9d"
                    dataKey="value"
                  >
                    {hotelAreaData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Pode adicionar mais secções de dashboard aqui */}
    </div>
  );
}
