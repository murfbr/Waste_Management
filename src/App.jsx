// src/App.jsx

import React from 'react';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './router'; // Importaremos nosso novo componente de configuração de rotas

// Componente principal do aplicativo React
export default function App() {
  // Renderiza o componente principal do aplicativo
  return (
    // AuthProvider envolve todo o aplicativo para fornecer o contexto de autenticação.
    // Ele deve vir ANTES do AppRoutes para que o contexto esteja disponível para todas as rotas e páginas.
    <AuthProvider>
      {/* AppRoutes será o componente que define todas as rotas da aplicação */}
      <AppRoutes />
    </AuthProvider>
  );
}
