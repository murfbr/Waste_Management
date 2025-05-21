// src/main.jsx (ou src/main.js)

import React from 'react';
import ReactDOM from 'react-dom/client'; // Importe de 'react-dom/client' para React 18+
import App from './App.jsx'; // Importa o componente principal App. Certifique-se da extensão (.jsx ou .js)

// Importa o arquivo CSS principal do seu projeto.
// O Vite processará este import e incluirá os estilos na sua aplicação.
import './styles/main.css';

// Cria a raiz do React para o seu aplicativo na div com id 'root' no index.html.
// Esta é a forma moderna de inicializar aplicativos React a partir da versão 18.
const root = ReactDOM.createRoot(document.getElementById('root'));

// Renderiza o componente App dentro da raiz.
// <React.StrictMode> ajuda a identificar problemas potenciais no aplicativo durante o desenvolvimento.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);