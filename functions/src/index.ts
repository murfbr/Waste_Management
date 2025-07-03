// functions/src/index.ts

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import * as crypto from "crypto";
import fetch from "node-fetch";

// Inicializa o Firebase Admin SDK
admin.initializeApp();

// Define a região global para as funções v2
setGlobalOptions({ region: "southamerica-east1" });

// --- INÍCIO DA SEÇÃO DE CRIPTOGRAFIA ---

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const key = process.env.INEA_ENCRYPTION_KEY;

  console.log(`Tentando encriptar... Comprimento da chave encontrada: ${key ? key.length : 'undefined'}`);

  if (!key || key.length !== 32) {
    throw new Error("A chave de criptografia (INEA_ENCRYPTION_KEY) não está configurada corretamente. Verifique o ficheiro .env.local e garanta que a chave tem 32 caracteres.");
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(key),
    iv
  );
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString(
    "hex"
  )}:${encrypted.toString("hex")}`;
}

function decrypt(text: string): string {
  const key = process.env.INEA_ENCRYPTION_KEY;

  if (!key || key.length !== 32) {
    throw new Error("A chave de criptografia (INEA_ENCRYPTION_KEY) não está configurada corretamente.");
  }
  
  const [ivHex, authTagHex, encryptedHex] = text.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(key),
    iv
  );
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString();
}

// --- FIM DA SEÇÃO DE CRIPTOGRAFIA ---

interface IneaCredentialsData {
  clienteId: string;
  login: string;
  senha?: string;
  cnpj: string;
  codUnidade: string;
}

// CORREÇÃO: Removida a opção { secrets: [...] } para o teste local no emulador.
export const saveIneaCredentials = onCall(async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "O usuário precisa estar autenticado.");
    }
    
    const data: IneaCredentialsData = request.data;
    console.log("Dados recebidos pela função saveIneaCredentials:", data);

    const { clienteId, login, senha, cnpj, codUnidade } = data;

    if (!clienteId) {
      console.error("Erro: ID do cliente não foi fornecido.");
      throw new HttpsError("invalid-argument", "O ID do cliente é obrigatório.");
    }

    try {
      const clienteRef = admin.firestore().collection("clientes").doc(clienteId);
      
      const configToSave: { [key: string]: any } = {
        login: login || null,
        cnpj: cnpj || null,
        codUnidade: codUnidade || null,
        ultimaAtualizacao: FieldValue.serverTimestamp(),
      };

      if (senha) {
        console.log("Nova senha fornecida. A encriptar...");
        configToSave.senhaCriptografada = encrypt(senha);
      }

      console.log("A atualizar o Firestore com os seguintes dados:", { configINEA: configToSave });

      await clienteRef.set({
        configINEA: configToSave
      }, { merge: true });

      console.log("Dados salvos com sucesso no Firestore.");
      return { status: "success", message: "Credenciais INEA salvas com sucesso!" };

    } catch (error: any) {
      console.error("Erro detalhado ao salvar credenciais INEA:", error);
      throw new HttpsError("internal", error.message || "Ocorreu um erro interno ao salvar as credenciais.");
    }
});


interface TestConnectionData {
  clienteId: string;
}

// CORREÇÃO: Removida a opção { secrets: [...] } para o teste local no emulador.
export const testIneaConnection = onCall(async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "O usuário precisa estar autenticado.");
    }

    const { clienteId } = request.data as TestConnectionData;
    if (!clienteId) {
      throw new HttpsError("invalid-argument", "O ID do cliente é obrigatório.");
    }

    try {
      const clienteRef = admin.firestore().collection("clientes").doc(clienteId);
      const clienteDoc = await clienteRef.get();

      if (!clienteDoc.exists) {
        throw new HttpsError("not-found", "Cliente não encontrado.");
      }

      const configINEA = clienteDoc.data()?.configINEA;
      if (!configINEA || !configINEA.senhaCriptografada || !configINEA.login || !configINEA.cnpj || !configINEA.codUnidade) {
        throw new HttpsError("failed-precondition", "As credenciais INEA para este cliente não estão configuradas completamente.");
      }

      const senha = decrypt(configINEA.senhaCriptografada);

      const api_url = `http://200.20.53.4:8090/api/retornaListaClasse/${configINEA.login}/${senha}/${configINEA.cnpj}/${configINEA.codUnidade}`;
      
      const response = await fetch(api_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Erro da API INEA: ${response.status} - ${errorBody}`);
        throw new HttpsError("unavailable", `A API do INEA retornou um erro: ${response.statusText}. Verifique as credenciais e tente novamente.`);
      }

      const responseData = await response.json();

      return {
        status: "success",
        message: "Conexão com a API do INEA bem-sucedida!",
        data: responseData,
      };

    } catch (error: any) {
        console.error("Erro ao testar conexão INEA:", error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError("internal", error.message || "Ocorreu um erro interno ao testar a conexão.");
    }
});
