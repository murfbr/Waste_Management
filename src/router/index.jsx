// src/router/index.jsx

import React, { useContext } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

// Layouts
import MainLayout from '../layouts/MainLayout'; // Criaremos este em breve

// Componentes de Página
import Login from '../components/Login'; // Já existente
import PaginaLancamento from '../pages/PaginaLancamento'; // Placeholder ou a ser criado
import PaginaDashboard from '../pages/PaginaDashboard';   // Placeholder ou a ser criado
import PaginaAdminUsuarios from '../pages/PaginaAdminUsuarios'; // Arquivo criado pelo usuário
import PaginaAdminHoteis from '../pages/PaginaAdminHoteis';   // Arquivo criado pelo usuário
import PaginaNotFound from '../pages/PaginaNotFound';       // Arquivo criado pelo usuário

/**
 * Componente para agrupar rotas que exigem autenticação e usam o MainLayout.
 * Se o usuário não estiver autenticado, ele é redirecionado para /login.
 * Se estiver autenticado, o MainLayout é renderizado, e o <Outlet /> dentro dele
 * renderizará o componente da rota filha correspondente (ex: PaginaLancamento).
 */
const PrivateRoutesLayout = () => {
  const { currentUser, loadingAuth } = useContext(AuthContext);

  if (loadingAuth) {
    // Enquanto o estado de autenticação está carregando, pode-se mostrar um loader global
    // ou null para evitar renderização prematura.
    return <div className="flex justify-center items-center min-h-screen">Carregando autenticação...</div>;
  }

  // Se não estiver carregando e não houver usuário, redireciona para login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Se o usuário estiver autenticado, renderiza o MainLayout que conterá as rotas filhas
  return (
    <MainLayout>
      <Outlet /> {/* As rotas filhas (PaginaLancamento, etc.) serão renderizadas aqui */}
    </MainLayout>
  );
};

export default function AppRoutes() {
  return (
    <Routes>
      {/* Rota para a página de Login */}
      <Route path="/login" element={<Login />} />

      {/* Rotas privadas que usam o MainLayout e exigem autenticação */}
      <Route element={<PrivateRoutesLayout />}>
        {/* A rota padrão ("/") quando logado pode ser o lançamento ou dashboard */}
        <Route index element={<Navigate to="/lancamento" replace />} /> {/* Redireciona / para /lancamento */}
        <Route path="lancamento" element={<PaginaLancamento />} />
        <Route path="dashboard" element={<PaginaDashboard />} />
        <Route path="admin/usuarios" element={<PaginaAdminUsuarios />} />
        <Route path="admin/hoteis" element={<PaginaAdminHoteis />} /> {/* Nova rota adicionada */}
      </Route>

      {/* Rota para página não encontrada (404) */}
      <Route path="*" element={<PaginaNotFound />} /> {/* Rota atualizada */}
    </Routes>
  );
}
