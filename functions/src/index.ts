// functions/src/index.ts

// Importa os arquivos de configuração primeiro para garantir a inicialização.
import "./core/admin";
import "./core/config";

// Importa todas as funções de seus respectivos handlers.
import * as ineaFunctions from "./handlers/inea";
import * as userFunctions from "./handlers/users";
import * as dashboardFunctions from "./handlers/dashboard";
import * as aggregationFunctions from "./handlers/aggregations"; // <- 1. IMPORTA O NOVO HANDLER
import * as backfillFunctions from "./handlers/backfill";

// Exporta as funções para que o Firebase possa encontrá-las e implantá-las.
export const {
    checkConfig,
    saveIneaCredentials,
    testIneaConnection,
    createIneaMtr,
    getIneaPassword
} = ineaFunctions;

export const {
    manageUserPermissions,
    getVisibleUsers
} = userFunctions;

export const {
    generateMonthlySummariesScheduled,
    generateMonthlySummaryOnDemand
} = dashboardFunctions;

// v- 2. EXPORTA AS NOVAS FUNÇÕES DE AGREGAÇÃO - v
export const {
    onWasteRecordCreated,
    onWasteRecordUpdated,
    onWasteRecordDeleted
} = aggregationFunctions;

export const {
    backfillMonthlyOnDemand,
    backfillDailyOnDemand
} = backfillFunctions;

