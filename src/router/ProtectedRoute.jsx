// src/router/ProtectedRoute.jsx

import React, { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom'; // Adicionado useLocation
import AuthContext from '../context/AuthContext';

/**
 * Componente para proteger rotas baseadas nos roles do utilizador.
 * @param {object} props
 * @param {Array<string>} props.allowedRoles - Array de strings com os roles permitidos para aceder à rota.
 * @param {React.ReactNode} [props.children] - Usado se este componente envolver um único elemento filho diretamente.
 * Para rotas de layout com múltiplas sub-rotas (usando <Outlet />), não passe children.
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { userProfile, currentUser, loadingAuth, isAuthReady } = useContext(AuthContext);
  const location = useLocation(); // Para guardar a localização atual antes de redirecionar para login

  // Se ainda está a carregar o estado de autenticação ou o perfil, mostra um loader.
  // isAuthReady fica true depois que o onAuthStateChanged executa pela primeira vez.
  if (loadingAuth || !isAuthReady) {
    return <div className="flex justify-center items-center min-h-screen">A verificar autenticação...</div>;
  }

  // Se terminou de verificar a autenticação e não há utilizador, redireciona para login.
  if (!currentUser) {
    // Passa a localização atual para que possa ser redirecionado de volta após o login.
    // O componente Login precisará de ler este estado e redirecionar.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se o utilizador está logado, mas o perfil ainda não carregou
  // (pode acontecer brevemente ou se houver um erro no carregamento do perfil)
  if (!userProfile) {
    // Este estado idealmente não deveria persistir. Se persistir, indica um problema no AuthContext ao carregar o perfil.
    // Considerar mostrar uma mensagem de erro específica ou um loader diferente.
    console.warn("ProtectedRoute: Utilizador logado, mas perfil não disponível.");
    return <div className="flex justify-center items-center min-h-screen">A carregar dados do perfil...</div>;
  }

  // Verifica se o role do utilizador está entre os roles permitidos
  const hasPermission = allowedRoles && userProfile.role && allowedRoles.includes(userProfile.role);

  if (!hasPermission) {
    // Utilizador logado, mas não tem o role necessário.
    console.warn(`ProtectedRoute: Acesso negado para ${currentUser.uid} com role "${userProfile.role}". Roles permitidos: ${allowedRoles.join(', ')} para a rota ${location.pathname}`);
    // Redireciona para uma página de acesso negado.
    return <Navigate to="/acesso-negado" state={{ from: location }} replace />;
  }

  // Se o utilizador tem permissão, renderiza o conteúdo da rota.
  // Se 'children' for passado (para proteger um único componente), renderiza 'children'.
  // Caso contrário (para rotas de layout aninhadas), renderiza <Outlet />.
  return children ? children : <Outlet />;
}
