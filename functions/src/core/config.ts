// functions/src/core/config.ts
import { setGlobalOptions } from "firebase-functions/v2";

setGlobalOptions({
    region: "southamerica-east1",
});

const corsPolicy = [
    "http://localhost:5173", // Para desenvolvimento local
    "https://ctrlwaste-aprovacao.vercel.app", // Ambiente de aprovação
    "https://www.ctrlwaste.com.br" // Ambiente de produção
];

export const functionOptions = {
    cors: corsPolicy,
    timeoutSeconds: 30, // Aumenta o timeout para 30 segundos
    memory: "256MiB" as const, // Aloca um pouco mais de memória
};