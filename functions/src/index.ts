// functions/src/index.ts


// Importa os arquivos de configuração primeiro para garantir a inicialização.
import "./core/admin";
import "./core/config";

// Importa todas as funções de seus respectivos handlers.
import * as ineaFunctions from "./handlers/inea";
import * as userFunctions from "./handlers/users";
// --- LINHA QUE FALTAVA ---
import * as dashboardFunctions from "./handlers/dashboard"; 

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

// --- BLOCO DE CÓDIGO QUE FALTAVA ---
export const {
    generateMonthlySummariesScheduled,
    generateMonthlySummaryOnDemand
} = dashboardFunctions;