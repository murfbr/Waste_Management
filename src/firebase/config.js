// src/firebase/config.js

// Suas credenciais Firebase fornecidas:
// Estas credenciais são essenciais para o aplicativo se conectar ao seu projeto Firebase.
const firebaseConfig = {
    apiKey: "AIzaSyDwWSa_wZPieFpSU4CQNrP09h1TGVe6YvU",
    authDomain: "controleresiduoshotel.firebaseapp.com",
    projectId: "controleresiduoshotel",
    storageBucket: "controleresiduoshotel.firebasestorage.app",
    messagingSenderId: "878082699301",
    appId: "1:878082699301:web:2c34692d62577612240fcc"
};

// Variáveis globais fornecidas pelo ambiente Canvas (onde o app está rodando).
// `__app_id`: ID único do seu aplicativo no ambiente Canvas.
// `__initial_auth_token`: Token de autenticação inicial para o usuário no ambiente Canvas.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Exporta as configurações e variáveis de ambiente para serem usadas em outros arquivos.
export { firebaseConfig, appId, initialAuthToken };