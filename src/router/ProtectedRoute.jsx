// src/router/ProtectedRoute.jsx

import React, { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

/**
 * Protege rotas baseadas no estado de autenticação e no perfil ('role') do usuário.
 * @param {object} props
 * @param {Array<string>} props.allowedRoles - Perfis que podem acessar a rota.
 * @param {React.ReactNode} [props.children] - Componente filho a ser renderizado se a rota for direta.
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { userProfile, currentUser, loadingAuth, isAuthReady } = useContext(AuthContext);
  const location = useLocation();

  // 1. Aguarda a verificação inicial de autenticação
  if (loadingAuth || !isAuthReady) {
    return <div className="flex justify-center items-center min-h-screen">A verificar autenticação...</div>;
  }

  // 2. Se não houver usuário, redireciona para a página de login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Aguarda o carregamento do perfil do usuário
  if (!userProfile) {
    return <div className="flex justify-center items-center min-h-screen">A carregar dados do perfil...</div>;
  }

  // 4. Verifica se o perfil do usuário tem a permissão necessária
  const hasPermission = allowedRoles && userProfile.role && allowedRoles.includes(userProfile.role);

  if (!hasPermission) {
    console.warn(`ProtectedRoute: Acesso negado para o usuário com role "${userProfile.role}" à rota ${location.pathname}`);
    return <Navigate to="/acesso-negado" state={{ from: location }} replace />;
  }

  // 5. Se tudo estiver correto, renderiza a rota (seja um componente filho ou um <Outlet> para rotas aninhadas)
  return children ? children : <Outlet />;
}