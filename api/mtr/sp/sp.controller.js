// api/mtr/sp/sp.controller.js
import * as spService from './sp.service.js';

// 1. AUTENTICAÇÃO
// Garante que esta função seja exportada corretamente
export const handleAuthentication = async (req, res) => {
  console.log('[Controller SP] Recebida requisição de autenticação.');
  try {
    const credentials = req.body;
    const token = await spService.authenticate(credentials);
    res.status(200).json({ token });
  } catch (error) {
    console.error('[Controller SP] Erro na autenticação:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// 2. BUSCA DE LISTAS
// Garante que esta função seja exportada corretamente
export const handleGetList = async (req, res) => {
  const { listName } = req.params;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
  }

  console.log(`[Controller SP] Recebida requisição para a lista '${listName}'.`);
  try {
    const data = await spService.fetchList(listName, token);
    res.status(200).json({ data });
  } catch (error) {
    console.error(`[Controller SP] Erro ao buscar a lista '${listName}':`, error.message);
    res.status(500).json({ error: `Erro ao buscar a lista: ${error.message}` });
  }
};

// 3. CRIAÇÃO DE MTR
// Garante que esta função seja exportada corretamente
export const handleCreateMtr = async (req, res) => {
  const mtrData = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
  }

  console.log('[Controller SP] Recebida requisição para gerar MTR.');
  try {
    const result = await spService.createMtr(mtrData, token);
    res.status(201).json(result);
  } catch (error) {
    console.error('[Controller SP] Erro ao gerar MTR:', error.message);
    res.status(500).json({ error: `Erro ao gerar MTR: ${error.message}` });
  }
};

