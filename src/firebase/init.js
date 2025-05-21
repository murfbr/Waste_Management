// src/firebase/init.js

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config'; // Importa as configurações do Firebase

// Inicializa o aplicativo Firebase com as configurações fornecidas.
const app = initializeApp(firebaseConfig);

// Obtém e exporta a instância do Firestore (banco de dados).
const db = getFirestore(app);

// Obtém e exporta a instância do serviço de autenticação.
const auth = getAuth(app);

// Exporta as instâncias inicializadas do Firebase para serem usadas em outros componentes.
export { app, db, auth };