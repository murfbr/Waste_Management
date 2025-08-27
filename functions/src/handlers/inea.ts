// functions/src/handlers/inea.ts
import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { IneaService } from "../services/ineaService";
import { functionOptions } from "../core/config";
import { encrypt, decrypt, ineaEncryptionKey } from "../core/crypto";
import { db } from "../core/admin";

interface IneaConfig {
    login: string;
    senhaCriptografada: string;
    cnpj: string;
    codUnidade: string;
}

async function getClientIneaConfig(clienteId: string): Promise<IneaConfig> {
    const clienteRef = db.collection("clientes").doc(clienteId);
    const clienteDoc = await clienteRef.get();
    if (!clienteDoc.exists) {
        throw new HttpsError("not-found", "Cliente não encontrado.");
    }
    const configINEA = clienteDoc.data()?.configINEA;
    if (!configINEA || !configINEA.senhaCriptografada || !configINEA.login || !configINEA.cnpj || !configINEA.codUnidade) {
        throw new HttpsError("failed-precondition", "As credenciais INEA para este cliente não estão configuradas completamente.");
    }
    return configINEA as IneaConfig;
}

export const checkConfig = onCall(functionOptions, () => {
    console.log("[checkConfig] Iniciando a verificação de configuração (v2)...");
    try {
        const key = ineaEncryptionKey.value();
        if (key) {
            console.log("[checkConfig] SUCESSO: Chave 'INEA_ENCRYPTION_KEY' encontrada.");
            return {
                status: "success",
                message: `Chave encontrada! Comprimento: ${key.length}. Os primeiros 4 caracteres são: '${key.substring(0, 4)}...'`,
            };
        } else {
            console.error("[checkConfig] ERRO: A chave foi definida mas retornou um valor vazio.");
            return {
                status: "error",
                message: "A chave INEA_ENCRYPTION_KEY foi encontrada, mas está vazia.",
            };
        }
    } catch (error: any) {
        console.error("[checkConfig] ERRO CATASTRÓFICO ao tentar ler o parâmetro:", error);
        throw new HttpsError("internal", "Erro ao ler o parâmetro 'INEA_ENCRYPTION_KEY'. Verifique se ela foi definida para o ambiente.", error.message);
    }
});

export const saveIneaCredentials = onCall(functionOptions, async (request: CallableRequest) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "O usuário precisa estar autenticado.");
    }
    const { clienteId, login, senha, cnpj, codUnidade } = request.data;
    if (!clienteId) {
      throw new HttpsError("invalid-argument", "O ID do cliente é obrigatório.");
    }
    try {
      const clienteRef = db.collection("clientes").doc(clienteId);
      const configToSave: { [key: string]: any } = {
        login: login || null,
        cnpj: cnpj || null,
        codUnidade: codUnidade || null,
        ultimaAtualizacao: FieldValue.serverTimestamp(),
      };
      if (senha) {
        configToSave.senhaCriptografada = encrypt(senha);
      }
      await clienteRef.set({ configINEA: configToSave }, { merge: true });
      return { status: "success", message: "Credenciais INEA salvas com sucesso!" };
    } catch (error: any) {
      console.error("Erro detalhado ao salvar credenciais INEA:", error);
      throw new HttpsError("internal", error.message || "Ocorreu um erro interno ao salvar as credenciais.");
    }
});

export const testIneaConnection = onCall(functionOptions, async (request: CallableRequest) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "O usuário precisa estar autenticado.");
    }
    const { clienteId } = request.data;
    if (!clienteId) {
      throw new HttpsError("invalid-argument", "O ID do cliente é obrigatório.");
    }

    try {
      const config = await getClientIneaConfig(clienteId);
      const senha = decrypt(config.senhaCriptografada);
      const ineaService = new IneaService(config.login, senha, config.cnpj, config.codUnidade);
      const responseData = await ineaService.testConnection();
      return { status: "success", message: "Conexão com a API do INEA bem-sucedida!", data: responseData };

    } catch (error: any) {
        console.error("Erro ao testar conexão INEA:", error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", error.message || "Ocorreu um erro interno ao testar a conexão.");
    }
});

export const createIneaMtr = onCall(functionOptions, async (request: CallableRequest) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "O usuário precisa estar autenticado.");
    }
    const { clienteId, mtrData } = request.data;
    if (!clienteId || !mtrData) {
        throw new HttpsError("invalid-argument", "Os dados do cliente e do MTR são obrigatórios.");
    }

    try {
        const config = await getClientIneaConfig(clienteId);
        const senha = decrypt(config.senhaCriptografada);
        const ineaService = new IneaService(config.login, senha, config.cnpj, config.codUnidade);
        const result = await ineaService.createMtrInLot(Array.isArray(mtrData) ? mtrData : [mtrData]);
        return { status: "success", message: "MTR criado com sucesso!", data: result };

    } catch (error: any) {
        console.error(`Erro ao criar MTR para o cliente ${clienteId}:`, error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", error.message || "Ocorreu um erro interno ao criar o MTR.");
    }
});