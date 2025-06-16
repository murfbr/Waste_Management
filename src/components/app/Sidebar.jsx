// Supondo que este arquivo esteja em: src/components/app/Sidebar.jsx

import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import { signOut } from 'firebase/auth';

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
  </svg>
);

export default function Sidebar({ isOpen, toggleSidebar }) {
  const { userProfile, currentUser, auth: authInstanceFromContext } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      if (!authInstanceFromContext) {
        console.error('Instância de autenticação não disponível.');
        return;
      }
      await signOut(authInstanceFromContext);
      if (typeof toggleSidebar === 'function') {
        toggleSidebar();
      }
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };
  
  const activeLinkStyle = {
    backgroundColor: '#4338ca', // Tailwind: indigo-700
    color: 'white',
  };

  const handleLinkClick = () => {
    if (isOpen && typeof toggleSidebar === 'function') {
        toggleSidebar();
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black opacity-50 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        ></div>
      )}

      <aside
        className={`
          bg-gray-800 text-gray-100 w-64 flex flex-col
          fixed inset-y-0 left-0 z-30 h-screen
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:relative
        `}
        aria-label="Sidebar principal"
      >
        <div className="p-4 flex justify-between items-center md:justify-center border-b border-gray-700 flex-shrink-0">
          <h1 className="text-2xl font-bold text-white">
            CtrlWaste
          </h1>
          <button
            onClick={toggleSidebar}
            className="md:hidden p-1 text-gray-300 hover:text-white"
            aria-label="Fechar menu"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Links de Navegação com caminhos corrigidos */}
        <nav className="flex-grow overflow-y-auto p-4 space-y-1">
          {userProfile ? (
            <>
              {(userProfile.role === 'master' || userProfile.role === 'gerente' || userProfile.role === 'operacional') && (
                <NavLink to="/app/lancamento" style={({ isActive }) => isActive ? activeLinkStyle : undefined} onClick={handleLinkClick} className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">Lançamento</NavLink>
              )}
              {(userProfile.role === 'master' || userProfile.role === 'gerente') && (
                <NavLink to="/app/dashboard" style={({ isActive }) => isActive ? activeLinkStyle : undefined} onClick={handleLinkClick} className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">Dashboards</NavLink>
              )}
              {userProfile.role === 'master' && (
                <>
                  <hr className="my-2 border-gray-600" />
                  <p className="px-4 py-2 text-xs text-gray-400 uppercase">Administração</p>
                  <NavLink to="/app/admin/usuarios" style={({ isActive }) => isActive ? activeLinkStyle : undefined} onClick={handleLinkClick} className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">Usuários</NavLink>
                  <NavLink to="/app/admin/clientes" style={({ isActive }) => isActive ? activeLinkStyle : undefined} onClick={handleLinkClick} className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">Clientes</NavLink>
                  <NavLink to="/app/admin/empresas-coleta" style={({ isActive }) => isActive ? activeLinkStyle : undefined} onClick={handleLinkClick} className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">Empresas de Coleta</NavLink>
                </>
              )}
            </>
          ) : (
            <p className="p-4 text-gray-400">Carregando menu...</p>
          )}
        </nav>

        <div className="p-4 border-t border-gray-700 flex-shrink-0">
          {userProfile && userProfile.role && (
            <p className="text-xs text-gray-400 text-center mb-1">
              Nível: {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}
            </p>
          )}
          {currentUser && currentUser.email && (
            <p className="text-xs text-gray-500 text-center break-all mb-2 truncate" title={currentUser.email}>
              {currentUser.email}
            </p>
          )}
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition duration-200"
          >
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
