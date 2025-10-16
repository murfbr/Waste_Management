// src/pages/app/GerarMtrSP.jsx
import React, { useState, useEffect, useContext,forwardRef, useMemo } from 'react';
import AuthContext from '../../context/AuthContext';
import { collection, doc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import DatePicker, { registerLocale } from 'react-datepicker';
import { SearchableSelect } from '../../components/app/SearchableSelect';
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

  const [isLogVisible, setIsLogVisible] = useState(false);
  
  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-full font-comfortaa text-rich-soil">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <header>
          <h1 className="font-lexend text-titulo text-blue-coral">Gerar MTR - SP</h1>
          <p className="text-corpo text-gray-600 mt-2">Preencha os campos abaixo para emitir um novo Manifesto de Transporte de Resíduos.</p>
        </header>

        {/* --- CARD 1: CONTEXTO DE TRABALHO --- */}
        <section className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <h2 className="text-subtitulo font-lexend text-blue-coral border-b border-early-frost pb-3">Passo 1: Gerador</h2>
          <div>
            <label htmlFor="cliente-selector" className="block text-sm font-medium mb-1">Selecione o Cliente (Gerador) <span className="text-apricot-orange">*</span></label>
            <select id="cliente-selector" value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} className="w-full p-2 border border-early-frost rounded-md">
                <option value="">-- Selecione um cliente --</option>
                {allClients.map(client => (<option key={client.id} value={client.id}>{client.nome}</option>))}
            </select>
          </div>
        </section>

        {/* --- CARD 2: AUTENTICAÇÃO E DADOS GERAIS --- */}
        <section className="bg-white p-6 rounded-lg shadow-md space-y-6" disabled={!cliente}>
            <h2 className="text-subtitulo font-lexend text-blue-coral border-b border-early-frost pb-3">Passo 2: Dados da Emissão</h2>
            
            <div>
                <h3 className="font-lexend text-xl text-rain-forest mb-3">Autenticação SIGOR</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="text" name="cpfCnpj" placeholder="CPF/CNPJ (automático)" value={credentials.cpfCnpj} className="p-2 border rounded-md bg-gray-100" readOnly />
                    <input type="password" name="senha" placeholder="Senha SIGOR" value={credentials.senha} onChange={handleCredentialChange} className="p-2 border rounded-md" />
                    <input type="text" name="unidade" placeholder="Unidade (automático)" value={credentials.unidade} className="p-2 border rounded-md bg-gray-100" readOnly />
                </div>
                <button onClick={handleAuth} className="mt-4 w-full bg-rain-forest text-white font-bold py-2 px-4 rounded-md hover:bg-abundant-green transition-colors">Obter Token de Acesso</button>
            </div>

            <div className="pt-6 border-t border-early-frost">
                 <h3 className="font-lexend text-xl text-rain-forest mb-3">Informações da Viagem</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">Data e Hora de Expedição <span className="text-apricot-orange">*</span></label>
                        <DatePicker
                            selected={new Date(mtrPayload.dataExpedicao)}
                            onChange={handleDateChange}
                            locale="pt-BR"
                            className="w-full p-2 border border-early-frost rounded-md"
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            timeCaption="Hora"
                            dateFormat="dd/MM/yyyy HH:mm"
                            shouldCloseOnSelect={false}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Nome do Motorista <span className="text-apricot-orange">*</span></label>
                        <input type="text" value={mtrPayload.nomeMotorista} onChange={(e) => handlePayloadChange('nomeMotorista', e.target.value)} className="w-full p-2 border border-early-frost rounded-md"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Placa do Veículo <span className="text-apricot-orange">*</span></label>
                        <input type="text" value={mtrPayload.placaVeiculo} onChange={(e) => handlePayloadChange('placaVeiculo', e.target.value)} className="w-full p-2 border border-early-frost rounded-md"/>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Observações <span className="text-gray-400 font-normal">(opcional)</span></label>
                        <textarea value={mtrPayload.observacoes} onChange={(e) => handlePayloadChange('observacoes', e.target.value)} rows="3" className="w-full p-2 border border-early-frost rounded-md"/>
                    </div>
                 </div>
            </div>
        </section>

        {/* --- CARD 3: RESÍDUOS (AGORA COMPLETO) --- */}
        <section className="bg-white p-6 rounded-lg shadow-md space-y-4" disabled={!token}>
            <h2 className="text-subtitulo font-lexend text-blue-coral border-b border-early-frost pb-3">Passo 3: Adicionar Resíduos</h2>
            
            <div className="space-y-4">
                <h3 className="font-lexend text-xl text-rain-forest">Vincular Coleta</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">1. Selecione o Tipo de Resíduo <span className="text-apricot-orange">*</span></label>
                    <select name="tipoResiduo" value={currentResiduo.tipoResiduo} onChange={handleCurrentResiduoChange} className="w-full p-2 border border-early-frost rounded-md"><option value="">-- Selecione --</option>{tiposDeResiduoDisponiveis.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}</select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">2. Selecione o Transportador <span className="text-apricot-orange">*</span></label>
                    <select value={selectedTransportadorId} onChange={(e) => {
                            const transportadorId = e.target.value;
                            setSelectedTransportadorId(transportadorId);
                            handlePayloadChange('destinador', null);
                            const transportador = transportadores.find(t => t.id === transportadorId);
                            if (transportador) {
                                const unidade = transportador.codigoUnidade ? parseInt(transportador.codigoUnidade, 10) : null;
                                handlePayloadChange('transportador', { unidade: isNaN(unidade) ? null : unidade, cpfCnpj: transportador.cnpj.replace(/\D/g,'') });
                            } else { handlePayloadChange('transportador', null); }
                        }} className="w-full p-2 border border-early-frost rounded-md" disabled={transportadoresFiltrados.length === 0}>
                        <option value="">-- Selecione --</option>
                        {transportadoresFiltrados.map(t => <option key={t.id} value={t.id}>{t.nomeFantasia}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">3. Selecione o Destinador <span className="text-apricot-orange">*</span></label>
                    <select value={mtrPayload.destinador ? allDestinadores.find(d => d.cnpj.replace(/\D/g, '') === mtrPayload.destinador.cpfCnpj)?.id : ''} className="w-full p-2 border border-early-frost rounded-md" disabled={destinadoresFiltrados.length === 0} onChange={(e) => {
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
            </div>

            <div className="pt-6 border-t border-early-frost space-y-4">
                <h3 className="font-lexend text-xl text-rain-forest">Detalhar Resíduo</h3>
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Resíduo (IBAMA) <span className="text-apricot-orange">*</span></label>
                      
                      <SearchableSelect
                          // Transforma a lista de resíduos no formato que o componente espera
                          options={listasDeApoio?.Residuo.map(r => ({
                              value: r.resCodigoIbama,
                              label: `${r.resCodigoIbama} - ${r.resDescricao}`
                          })) || []}
                          
                          // Passa o valor atual do estado
                          value={currentResiduo.resCodigoIbama}

                          // Função para atualizar o estado quando uma opção for selecionada
                          onChange={(selectedValue) => handleCurrentResiduoChange({ target: { name: 'resCodigoIbama', value: selectedValue } })}

                          // Texto que aparece quando nada está selecionado
                          placeholder="Selecione ou busque um resíduo"
                      />
                  </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade <span className="text-apricot-orange">*</span></label>
                        <input type="number" step="0.001" name="marQuantidade" placeholder="Ex: 1.250" value={currentResiduo.marQuantidade} onChange={handleCurrentResiduoChange} className="w-full p-2 border rounded-md" disabled={!listasDeApoio} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unidade <span className="text-apricot-orange">*</span></label>
                        <select name="uniCodigo" value={currentResiduo.uniCodigo} onChange={handleCurrentResiduoChange} className="w-full p-2 border rounded-md" disabled={!listasDeApoio}><option value="">Unidade</option>{listasDeApoio?.Unidade.map(u => <option key={u.uniCodigo} value={u.uniCodigo}>{u.uniDescricao}</option>)}</select>
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tratamento <span className="text-apricot-orange">*</span></label>
                    <select name="traCodigo" value={currentResiduo.traCodigo} onChange={handleCurrentResiduoChange} className="w-full p-2 border border-early-frost rounded-md" disabled={!listasDeApoio}><option value="">Selecione o Tratamento</option>{tratamentosFiltrados.map(t => <option key={t.traCodigo} value={t.traCodigo}>{t.traDescricao}</option>)}</select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Classe <span className="text-apricot-orange">*</span></label>
                    <select name="claCodigo" value={currentResiduo.claCodigo} onChange={handleCurrentResiduoChange} className="w-full p-2 border border-early-frost rounded-md" disabled={!listasDeApoio}><option value="">Selecione a Classe</option>{listasDeApoio?.Classe.map(c => <option key={c.claCodigo} value={c.claCodigo}>{c.claDescricao}</option>)}</select>
                </div>
                <button type="button" onClick={handleAddResiduo} className="w-full bg-abundant-green text-white py-2 px-3 rounded-md hover:bg-rain-forest transition-colors mt-4">Adicionar Resíduo à Lista</button>
            </div>
             <div className="pt-4">
                <h4 className="font-lexend text-lg">Resíduos Adicionados: {mtrPayload.listaManifestoResiduos.length}</h4>
            </div>
        </section>

        {/* --- CARD 4: AÇÕES FINAIS --- */}
        <section className="bg-white p-6 rounded-lg shadow-md space-y-4">
            <h2 className="text-subtitulo font-lexend text-blue-coral border-b border-early-frost pb-3">Passo 4: Finalizar</h2>
            <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={handlePreviewPayload} className="flex-1 bg-golden-orange text-white font-bold py-2 px-4 rounded-md hover:opacity-90 transition-opacity">Pré-visualizar Dados</button>
                <button onClick={handleFinalSubmit} className="flex-1 bg-apricot-orange text-white font-lexend text-acao py-3 px-4 rounded-md hover:opacity-90 transition-opacity">GERAR MTR OFICIAL</button>
            </div>
        </section>
        
        {/* --- SANFONA (ACCORDION) PARA O LOG --- */}
        <div className="bg-white rounded-lg shadow-md">
          <button 
            onClick={() => setIsLogVisible(!isLogVisible)}
            className="w-full flex justify-between items-center p-4 text-left"
          >
            <h2 className="font-lexend text-lg text-gray-700">Painel de Resposta (Log Visual)</h2>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 transform transition-transform duration-300 ${isLogVisible ? 'rotate-180' : ''}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          
          {isLogVisible && (
            <div className="p-4 border-t border-early-frost">
              <div className="bg-gray-800 text-white p-4 rounded-md min-h-[200px] text-sm font-mono overflow-x-auto">
                {status === 'carregando' && <p>Carregando...</p>}
                {apiResponse && (<pre className="whitespace-pre-wrap break-all">{JSON.stringify(apiResponse, null, 2)}</pre>)}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
);
};

export default GerarMtrSP;