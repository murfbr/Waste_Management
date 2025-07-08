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

// --- Seção de Criptografia (Inalterada) ---
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
function encrypt(text: string): string {
    const key = process.env.INEA_ENCRYPTION_KEY;
    if (!key || key.length !== 32) {
        throw new Error("A chave de criptografia (INEA_ENCRYPTION_KEY) não está configurada corretamente.");
    }
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key), iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
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
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key), iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString();
}
// --- Fim da Seção de Criptografia ---

interface IneaCredentialsData {
  clienteId: string;
  login: string;
  senha?: string;
  cnpj: string;
  codUnidade: string;
}

export const saveIneaCredentials = onCall({ region: "southamerica-east1" }, async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "O usuário precisa estar autenticado.");
    }
    const data: IneaCredentialsData = request.data;
    const { clienteId, login, senha, cnpj, codUnidade } = data;
    if (!clienteId) {
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
        configToSave.senhaCriptografada = encrypt(senha);
      }
      await clienteRef.set({ configINEA: configToSave }, { merge: true });
      return { status: "success", message: "Credenciais INEA salvas com sucesso!" };
    } catch (error: any) {
      console.error("Erro detalhado ao salvar credenciais INEA:", error);
      throw new HttpsError("internal", error.message || "Ocorreu um erro interno ao salvar as credenciais.");
    }
});

interface TestConnectionData {
  clienteId: string;
}

export const testIneaConnection = onCall({ region: "southamerica-east1" }, async (request) => {
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
      const response = await fetch(api_url, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Erro da API INEA: ${response.status} - ${errorBody}`);
        throw new HttpsError("unavailable", `A API do INEA retornou um erro: ${response.statusText}.`);
      }
      const responseData = await response.json();
      return { status: "success", message: "Conexão com a API do INEA bem-sucedida!", data: responseData };
    } catch (error: any) {
        console.error("Erro ao testar conexão INEA:", error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", error.message || "Ocorreu um erro interno ao testar a conexão.");
    }
});

interface UserData {
  targetUid?: string;
  email?: string;
  password?: string;
  nome?: string;
  role?: "master" | "gerente" | "operacional";
  clientesPermitidos: string[];
}

interface ManageUserPermissionsData {
  action: "create" | "update";
  userData: UserData;
}

export const manageUserPermissions = onCall({ region: "southamerica-east1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "A requisição deve ser feita por um usuário autenticado.");
  }
  const callerUid = request.auth.uid;
  const db = admin.firestore();
  const auth = admin.auth();
  const callerProfileRef = db.collection("users").doc(callerUid);
  const callerProfileSnap = await callerProfileRef.get();
  if (!callerProfileSnap.exists) {
    throw new HttpsError("not-found", "Perfil do usuário chamador não encontrado.");
  }
  const callerProfile = callerProfileSnap.data() as { role: string; clientesPermitidos?: string[] };
  const callerRole = callerProfile.role;
  const { action, userData } = request.data as ManageUserPermissionsData;

  if (action === "update") {
    const { targetUid, clientesPermitidos, role } = userData;
    if (!targetUid || !Array.isArray(clientesPermitidos)) {
      throw new HttpsError("invalid-argument", "Dados inválidos para atualização.");
    }
    const targetProfileRef = db.collection("users").doc(targetUid);
    const targetProfileSnap = await targetProfileRef.get();
    if (!targetProfileSnap.exists) {
      throw new HttpsError("not-found", "Usuário alvo não encontrado.");
    }
    const targetProfile = targetProfileSnap.data() as { role: string };

    if (callerRole === "gerente") {
      if (targetProfile.role !== "operacional") throw new HttpsError("permission-denied", "Gerentes só podem editar usuários operacionais.");
      const callerClientes = callerProfile.clientesPermitidos || [];
      const isSubset = clientesPermitidos.every((clienteId) => callerClientes.includes(clienteId));
      if (!isSubset) throw new HttpsError("permission-denied", "Você está tentando atribuir um cliente ao qual não tem acesso.");
      await targetProfileRef.update({ clientesPermitidos });
      return { success: true, message: "Usuário operacional atualizado com sucesso!" };
    }

    if (callerRole === "master") {
      if (!role) throw new HttpsError("invalid-argument", "A 'role' é obrigatória para atualização pelo master.");
      await targetProfileRef.update({ clientesPermitidos, role });
      return { success: true, message: "Usuário atualizado com sucesso pelo master!" };
    }

    throw new HttpsError("permission-denied", "Ação não permitida para sua role.");
  }

  if (action === "create") {
    const { email, password, nome, clientesPermitidos, role } = userData;
    if (!email || !password || !nome || !Array.isArray(clientesPermitidos) || !role) {
      throw new HttpsError("invalid-argument", "Dados inválidos para criação.");
    }
    if (callerRole === "gerente") {
      if (role !== "operacional") throw new HttpsError("permission-denied", "Gerentes só podem criar usuários com o nível 'operacional'.");
      const callerClientes = callerProfile.clientesPermitidos || [];
      const isSubset = clientesPermitidos.every((clienteId) => callerClientes.includes(clienteId));
      if (!isSubset) throw new HttpsError("permission-denied", "Você só pode atribuir clientes aos quais você tem acesso.");
    } else if (callerRole !== "master") {
      throw new HttpsError("permission-denied", "Sua role não permite criar usuários.");
    }
    let newUserRecord;
    try {
      newUserRecord = await auth.createUser({ email, password, displayName: nome });
    } catch (error: any) {
      if (error.code === "auth/email-already-exists") throw new HttpsError("already-exists", "O e-mail fornecido já está em uso.");
      if (error.code === "auth/weak-password") throw new HttpsError("invalid-argument", "A senha é muito fraca. Use pelo menos 6 caracteres.");
      throw new HttpsError("internal", "Erro ao criar usuário na autenticação: " + error.message);
    }
    const newUserProfile = { nome, email, role, clientesPermitidos: role === "master" ? [] : clientesPermitidos, dataCriacaoPerfil: FieldValue.serverTimestamp() };
    await db.collection("users").doc(newUserRecord.uid).set(newUserProfile);
    return { success: true, message: `Usuário ${email} criado com sucesso!` };
  }

  throw new HttpsError("invalid-argument", "Ação não especificada ou inválida.");
});