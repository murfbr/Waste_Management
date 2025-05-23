// src/main.jsx (ou src/main.js)
// src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Seu componente App principal
import { BrowserRouter } from 'react-router-dom'; // Importa o BrowserRouter
import './styles/main.css'; // Seus estilos globais

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Envolve o componente App com BrowserRouter */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
