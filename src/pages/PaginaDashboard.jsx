// src/pages/PaginaDashboard.jsx

import React, { useContext, useEffect, useState, useMemo } from 'react';
import AuthContext from '../context/AuthContext';
import { 
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    LineChart, Line, ReferenceLine
} from 'recharts';
import { collection, onSnapshot, query, where, getDocs, documentId, orderBy, Timestamp } from 'firebase/firestore';
import DashboardFilters from '../components/DashboardFilters'; // IMPORTA O NOVO COMPONENTE

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AA336A', '#3D9140', '#FF5733', '#8333FF'];
const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// Funções de processamento de dados (inalteradas)
const processDataForPieChartByWeight = (records, groupByField) => {
  if (!records || records.length === 0) return { pieData: [], totalWeight: 0 };
  let totalWeight = 0;
  const counts = records.reduce((acc, record) => {
    const key = record[groupByField] || 'Não especificado';
    const weight = parseFloat(record.peso || 0);
    acc[key] = (acc[key] || 0) + weight;
    totalWeight += weight;
    return acc;
  }, {});
  const pieData = Object.entries(counts).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));
  return { pieData, totalWeight: parseFloat(totalWeight.toFixed(2)) };
};

const processDataForDailyVolumeBarChart = (records) => {
    if (!records || records.length === 0) return [];
    const dailyVolumes = records.reduce((acc, record) => {
        const date = new Date(record.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const weight = parseFloat(record.peso || 0);
        acc[date] = (acc[date] || 0) + weight;
        return acc;
    }, {});
    return Object.entries(dailyVolumes)
        .map(([name, volume]) => ({ name, volume: parseFloat(volume.toFixed(2)) }))
        .sort((a,b) => {
            const [dayA, monthA] = a.name.split('/');
            const [dayB, monthB] = b.name.split('/');
            return new Date(`2000/${monthA}/${dayA}`) - new Date(`2000/${monthB}/${dayB}`);
        });
};

const processDataForLixoZeroChart = (records, rejectCategoryName = "Rejeito") => {
    if (!records || records.length === 0) return [];
    const dailyData = records.reduce((acc, record) => {
        const date = new Date(record.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const weight = parseFloat(record.peso || 0);
        acc[date] = acc[date] || { total: 0, rejeito: 0 };
        acc[date].total += weight;
        if (record.wasteType === rejectCategoryName) {
            acc[date].rejeito += weight;
        }
        return acc;
    }, {});

    return Object.entries(dailyData)
        .map(([name, data]) => ({
            name,
            percentualRejeito: data.total > 0 ? parseFloat(((data.rejeito / data.total) * 100).toFixed(2)) : 0,
            total: parseFloat(data.total.toFixed(2)),
            rejeito: parseFloat(data.rejeito.toFixed(2))
        }))
        .sort((a,b) => {
            const [dayA, monthA] = a.name.split('/');
            const [dayB, monthB] = b.name.split('/');
            return new Date(`2000/${monthA}/${dayA}`) - new Date(`2000/${monthB}/${dayB}`);
        });
};


export default function PaginaDashboard() {
  const { userProfile, db, appId, currentUser } = useContext(AuthContext);
  
  const [allWasteRecords, setAllWasteRecords] = useState([]);
  const [filteredWasteRecords, setFilteredWasteRecords] = useState([]); 
  const [loadingRecords, setLoadingRecords] = useState(true);

  const [userAllowedClientes, setUserAllowedClientes] = useState([]);
  const [selectedClienteIds, setSelectedClienteIds] = useState([]); 
  const [loadingUserClientes, setLoadingUserClientes] = useState(true);
  const [selectAllToggle, setSelectAllToggle] = useState(true);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const [availableAreas, setAvailableAreas] = useState([]);
  const [selectedAreaLixoZero, setSelectedAreaLixoZero] = useState('ALL');

  const availableYears = useMemo(() => {
    const years = new Set();
    allWasteRecords.forEach(record => {
        if (record.timestamp) years.add(new Date(record.timestamp).getFullYear());
    });
    if (years.size === 0) years.add(currentYear);
    return Array.from(years).sort((a,b) => b - a);
  }, [allWasteRecords, currentYear]);

  // Carregar clientes (lógica inalterada)
  useEffect(() => { 
    if (!db || !userProfile) { setLoadingUserClientes(false); setUserAllowedClientes([]); setSelectedClienteIds([]); return; }
    const fetchUserClientes = async () => {
      setLoadingUserClientes(true); let loadedClientes = [];
      try {
        if (userProfile.role === 'master') {
          const q = query(collection(db, "clientes"), where("ativo", "==", true), orderBy("nome"));
          loadedClientes = (await getDocs(q)).docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } else if (userProfile.clientesPermitidos && userProfile.clientesPermitidos.length > 0) {
          const q = query(collection(db, "clientes"), where(documentId(), "in", userProfile.clientesPermitidos), where("ativo", "==", true), orderBy("nome"));
          loadedClientes = (await getDocs(q)).docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        setUserAllowedClientes(loadedClientes);
        setSelectedClienteIds(loadedClientes.map(c => c.id));
        setSelectAllToggle(true);
      } catch (e) { console.error("Erro ao carregar clientes para dashboard:", e); setUserAllowedClientes([]); setSelectedClienteIds([]); }
      setLoadingUserClientes(false);
    };
    fetchUserClientes();
  }, [db, userProfile]);

  // Buscar TODOS os registos de resíduos para os clientes selecionados (lógica inalterada)
  useEffect(() => {
    if (!db || !currentUser || loadingUserClientes || selectedClienteIds.length === 0) {
      setAllWasteRecords([]); setLoadingRecords(false); return;
    }
    setLoadingRecords(true);
    const q = query(collection(db, `artifacts/${appId}/public/data/wasteRecords`), where("clienteId", "in", selectedClienteIds));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), timestamp: doc.data().timestamp }));
      setAllWasteRecords(records);
      setLoadingRecords(false);
    }, (error) => {
      console.error("Erro ao buscar todos os registos para dashboard:", error);
      setAllWasteRecords([]); setLoadingRecords(false);
    });
    return () => unsubscribe();
  }, [db, currentUser, appId, selectedClienteIds, loadingUserClientes]);

  // Filtrar registos e popular áreas (lógica inalterada)
  useEffect(() => {
    if (allWasteRecords.length === 0) {
      setFilteredWasteRecords([]); setAvailableAreas([]); setSelectedAreaLixoZero('ALL'); return;
    }
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getTime();
    const lastDayOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999).getTime();
    const recordsForMonth = allWasteRecords.filter(record => {
      const recordDate = typeof record.timestamp === 'number' ? record.timestamp : record.timestamp?.toDate?.().getTime();
      return recordDate >= firstDayOfMonth && recordDate <= lastDayOfMonth;
    });
    setFilteredWasteRecords(recordsForMonth);
    const areasInMonth = new Set();
    recordsForMonth.forEach(record => { if(record.areaLancamento) areasInMonth.add(record.areaLancamento); });
    setAvailableAreas(Array.from(areasInMonth).sort());
  }, [allWasteRecords, selectedYear, selectedMonth]);

  const lixoZeroChartRecords = useMemo(() => { // Lógica inalterada
    if (selectedAreaLixoZero === 'ALL') return filteredWasteRecords;
    return filteredWasteRecords.filter(record => record.areaLancamento === selectedAreaLixoZero);
  }, [filteredWasteRecords, selectedAreaLixoZero]);

  const handleClienteSelectionChange = (clienteId) => { // Lógica inalterada
    setSelectedClienteIds(prev => {
      const nS = prev.includes(clienteId) ? prev.filter(id => id !== clienteId) : [...prev, clienteId];
      setSelectAllToggle(nS.length === userAllowedClientes.length); return nS;
    });
  };
  const handleSelectAllToggleChange = () => { // Lógica inalterada
    const nT = !selectAllToggle; setSelectAllToggle(nT);
    if (nT) setSelectedClienteIds(userAllowedClientes.map(c => c.id)); else setSelectedClienteIds([]);
  };

  const { pieData: wasteTypeData, totalWeight: totalWasteWeight } = processDataForPieChartByWeight(allWasteRecords, 'wasteType');
  const { pieData: areaData } = processDataForPieChartByWeight(allWasteRecords, 'areaLancamento');
  const dailyVolumeData = processDataForDailyVolumeBarChart(filteredWasteRecords);
  const lixoZeroData = processDataForLixoZeroChart(lixoZeroChartRecords);

  // Lógica de renderização de loading e permissões (inalterada)
  if (loadingUserClientes) return <div className="text-center text-gray-600 p-8">A carregar dados dos clientes...</div>;
  if (!userProfile && currentUser) return <div className="text-center text-gray-600 p-8">A carregar perfil...</div>;
  if (!userProfile || (userProfile.role !== 'master' && userProfile.role !== 'gerente')) {
    return <div className="text-center text-red-500 p-8">Acesso Negado.</div>;
  }
  if (userProfile.role === 'gerente' && userAllowedClientes.length === 0 && !loadingUserClientes) {
    return <div className="text-center text-orange-600 p-8">Sem acesso a clientes.</div>;
  }
   if (userProfile.role === 'master' && userAllowedClientes.length === 0 && !loadingUserClientes) {
    return <div className="text-center text-orange-600 p-8">Nenhum cliente ativo cadastrado.</div>;
  }

  let dashboardTitleContext = ""; // Lógica inalterada
  if (selectedClienteIds.length === 1) {
    const cliente = userAllowedClientes.find(c => c.id === selectedClienteIds[0]);
    dashboardTitleContext = cliente ? ` de: ${cliente.nome}` : "";
  } else if (selectedClienteIds.length > 1 && selectedClienteIds.length < userAllowedClientes.length) {
    dashboardTitleContext = ` de ${selectedClienteIds.length} clientes selecionados`;
  } else if (selectedClienteIds.length > 0 && selectedClienteIds.length === userAllowedClientes.length) {
     dashboardTitleContext = userProfile.role === 'master' ? " (Todos os Clientes Ativos)" : " (Todos os Seus Clientes Permitidos)";
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboards</h1>
      </div>

      {/* USA O NOVO COMPONENTE DE FILTROS */}
      <DashboardFilters
        userProfile={userProfile}
        userAllowedClientes={userAllowedClientes}
        selectedClienteIds={selectedClienteIds}
        onClienteSelectionChange={handleClienteSelectionChange}
        selectAllToggle={selectAllToggle}
        onSelectAllToggleChange={handleSelectAllToggleChange}
        availableYears={availableYears}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear} // Passa a função de set diretamente
        // MESES é uma constante global, não precisa ser passada se DashboardFilters a importar também
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth} // Passa a função de set diretamente
        availableAreas={availableAreas}
        selectedAreaLixoZero={selectedAreaLixoZero}
        onAreaLixoZeroChange={setSelectedAreaLixoZero} // Passa a função de set diretamente
        loadingUserClientes={loadingUserClientes}
      />
      
      {/* Secção de Gráficos (lógica de renderização condicional e JSX dos gráficos inalterada) */}
      {loadingRecords ? ( <div className="text-center text-gray-600 p-8">A carregar dados dos gráficos...</div>
      ) : selectedClienteIds.length === 0 ? ( <div className="bg-white p-6 rounded-lg shadow text-center"><p className="text-gray-600">Selecione pelo menos um cliente para visualizar os dados.</p></div>
      ) : allWasteRecords.length === 0 && filteredWasteRecords.length === 0 ? ( <div className="bg-white p-6 rounded-lg shadow text-center"><p className="text-gray-600">Não há dados de resíduos registados para a seleção atual.</p></div>
      ) : (
        <>
          {/* Gráfico de Barras: Volume Diário */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Volume Diário de Resíduos ({MESES[selectedMonth]}/{selectedYear}){dashboardTitleContext}</h2>
            {dailyVolumeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dailyVolumeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => `${value.toFixed(2)} kg`} />
                  <Legend />
                  <Bar dataKey="volume" fill="#8884d8" name="Volume Total (kg)" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-gray-500">Sem dados para o gráfico de volume diário neste período.</p>}
          </div>

          {/* Gráfico de Linha: Meta Lixo Zero */}
          <div className="bg-white p-6 rounded-lg shadow mt-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Meta Lixo Zero: Percentual de Rejeito ({MESES[selectedMonth]}/{selectedYear})
              {selectedAreaLixoZero !== 'ALL' ? ` - Área: ${selectedAreaLixoZero}` : ' - Todas as Áreas'}
              {dashboardTitleContext}
            </h2>
            {lixoZeroData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={lixoZeroData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: '% Rejeito', angle: -90, position: 'insideLeft' }} domain={[0, 'dataMax + 10']} allowDataOverflow />
                  <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                  <Legend />
                  <Line type="monotone" dataKey="percentualRejeito" stroke="#FF8042" name="% Rejeito" activeDot={{ r: 8 }} />
                  <ReferenceLine y={10} label={{ value: "Meta 10%", position: "insideTopRight", fill: "#FF8042" }} stroke="#FF8042" strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-gray-500">Sem dados para o gráfico Meta Lixo Zero neste período/área.</p>}
          </div>

          {/* Gráficos de Pizza */}
          <div className="bg-white p-6 rounded-lg shadow mt-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Composição Geral dos Resíduos (Total: {totalWasteWeight.toFixed(2)} kg){dashboardTitleContext}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
              {wasteTypeData.length > 0 ? (
                <div className="bg-gray-50 p-4 rounded-lg shadow h-[450px]">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3 text-center">Por Tipo de Resíduo (Peso)</h3>
                  <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                      <Pie data={wasteTypeData} cx="50%" cy="50%" labelLine={false} label={({ name, value, percent }) => `${name}: ${value.toFixed(2)} kg (${(percent * 100).toFixed(0)}%)`} outerRadius={120} fill="#8884d8" dataKey="value">
                        {wasteTypeData.map((entry, index) => (<Cell key={`cell-type-${index}`} fill={COLORS[index % COLORS.length]} />))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value.toFixed(2)} kg`, name]}/>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="text-center text-gray-500 lg:col-span-1">Sem dados para o gráfico de tipo de resíduo.</p>}

              {areaData.length > 0 ? (
                <div className="bg-gray-50 p-4 rounded-lg shadow h-[450px]">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3 text-center">Por Área do Cliente (Peso)</h3>
                  <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                      <Pie data={areaData} cx="50%" cy="50%" labelLine={false} label={({ name, value, percent }) => `${name}: ${value.toFixed(2)} kg (${(percent * 100).toFixed(0)}%)`} outerRadius={120} fill="#82ca9d" dataKey="value">
                        {areaData.map((entry, index) => (<Cell key={`cell-area-${index}`} fill={COLORS[index % COLORS.length]} />))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value.toFixed(2)} kg`, name]}/>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="text-center text-gray-500 lg:col-span-1">Sem dados para o gráfico de área do cliente.</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
