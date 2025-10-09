// src/router/index.jsx

import React, { useContext, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthContext from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import RouteChangeTracker from './RouteChangeTracker'; // <-- IMPORTAÇÃO ATUALIZADA

import MainLayout from '../layouts/MainLayout';
import PublicLayout from '../layouts/PublicLayout';

// Páginas públicas
import PaginaLogin from '../pages/PaginaLogin';
import HomePage from '../pages/site/HomePage';
import PaginaProduto from '../pages/site/PaginaProduto';
import PaginaSobre from '../pages/site/PaginaSobre';
import PaginaContato from '../pages/site/PaginaContato';
import PaginaNotFound from '../pages/PaginaNotFound';
import PaginaAcessoNegado from '../pages/PaginaAcessoNegado';

// Páginas privadas
const PaginaLancamento = React.lazy(() => import('../pages/app/PaginaLancamento'));
const PaginaDashboard = React.lazy(() => import('../pages/app/PaginaDashboard'));
const PaginaAdminUsuarios = React.lazy(() => import('../pages/app/PaginaAdminUsuarios'));
const PaginaAdminClientes = React.lazy(() => import('../pages/app/PaginaAdminClientes'));
const PaginaAdminEmpresasColeta = React.lazy(() => import('../pages/app/PaginaAdminEmpresasColeta'));
const PaginaDocumentacao = React.lazy(() => import('../pages/app/PaginaDocumentacao'));
const PaginaEconomiaCircular = React.lazy(() => import('../pages/app/PaginaEconomiaCircular'));
const PaginaGlossario = React.lazy(() => import('../pages/app/PaginaGlossario'));
const PaginaGestaoMTR = React.lazy(() => import('../pages/app/PaginaGestaoMTR'));
const PaginaAdminMaster = React.lazy(() => import('../pages/app/PaginaAdminMaster'));
const PainelSigor = React.lazy(() => import('../pages/app/PainelSigor'));

const PageLoader = () => (
  <div className="flex justify-center items-center min-h-screen bg-gray-100">
    <p className="text-lg text-gray-600">A carregar...</p>
  </div>
);

// Layout privado
const PrivateRoutesLayout = () => {
  const { currentUser, isAuthReady } = useContext(AuthContext);
  if (!isAuthReady) return <PageLoader />;
  if (!currentUser) return <Navigate to="/login" replace />;
  return (<MainLayout><Outlet /></MainLayout>);
};

// Wrapper que ajusta idioma com base na rota
const LanguageWrapper = ({ lang, children }) => {
  const { i18n } = useTranslation();
  if (i18n.language !== lang) {
    i18n.changeLanguage(lang);
  }
  return children;
};

export default function AppRoutes() {
  const location = useLocation();
  const path = location.pathname;

  if (path === '/en') return <Navigate to="/en/" replace />;
  if (path === '/es') return <Navigate to="/es/" replace />;

  return (
    <>
      <RouteChangeTracker /> {/* <-- TRACKER ADICIONADO */}
      <Suspense fallback={<PageLoader />}>
        <Routes>

          {/* ROTAS PÚBLICAS EM PORTUGUÊS (sem prefixo) */}
          <Route element={<LanguageWrapper lang="pt"><PublicLayout /></LanguageWrapper>}>
            <Route path="/" element={<HomePage />} />
            <Route path="/produto" element={<PaginaProduto />} />
            <Route path="/sobre" element={<PaginaSobre />} />
            <Route path="/contato" element={<PaginaContato />} />
            <Route path="/login" element={<PaginaLogin />} />
          </Route>

          {/* ROTAS PÚBLICAS INTERNACIONAIS COM PREFIXO /en e /es */}
          {['en', 'es'].map((lang) => (
            <Route key={lang} path={`/${lang}`} element={<LanguageWrapper lang={lang}><PublicLayout /></LanguageWrapper>}>
              <Route index element={<HomePage />} />
              <Route path="produto" element={<PaginaProduto />} />
              <Route path="sobre" element={<PaginaSobre />} />
              <Route path="contato" element={<PaginaContato />} />
              <Route path="login" element={<PaginaLogin />} />
            </Route>
          ))}
          
          {/* ROTAS PRIVADAS (APP) EM PORTUGUÊS */}
          <Route path="/app" element={<LanguageWrapper lang="pt"><PrivateRoutesLayout /></LanguageWrapper>}>
              <Route index element={<ProtectedRoute allowedRoles={['master', 'gerente', 'operacional']}><PaginaLancamento /></ProtectedRoute>} />
              <Route path="lancamento" element={<ProtectedRoute allowedRoles={['master', 'gerente', 'operacional']}><PaginaLancamento /></ProtectedRoute>} />
              <Route path="dashboard" element={<ProtectedRoute allowedRoles={['master', 'gerente']}><PaginaDashboard /></ProtectedRoute>} />
              <Route path="documentacao" element={<ProtectedRoute allowedRoles={['master', 'gerente']}><PaginaDocumentacao /></ProtectedRoute>} />
              <Route path="economia-circular" element={<ProtectedRoute allowedRoles={['master', 'gerente']}><PaginaEconomiaCircular /></ProtectedRoute>} />
              <Route path="glossario" element={<ProtectedRoute allowedRoles={['master', 'gerente']}><PaginaGlossario /></ProtectedRoute>} />
              <Route path="admin/usuarios" element={<ProtectedRoute allowedRoles={['master', 'gerente']}><PaginaAdminUsuarios /></ProtectedRoute>} />
              <Route path="admin/clientes" element={<ProtectedRoute allowedRoles={['master']}><PaginaAdminClientes /></ProtectedRoute>} />
              <Route path="admin/empresas-coleta" element={<ProtectedRoute allowedRoles={['master']}><PaginaAdminEmpresasColeta /></ProtectedRoute>} />
              <Route path="admin/gestao-mtr" element={<ProtectedRoute allowedRoles={['master']}><PaginaGestaoMTR /></ProtectedRoute>} />
              <Route path="admin/master-tools" element={<ProtectedRoute allowedRoles={['master']}><PaginaAdminMaster /></ProtectedRoute>} />
              <Route path="painelsigor" element={<ProtectedRoute allowedRoles={['master']}><PainelSigor /></ProtectedRoute>} />
          </Route>

          {/* ROTAS PRIVADAS (APP) INTERNACIONAIS */}
          {['en', 'es'].map((lang) => (
            <Route key={`app-${lang}`} path={`/${lang}/app`} element={<LanguageWrapper lang={lang}><PrivateRoutesLayout /></LanguageWrapper>}>
              <Route index element={<ProtectedRoute allowedRoles={['master', 'gerente', 'operacional']}><PaginaLancamento /></ProtectedRoute>} />
              <Route path="lancamento" element={<ProtectedRoute allowedRoles={['master', 'gerente', 'operacional']}><PaginaLancamento /></ProtectedRoute>} />
              <Route path="dashboard" element={<ProtectedRoute allowedRoles={['master', 'gerente']}><PaginaDashboard /></ProtectedRoute>} />
              <Route path="documentacao" element={<ProtectedRoute allowedRoles={['master', 'gerente']}><PaginaDocumentacao /></ProtectedRoute>} />
              <Route path="economia-circular" element={<ProtectedRoute allowedRoles={['master', 'gerente']}><PaginaEconomiaCircular /></ProtectedRoute>} />
              <Route path="glossario" element={<ProtectedRoute allowedRoles={['master', 'gerente']}><PaginaGlossario /></ProtectedRoute>} />
              <Route path="admin/usuarios" element={<ProtectedRoute allowedRoles={['master', 'gerente']}><PaginaAdminUsuarios /></ProtectedRoute>} />
              <Route path="admin/clientes" element={<ProtectedRoute allowedRoles={['master']}><PaginaAdminClientes /></ProtectedRoute>} />
              <Route path="admin/empresas-coleta" element={<ProtectedRoute allowedRoles={['master']}><PaginaAdminEmpresasColeta /></ProtectedRoute>} />
              <Route path="admin/gestao-mtr" element={<ProtectedRoute allowedRoles={['master']}><PaginaGestaoMTR /></ProtectedRoute>} />
              <Route path="admin/master-tools" element={<ProtectedRoute allowedRoles={['master']}><PaginaAdminMaster /></ProtectedRoute>} />
            </Route>
          ))}

          {/* ROTAS DE FALLBACK */}
          <Route path="/acesso-negado" element={<PaginaAcessoNegado />} />
          <Route path="*" element={<PaginaNotFound />} />

        </Routes>
      </Suspense>
    </>
  );
}