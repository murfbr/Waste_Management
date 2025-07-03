// src/firebase/init.js

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { firebaseConfig } from './config';

// Inicializa o aplicativo Firebase
const app = initializeApp(firebaseConfig);

// Obtém as instâncias dos serviços
const db = getFirestore(app);
const auth = getAuth(app);
// Adicionamos a inicialização do serviço de Functions, especificando a região
const functions = getFunctions(app, 'southamerica-east1');

// Conecta aos emuladores se estiver em modo de desenvolvimento
if (import.meta.env.DEV) {
  try {
    console.log("Modo de desenvolvimento. Conectando aos emuladores...");
    connectAuthEmulator(auth, 'http://127.0.0.1:9099');
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    console.log("Conexão com os emuladores estabelecida!");
  } catch (error) {
    console.error("Erro ao conectar aos emuladores:", error);
  }
}

// Exporta todas as instâncias para serem usadas na aplicação
export { app, db, auth, functions };