// src/pages/app/GerarMtrSP.jsx
import React, { useState, useContext } from 'react';
import AuthContext from '../../context/AuthContext'; // Usaremos para pegar o 'db'

const GerarMtrSP = () => {
  const { db } = useContext(AuthContext);

  // Estados para armazenar os dados carregados
  const [listasDeApoio, setListasDeApoio] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [transportadores, setTransportadores] = useState([]);
  const [destinadores, setDestinadores] = useState([]);

  // Estados de controle e feedback visual
  const [status, setStatus] = useState('ocioso'); // ocioso, carregando, sucesso, erro
  const [apiResponse, setApiResponse] = useState({ message: 'Aguardando ação...' });

  // --- FASE 1: CARREGAR LISTAS DE APOIO DO NOSSO BANCO DE DADOS ---
  const handleLoadSupportLists = async () => {
    setStatus('carregando');
    setApiResponse({ message: 'Buscando listas de apoio (Classe, Tratamento, etc.) do nosso Firestore...' });

    const nomesDasListas = ['Classe', 'Tratamento', 'Unidade', 'Acondicionamento', 'EstadoFisico', 'Residuo'];
    
    try {
      // Usamos Promise.all para fazer todas as buscas em paralelo
      const promessas = nomesDasListas.map(listName =>
        fetch(`/api/mtr/sp/data/${listName}`).then(res => {
          if (!res.ok) {
            throw new Error(`Falha ao buscar a lista: ${listName}`);
          }
          return res.json();
        })
      );

      const resultados = await Promise.all(promessas);

      // Organiza os resultados em um objeto para fácil acesso
      const listasCarregadas = nomesDasListas.reduce((acc, name, index) => {
        acc[name] = resultados[index];
        return acc;
      }, {});

      setListasDeApoio(listasCarregadas);
      setStatus('sucesso');
      setApiResponse(listasCarregadas); // Mostra o JSON completo das listas no painel

    } catch (error) {
      console.error("Erro ao carregar listas de apoio:", error);
      setStatus('erro');
      setApiResponse({ error: error.message });
    }
  };


  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Geração de MTR - SP (Modo de Desenvolvimento)</h1>
        
        {/* --- Card da Fase 1 --- */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Fase 1: Carregar Dados de Apoio</h2>
          <p className="text-sm text-gray-500 mb-4">
            Este botão irá buscar todas as listas necessárias (Classe, Tratamento, etc.) do seu banco de dados Firestore para preencher os formulários.
          </p>
          <button
            onClick={handleLoadSupportLists}
            className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors w-full"
          >
            1. Carregar Listas de Apoio
          </button>
        </div>

        {/* --- Card da Fase 2 (Ainda não funcional) --- */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 opacity-50">
           <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Fase 2: Carregar Dados do Contexto</h2>
           <p className="text-sm text-gray-500 mb-4">
            (Próximo passo) Aqui vamos selecionar o cliente e carregar seus transportadores e destinadores vinculados.
          </p>
           <button disabled className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md w-full">2. Carregar Dados do Cliente</button>
        </div>


        {/* --- Painel de Resposta Visual --- */}
        <div className="bg-white p-4 rounded-lg shadow-inner">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Painel de Resposta (Log Visual)</h2>
          <div className="bg-gray-800 text-white p-4 rounded-md min-h-[200px] text-sm font-mono">
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

export default GerarMtrSP;