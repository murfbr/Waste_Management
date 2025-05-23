// src/firebase/config.js

// Lê as credenciais do Firebase das variáveis de ambiente (prefixadas com VITE_)
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID 
    // Nota: O 'appId' aqui é o Measurement ID do Firebase, diferente do 'appId' que usamos para o caminho do Firestore.
};

// Variáveis globais fornecidas pelo ambiente Canvas (onde o app está a rodar).
// const __app_id_canvas = typeof __app_id !== 'undefined' ? __app_id : null;

// ATENÇÃO: Mantido para usar 'default-app-id' consistentemente para o caminho dos perfis de utilizador no Firestore.
// Este 'appId' é específico para a estrutura de dados no Firestore e não deve vir do .env se for fixo.
const appId = 'default-app-id'; // Este é o ID da aplicação para o caminho do Firestore, não o Firebase Measurement ID.

// Validação para garantir que as variáveis de ambiente foram carregadas
// (útil durante o desenvolvimento)
if (!firebaseConfig.apiKey) {
    console.error("Firebase API Key não encontrada. Verifique o seu arquivo .env e as variáveis de ambiente.");
    // Poderia lançar um erro ou ter um comportamento de fallback aqui, se apropriado.
}


// Exporta as configurações e o appId específico do Firestore.
export { firebaseConfig, appId };
