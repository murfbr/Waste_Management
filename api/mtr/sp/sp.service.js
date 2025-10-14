// api/mtr/sp/sp.service.js
import fetch from 'node-fetch';
import { db } from '../../config/firebase.js';

// CORREÇÃO DEFINITIVA: A URL agora é uma string de texto simples e válida.
const SIGOR_API_URL = 'https://mtrr.cetesb.sp.gov.br/apiws/rest';

export const authenticate = async (credentials) => {
  console.log('3. [SERVIÇO] Iniciando autenticação com a API externa SIGOR.');
  try {
    const requestBody = JSON.stringify(credentials);
    console.log('3a. [SERVIÇO] Corpo exato a ser enviado para a SIGOR:', requestBody);

    const response = await fetch(`${SIGOR_API_URL}/gettoken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody
    });

    console.log('3b. [SERVIÇO] Resposta recebida da SIGOR. Status:', response.status);
    const responseBodyText = await response.text();
    console.log('3c. [SERVIÇO] Corpo da resposta da SIGOR (texto bruto):', responseBodyText);
    
    if (!response.ok) {
      throw new Error(`A API SIGOR respondeu com status ${response.status}. Corpo: ${responseBodyText}`);
    }

    const data = JSON.parse(responseBodyText);
    if (data.erro || !data.objetoResposta) {
      throw new Error(data.mensagem || 'Resposta de autenticação inválida da SIGOR.');
    }
    
    console.log('3d. [SERVIÇO] Autenticação com SIGOR bem-sucedida.');
    return data.objetoResposta.replace('Bearer ', '');
  } catch (error) {
    console.error('ERRO [SERVIÇO] na autenticação com SIGOR:', error);
    throw error;
  }
};

export const fetchList = async (listName, token) => {
  console.log(`3. [SERVIÇO] Buscando lista '${listName}' da API SIGOR.`);
  try {
    const response = await fetch(`${SIGOR_API_URL}/retornaLista${listName}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('3b. [SERVIÇO] Resposta recebida da SIGOR. Status:', response.status);
    
    // CORREÇÃO: Ler o corpo uma vez como texto e depois fazer o parse.
    const responseBodyText = await response.text();
    console.log('3c. [SERVIÇO] Corpo da resposta da SIGOR (texto bruto):', responseBodyText);
    
    if (!response.ok) { 
      throw new Error(`A API SIGOR respondeu com status ${response.status} para a lista ${listName}.`); 
    }
    
    const data = JSON.parse(responseBodyText);
    if (data.erro) { 
      throw new Error(data.mensagem || `A API SIGOR retornou um erro para a lista ${listName}.`); 
    }

    console.log(`3d. [SERVIÇO] Lista '${listName}' obtida com sucesso.`);
    return data.objetoResposta;
  } catch (error) {
    console.error(`ERRO [SERVIÇO] ao buscar lista '${listName}' da SIGOR:`, error);
    throw error;
  }
};

export const createMtr = async (mtrData, token) => {
  console.log('3. [SERVIÇO] Enviando dados para criar MTR na API SIGOR.');
  try {
    const requestBody = JSON.stringify(mtrData);
    console.log('3a. [SERVIÇO] Corpo exato a ser enviado para a SIGOR:', requestBody);
    const response = await fetch(`${SIGOR_API_URL}/salvarManifestoLote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: requestBody
    });
    console.log('3b. [SERVIÇO] Resposta recebida da SIGOR. Status:', response.status);
    
    const responseBodyText = await response.text();
    console.log('3c. [SERVIÇO] Corpo da resposta da SIGOR (texto bruto):', responseBodyText);

    if (!response.ok) { 
      throw new Error(`A API SIGOR respondeu com status ${response.status} ao criar MTR.`); 
    }
    
    const result = JSON.parse(responseBodyText);
    console.log('3d. [SERVIÇO] MTR criado com sucesso na SIGOR.');
    return result;
  } catch (error) {
    console.error('ERRO [SERVIÇO] ao criar MTR na SIGOR:', error);
    throw error;
  }
};

export const syncAllListsToFirestore = async (token) => {
    const listNames = ['Classe', 'Unidade', 'Tratamento', 'EstadoFisico', 'Acondicionamento', 'Residuo'];
    const report = {};
    console.log('3. [SERVIÇO] Iniciando sincronização com o Firestore...');
    for (const listName of listNames) {
        try {
            console.log(`3a. [SERVIÇO] Sincronizando lista: ${listName}`);
            const items = await fetchList(listName, token);
            if (items && items.length > 0) {
                const collectionRef = db.collection('Mtr').doc('SP').collection(listName.toLowerCase());
                const batch = db.batch();
                items.forEach(item => {
                    const docId = String(Object.values(item)[0]);
                    const docRef = collectionRef.doc(docId);
                    batch.set(docRef, item);
                });
                await batch.commit();
                const message = `${items.length} itens da lista '${listName}' salvos.`;
                console.log(`[Service SP] ${message}`);
                report[listName] = { status: 'Success', count: items.length };
            } else {
                 report[listName] = { status: 'Success', count: 0, message: 'Nenhum item retornado pela API.' };
            }
        } catch (error) {
            console.error(`ERRO [SERVIÇO] Falha ao sincronizar a lista '${listName}':`, error.message);
            report[listName] = { status: 'Failed', error: error.message };
        }
    }
    console.log('3d. [SERVIÇO] Sincronização com o Firestore concluída.');
    return report;
};

// --- NOVA FUNÇÃO ADICIONADA ---
// Busca todos os documentos da coleção 'destinadores' no Firestore.
export const fetchAllDestinadores = async () => {
    console.log('3. [SERVIÇO] Buscando todos os destinadores do Firestore.');
    const destinadoresRef = db.collection('destinadores');
    const snapshot = await destinadoresRef.orderBy('nome').get();
    
    if (snapshot.empty) {
        return [];
    }
    
    const destinadoresList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`3d. [SERVIÇO] ${destinadoresList.length} destinadores encontrados.`);
    return destinadoresList;
};