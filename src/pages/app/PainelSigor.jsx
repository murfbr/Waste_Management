// src/pages/PainelSigor.jsx
import React, { useState } from 'react';

const PainelSigor = () => {
  // Estado para armazenar as credenciais
  const [credentials, setCredentials] = useState({
    cpfCnpj: '',
    senha: '',
    unidade: ''
  });

  // Estado para armazenar o token obtido
  const [token, setToken] = useState(null);

  // Estado para o status da operação (ex: 'carregando', 'sucesso', 'erro')
  const [status, setStatus] = useState('ocioso');

  // Estado para a resposta da API a ser exibida
  const [apiResponse, setApiResponse] = useState(null);

  // Função para lidar com a mudança nos inputs
  const handleCredentialChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  // --- FUNÇÃO DE AUTENTICAÇÃO ---
  const handleAuth = async () => {
    setStatus('carregando');
    setApiResponse({ message: 'Autenticando com a API interna...' });

    try {
      const response = await fetch('/api/mtr/sp/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha na autenticação');
      }

      setToken(data.token); // Armazena o token no estado
      setStatus('sucesso');
      setApiResponse({ message: 'Token recebido com sucesso!', token: data.token });

    } catch (error) {
      setStatus('erro');
      setApiResponse({ error: error.message });
    }
  };


  // --- FUNÇÃO DE SINCRONIZAÇÃO DE LISTAS ---
  const handleSync = async (listName) => {
    if (!token) {
      setApiResponse({ error: 'É necessário obter um token primeiro.' });
      return;
    }
    setStatus('carregando');
    setApiResponse({ message: `Sincronizando a lista: ${listName}...` });

    try {
    const response = await fetch(`/api/mtr/sp/lists/${listName}`, {
      method: 'GET', // <-- DEVE SER GET
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
      
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao buscar lista');
      }

      setStatus('sucesso');
      setApiResponse(result.data);

    } catch (error) {
      setStatus('erro');
      setApiResponse({ error: error.message });
    }
  };

  // --- FUNÇÃO PARA GERAR MTR ---
  const handleGenerateMtr = async () => {
    if (!token) {
      setApiResponse({ error: 'É necessário obter um token primeiro.' });
      return;
    }
    setStatus('carregando');
    setApiResponse({ message: 'Enviando dados do MTR para a API interna...' });

    // Este é o corpo do MTR que validamos 100% no Postman
    const mtrTestData = [{
        seuCodigo: `TESTE_APP_${new Date().getTime()}`, // Código único para evitar duplicidade
        nomeResponsavel: "Gustavo ferracioli",
        dataExpedicao: 1760055600000,
        nomeMotorista: "MOTORISTA TESTE APP",
        placaVeiculo: "APP1234",
        observacoes: "MTR gerado via aplicação para teste.",
        transportador: { unidade: 53173, cpfCnpj: "20947332000942" },
        destinador: { unidade: 44230, cpfCnpj: "14063367000169" },
        listaManifestoResiduos: [{
            marQuantidade: 0.0122,
            resCodigoIbama: "150102",
            uniCodigo: 3,
            traCodigo: 43,
            tieCodigo: 4,
            tiaCodigo: 2,
            claCodigo: 43,
        }]
    }];

    try {
      const response = await fetch('/api/mtr/sp/mtr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Enviando o token
        },
        body: JSON.stringify(mtrTestData)
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao gerar MTR');
      }
      
      setStatus('sucesso');
      setApiResponse(data);

    } catch (error) {
      setStatus('erro');
      setApiResponse({ error: error.message });
    }
  };


  return (
    <div className="p-6 bg-gray-50 min-h-full font-comfortaa text-rich-soil">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-lexend text-blue-coral mb-4">Painel de Testes - Integração SIGOR</h1>
        <p className="mb-6 text-gray-600">Este painel serve para testar a comunicação Front-end {'>'} Back-end {'>'} API SIGOR.</p>

        {/* Seção de Autenticação */}
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

        {/* Seção de Sincronização */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-lexend text-apricot-orange border-b pb-2 mb-4">Fase 2: Sincronização de Listas</h2>
          <p className="text-sm text-gray-500 mb-4">Use os botões abaixo para buscar as listas da API do SIGOR. (Requer token válido).</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button onClick={() => handleSync('Tratamento')} className="bg-golden-orange text-white py-2 px-4 rounded-md hover:opacity-90 transition-opacity">Tratamentos</button>
            <button onClick={() => handleSync('Classe')} className="bg-golden-orange text-white py-2 px-4 rounded-md hover:opacity-90 transition-opacity">Classes</button>
            <button onClick={() => handleSync('Unidade')} className="bg-golden-orange text-white py-2 px-4 rounded-md hover:opacity-90 transition-opacity">Unidades</button>
            <button onClick={() => handleSync('Acondicionamento')} className="bg-golden-orange text-white py-2 px-4 rounded-md hover:opacity-90 transition-opacity">Acondicionamentos</button>
          </div>
        </div>

        {/* Seção de Geração de MTR */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-lexend text-apricot-orange border-b pb-2 mb-4">Fase 3: Geração de MTR</h2>
          <button onClick={handleGenerateMtr} className="bg-abundant-green text-white font-bold py-2 px-4 rounded-md hover:bg-rain-forest transition-colors w-full">
            3. Gerar MTR de Teste
          </button>
        </div>

        {/* Painel de Resposta */}
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

