// src/pages/PainelSigor.jsx
import React, { useState } from 'react';

const API_BASE_URL = '/api/mtr/sp';

const PainelSigor = () => {
  const [credentials, setCredentials] = useState({ cpfCnpj: '', senha: '', unidade: '' });
  const [token, setToken] = useState(null);
  const [status, setStatus] = useState('ocioso');
  const [apiResponse, setApiResponse] = useState(null);

  const handleCredentialChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  // --- FUNÇÃO DE AUTENTICAÇÃO ---
  const handleAuth = async () => {
    setStatus('carregando');
    setApiResponse({ message: '1. [FRONT-END] Enviando requisição de autenticação para o back-end...' });
    
    console.log('1. [FRONT-END] Clique em "Obter Token". Enviando para o back-end:', credentials);

    try {
      const response = await fetch(`${API_BASE_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      console.log('5. [FRONT-END] Recebida resposta do back-end. Status:', response.status);
      const responseText = await response.text();
      console.log('6. [FRONT-END] Corpo da resposta (texto bruto):', responseText);

      const data = JSON.parse(responseText);
      console.log('7. [FRONT-END] Corpo da resposta (JSON):', data);

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

  // --- FUNÇÃO DE TESTE DE BUSCA DE LISTAS ---
  const handleSync = async (listName) => {
    if (!token) {
      setApiResponse({ error: 'É necessário obter um token primeiro.' });
      return;
    }
    setStatus('carregando');
    setApiResponse({ message: `1. [FRONT-END] Enviando requisição para a lista '${listName}'...` });
    
    console.log(`1. [FRONT-END] Clique em "Testar Busca: ${listName}". Enviando requisição.`);

    try {
      const response = await fetch(`${API_BASE_URL}/lists/${listName}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('5. [FRONT-END] Recebida resposta do back-end. Status:', response.status);
      const responseText = await response.text();
      console.log('6. [FRONT-END] Corpo da resposta (texto bruto):', responseText);
      
      const result = JSON.parse(responseText);
      console.log('7. [FRONT-END] Corpo da resposta (JSON):', result);
      
      if (!response.ok) throw new Error(result.error || 'Erro ao buscar lista');
      
      setStatus('sucesso');
      setApiResponse(result.data);
    } catch (error) {
      console.error(`ERRO [FRONT-END] ao buscar a lista '${listName}':`, error);
      setStatus('erro');
      setApiResponse({ error: error.message });
    }
  };
  
  // --- FUNÇÃO DE SINCRONIZAÇÃO COMPLETA COM O BANCO ---
  const handleFullSync = async () => {
    if (!token) {
      setApiResponse({ error: 'É necessário obter um token primeiro.' });
      return;
    }
    setStatus('carregando');
    setApiResponse({ message: `1. [FRONT-END] Iniciando sincronização completa...` });
    console.log(`1. [FRONT-END] Clique em "Sincronizar Todas as Listas".`);
    try {
      const response = await fetch(`${API_BASE_URL}/sync`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('5. [FRONT-END] Recebida resposta do back-end. Status:', response.status);
      const result = await response.json();
      console.log('6. [FRONT-END] Corpo da resposta (JSON):', result);
      if (!response.ok) throw new Error(result.error || 'Erro ao sincronizar com o Firestore');
      setStatus('sucesso');
      setApiResponse(result);
    } catch (error) {
      console.error(`ERRO [FRONT-END] na sincronização completa:`, error);
      setStatus('erro');
      setApiResponse({ error: error.message });
    }
  };

  const handleGenerateMtr = async () => {
    if (!token) {
      setApiResponse({ error: 'É necessário obter um token primeiro.' });
      return;
    }
    setStatus('carregando');
    setApiResponse({ message: '1. [FRONT-END] Enviando dados do MTR...' });
    const mtrTestData = [{ seuCodigo: `TESTE_APP_${new Date().getTime()}`, nomeResponsavel: "Gustavo ferracioli", dataExpedicao: 1760055600000, nomeMotorista: "MOTORISTA TESTE APP", placaVeiculo: "APP1234", observacoes: "MTR gerado via aplicação para teste.", transportador: { unidade: 53173, cpfCnpj: "20947332000942" }, destinador: { unidade: 44230, cpfCnpj: "14063367000169" }, listaManifestoResiduos: [{ marQuantidade: 0.0122, resCodigoIbama: "150102", uniCodigo: 3, traCodigo: 43, tieCodigo: 4, tiaCodigo: 2, claCodigo: 43, }] }];
    console.log(`1. [FRONT-END] Clique em "Gerar MTR". Enviando para o back-end:`, mtrTestData);
    try {
      const response = await fetch(`${API_BASE_URL}/mtr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(mtrTestData)
      });
      console.log('5. [FRONT-END] Recebida resposta do back-end. Status:', response.status);
      const data = await response.json();
      console.log('6. [FRONT-END] Corpo da resposta (JSON):', data);
      if (!response.ok) throw new Error(data.error || 'Falha ao gerar MTR');
      setStatus('sucesso');
      setApiResponse(data);
    } catch (error) {
      console.error(`ERRO [FRONT-END] ao gerar MTR:`, error);
      setStatus('erro');
      setApiResponse({ error: error.message });
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-full font-comfortaa text-rich-soil">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-lexend text-blue-coral mb-4">Painel de Testes - Integração SIGOR</h1>
        {/* ... (código do cabeçalho sem alterações) ... */}

        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-lexend text-apricot-orange border-b pb-2 mb-4">Fase 1: Autenticação</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input type="text" name="cpfCnpj" placeholder="CPF do Usuário" value={credentials.cpfCnpj} onChange={handleCredentialChange} className="p-2 border rounded-md focus:ring-blue-coral focus:border-blue-coral" />
            <input type="password" name="senha" placeholder="Senha" value={credentials.senha} onChange={handleCredentialChange} className="p-2 border rounded-md focus:ring-blue-coral focus:border-blue-coral" />
            <input type="text" name="unidade" placeholder="Código da Unidade" value={credentials.unidade} onChange={handleCredentialChange} className="p-2 border rounded-md focus:ring-blue-coral focus:border-blue-coral" />
          </div>
          <button onClick={handleAuth} className="bg-blue-coral text-white font-bold py-2 px-4 rounded-md hover:bg-exotic-plume transition-colors w-full">
            1. Obter Token de Acesso
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-lexend text-apricot-orange border-b pb-2 mb-4">Fase 2: Sincronização de Listas</h2>
          <p className="text-sm text-gray-500 mb-4">Estes botões testam a busca de cada lista na API externa (não salvam no banco).</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <button onClick={() => handleSync('Tratamento')} className="bg-golden-orange text-white py-2 px-4 rounded-md hover:opacity-90 transition-opacity">Testar Busca: Tratamentos</button>
            <button onClick={() => handleSync('Classe')} className="bg-golden-orange text-white py-2 px-4 rounded-md hover:opacity-90 transition-opacity">Testar Busca: Classes</button>
            <button onClick={() => handleSync('Unidade')} className="bg-golden-orange text-white py-2 px-4 rounded-md hover:opacity-90 transition-opacity">Testar Busca: Unidades</button>
            <button onClick={() => handleSync('Acondicionamento')} className="bg-golden-orange text-white py-2 px-4 rounded-md hover:opacity-90 transition-opacity">Testar Busca: Acondicionamentos</button>
          </div>
          <hr className="my-4"/>
          <p className="text-sm text-gray-500 mb-4">Este botão executa a rotina completa: busca todas as listas da SIGOR e as salva no seu banco de dados Firestore.</p>
           <button onClick={handleFullSync} className="bg-rain-forest text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-90 transition-colors w-full">
            2. Sincronizar Todas as Listas com o Banco de Dados
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-lexend text-apricot-orange border-b pb-2 mb-4">Fase 3: Geração de MTR</h2>
          <button onClick={handleGenerateMtr} className="bg-abundant-green text-white font-bold py-2 px-4 rounded-md hover:bg-rain-forest transition-colors w-full">
            3. Gerar MTR de Teste
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-inner">
          <h2 className="text-lg font-lexend text-gray-700 border-b pb-2 mb-4">Painel de Resposta da API Interna</h2>
          <div className="bg-gray-100 p-4 rounded-md min-h-[100px] text-sm text-gray-800">
            {status === 'carregando' && <p>Carregando...</p>}
            {apiResponse && (
              <pre className="whitespace-pre-wrap break-all">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PainelSigor;