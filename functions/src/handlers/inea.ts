// functions/src/handlers/inea.ts
import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { IneaService } from "../services/ineaService";
import { functionOptions } from "../core/config";
import { encrypt, decrypt } from "../core/crypto";
import { db } from "../core/admin";
import { logger } from "firebase-functions";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const secretManager = new SecretManagerServiceClient();
let cachedKey: string | null = null;

// Função para buscar a chave do Secret Manager (com cache para performance)
async function getEncryptionKey(): Promise<string> {
    if (cachedKey) {
        logger.info("[DEBUG] Retornando chave de criptografia do cache.");
        return cachedKey;
    }
    
    const name = "projects/ctrlwaste-dev/secrets/INEA_ENCRYPTION_KEY/versions/latest";
    logger.info(`[DEBUG] Buscando chave secreta em: ${name}`);
    try {
        const [version] = await secretManager.accessSecretVersion({ name });
        const key = version.payload?.data?.toString();
        if (!key || key.length !== 32) {
            throw new Error(`Chave secreta inválida ou vazia. Comprimento: ${key?.length || 0}`);
        }
        cachedKey = key;
        logger.info("[DEBUG] Chave secreta carregada e cacheada com sucesso.");
        return key;
    } catch (error) {
        logger.error("[DEBUG] FALHA CRÍTICA AO ACESSAR A CHAVE SECRETA:", error);
        throw new HttpsError("internal", "Não foi possível acessar a configuração de segurança.");
    }
}

// Função auxiliar para verificar a permissão do usuário de forma segura no backend
async function verifyMasterAdmin(auth: any): Promise<void> {
    logger.info("[DEBUG] Iniciando verifyMasterAdmin.");
    if (!auth) {
        logger.warn("[DEBUG] Falha na verificação: Usuário não autenticado.");
        throw new HttpsError("unauthenticated", "O usuário precisa estar autenticado.");
    }
    logger.info(`[DEBUG] Verificando permissão para o UID: ${auth.uid}`);
    const userRef = db.collection("users").doc(auth.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists || userDoc.data()?.role !== "master") {
        logger.warn(`[DEBUG] Tentativa de acesso não autorizada. UID: ${auth.uid}, Role: ${userDoc.data()?.role || 'não encontrado'}`);
        throw new HttpsError("permission-denied", "Ação permitida apenas para administradores master.");
    }
    logger.info(`[DEBUG] Permissão de 'master' confirmada para o UID: ${auth.uid}`);
}

interface IneaConfig {
    login: string;
    senhaCriptografada: string;
    cnpj: string;
    codUnidade: string;
}

async function getClientIneaConfig(clienteId: string): Promise<IneaConfig> {
    logger.info(`[DEBUG] [getClientIneaConfig] Buscando configuração para cliente ${clienteId}`);
    const clienteRef = db.collection("clientes").doc(clienteId);
    const clienteDoc = await clienteRef.get();
    if (!clienteDoc.exists) {
        throw new HttpsError("not-found", "Cliente não encontrado.");
    }
    const configINEA = clienteDoc.data()?.configINEA;
    if (!configINEA || !configINEA.senhaCriptografada || !configINEA.login || !configINEA.cnpj || !configINEA.codUnidade) {
        throw new HttpsError("failed-precondition", "As credenciais INEA para este cliente não estão configuradas completamente.");
    }
    logger.info(`[DEBUG] [getClientIneaConfig] Configuração encontrada para cliente ${clienteId}`);
    return configINEA as IneaConfig;
}

export const checkConfig = onCall(functionOptions, async () => {
    logger.info("[DEBUG] [checkConfig] Iniciando a verificação de configuração...");
    try {
        const key = await getEncryptionKey();
        if (key) {
            logger.info("[DEBUG] [checkConfig] SUCESSO: Chave 'INEA_ENCRYPTION_KEY' lida com sucesso.");
            return {
                status: "success",
                message: `Chave lida com sucesso! Comprimento: ${key.length}.`,
            };
        } else {
            // Este caso não deve acontecer por causa do throw em getEncryptionKey
            logger.error("[DEBUG] [checkConfig] ERRO: A chave retornou um valor vazio.");
            return { status: "error", message: "A chave INEA_ENCRYPTION_KEY foi encontrada, mas está vazia." };
        }
    } catch (error: any) {
        logger.error("[DEBUG] [checkConfig] ERRO CATASTRÓFICO:", error);
        throw new HttpsError("internal", "Erro ao ler a chave secreta.", error.message);
    }
});

export const saveIneaCredentials = onCall(functionOptions, async (request: CallableRequest) => {
    logger.info("[DEBUG] [saveIneaCredentials] Função invocada.");
    await verifyMasterAdmin(request.auth);
    
    const { clienteId, login, senha, cnpj, codUnidade } = request.data;
    logger.info(`[DEBUG] [saveIneaCredentials] Dados recebidos para clienteId: ${clienteId}`);
    
    if (!clienteId) throw new HttpsError("invalid-argument", "O ID do cliente é obrigatório.");

    try {
        const clienteRef = db.collection("clientes").doc(clienteId);
        const configToSave: { [key: string]: any } = {
            login: login || null,
            cnpj: cnpj || null,
            codUnidade: codUnidade || null,
            ultimaAtualizacao: FieldValue.serverTimestamp(),
        };

        if (senha) {
            logger.info("[DEBUG] [saveIneaCredentials] Senha encontrada. Buscando chave...");
            const key = await getEncryptionKey();
            configToSave.senhaCriptografada = encrypt(senha, key);
            logger.info("[DEBUG] [saveIneaCredentials] Senha criptografada.");
        } else {
            logger.info("[DEBUG] [saveIneaCredentials] Nenhuma senha fornecida.");
        }
        
        logger.info("[DEBUG] [saveIneaCredentials] Salvando no Firestore...");
        await clienteRef.set({ configINEA: configToSave }, { merge: true });

        logger.info("[DEBUG] [saveIneaCredentials] Credenciais salvas com sucesso.");
        return { status: "success", message: "Credenciais INEA salvas com sucesso!" };
    } catch (error: any) {
        logger.error("[DEBUG] [saveIneaCredentials] Erro catastrófico:", error);
        throw new HttpsError("internal", error.message || "Ocorreu um erro interno.");
    }
});

export const getIneaPassword = onCall(functionOptions, async (request: CallableRequest) => {
    logger.info("[DEBUG] [getIneaPassword] Função invocada.");
    await verifyMasterAdmin(request.auth);

    const { clienteId } = request.data;
    if (!clienteId) throw new HttpsError("invalid-argument", "O ID do cliente é obrigatório.");
    logger.info(`[DEBUG] [getIneaPassword] Buscando senha para clienteId: ${clienteId}`);

    try {
        const clienteDoc = await db.collection("clientes").doc(clienteId).get();
        if (!clienteDoc.exists) {
            logger.warn(`[DEBUG] [getIneaPassword] Cliente não encontrado: ${clienteId}`);
            throw new HttpsError("not-found", "Cliente não encontrado.");
        }

        const ciphertext = clienteDoc.data()?.configINEA?.senhaCriptografada;
        if (!ciphertext) {
            logger.warn(`[DEBUG] [getIneaPassword] Nenhuma senha criptografada para cliente: ${clienteId}`);
            throw new HttpsError("not-found", "Nenhuma senha encontrada.");
        }
        
        logger.info("[DEBUG] [getIneaPassword] Senha criptografada encontrada. Buscando chave...");
        const key = await getEncryptionKey();
        const senhaOriginal = decrypt(ciphertext, key);
        logger.info("[DEBUG] [getIneaPassword] Senha descriptografada com sucesso.");
        
        return { success: true, password: senhaOriginal };
    } catch (error: any) {
        logger.error(`[DEBUG] [getIneaPassword] Erro catastrófico para cliente ${clienteId}:`, error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", error.message);
    }
});

export const testIneaConnection = onCall(functionOptions, async (request: CallableRequest) => {
    logger.info("[DEBUG] [testIneaConnection] Função invocada.");
    await verifyMasterAdmin(request.auth);
    const { clienteId } = request.data;
    if (!clienteId) throw new HttpsError("invalid-argument", "O ID do cliente é obrigatório.");

    try {
      const config = await getClientIneaConfig(clienteId);
      logger.info("[DEBUG] [testIneaConnection] Config do cliente obtida. Descriptografando senha...");
      const key = await getEncryptionKey();
      const senha = decrypt(config.senhaCriptografada, key);
      logger.info("[DEBUG] [testIneaConnection] Senha descriptografada. Testando conexão...");
      const ineaService = new IneaService(config.login, senha, config.cnpj, config.codUnidade);
      const responseData = await ineaService.testConnection();
      logger.info("[DEBUG] [testIneaConnection] Conexão bem-sucedida.");
      return { status: "success", message: "Conexão com a API do INEA bem-sucedida!", data: responseData };

    } catch (error: any) {
        logger.error("[DEBUG] [testIneaConnection] Erro:", error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", error.message || "Ocorreu um erro interno.");
    }
});

export const createIneaMtr = onCall(functionOptions, async (request: CallableRequest) => {
    logger.info("[DEBUG] [createIneaMtr] Função invocada.");
    await verifyMasterAdmin(request.auth);
    const { clienteId, mtrData } = request.data;
    if (!clienteId || !mtrData) {
        throw new HttpsError("invalid-argument", "Os dados do cliente e do MTR são obrigatórios.");
    }

    try {
        const config = await getClientIneaConfig(clienteId);
        logger.info("[DEBUG] [createIneaMtr] Config do cliente obtida. Descriptografando senha...");
        const key = await getEncryptionKey();
        const senha = decrypt(config.senhaCriptografada, key);
        logger.info("[DEBUG] [createIneaMtr] Senha descriptografada. Criando MTR...");
        const ineaService = new IneaService(config.login, senha, config.cnpj, config.codUnidade);
        const result = await ineaService.createMtrInLot(Array.isArray(mtrData) ? mtrData : [mtrData]);
        logger.info("[DEBUG] [createIneaMtr] MTR criado com sucesso.");
        return { status: "success", message: "MTR criado com sucesso!", data: result };

    } catch (error: any) {
        logger.error(`[DEBUG] [createIneaMtr] Erro para cliente ${clienteId}:`, error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", error.message || "Ocorreu um erro interno.");
    }
});