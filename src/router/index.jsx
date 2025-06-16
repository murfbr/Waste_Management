// src/router/index.jsx

import React, { useContext, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

// Layouts
import MainLayout from '../layouts/MainLayout';
import PublicLayout from '../layouts/PublicLayout';

// Páginas do Site e de Transição
import PaginaLogin from '../pages/PaginaLogin';
import HomePage from '../pages/site/HomePage';
import PaginaProduto from '../pages/site/PaginaProduto';
import PaginaSobre from '../pages/site/PaginaSobre';
import PaginaContato from '../pages/site/PaginaContato';
import PaginaNotFound from '../pages/PaginaNotFound';
import PaginaAcessoNegado from '../pages/PaginaAcessoNegado';


// Páginas da Aplicação (Carregadas sob demanda com "lazy loading")
const PaginaLancamento = React.lazy(() => import('../pages/app/PaginaLancamento'));
const PaginaDashboard = React.lazy(() => import('../pages/app/PaginaDashboard'));
const PaginaAdminUsuarios = React.lazy(() => import('../pages/app/PaginaAdminUsuarios'));
const PaginaAdminClientes = React.lazy(() => import('../pages/app/PaginaAdminClientes'));
const PaginaAdminEmpresasColeta = React.lazy(() => import('../pages/app/PaginaAdminEmpresasColeta'));


// Layout para Rotas Privadas
const PrivateRoutesLayout = () => {
  const { currentUser, isAuthReady } = useContext(AuthContext);
  if (!isAuthReady) return <div className="flex justify-center items-center min-h-screen">A carregar aplicação...</div>;
  if (!currentUser) return <Navigate to="/login" replace />;
  return (<MainLayout><Outlet /></MainLayout>);
};

// Componente para exibir enquanto as páginas "lazy" carregam
const PageLoader = () => (
  <div className="flex justify-center items-center min-h-screen bg-gray-100">
    <p className="text-lg text-gray-600">A carregar...</p>
  </div>
);


// Estrutura Principal de Rotas
export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ROTAS PÚBLICAS: Usam o layout do site (Navbar/Footer) */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/produto" element={<PaginaProduto />} />
          <Route path="/sobre" element={<PaginaSobre />} />
          <Route path="/contato" element={<PaginaContato />} />
          <Route path="/login" element={<PaginaLogin />} />
        </Route>

        {/* ROTA DE ACESSO NEGADO: Sem layout principal */}
        <Route path="/acesso-negado" element={<PaginaAcessoNegado />} />

        {/* ROTAS PRIVADAS (APLICAÇÃO): Usam o layout da aplicação e são protegidas */}
        <Route path="/app" element={<PrivateRoutesLayout />}>
          
          {/* Rota principal da aplicação (quando o usuário acessa /app) */}
          <Route 
            index 
            element={
              <ProtectedRoute allowedRoles={['master', 'gerente', 'operacional']}>
                <PaginaLancamento />
              </ProtectedRoute>
            } 
          />

          {/* Rota explícita para lançamento */}
          <Route
            path="lancamento"
            element={
              <ProtectedRoute allowedRoles={['master', 'gerente', 'operacional']}>
                <PaginaLancamento />
              </ProtectedRoute>
            }
          />

          {/* Outras rotas da aplicação */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute allowedRoles={['master', 'gerente']}>
                <PaginaDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="admin" element={<ProtectedRoute allowedRoles={['master']}><Outlet /></ProtectedRoute>}>
            <Route path="usuarios" element={<PaginaAdminUsuarios />} />
            <Route path="clientes" element={<PaginaAdminClientes />} />
            <Route path="empresas-coleta" element={<PaginaAdminEmpresasColeta />} />
          </Route>
        </Route>

        {/* Rota "Catch-all" para páginas não encontradas */}
        <Route path="*" element={<PaginaNotFound />} />
      </Routes>
    </Suspense>
  );
}
