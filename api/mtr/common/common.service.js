// api/mtr/common/common.service.js

import { db } from '../../config/firebase.js';

// --- FUNÇÃO EXISTENTE ---
export const fetchAllDestinadores = async () => {
    console.log('3. [SERVICE-COMMON] Buscando todos os destinadores do Firestore.');
    const destinadoresRef = db.collection('destinadores');
    const snapshot = await destinadoresRef.orderBy('nome').get();
    if (snapshot.empty) {
        return [];
    }
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`3d. [SERVICE-COMMON] ${list.length} destinadores encontrados.`);
    return list;
};

// --- NOVAS FUNÇÕES ADICIONADAS ---

// 1. Função para buscar uma lista simples de todos os clientes (id e nome)
export const fetchAllClientsSimple = async () => {
    console.log('3. [SERVICE-COMMON] Buscando lista simples de clientes do Firestore.');
    const clientesRef = db.collection('clientes');
    const snapshot = await clientesRef.where('ativo', '==', true).orderBy('nome').get();
    if (snapshot.empty) {
        return [];
    }
    // Retorna apenas o ID e o nome, para popular o dropdown no front-end
    const list = snapshot.docs.map(doc => ({ id: doc.id, nome: doc.data().nome }));
    console.log(`3d. [SERVICE-COMMON] ${list.length} clientes ativos encontrados.`);
    return list;
};

// 2. Função para buscar o contexto completo de um cliente (cliente + transportadores)
export const fetchClientContext = async (clienteId) => {
    console.log(`3. [SERVICE-COMMON] Buscando contexto completo para o cliente ID: ${clienteId}`);
    
    // Etapa A: Buscar os dados do cliente selecionado
    const clienteRef = db.collection('clientes').doc(clienteId);
    const clienteDoc = await clienteRef.get();
    if (!clienteDoc.exists) {
        throw new Error(`Cliente com ID ${clienteId} não encontrado.`);
    }
    const clienteData = { id: clienteDoc.id, ...clienteDoc.data() };
    console.log('3a. [SERVICE-COMMON] Dados do cliente encontrados:', clienteData.nome);

    // Etapa B: Buscar os transportadores vinculados
    const transportadorIds = clienteData.contratosColeta?.map(c => c.empresaColetaId) || [];
    let transportadoresData = [];

    if (transportadorIds.length > 0) {
        console.log('3b. [SERVICE-COMMON] Buscando dados para os transportadores IDs:', transportadorIds);
        const transportadoresRef = db.collection('empresasColeta');
        // O Firestore permite buscar até 30 documentos de uma vez com o operador 'in'
        const transportadoresSnapshot = await transportadoresRef.where('__name__', 'in', transportadorIds).get();
        transportadoresData = transportadoresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`3c. [SERVICE-COMMON] ${transportadoresData.length} transportadores encontrados.`);
    } else {
        console.log('3c. [SERVICE-COMMON] Cliente não possui transportadores vinculados.');
    }

    // Etapa C: Retornar o objeto de contexto completo
    const contextData = {
        cliente: clienteData,
        transportadores: transportadoresData,
    };
    
    console.log('3d. [SERVICE-COMMON] Contexto completo montado com sucesso.');
    return contextData;
};