import React, { useState, useEffect, useMemo, useContext, useCallback, useRef } from 'react';
import { collection, query, where, orderBy, getDocs, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import AuthContext from '../../context/AuthContext';
import { appId } from '../../firebase/config';
import { exportarParaAuditoriaCSV } from '../../utils/relatorioCsvExport';
import DocumentosCliente from '../../components/app/DocumentosCliente';
import RelatorioDiario from '../../components/app/admin/RelatorioDiario';
import ModelosMTRModal from '../../components/app/admin/ModelosMTRModal';
import ViewPasswordButton from '../../components/app/admin/ViewPasswordButton';

// Card de detalhes do cliente
const ClienteDetalhesCard = ({ cliente }) => {
  if (!cliente) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
        Selecione um cliente para ver seus detalhes.
      </div>
    );
  }
  const { nome, cnpj, endereco, cidade, estado, configINEA } = cliente;
  return (
    <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
      <h3 className="text-xl font-bold text-gray-800 mb-4 font-lexend">{nome}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <p><strong className="text-gray-600">CNPJ:</strong> {cnpj || 'Não informado'}</p>
        <p><strong className="text-gray-600">Endereço:</strong>{' '}{`${endereco || ''}, ${cidade || ''} - ${estado || ''}`}</p>
        <div className="md:col-span-2 mt-2 pt-2 border-t space-y-1">
  <p className="font-semibold text-gray-700">Dados de Integração INEA:</p>
  <p><strong className="text-gray-600">Login (CPF):</strong>{' '}{cliente.configINEA?.ineaLogin || 'Não configurado'}</p>
  <p><strong className="text-gray-600">Cód. Unidade:</strong>{' '}{cliente.configINEA?.ineaCodigoDaUnidade || 'Não configurado'}</p>
  <p><strong className="text-gray-600">Responsável:</strong>{' '}{cliente.configINEA?.ineaResponsavel || 'Não configurado'}</p>
  <p><strong className="text-gray-600">Cargo:</strong>{' '}{cliente.configINEA?.ineaCargo || 'Não configurado'}</p>
  <div className="flex items-center gap-2">
    <strong className="text-gray-600">Senha:</strong>
    <ViewPasswordButton clienteId={cliente.id} />
  </div>
</div>
      </div>
    </div>
  );
};

// Componente para a seção da Planilha INEA
const PlanilhaIneaCard = ({ clienteData, db }) => {
  const [planilhaUrl, setPlanilhaUrl] = useState('');
  useEffect(() => {
    if (clienteData?.planilhaRelatorioDiarioId) {
      setPlanilhaUrl(`https://docs.google.com/spreadsheets/d/${clienteData.planilhaRelatorioDiarioId}/edit`);
    } else {
      setPlanilhaUrl('');
    }
  }, [clienteData?.planilhaRelatorioDiarioId]);

  const handleVincularPlanilha = async () => {
    if (!db || !clienteData?.id) return alert("Selecione um cliente válido.");
    const entrada = window.prompt("Cole a URL completa do Google Sheets (ou somente o ID):");
    if (!entrada) return;
    const m = entrada.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const id = (m ? m[1] : entrada.trim());
    if (!/^[a-zA-Z0-9-_]{20,}$/.test(id)) return alert("Não reconheci um ID de planilha válido.");
    try {
      await updateDoc(doc(db, "clientes", clienteData.id), { planilhaRelatorioDiarioId: id });
      setPlanilhaUrl(`https://docs.google.com/spreadsheets/d/${id}/edit`);
    } catch (e) {
      console.error("Falha ao vincular planilha", e);
      alert("Falha ao vincular a planilha.");
    }
  };

  return (
    <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-lexend font-semibold text-blue-coral">Planilha de Relatórios INEA</h2>
          <p className="text-sm text-gray-600 mt-1">Link para o documento principal no Google Sheets deste cliente.</p>
        </div>
        <div className="flex-shrink-0">
          {planilhaUrl ? (
            <button onClick={() => window.open(planilhaUrl, "_blank", "noopener")} className="inline-flex items-center gap-2 rounded-xl bg-blue-coral px-4 py-2 text-white font-lexend text-sm shadow hover:opacity-90">
              Abrir planilha INEA
            </button>
          ) : (
            <button onClick={handleVincularPlanilha} className="inline-flex items-center gap-2 rounded-xl bg-gray-600 px-4 py-2 text-white font-lexend text-sm shadow hover:bg-gray-700">
              Vincular planilha existente
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default function PaginaGestaoMTR() {
  const { db, userProfile, userAllowedClientes, loadingUserClientes } = useContext(AuthContext);

  // Filtros e entidades
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [clienteData, setClienteData] = useState(null);
  const [empresasColeta, setEmpresasColeta] = useState([]);

  // Período
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Lançamentos + estados auxiliares
  const [lancamentos, setLancamentos] = useState([]);
  const [loadingLancamentos, setLoadingLancamentos] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [mostrarLancamentosBrutos, setMostrarLancamentosBrutos] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Controle contra "race conditions" entre buscas
  const fetchKeyRef = useRef(0);

  const empresasMap = useMemo(() => new Map((empresasColeta || []).map(e => [e.id, e.nomeFantasia])), [empresasColeta]);

  // Carrega empresas de coleta (tempo real)
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'empresasColeta'), orderBy('nomeFantasia'));
    const unsub = onSnapshot(q, (qs) => {
      setEmpresasColeta(qs.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => console.error('Erro ao carregar empresas de coleta:', err));
    return () => unsub();
  }, [db]);

  // Define cliente padrão (prioriza 'teste456' se existir)
  useEffect(() => {
    if (loadingUserClientes || selectedClienteId) return;
    if (!userAllowedClientes || userAllowedClientes.length === 0) return;
    const preferido = userAllowedClientes.find((c) => c.id === 'teste456');
    setSelectedClienteId(preferido ? preferido.id : userAllowedClientes[0].id);
  }, [loadingUserClientes, userAllowedClientes, selectedClienteId]);

  // Ao mudar cliente: buscar dados do cliente + limpar lançamentos e invalidar buscas antigas
  useEffect(() => {
    setLancamentos([]);
    fetchKeyRef.current++;
    setCurrentPage(1);

    if (!db || !selectedClienteId) {
      setClienteData(null);
      return; // Sai se não houver cliente selecionado
    }
    
    const clienteRef = doc(db, 'clientes', selectedClienteId);
    
    // onSnapshot cria um "ouvinte" em tempo real para o documento do cliente.
    // Qualquer alteração no Firestore (feita pelo modal ou em qualquer outro lugar)
    // fará com que este código execute e atualize o estado 'clienteData'.
    const unsubscribe = onSnapshot(clienteRef, (docSnap) => {
      if (docSnap.exists()) {
        // Atualiza o estado da página com os dados mais recentes do cliente
        setClienteData({ id: docSnap.id, ...docSnap.data() });
      } else {
        console.error("Cliente não encontrado em tempo real.");
        setClienteData(null);
      }
    }, (error) => {
      console.error("Erro ao observar o cliente:", error);
      setClienteData(null);
    });

    // Função de limpeza: quando o componente for desmontado ou o cliente mudar,
    // o "ouvinte" é removido para evitar vazamento de memória.
    return () => unsubscribe();
    
  }, [db, selectedClienteId]);

  // Buscar lançamentos do período para o cliente selecionado
  const handleBuscarLancamentos = useCallback(async () => {
    if (!selectedClienteId || !startDate || !endDate) {
      alert('Por favor, selecione um cliente e um período de datas.');
      return;
    }
    const myKey = ++fetchKeyRef.current;
    setLoadingLancamentos(true);
    setLancamentos([]);
    setCurrentPage(1);
    const dataInicio = new Date(startDate);
    dataInicio.setHours(0, 0, 0, 0);
    const dataFim = new Date(endDate);
    dataFim.setHours(23, 59, 59, 999);
    try {
      const qy = query(
        collection(db, `artifacts/${appId}/public/data/wasteRecords`),
        where('clienteId', '==', selectedClienteId),
        where('timestamp', '>=', dataInicio.getTime()),
        where('timestamp', '<=', dataFim.getTime()),
        orderBy('timestamp', 'desc')
      );
      const qs = await getDocs(qy);
      if (myKey !== fetchKeyRef.current) return;
      const records = qs.docs.map((d) => ({ id: d.id, ...d.data() }));
      setLancamentos(records);
    } catch (error) {
      console.error('Erro ao buscar lançamentos:', error);
      alert('Falha ao buscar os lançamentos.');
    } finally {
      if (myKey === fetchKeyRef.current) setLoadingLancamentos(false);
    }
  }, [db, selectedClienteId, startDate, endDate]);

  const handleLimparFiltro = () => {
    const hoje = new Date().toISOString().split('T')[0];
    setStartDate(hoje);
    setEndDate(hoje);
    setLancamentos([]);
    setCurrentPage(1);
    setMostrarLancamentosBrutos(false);
  };

  // Exportação CSV para Auditoria
  const handleExport = () => {
    if (!lancamentos || lancamentos.length === 0) {
      alert('Não há lançamentos no período selecionado para exportar.');
      return;
    }
    setIsExporting(true);
    try {
      exportarParaAuditoriaCSV(lancamentos, empresasMap, clienteData);
    } finally {
      setIsExporting(false);
    }
  };

  // Gate simples de permissão
 // if (userProfile && userProfile.role !== 'master') {
 //   return (
 //     <div className="p-8 text-center text-red-600">
 //       Acesso negado. Esta página é restrita a administradores.
 //     </div>
 //   );
 // }

  // Lógica de cálculo da paginação
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLancamentos = lancamentos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(lancamentos.length / itemsPerPage);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 font-comfortaa bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-lexend font-bold text-blue-coral">
        Gestão de MTR/CDF
      </h1>

      {/* SEÇÃO DE SELEÇÃO DE CLIENTE E MODELOS */}
      <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Coluna do Seletor e Botão */}
          <div className="w-full lg:w-1/3 space-y-4">
            <div>
              <label htmlFor="cliente-selector-gestao" className="block text-sm font-medium text-rich-soil mb-1 font-lexend">
                Selecione o Cliente
              </label>
              <select id="cliente-selector-gestao" value={selectedClienteId} onChange={(e) => setSelectedClienteId(e.target.value)} disabled={loadingUserClientes} className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-coral focus:border-blue-coral">
                {loadingUserClientes ? (<option>Carregando...</option>) : (userAllowedClientes.map((c) => (<option key={c.id} value={c.id}>{c.nome}</option>)))}
              </select>
            </div>
            
            {/* NOVO BOTÃO DE GERENCIAR MODELOS */}
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={!selectedClienteId}
              className="w-full px-4 py-2 bg-white border-2 border-blue-coral text-blue-coral font-semibold rounded-md shadow-sm hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Gerenciar Modelos de MTR
            </button>
          </div>

          {/* Coluna do Card de Detalhes */}
          <div className="w-full lg:w-2/3">
            <ClienteDetalhesCard cliente={clienteData} />
          </div>
        </div>
      </section>

      {clienteData && <PlanilhaIneaCard clienteData={clienteData} db={db} />}

      <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <h2 className="text-xl font-lexend font-semibold text-blue-coral mb-4">
          Relatório de Lançamentos por Período
        </h2>

        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">Data de Início</label>
            <input type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 p-2 border border-gray-300 rounded-md shadow-sm"/>
          </div>
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">Data Final</label>
            <input type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 p-2 border border-gray-300 rounded-md shadow-sm"/>
          </div>
          <button onClick={handleBuscarLancamentos} disabled={loadingLancamentos || !selectedClienteId} className="px-4 py-2 bg-blue-coral text-white font-semibold rounded-md shadow-sm hover:bg-opacity-90 disabled:opacity-50 transition-colors">
            {loadingLancamentos ? 'Buscando...' : 'Buscar'}
          </button>
          <button onClick={handleLimparFiltro} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md shadow-sm hover:bg-gray-300 transition-colors">
            Limpar
          </button>
        </div>

        {loadingLancamentos && <p className="text-center text-gray-500 py-8">Buscando lançamentos...</p>}

        {!loadingLancamentos && lancamentos.length > 0 && (
          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-lexend font-semibold text-gray-700">1. Lançamentos Individuais ({lancamentos.length})</h3>
              <button onClick={() => setMostrarLancamentosBrutos(!mostrarLancamentosBrutos)} className="text-blue-coral hover:text-blue-dark transition-colors" aria-label={mostrarLancamentosBrutos ? 'Ocultar lançamentos' : 'Ver lançamentos'}>
                {mostrarLancamentosBrutos ? (<span className="text-2xl">▲</span>) : (<span className="text-2xl">▼</span>)}
              </button>
            </div>
            
            {mostrarLancamentosBrutos && (
              <div className="mt-4">
                <div className="overflow-x-auto rounded-lg border border-gray-200 mb-4">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-rich-soil uppercase tracking-wider">Data</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-rich-soil uppercase tracking-wider">Área</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-rich-soil uppercase tracking-wider">Tipo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-rich-soil uppercase tracking-wider">Subtipo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-rich-soil uppercase tracking-wider">Peso</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentLancamentos.map((record) => (
                        <tr key={record.id}>
                          <td className="px-4 py-3">{new Date(record.timestamp).toLocaleDateString('pt-BR')}</td>
                          <td className="px-4 py-3">{record.areaLancamento || '-'}</td>
                          <td className="px-4 py-3">{record.wasteType}</td>
                          <td className="px-4 py-3">{record.wasteSubType || '-'}</td>
                          <td className="px-4 py-3">{record.peso} kg</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Anterior</button>
                    <span>Página {currentPage} de {totalPages}</span>
                    <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Próximo</button>
                  </div>
                )}
                <div className="text-right">
                   <button onClick={handleExport} disabled={isExporting} className="px-5 py-2.5 bg-golden-orange text-white font-semibold rounded-lg shadow-md hover:opacity-90 disabled:opacity-50">
                     {isExporting ? 'Exportando...' : 'Exportar para CSV (Auditoria)'}
                   </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!loadingLancamentos && lancamentos.length === 0 && (
          <p className="text-center text-gray-500 py-8">Nenhum lançamento encontrado para o período selecionado.</p>
        )}
        
        {/* Totais p/ INEA (exportação para Sheets) */}
        <RelatorioDiario
          lancamentos={lancamentos}
          empresasColeta={empresasColeta}
          clienteData={clienteData}
          startDate={startDate}
          endDate={endDate}
        />
      </section>

      {/* Histórico de documentos emitidos */}
      <div className="mt-6">
        {selectedClienteId && <DocumentosCliente clienteId={selectedClienteId} clienteNome={clienteData?.nome} empresasColeta={empresasColeta} />}
      </div>

      {/* A LINHA QUE FALTAVA PARA O MODAL APARECER FOI ADICIONADA AQUI */}
      <ModelosMTRModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cliente={clienteData}
        empresasColeta={empresasColeta}
      />
    </div>
  );
}