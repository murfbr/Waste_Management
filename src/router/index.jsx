// src/router/index.jsx

import React, { useContext, Suspense } from 'react'; // Adicionado Suspense
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

// Layouts
import MainLayout from '../layouts/MainLayout';

// Componentes de Página
import Login from '../components/Login';
// PaginaLancamento é importada normalmente, pois é a principal e não será lazy-loaded
import PaginaLancamento from '../pages/PaginaLancamento';
import PaginaNotFound from '../pages/PaginaNotFound';
import PaginaAcessoNegado from '../pages/PaginaAcessoNegado';

// Páginas que serão carregadas com React.lazy
const PaginaDashboard = React.lazy(() => import('../pages/PaginaDashboard'));
const PaginaAdminUsuarios = React.lazy(() => import('../pages/PaginaAdminUsuarios'));
const PaginaAdminClientes = React.lazy(() => import('../pages/PaginaAdminClientes'));
const PaginaAdminEmpresasColeta = React.lazy(() => import('../pages/PaginaAdminEmpresasColeta'));


/**
 * Componente para agrupar rotas que exigem autenticação e usam o MainLayout.
 */
const PrivateRoutesLayout = () => {
  const { currentUser, loadingAuth, isAuthReady } = useContext(AuthContext);

  if (!isAuthReady) {
    return <div className="flex justify-center items-center min-h-screen">A carregar aplicação...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <MainLayout>
      <Outlet /> {/* O Outlet renderizará os componentes filhos da rota */}
    </MainLayout>
  );
};

// Componente de Fallback simples para o Suspense
const PageLoader = () => (
  <div className="flex justify-center items-center min-h-screen bg-gray-100">
    <p className="text-lg text-gray-600">A carregar página...</p>
    {/* Você pode adicionar um spinner aqui se desejar */}
  </div>
);

export default function AppRoutes() {
  return (
    // Suspense envolve todas as rotas que podem conter componentes lazy-loaded
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/acesso-negado" element={<PaginaAcessoNegado />} />

        {/* Rotas Privadas com MainLayout */}
        <Route element={<PrivateRoutesLayout />}>
          {/* Rota inicial padrão após login */}
          <Route index element={<Navigate to="/lancamento" replace />} />

          <Route
            path="lancamento"
            element={
              <ProtectedRoute allowedRoles={['master', 'gerente', 'operacional']}>
                <PaginaLancamento /> {/* Carregada normalmente */}
              </ProtectedRoute>
            }
          />

          <Route
            path="dashboard"
            element={
              <ProtectedRoute allowedRoles={['master', 'gerente']}>
                <PaginaDashboard /> {/* Carregada com React.lazy */}
              </ProtectedRoute>
            }
          />

          {/* Rotas de Administração (Master) */}
          <Route element={<ProtectedRoute allowedRoles={['master']} />}>
            <Route path="admin/usuarios" element={<PaginaAdminUsuarios />} /> {/* Lazy */}
            <Route path="admin/clientes" element={<PaginaAdminClientes />} /> {/* Lazy */}
            <Route path="admin/empresas-coleta" element={<PaginaAdminEmpresasColeta />} /> {/* Lazy */}
          </Route>
        </Route>

        <Route path="*" element={<PaginaNotFound />} />
      </Routes>
    </Suspense>
  );
}
