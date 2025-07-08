// src/firebase/init.js

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { firebaseConfig } from './config';

// Inicializa o aplicativo Firebase
const app = initializeApp(firebaseConfig);

// Obtém as instâncias dos serviços
const db = getFirestore(app);
const auth = getAuth(app);
// Adicionamos a inicialização do serviço de Functions, especificando a região
const functions = getFunctions(app, 'southamerica-east1');


// Exporta todas as instâncias para serem usadas na aplicação
export { app, db, auth, functions };
