// src/pages/app/GerarMtrSP.jsx
import React, { useState, useEffect, useContext,forwardRef, useMemo } from 'react';
import AuthContext from '../../context/AuthContext';
import { collection, doc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import DatePicker, { registerLocale } from 'react-datepicker';
import ptBR from 'date-fns/locale/pt-BR';
import "react-datepicker/dist/react-datepicker.css";
registerLocale('pt-BR', ptBR);


const initialResiduoState = {
    tipoResiduo: "",
    resCodigoIbama: "",
    marQuantidade: "",
    uniCodigo: "",
    traCodigo: "",
    claCodigo: "",
    tieCodigo: 4, 
    tiaCodigo: 2,
};

// Primeiro, criamos a data padrão com a regra que você pediu
const dataPadrao = new Date(); // Pega a data e hora atuais
dataPadrao.setHours(dataPadrao.getHours(), 0, 0, 0); // Mantém a hora atual e zera o resto

const initialMtrPayload = {
    seuCodigo: `APP_TESTE_${Date.now()}`,
    nomeResponsavel: "Gustavo Ferracioli",
    dataExpedicao: dataPadrao.getTime(), // <<< AQUI ESTÁ A MUDANÇA
    nomeMotorista: "",
    placaVeiculo: "",
    observacoes: "MTR gerado via aplicação para teste.",
    transportador: null,
    destinador: null,
    listaManifestoResiduos: []
};

const GerarMtrSP = () => {
  const { db, userProfile } = useContext(AuthContext);

  const [credentials, setCredentials] = useState({ cpfCnpj: '', senha: '', unidade: '' });
  const [token, setToken] = useState(null);

  const [allClients, setAllClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [listasDeApoio, setListasDeApoio] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [transportadores, setTransportadores] = useState([]);
  const [allDestinadores, setAllDestinadores] = useState([]);
  const [mtrPayload, setMtrPayload] = useState(initialMtrPayload);
  const [currentResiduo, setCurrentResiduo] = useState(initialResiduoState);
  const [selectedTransportadorId, setSelectedTransportadorId] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [status, setStatus] = useState('ocioso');
  const [apiResponse, setApiResponse] = useState({ message: 'Aguardando ação...' });

  useEffect(() => {
  if (!db || !userProfile) return; // Agora espera também pelo userProfile

  const fetchInitialData = async () => {
      setInitialLoading(true);

      // Lógica para buscar apenas os clientes permitidos para o usuário
      const fetchClients = async () => {
          const clientsCollection = collection(db, 'clientes');
          let q;
          // Se o usuário for 'master', pega todos. Se não, filtra pelos permitidos.
          if (userProfile.role === 'master') {
              q = query(clientsCollection, where('ativo', '==', true), orderBy('nome'));
          } else if (userProfile.clientesPermitidos && userProfile.clientesPermitidos.length > 0) {
              // A cláusula 'in' do Firestore é limitada a 30 IDs.
              q = query(clientsCollection, where('__name__', 'in', userProfile.clientesPermitidos), where('ativo', '==', true));
          } else {
              console.log("Log: Usuário não é master e não tem clientes permitidos.");
              return []; // Usuário sem clientes permitidos não vê nada.
          }
          const querySnapshot = await getDocs(q);
          return querySnapshot.docs.map(doc => ({ id: doc.id, nome: doc.data().nome }));
      };

      const fetchDestinadores = getDocs(query(collection(db, 'destinadores'), where('ativo', '==', true), orderBy('nome')));

      try {
          const [clientsData, destinadoresSnapshot] = await Promise.all([
              fetchClients(),
              fetchDestinadores
          ]);
          setAllClients(clientsData);
          const destData = destinadoresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAllDestinadores(destData);
      } catch (error) {
          console.error("Erro ao carregar dados iniciais:", error);
      } finally {
          setInitialLoading(false);
      }
  };
  fetchInitialData();
}, [db, userProfile]);

  useEffect(() => {
    if (cliente) {
        // Esta lógica preenche os campos de autenticação
        // quando o estado 'cliente' é atualizado.
        console.log("LOG DE DEPURAÇÃO: useEffect do cliente disparado. Dados do cliente recebidos:", cliente);
        setCredentials(prev => ({
            ...prev,
            senha: '', // Limpa a senha anterior por segurança
            cpfCnpj: cliente.configMTR?.mtrLogin || cliente.cnpj || '',
            unidade: cliente.configMTR?.mtrCodigoDaUnidade || ''
        }));

        // Atualiza também o nome do responsável no payload do MTR
        if (cliente.configMTR?.mtrResponsavel) {
            handlePayloadChange('nomeResponsavel', cliente.configMTR.mtrResponsavel);
        }
    }
  }, [cliente]);

  useEffect(() => {
    // Se um ID de cliente foi selecionado (e não é a opção vazia)...
    if (selectedClientId) {
      // ...chama a função para carregar todo o contexto automaticamente.
      handleLoadContextAndLists();
    } else {
      // Se o usuário limpou a seleção, reseta os dados para o estado inicial.
      setCliente(null);
      setTransportadores([]);
      setListasDeApoio(null);
      setMtrPayload(initialMtrPayload);
      setToken(null); 
    }
  }, [selectedClientId]); // A "mágica" acontece aqui: este código roda sempre que 'selectedClientId' mudar.

   const handleLoadContextAndLists = async () => {
    if (!selectedClientId || !db) return;
    setStatus('carregando');
    setApiResponse({ message: `Carregando todo o contexto...` });
    try {
      // Combina a lógica de carregar cliente e listas de apoio
      // 1. Carregar Cliente e Transportadores
      const clientDocRef = doc(db, 'clientes', selectedClientId);
      const clientDocSnap = await getDoc(clientDocRef);
      if (!clientDocSnap.exists()) throw new Error(`Cliente não encontrado.`);
      const clienteData = { id: clientDocSnap.id, ...clientDocSnap.data() };
      setCliente(clienteData);

      const transportadorIds = clienteData.contratosColeta?.map(c => c.empresaColetaId).filter(Boolean) || [];
      if (transportadorIds.length > 0) {
        const transportadoresSnapshot = await getDocs(query(collection(db, 'empresasColeta'), where('__name__', 'in', transportadorIds)));
        setTransportadores(transportadoresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else {
        setTransportadores([]);
      }

      // 2. Carregar Listas de Apoio
      const nomesDasListas = ['Classe', 'Tratamento', 'Unidade', 'Acondicionamento', 'EstadoFisico', 'Residuo'];
      const estado = clienteData.estado || 'SP'; // Usa o estado do cliente
      const listasCarregadas = {};
      for (const listName of nomesDasListas) {
        const path = collection(db, 'Mtr', estado.toUpperCase(), listName.toLowerCase());
        const querySnapshot = await getDocs(query(path));
        listasCarregadas[listName] = querySnapshot.docs.map(doc => doc.data());
      }
      setListasDeApoio(listasCarregadas);
      
      setStatus('sucesso');
      setApiResponse({ message: "Contexto e listas de apoio carregados com sucesso." });
    } catch (error) {
      setStatus('erro');
      setApiResponse({ error: `Erro ao carregar contexto: ${error.message}` });
    }
  };

  const handlePreviewPayload = () => {
      console.log("Log Fase 3: Exibindo pré-visualização do payload MTR.");
      setStatus('sucesso');
      setApiResponse(mtrPayload);
  };

  const handlePayloadChange = (field, value) => {
    let finalValue = value;

    // Converte a string de data 'YYYY-MM-DD' para um timestamp numérico
    if (field === 'dataExpedicao' && typeof value === 'string' && value) {
      // Adiciona T00:00:00 para garantir que a data seja interpretada no fuso horário local
      finalValue = new Date(`${value}T00:00:00`).getTime();
    }
    
    setMtrPayload(prev => ({ ...prev, [field]: finalValue }));
  };

  const handleCurrentResiduoChange = (e) => {
    const { name, value } = e.target;
    if (name === 'tipoResiduo') {
        setSelectedTransportadorId('');
        handlePayloadChange('transportador', null);
        handlePayloadChange('destinador', null);
    }
    setCurrentResiduo(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAddResiduo = () => {
    // Validação para garantir que os campos essenciais foram preenchidos
    if (!currentResiduo.resCodigoIbama || !currentResiduo.marQuantidade || !currentResiduo.uniCodigo || !currentResiduo.traCodigo || !currentResiduo.claCodigo) {
        alert("Preencha todos os campos do resíduo antes de adicionar.");
        return;
    }

    // Cria um objeto 'limpo' para o payload, garantindo os tipos corretos
    const residuoParaAdicionar = {
  resCodigoIbama: currentResiduo.resCodigoIbama,
  tieCodigo: currentResiduo.tieCodigo,
  tiaCodigo: currentResiduo.tiaCodigo,
  uniCodigo: currentResiduo.uniCodigo ? parseInt(currentResiduo.uniCodigo, 10) : null,
  traCodigo: currentResiduo.traCodigo ? parseInt(currentResiduo.traCodigo, 10) : null,
  claCodigo: currentResiduo.claCodigo ? parseInt(currentResiduo.claCodigo, 10) : null,
  marQuantidade: currentResiduo.marQuantidade ? parseFloat(currentResiduo.marQuantidade) : null,
  // AQUI É A MUDANÇA CRÍTICA:
  marDensidade: currentResiduo.marDensidade,
  marNumeroONU: currentResiduo.marNumeroONU,
  marClasseRisco: currentResiduo.marClasseRisco,
  marNomeEmbarque: currentResiduo.marNomeEmbarque,
  greCodigo: currentResiduo.greCodigo
};
    
    console.log("Log: Adicionando resíduo com tipos corrigidos ao payload:", residuoParaAdicionar);
    
    // Adiciona o objeto corrigido à lista no estado do MTR
    const novaLista = [...mtrPayload.listaManifestoResiduos, residuoParaAdicionar];
    setMtrPayload(prev => ({ ...prev, listaManifestoResiduos: novaLista }));
    
    // Limpa o formulário para a próxima adição
    setCurrentResiduo({
      ...initialResiduoState,
      tipoResiduo: currentResiduo.tipoResiduo
    });
  };

  
const handleDateChange = (date) => {
    const timestamp = date.getTime();
    setMtrPayload(prev => ({ ...prev, dataExpedicao: timestamp }));
};

   // Função para lidar com a mudança nos campos de credenciais
  const handleCredentialChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  // Função para autenticar com o back-end e obter o token
  const handleAuth = async () => {
    setStatus('carregando');
    setApiResponse({ message: '1. [FRONT-END] Enviando requisição de autenticação para o back-end...' });
    try {
      const response = await fetch('/api/mtr/sp/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha na autenticação');
      
      setToken(data.token);
      setStatus('sucesso');
      setApiResponse({ message: 'Token recebido com sucesso!', token: data.token });
    } catch (error) {
      console.error('ERRO [FRONT-END] na autenticação:', error);
      setStatus('erro');
      setApiResponse({ error: error.message });
    }
  };

  // Função para enviar o MTR final para a SIGOR (via nosso back-end)
  const handleFinalSubmit = async () => {
    if (!token) {
        alert("É necessário obter um token de acesso primeiro (Fase 0).");
        return;
    }
    if (!mtrPayload.transportador || !mtrPayload.destinador || mtrPayload.listaManifestoResiduos.length === 0) {
        alert("Preencha o transportador, destinador e adicione pelo menos um resíduo antes de enviar.");
        return;
    }

    setStatus('carregando');
    setApiResponse({ message: '4. [FRONT-END] Enviando MTR para a SIGOR via back-end...' });
    
    try {
      // A API da SIGOR espera uma lista (array), então colocamos nosso payload dentro de um [ ]
      const finalPayload = [mtrPayload];

      const response = await fetch('/api/mtr/sp/mtr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(finalPayload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao gerar MTR');

      setStatus('sucesso');
      setApiResponse(data); // Mostra a resposta final da SIGOR
    } catch (error) {
      console.error(`ERRO [FRONT-END] ao gerar MTR:`, error);
      setStatus('erro');
      setApiResponse({ error: error.message });
    }
  };
  
  const tiposDeResiduoDisponiveis = useMemo(() => {
    if (!cliente?.contratosColeta) return [];
    const todosOsTiposComDuplicatas = cliente.contratosColeta.flatMap(c => c.tiposResiduoColetados);
    return [...new Set(todosOsTiposComDuplicatas)];
  }, [cliente]);

  const transportadoresFiltrados = useMemo(() => {
    if (!currentResiduo.tipoResiduo || transportadores.length === 0) return [];
    return transportadores.filter(t => t.tiposResiduo?.includes(currentResiduo.tipoResiduo));
  }, [currentResiduo.tipoResiduo, transportadores]);

 const destinadoresFiltrados = useMemo(() => {
    // A lógica agora depende tanto do transportador quanto do tipo de resíduo
    if (!selectedTransportadorId || !currentResiduo.tipoResiduo) return [];
    
    const transportador = transportadores.find(t => t.id === selectedTransportadorId);
    if (!transportador || !transportador.destinadoresPorTipo) return [];

    // Pega o ID do destinador específico para o tipo de resíduo selecionado
    const destinadorId = transportador.destinadoresPorTipo[currentResiduo.tipoResiduo];

    console.log("ID do Destinador que estou procurando:", destinadorId);
    console.log("Lista de TODOS os destinadores que eu tenho:", allDestinadores);

    // Retorna vazio se não houver um vínculo específico para aquele tipo
    if (!destinadorId) return []; 

    // Filtra a lista completa de destinadores para encontrar apenas o correto

    
    return allDestinadores.filter(d => d.id === destinadorId);
  }, [selectedTransportadorId, currentResiduo.tipoResiduo, transportadores, allDestinadores]);

   const tratamentosFiltrados = useMemo(() => {
    // Se a lista de apoio de tratamentos não estiver carregada, retorna uma lista vazia.
    if (!listasDeApoio?.Tratamento) {
      return [];
    }
    
    // Se nenhum destinador estiver selecionado no payload, retorna a lista completa de tratamentos.
    if (!mtrPayload.destinador) {
      return listasDeApoio.Tratamento;
    }

    // Encontra o objeto completo do destinador que está no payload
    const destinadorSelecionado = allDestinadores.find(d => d.cnpj.replace(/\D/g,'') === mtrPayload.destinador.cpfCnpj);
    
    // Se não encontrar o destinador ou se ele não tiver tratamentos cadastrados, retorna uma lista vazia.
    if (!destinadorSelecionado || !destinadorSelecionado.tratamentosOferecidos) {
      return [];
    }

    // Filtra a lista principal de tratamentos do estado (listasDeApoio.Tratamento)
    // e mantém apenas aqueles cuja descrição está na lista de tratamentos do destinador.
    return listasDeApoio.Tratamento.filter(tratamento => 
      destinadorSelecionado.tratamentosOferecidos.includes(tratamento.traDescricao)
    );
  }, [mtrPayload.destinador, listasDeApoio, allDestinadores]);
  
  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Geração de MTR - SP (Modo de Desenvolvimento)</h1>

        <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Contexto de Trabalho</h2>
            <label htmlFor="cliente-selector" className="block text-sm font-medium text-gray-700">Selecione o Cliente (Gerador)</label>
            <select id="cliente-selector" value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm">
                <option value="">-- Selecione --</option>
                {allClients.map(client => (<option key={client.id} value={client.id}>{client.nome}</option>))}
            </select>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md disabled:opacity-50" disabled={!cliente}>
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Passo 3: Autenticação SIGOR</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input type="text" name="cpfCnpj" placeholder="CPF/CNPJ (automático)" value={credentials.cpfCnpj} onChange={handleCredentialChange} className="p-2 border rounded-md bg-gray-100" readOnly />
                 <input type="password" name="senha" placeholder="Senha" value={credentials.senha} onChange={handleCredentialChange} className="p-2 border rounded-md" />
                <input type="text" name="unidade" placeholder="Unidade (automático)" value={credentials.unidade} onChange={handleCredentialChange} className="p-2 border rounded-md bg-gray-100" readOnly />
            </div>
                <button onClick={handleAuth} className="bg-gray-700 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-800 w-full">Obter Token de Acesso</button>
        </div>

        <div className="disabled:opacity-50" disabled={!token}>
            <div className="bg-white p-4 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Passo 4: Montar Objeto MTR</h2>
                <div className="space-y-4">
                    <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700">Data de Expedição</label>
                          <DatePicker
                              // Props que você já tem
                              selected={new Date(mtrPayload.dataExpedicao)}
                              onChange={handleDateChange}
                              locale="pt-BR"
                              className="w-full p-2 border border-gray-300 rounded-md"
                              showTimeSelect
                              timeFormat="HH:mm"
                              timeIntervals={15}
                              timeCaption="Hora"
                              dateFormat="dd/MM/yyyy HH:mm"
                              shouldCloseOnSelect={false}
                          />
                        </div>
                        <div><label className="block text-sm font-medium text-gray-700">Nome do Motorista</label><input type="text" value={mtrPayload.nomeMotorista} onChange={(e) => handlePayloadChange('nomeMotorista', e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/></div>
                        <div><label className="block text-sm font-medium text-gray-700">Placa do Veículo</label><input type="text" value={mtrPayload.placaVeiculo} onChange={(e) => handlePayloadChange('placaVeiculo', e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/></div>
                        <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700">Observações</label><textarea value={mtrPayload.observacoes} onChange={(e) => handlePayloadChange('observacoes', e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/></div>
                    </fieldset>
                    <fieldset className="border p-4 rounded-md space-y-4">
                        <legend className="text-md font-medium px-2">Adicionar Resíduo</legend>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">1. Selecione o Tipo de Resíduo</label>
                            <select name="tipoResiduo" value={currentResiduo.tipoResiduo} onChange={handleCurrentResiduoChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"><option value="">-- Selecione --</option>{tiposDeResiduoDisponiveis.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}</select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">2. Selecione o Transportador</label>
                            <select value={selectedTransportadorId} onChange={(e) => {
                                    const transportadorId = e.target.value;
                                    setSelectedTransportadorId(transportadorId);
                                    handlePayloadChange('destinador', null);
                                    const transportador = transportadores.find(t => t.id === transportadorId);
                                    if (transportador) {
                                        const unidade = transportador.codigoUnidade ? parseInt(transportador.codigoUnidade, 10) : null;
                                        handlePayloadChange('transportador', { unidade: isNaN(unidade) ? null : unidade, cpfCnpj: transportador.cnpj.replace(/\D/g,'') });
                                    } else { handlePayloadChange('transportador', null); }
                                }} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" disabled={transportadoresFiltrados.length === 0}>
                                <option value="">-- Selecione --</option>
                                {transportadoresFiltrados.map(t => <option key={t.id} value={t.id}>{t.nomeFantasia}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">3. Selecione o Destinador</label>
                            <select value={mtrPayload.destinador ? allDestinadores.find(d => d.cnpj.replace(/\D/g, '') === mtrPayload.destinador.cpfCnpj)?.id : ''} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" disabled={destinadoresFiltrados.length === 0} onChange={(e) => {
                                    const destinadorId = e.target.value;
                                    const destinador = allDestinadores.find(d => d.id === destinadorId);
                                    if (destinador) {
                                        const unidade = destinador.codigoUnidade ? parseInt(destinador.codigoUnidade, 10) : null;
                                        handlePayloadChange('destinador', { unidade: isNaN(unidade) ? null : unidade, cpfCnpj: destinador.cnpj.replace(/\D/g,'') });
                                        setCurrentResiduo(prev => ({ ...prev, traCodigo: '' }));
                                    } else { handlePayloadChange('destinador', null); }
                                }}>
                                <option value="">-- Selecione --</option>
                                {destinadoresFiltrados.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                            </select>
                        </div>
                        <div className="pt-4 border-t">
                            <h3 className="text-sm font-medium text-gray-700">4. Detalhe o Resíduo</h3>
                            <select name="resCodigoIbama" value={currentResiduo.resCodigoIbama} onChange={handleCurrentResiduoChange} className="mt-2 block w-full p-2 border border-gray-300 rounded-md" disabled={!listasDeApoio}><option value="">Selecione o Resíduo (IBAMA)</option>{listasDeApoio?.Residuo.map(r => <option key={r.resCodigoIbama} value={r.resCodigoIbama}>{r.resCodigoIbama} - {r.resDescricao}</option>)}</select>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <input type="number" step="0.001" name="marQuantidade" placeholder="Quantidade" value={currentResiduo.marQuantidade} onChange={handleCurrentResiduoChange} className="p-2 border rounded-md" disabled={!listasDeApoio} />
                                <select name="uniCodigo" value={currentResiduo.uniCodigo} onChange={handleCurrentResiduoChange} className="p-2 border rounded-md" disabled={!listasDeApoio}><option value="">Unidade</option>{listasDeApoio?.Unidade.map(u => <option key={u.uniCodigo} value={u.uniCodigo}>{u.uniDescricao}</option>)}</select>
                            </div>
                            <select name="traCodigo" value={currentResiduo.traCodigo} onChange={handleCurrentResiduoChange} className="mt-2 block w-full p-2 border border-gray-300 rounded-md" disabled={!listasDeApoio}><option value="">Tratamento</option>{tratamentosFiltrados.map(t => <option key={t.traCodigo} value={t.traCodigo}>{t.traDescricao}</option>)}</select>
                            <select name="claCodigo" value={currentResiduo.claCodigo} onChange={handleCurrentResiduoChange} className="mt-2 block w-full p-2 border border-gray-300 rounded-md" disabled={!listasDeApoio}><option value="">Classe</option>{listasDeApoio?.Classe.map(c => <option key={c.claCodigo} value={c.claCodigo}>{c.claDescricao}</option>)}</select>
                            <button type="button" onClick={handleAddResiduo} className="bg-gray-200 text-gray-800 py-1 px-3 rounded-md hover:bg-gray-300 w-full mt-4">Adicionar Resíduo à Lista</button>
                        </div>
                    </fieldset>
                    <div><h4 className="text-md font-medium">Resíduos Adicionados: {mtrPayload.listaManifestoResiduos.length}</h4></div>
                    <hr/>
                    <button onClick={handlePreviewPayload} className="bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 w-full">Pré-visualizar Objeto MTR</button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md mt-6">
              <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Passo 5: Envio Final</h2>
              <p className="text-sm text-gray-500 mb-4">Este botão pegará o objeto MTR montado e o enviará para a API da SIGOR para geração oficial.</p>
              <button onClick={handleFinalSubmit} className="bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700 transition-colors w-full">GERAR MTR NA SIGOR</button>
            </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-inner">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Painel de Resposta (Log Visual)</h2>
          <div className="bg-gray-800 text-white p-4 rounded-md min-h-[200px] text-sm font-mono">
            {status === 'carregando' && <p>Carregando...</p>}
            {apiResponse && (<pre className="whitespace-pre-wrap break-all">{JSON.stringify(apiResponse, null, 2)}</pre>)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Fase 4: Envio Final</h2>
          <p className="text-sm text-gray-500 mb-4">Este botão pegará o objeto MTR montado e o enviará para a API da SIGOR para geração oficial.</p>
          <button onClick={handleFinalSubmit} className="bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700 transition-colors w-full">
            4. GERAR MTR NA SIGOR
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-inner"></div>
      </div>
    </div>
  );
};

export default GerarMtrSP;