// src/firebase/config.js

// Suas credenciais Firebase fornecidas:
const firebaseConfig = {
    apiKey: "AIzaSyDwWSa_wZPieFpSU4CQNrP09h1TGVe6YvU", // Mantenha suas credenciais reais
    authDomain: "controleresiduoshotel.firebaseapp.com",
    projectId: "controleresiduoshotel",
    storageBucket: "controleresiduoshotel.firebasestorage.app",
    messagingSenderId: "878082699301",
    appId: "1:878082699301:web:2c34692d62577612240fcc" // Este é o Measurement ID, não o que usamos para o caminho
};

// Variáveis globais fornecidas pelo ambiente Canvas (onde o app está rodando).
// const __app_id_canvas = typeof __app_id !== 'undefined' ? __app_id : null; // Você pode manter isso se precisar do __app_id para outras finalidades

// ATENÇÃO: Modificado para usar 'default-app-id' consistentemente para o caminho dos perfis de usuário.
// Se os seus perfis de usuário no Firestore estão SEMPRE sob 'artifacts/default-app-id/users/',
// então 'appId' deve ser 'default-app-id'.
const appId = 'default-app-id';

// Exporta as configurações e o appId modificado.
export { firebaseConfig, appId };