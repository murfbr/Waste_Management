// functions/src/core/config.ts
import { setGlobalOptions } from "firebase-functions/v2";
import { logger } from "firebase-functions";

logger.info("[DEBUG] Carregando arquivo de configuração: config.ts");

setGlobalOptions({
    region: "southamerica-east1",
});

const corsPolicy = [
    "http://localhost:5173",
    "https://ctrlwaste-aprovacao.vercel.app",
    "https://www.ctrlwaste.com.br"
];

export const functionOptions = {
    cors: corsPolicy,
    timeoutSeconds: 30,
    memory: "256MiB" as const,
    // A propriedade 'secrets' foi removida, pois acessaremos o Secret Manager diretamente.
};

logger.info("[DEBUG] Opções de função configuradas (sem secrets injetados):", functionOptions);