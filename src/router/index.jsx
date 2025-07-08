// src/router/index.jsx

import React, { useContext, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

// Layouts
import MainLayout from '../layouts/MainLayout';
import PublicLayout from '../layouts/PublicLayout';

// --- Páginas ---
// CORREÇÃO: Caminhos ajustados para a pasta /pages/site/
import PaginaLogin from '../pages/PaginaLogin';
import HomePage from '../pages/site/HomePage';
import PaginaProduto from '../pages/site/PaginaProduto';
import PaginaSobre from '../pages/site/PaginaSobre';
import PaginaContato from '../pages/site/PaginaContato';
import PaginaNotFound from '../pages/PaginaNotFound';
import PaginaAcessoNegado from '../pages/PaginaAcessoNegado';


// Páginas da Aplicação (Lazy-loaded)
const PaginaLancamento = React.lazy(() => import('../pages/app/PaginaLancamento'));
const PaginaDashboard = React.lazy(() => import('../pages/app/PaginaDashboard'));
const PaginaAdminUsuarios = React.lazy(() => import('../pages/app/PaginaAdminUsuarios'));
const PaginaAdminClientes = React.lazy(() => import('../pages/app/PaginaAdminClientes'));
const PaginaAdminEmpresasColeta = React.lazy(() => import('../pages/app/PaginaAdminEmpresasColeta'));
const PaginaDocumentacao = React.lazy(() => import('../pages/app/PaginaDocumentacao'));
const PaginaEconomiaCircular = React.lazy(() => import('../pages/app/PaginaEconomiaCircular'));
const PaginaGlossario = React.lazy(() => import('../pages/app/PaginaGlossario'));


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
        {/* ROTAS PÚBLICAS (SITE) */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/produto" element={<PaginaProduto />} />
          <Route path="/sobre" element={<PaginaSobre />} />
          <Route path="/contato" element={<PaginaContato />} />
          <Route path="/login" element={<PaginaLogin />} />
        </Route>

        {/* ROTAS DE TRANSIÇÃO */}
        <Route path="/acesso-negado" element={<PaginaAcessoNegado />} />

        {/* ROTAS PRIVADAS (APLICAÇÃO) */}
        <Route path="/app" element={<PrivateRoutesLayout />}>
          
          <Route index element={ <ProtectedRoute allowedRoles={['master', 'gerente', 'operacional']}><PaginaLancamento /></ProtectedRoute> } />
          <Route path="lancamento" element={ <ProtectedRoute allowedRoles={['master', 'gerente', 'operacional']}><PaginaLancamento /></ProtectedRoute> } />
          <Route path="dashboard" element={ <ProtectedRoute allowedRoles={['master', 'gerente']}><PaginaDashboard /></ProtectedRoute> } />
          
          {/* NOVAS ROTAS INFORMATIVAS */}
          <Route path="documentacao" element={ <ProtectedRoute allowedRoles={['master', 'gerente']}><PaginaDocumentacao /></ProtectedRoute> } />
          <Route path="economia-circular" element={ <ProtectedRoute allowedRoles={['master', 'gerente']}><PaginaEconomiaCircular /></ProtectedRoute> } />
          <Route path="glossario" element={ <ProtectedRoute allowedRoles={['master', 'gerente']}><PaginaGlossario /></ProtectedRoute> } />

          {/* Rotas de Administração */}
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