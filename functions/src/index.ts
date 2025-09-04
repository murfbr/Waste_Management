// functions/src/index.ts

// Importa os arquivos de configuração primeiro para garantir a inicialização.
import "./core/admin";
import "./core/config";

// Importa todas as funções de seus respectivos handlers.
import * as ineaFunctions from "./handlers/inea";
import * as userFunctions from "./handlers/users";
import * as dashboardFunctions from "./handlers/dashboard"; 

// Exporta as funções para que o Firebase possa encontrá-las e implantá-las.
export const {
    checkConfig,
    saveIneaCredentials,
    testIneaConnection,
    createIneaMtr,
    getIneaPassword // A NOVA FUNÇÃO ADICIONADA AQUI
} = ineaFunctions;

export const {
    manageUserPermissions,
    getVisibleUsers
} = userFunctions;

export const {
    generateMonthlySummariesScheduled,
    generateMonthlySummaryOnDemand
} = dashboardFunctions;