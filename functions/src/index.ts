// functions/src/index.ts

/**
 * Este é o ponto de entrada principal para todas as Cloud Functions.
 * Sua única responsabilidade é importar e re-exportar as funções
 * dos seus respectivos arquivos de "handler".
 * Isso mantém o código organizado e fácil de manter.
 */

// Importa os arquivos de configuração primeiro para garantir a inicialização.
import "./core/admin";
import "./core/config";

// Importa todas as funções de seus respectivos handlers.
import * as ineaFunctions from "./handlers/inea";
import * as userFunctions from "./handlers/users";

// Exporta as funções para que o Firebase possa encontrá-las e implantá-las.
export const {
    checkConfig,
    saveIneaCredentials,
    testIneaConnection,
    createIneaMtr
} = ineaFunctions;

export const {
    manageUserPermissions,
    getVisibleUsers
} = userFunctions;