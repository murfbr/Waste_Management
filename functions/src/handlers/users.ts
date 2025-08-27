// functions/src/handlers/users.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { functionOptions } from "../core/config";
import { db, auth } from "../core/admin";

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

export const manageUserPermissions = onCall(functionOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "A requisição deve ser feita por um usuário autenticado.");
  }
  const callerUid = request.auth.uid;
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
    return { success: true, message: `Usuário ${email} criado com sua role!` };
  }

  throw new HttpsError("invalid-argument", "Ação não especificada ou inválida.");
});

export const getVisibleUsers = onCall(functionOptions, async (request) => {
    console.log("getVisibleUsers: Função iniciada.");
    if (!request.auth) {
        console.error("getVisibleUsers: Erro - Usuário não autenticado.");
        throw new HttpsError("unauthenticated", "O usuário precisa estar autenticado.");
    }

    const callerUid = request.auth.uid;
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