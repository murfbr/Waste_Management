// functions/src/index.ts

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
// ADICIONADO: Importa o sistema de parâmetros da v2
import { defineString } from "firebase-functions/params";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import * as crypto from "crypto";

import { IneaService } from "./ineaService";

admin.initializeApp();

// AJUSTE: A propriedade 'cors' foi removida de setGlobalOptions, pois não é suportada na v2.
setGlobalOptions({
    region: "southamerica-east1",
});

// ADICIONADO: Define a política de CORS em uma constante para ser reutilizada.
// ATUALIZADO: URLs de aprovação e produção adicionadas.
const corsPolicy = [
    "http://localhost:5173", // Para desenvolvimento local
    "https://ctrlwaste-aprovacao.vercel.app", // Ambiente de aprovação
    "https://www.ctrlwaste.com.br" // Ambiente de produção
];

// ADICIONADO: Define opções reutilizáveis para as funções, incluindo timeout.
const functionOptions = {
    cors: corsPolicy,
    timeoutSeconds: 30, // Aumenta o timeout para 30 segundos
    memory: "256MiB" as const, // Aloca um pouco mais de memória
};


// --- NOVO PADRÃO v2: Declarando o parâmetro de ambiente ---
const ineaEncryptionKey = defineString("INEA_ENCRYPTION_KEY");


// --- Seção de Criptografia (CORRIGIDA para o padrão v2) ---
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

function encrypt(text: string): string {
    const key = ineaEncryptionKey.value();
    if (!key || key.length !== 32) {
        throw new Error("A chave de criptografia (INEA_ENCRYPTION_KEY) não está configurada corretamente no ambiente.");
    }
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key), iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

function decrypt(text: string): string {
    const key = ineaEncryptionKey.value();
    if (!key || key.length !== 32) {
        throw new Error("A chave de criptografia (INEA_ENCRYPTION_KEY) não está configurada corretamente no ambiente.");
    }
    const [ivHex, authTagHex, encryptedHex] = text.split(":");
    if (!ivHex || !authTagHex || !encryptedHex) {
        throw new Error("Formato de texto criptografado inválido.");
    }
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key), iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString();
}

// --- Interfaces e Funções Auxiliares ---
interface IneaConfig {
    login: string;
    senhaCriptografada: string;
    cnpj: string;
    codUnidade: string;
}

interface UserProfile {
    id: string;
    role: "master" | "gerente" | "operacional";
    clientesPermitidos?: string[];
    nome?: string;
    email?: string;
}

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

async function getClientIneaConfig(clienteId: string): Promise<IneaConfig> {
    const clienteRef = admin.firestore().collection("clientes").doc(clienteId);
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


// --- Firebase Functions ---

// AJUSTE: Aplicando as opções com timeout e CORS.
export const checkConfig = onCall(functionOptions, (request) => {
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

// AJUSTE: Aplicando as opções com timeout e CORS.
export const saveIneaCredentials = onCall(functionOptions, async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "O usuário precisa estar autenticado.");
    }
    const { clienteId, login, senha, cnpj, codUnidade } = request.data;
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

// AJUSTE: Aplicando as opções com timeout e CORS.
export const testIneaConnection = onCall(functionOptions, async (request) => {
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

// AJUSTE: Aplicando as opções com timeout e CORS.
export const createIneaMtr = onCall(functionOptions, async (request) => {
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


// --- Funções de Gerenciamento de Usuários (Código Completo Restaurado) ---
// AJUSTE: Aplicando as opções com timeout e CORS.
export const manageUserPermissions = onCall(functionOptions, async (request) => {
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
  const callerProfile = callerProfileSnap.data() as UserProfile;
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
    // CORRIGIDO: O acento grave (`) foi usado para fechar a string.
    return { success: true, message: `Usuário ${email} criado com sua role!` };
  }

  throw new HttpsError("invalid-argument", "Ação não especificada ou inválida.");
});

// AJUSTE: Aplicando as opções com timeout e CORS.
export const getVisibleUsers = onCall(functionOptions, async (request) => {
    console.log("getVisibleUsers: Função iniciada.");
    if (!request.auth) {
        console.error("getVisibleUsers: Erro - Usuário não autenticado.");
        throw new HttpsError("unauthenticated", "O usuário precisa estar autenticado.");
    }

    const callerUid = request.auth.uid;
    const db = admin.firestore();
    console.log(`getVisibleUsers: Chamada pelo UID: ${callerUid}`);

    try {
        const callerProfileSnap = await db.collection("users").doc(callerUid).get();
        if (!callerProfileSnap.exists) {
            console.error(`getVisibleUsers: Erro - Perfil não encontrado para UID: ${callerUid}`);
            throw new HttpsError("not-found", "Perfil do usuário chamador não encontrado.");
        }
        const callerProfile = callerProfileSnap.data() as UserProfile;
        console.log("getVisibleUsers: Perfil do chamador:", callerProfile);

        const allUsersSnap = await db.collection("users").orderBy("email").get();
        const allUsers = allUsersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as UserProfile));
        console.log(`getVisibleUsers: Total de ${allUsers.length} usuários encontrados no banco.`);

        if (callerProfile.role === "master") {
            console.log("getVisibleUsers: Chamador é 'master', retornando todos os usuários.");
            return { users: allUsers };
        }

        if (callerProfile.role === "gerente") {
            const gerentesClientesIds = new Set(callerProfile.clientesPermitidos || []);
            console.log(`getVisibleUsers: Chamador é 'gerente' com ${gerentesClientesIds.size} clientes permitidos.`);
            
            if (gerentesClientesIds.size === 0) {
                const self = allUsers.find((u) => u.id === callerUid);
                console.log("getVisibleUsers: Gerente não tem clientes, retornando apenas a si mesmo.");
                return { users: self ? [self] : [] };
            }

            const visibleUsers = allUsers.filter((user) => {
                if (user.id === callerUid) return true;
                if (user.role !== "operacional") return false;
                
                const operacionaisClientesIds = user.clientesPermitidos || [];
                const temClienteEmComum = operacionaisClientesIds.some((clienteId: string) => gerentesClientesIds.has(clienteId));
                return temClienteEmComum;
            });
            
            console.log(`getVisibleUsers: Filtro para gerente resultou em ${visibleUsers.length} usuários visíveis.`);
            return { users: visibleUsers };
        }

        console.log("getVisibleUsers: Chamador não é 'master' nem 'gerente', retornando apenas a si mesmo.");
        const self = allUsers.find((u) => u.id === callerUid);
        return { users: self ? [self] : [] };

    } catch (error: any) {
        console.error("getVisibleUsers: Erro CRÍTICO na execução da função:", error);
        throw new HttpsError("internal", error.message || "Ocorreu um erro interno ao buscar os usuários.");
    }
});
