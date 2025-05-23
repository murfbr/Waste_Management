// src/router/ProtectedRoute.jsx

import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

/**
 * Componente para proteger rotas baseadas nos roles do utilizador.
 * @param {object} props
 * @param {Array<string>} props.allowedRoles - Array de strings com os roles permitidos para aceder à rota.
 * @param {React.ReactNode} [props.children] - Usado se este componente envolver um único elemento filho diretamente.
                                                Para rotas de layout com múltiplas sub-rotas, o <Outlet /> é preferível.
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { userProfile, currentUser, loadingAuth } = useContext(AuthContext);

  if (loadingAuth) {
    // Enquanto o estado de autenticação e perfil estão a carregar
    return <div className="flex justify-center items-center min-h-screen">A verificar permissões...</div>;
  }

  if (!currentUser) {
    // Utilizador não está logado, redireciona para a página de login
    // Passa a localização atual para que possa ser redirecionado de volta após o login (opcional)
    return <Navigate to="/login" replace />;
  }

  if (!userProfile) {
    // Perfil ainda não carregou, mas o utilizador está logado (pode acontecer brevemente)
    // Poderia mostrar um loader específico ou aguardar. Por simplicidade, pode-se tratar como "a verificar".
    // Ou, se isto persistir, pode ser um problema no carregamento do perfil.
    return <div className="flex justify-center items-center min-h-screen">A carregar perfil para verificação...</div>;
  }

  // Verifica se o role do utilizador está entre os roles permitidos
  const hasPermission = allowedRoles && allowedRoles.includes(userProfile.role);

  if (!hasPermission) {
    // Utilizador logado, mas não tem o role necessário.
    // Redireciona para uma página de acesso negado ou mostra uma mensagem.
    // Por enquanto, vamos redirecionar para uma rota que podemos criar depois: /acesso-negado
    // Ou, para simplificar, pode redirecionar para a página inicial ou mostrar uma mensagem inline.
    console.warn(`Acesso negado para o utilizador ${currentUser.uid} com role "${userProfile.role}". Roles permitidos: ${allowedRoles.join(', ')}`);
    return <Navigate to="/acesso-negado" replace />; // Certifique-se de ter uma rota para /acesso-negado
    // Alternativa: return <div>Acesso Negado: Você não tem permissão para ver esta página.</div>;
  }

  // Se o utilizador tem permissão, renderiza o conteúdo da rota.
  // Se 'children' for passado, renderiza 'children'. Caso contrário, renderiza <Outlet />.
  // <Outlet /> é usado quando ProtectedRoute envolve outras definições de <Route> (rotas aninhadas).
  return children ? children : <Outlet />;
}
