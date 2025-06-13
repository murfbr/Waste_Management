// src/router/index.jsx

import React, { useContext, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

// Layouts
import MainLayout from '../layouts/MainLayout';
import PublicLayout from '../layouts/PublicLayout';

// --- Páginas ---
// Páginas de transição e site (carregadas normalmente)
import PaginaLogin from '../pages/PaginaLogin';
import HomePage from '../pages/site/HomePage';
import PaginaProduto from '../pages/site/PaginaProduto'; // Importação da nova página
import PaginaSobre from '../pages/site/PaginaSobre';     // Importação da nova página
import PaginaContato from '../pages/site/PaginaContato'; // Importação da nova página
import PaginaNotFound from '../pages/PaginaNotFound';
import PaginaAcessoNegado from '../pages/PaginaAcessoNegado';


// Páginas da Aplicação (Lazy-loaded)
const PaginaLancamento = React.lazy(() => import('../pages/app/PaginaLancamento'));
const PaginaDashboard = React.lazy(() => import('../pages/app/PaginaDashboard'));
const PaginaAdminUsuarios = React.lazy(() => import('../pages/app/PaginaAdminUsuarios'));
const PaginaAdminClientes = React.lazy(() => import('../pages/app/PaginaAdminClientes'));
const PaginaAdminEmpresasColeta = React.lazy(() => import('../pages/app/PaginaAdminEmpresasColeta'));


// --- Layouts de Rota ---
const PrivateRoutesLayout = () => {
  const { currentUser, isAuthReady } = useContext(AuthContext);
  if (!isAuthReady) return <div className="flex justify-center items-center min-h-screen">A carregar aplicação...</div>;
  if (!currentUser) return <Navigate to="/login" replace />;
  return (<MainLayout><Outlet /></MainLayout>);
};

const PageLoader = () => (
  <div className="flex justify-center items-center min-h-screen bg-gray-100">
    <p className="text-lg text-gray-600">A carregar...</p>
  </div>
);


// --- Componente Principal de Rotas ---
export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* GRUPO DE ROTAS PÚBLICAS (SITE) */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/produto" element={<PaginaProduto />} />
          <Route path="/sobre" element={<PaginaSobre />} />
          <Route path="/contato" element={<PaginaContato />} />
        </Route>

        {/* ROTAS DE TRANSIÇÃO (sem layout principal) */}
        <Route path="/login" element={<PaginaLogin />} />
        <Route path="/acesso-negado" element={<PaginaAcessoNegado />} />

        {/* GRUPO DE ROTAS PRIVADAS (APLICAÇÃO) */}
        <Route path="/app" element={<PrivateRoutesLayout />}>
          <Route index element={<Navigate to="/app/lancamento" replace />} />
          <Route path="lancamento" element={<ProtectedRoute allowedRoles={['master', 'gerente', 'operacional']}><PaginaLancamento /></ProtectedRoute>} />
          <Route path="dashboard" element={<ProtectedRoute allowedRoles={['master', 'gerente']}><PaginaDashboard /></ProtectedRoute>} />
          <Route path="admin" element={<ProtectedRoute allowedRoles={['master']}><Outlet /></ProtectedRoute>}>
            <Route path="usuarios" element={<PaginaAdminUsuarios />} />
            <Route path="clientes" element={<PaginaAdminClientes />} />
            <Route path="empresas-coleta" element={<PaginaAdminEmpresasColeta />} />
          </Route>
        </Route>

        <Route path="*" element={<PaginaNotFound />} />
      </Routes>
    </Suspense>
  );
}
