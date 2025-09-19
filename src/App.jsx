// src/App.jsx

import React from 'react';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './router';
import { Analytics } from '@vercel/analytics/react';

export default function App() {
  return (

    <AuthProvider>
      {/* AppRoutes será o componente que define todas as rotas da aplicação */}
      <AppRoutes />

      {/* 2. ADICIONE O COMPONENTE DE ANALYTICS AQUI*/}
      <Analytics />
    </AuthProvider>
  );
}