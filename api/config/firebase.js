// api/config/firebase.js
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
// CORREÇÃO: Usando o módulo 'fs' para uma leitura de arquivo mais robusta
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let serviceAccount;

const vercelEnv = process.env.VERCEL_ENV;

if (vercelEnv === 'production') {
  // AMBIENTE DE PRODUÇÃO (Branch: main)
  console.log('[Firebase] Inicializando em modo de PRODUÇÃO.');
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_PROD) {
    throw new Error('Variável de ambiente FIREBASE_SERVICE_ACCOUNT_PROD não definida no projeto Vercel de produção.');
  }
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_PROD);

} else if (vercelEnv === 'preview') {
  // AMBIENTE DE DESENVOLVIMENTO/APROVAÇÃO NA VERCEL (Branch: aprovacao)
  console.log('[Firebase] Inicializando em modo de PREVIEW (Desenvolvimento/Aprovação).');
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_DEV) {
    throw new Error('Variável de ambiente FIREBASE_SERVICE_ACCOUNT_DEV não definida no projeto Vercel de desenvolvimento.');
  }
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_DEV);

} else {
  // AMBIENTE LOCAL (sua máquina)
  console.log('[Firebase] Inicializando em modo LOCAL.');
  try {
    // CORREÇÃO: Lendo o arquivo JSON de forma síncrona com 'fs'
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const serviceAccountPath = path.join(__dirname, 'serviceAccountKey_dev.json');
    const serviceAccountFile = fs.readFileSync(serviceAccountPath, 'utf8');
    serviceAccount = JSON.parse(serviceAccountFile);
  } catch (error) {
    console.error('ERRO: Não foi possível carregar o arquivo de chave local `serviceAccountKey_dev.json`. Verifique se o arquivo existe em `api/config`.');
    throw error;
  }
}

// Inicializa o app do Firebase apenas uma vez para evitar erros
let app;
try {
  app = initializeApp({
    credential: cert(serviceAccount)
  });
} catch (error) {
  if (error.code !== 'app/duplicate-app') {
    throw error;
  }
  console.warn('[Firebase] App já inicializado. Reutilizando instância existente.');
}

const db = getFirestore();

db.settings({
  ignoreUndefinedProperties: true,
});

export { db };

