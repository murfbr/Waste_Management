// api/mtr/sp/sp.service.js
import fetch from 'node-fetch';

// CORREÇÃO: Definindo a constante da URL da API que estava faltando.
const SIGOR_API_URL = 'https://mtrr.cetesb.sp.gov.br/apiws/rest';

// 1. AUTENTICAÇÃO
export const authenticate = async (credentials) => {
  console.log('[Service SP] Autenticando com a API real do SIGOR...');
  try {
    const response = await fetch(`${SIGOR_API_URL}/gettoken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      throw new Error(`Erro na API SIGOR: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.erro || !data.objetoResposta) {
      throw new Error(data.mensagem || 'Resposta de autenticação inválida.');
    }
    
    console.log('[Service SP] Token obtido com sucesso.');
    // Limpa a palavra "Bearer " para retornar apenas o token
    return data.objetoResposta.replace('Bearer ', '');

  } catch (error) {
    console.error('[Service SP] Erro na autenticação:', error);
    throw error;
  }
};

// 2. BUSCA DE LISTAS
export const fetchList = async (listName, token) => {
  console.log(`[Service SP] Buscando dados reais para a lista '${listName}'.`);
  try {
    const response = await fetch(`${SIGOR_API_URL}/retornaLista${listName}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na API SIGOR ao buscar lista: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
     if (data.erro) {
      throw new Error(data.mensagem || `A API retornou um erro para a lista ${listName}.`);
    }

    return data.objetoResposta;

  } catch (error) {
    console.error(`[Service SP] Erro ao buscar lista '${listName}':`, error);
    throw error;
  }
};

// 3. CRIAÇÃO DE MTR
export const createMtr = async (mtrData, token) => {
  console.log('[Service SP] Enviando dados para gerar MTR na API real do SIGOR...');
  try {
    const response = await fetch(`${SIGOR_API_URL}/salvarManifestoLote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(mtrData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API SIGOR ao criar MTR: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('[Service SP] Erro ao criar MTR:', error);
    throw error;
  }
};

