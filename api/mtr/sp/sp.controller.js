// api/mtr/sp/sp.controller.js

import * as spService from './sp.service.js';

export const handleAuthentication = async (req, res) => {
  console.log('2. [CONTROLADOR] Rota /auth atingida.');
  try {
    const credentials = req.body;
    
    console.log('2a. [CONTROLADOR] Corpo da requisição recebido:', credentials);

    const token = await spService.authenticate(credentials);
    
    console.log('4. [CONTROLADOR] Serviço concluiu. Enviando token de volta para o front-end.');
    res.status(200).json({ token });
  } catch (error) {
    console.error('ERRO [CONTROLADOR] na autenticação:', error);
    res.status(500).json({ error: error.message });
  }
};

export const handleGetList = async (req, res) => {
  const { listName } = req.params;
  const token = req.headers.authorization?.split(' ')[1];
  
  console.log(`2. [CONTROLADOR] Rota /lists/${listName} atingida.`);
  console.log(`2a. [CONTROLADOR] Token recebido no header:`, token ? 'Sim' : 'Não');

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
  }

  try {
    const data = await spService.fetchList(listName, token);
    
    console.log('4. [CONTROLADOR] Serviço concluiu. Enviando dados da lista de volta para o front-end.');
    res.status(200).json({ data });
  } catch (error) {
    console.error(`ERRO [CONTROLADOR] ao buscar a lista '${listName}':`, error);
    res.status(500).json({ error: `Erro ao buscar a lista: ${error.message}` });
  }
};

export const handleCreateMtr = async (req, res) => {
  const mtrData = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  console.log('2. [CONTROLADOR] Rota /mtr atingida.');
  console.log(`2a. [CONTROLADOR] Token recebido no header:`, token ? 'Sim' : 'Não');
  if (!token) { return res.status(401).json({ error: 'Token de autenticação não fornecido.' }); }
  try {
    const result = await spService.createMtr(mtrData, token);
    console.log('4. [CONTROLADOR] Serviço concluiu. Enviando resultado da criação do MTR de volta para o front-end.');
    res.status(201).json(result);
  } catch (error) {
    console.error('ERRO [CONTROLADOR] ao gerar MTR:', error);
    res.status(500).json({ error: `Erro ao gerar MTR: ${error.message}` });
  }
};

export const handleSyncAllLists = async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    console.log('2. [CONTROLADOR] Rota /sync atingida.');
    console.log(`2a. [CONTROLADOR] Token recebido no header:`, token ? 'Sim' : 'Não');
    if (!token) { return res.status(401).json({ error: 'Token de autenticação não fornecido.' }); }
    try {
        const report = await spService.syncAllListsToFirestore(token);
        console.log('4. [CONTROLADOR] Serviço concluiu. Enviando relatório de sincronização de volta para o front-end.');
        res.status(200).json({ message: 'Sincronização concluída com sucesso!', report });
    } catch (error) {
        console.error('ERRO [CONTROLADOR] na sincronização:', error);
        res.status(500).json({ error: `Erro na sincronização: ${error.message}` });
    }
};

// --- NOVA FUNÇÃO ADICIONADA ---
// Função para buscar a lista genérica de destinadores.
export const handleGetDestinadores = async (req, res) => {
  try {
    const destinadores = await spService.fetchAllDestinadores();
    res.status(200).json(destinadores);
  } catch (error) {
    console.error('ERRO [CONTROLADOR] ao buscar destinadores:', error);
    res.status(500).json({ error: 'Erro ao buscar a lista de destinadores.' });
  }
}; // <-- A CHAVE '}' FALTANTE FOI ADICIONADA AQUI, FECHANDO A FUNÇÃO