// src/router/index.jsx

import React, { useContext } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

// Layouts
import MainLayout from '../layouts/MainLayout';

// Componentes de Página
import Login from '../components/Login';
import PaginaLancamento from '../pages/PaginaLancamento';
import PaginaDashboard from '../pages/PaginaDashboard';
import PaginaAdminUsuarios from '../pages/PaginaAdminUsuarios';
import PaginaAdminClientes from '../pages/PaginaAdminClientes.jsx';
import PaginaAdminEmpresasColeta from '../pages/PaginaAdminEmpresasColeta'; // Importação que faltava
import PaginaNotFound from '../pages/PaginaNotFound';
import PaginaAcessoNegado from '../pages/PaginaAcessoNegado'; // Importação que faltava

/**
 * Componente para agrupar rotas que exigem autenticação e usam o MainLayout.
 */
const PrivateRoutesLayout = () => {
  const { currentUser, loadingAuth } = useContext(AuthContext);

  if (loadingAuth) {
    return <div className="flex justify-center items-center min-h-screen">A carregar autenticação...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};

// Se você já implementou o ProtectedRoute.jsx, pode usá-lo aqui.
// Por agora, as rotas de admin estão apenas dentro do PrivateRoutesLayout.
// import ProtectedRoute from './ProtectedRoute'; 

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/acesso-negado" element={<PaginaAcessoNegado />} /> {/* Rota para acesso negado */}

      {/* Rotas privadas que usam o MainLayout e exigem autenticação */}
      <Route element={<PrivateRoutesLayout />}>
        <Route index element={<Navigate to="/lancamento" replace />} />
        <Route path="lancamento" element={<PaginaLancamento />} />
        <Route path="dashboard" element={<PaginaDashboard />} />
        
        {/* Para usar o ProtectedRoute (exemplo):
        <Route element={<ProtectedRoute allowedRoles={['master']} />}>
            <Route path="admin/usuarios" element={<PaginaAdminUsuarios />} />
            <Route path="admin/hoteis" element={<PaginaAdminHoteis />} />
            <Route path="admin/empresas-coleta" element={<PaginaAdminEmpresasColeta />} />
        </Route>
        */}

        {/* Por enquanto, sem o ProtectedRoute explícito, apenas agrupadas: */}
        <Route path="admin/usuarios" element={<PaginaAdminUsuarios />} />
        <Route path="admin/clientes" element={<PaginaAdminClientes />} />
        <Route path="admin/empresas-coleta" element={<PaginaAdminEmpresasColeta />} /> {/* Rota que faltava */}
      </Route>

      <Route path="*" element={<PaginaNotFound />} />
    </Routes>
  );
}
