// src/router/index.jsx

import React, { useContext } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
// AJUSTADO: Assumindo que o seu ficheiro se chama ProtectedRoutes.jsx (plural, CamelCase)
// Se o nome do seu ficheiro for diferente (ex: protectedroutes.jsx), ajuste aqui.
import ProtectedRoute from './ProtectedRoutes'; 

// Layouts
import MainLayout from '../layouts/MainLayout';

// Componentes de Página
import Login from '../components/Login';
import PaginaLancamento from '../pages/PaginaLancamento';
import PaginaDashboard from '../pages/PaginaDashboard';
import PaginaAdminUsuarios from '../pages/PaginaAdminUsuarios';
import PaginaAdminClientes from '../pages/PaginaAdminClientes'; 
import PaginaAdminEmpresasColeta from '../pages/PaginaAdminEmpresasColeta';
import PaginaNotFound from '../pages/PaginaNotFound';
import PaginaAcessoNegado from '../pages/PaginaAcessoNegado';

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
      <Outlet />
    </MainLayout>
  );
};

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/acesso-negado" element={<PaginaAcessoNegado />} />

      <Route element={<PrivateRoutesLayout />}>
        <Route index element={<Navigate to="/lancamento" replace />} />
        
        <Route 
          path="lancamento" 
          element={
            <ProtectedRoute allowedRoles={['master', 'gerente', 'operacional']}>
              <PaginaLancamento />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="dashboard" 
          element={
            <ProtectedRoute allowedRoles={['master', 'gerente']}>
              <PaginaDashboard />
            </ProtectedRoute>
          } 
        />

        <Route element={<ProtectedRoute allowedRoles={['master']} />}>
          <Route path="admin/usuarios" element={<PaginaAdminUsuarios />} />
          <Route path="admin/clientes" element={<PaginaAdminClientes />} />
          <Route path="admin/empresas-coleta" element={<PaginaAdminEmpresasColeta />} />
        </Route>
      </Route>

      <Route path="*" element={<PaginaNotFound />} />
    </Routes>
  );
}
