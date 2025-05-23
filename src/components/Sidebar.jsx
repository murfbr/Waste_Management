// src/components/Sidebar.jsx

import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { signOut } from 'firebase/auth';

// Ícone de Fechar (X) para o menu mobile - pode usar react-icons ou um SVG
const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
  </svg>
);

export default function Sidebar({ isOpenOnMobile, toggleMobileSidebar }) {
  const { userProfile, currentUser, auth: authInstanceFromContext } = useContext(AuthContext); 
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(authInstanceFromContext);
      if (toggleMobileSidebar) toggleMobileSidebar(); // Fecha a sidebar mobile após logout
      navigate('/login');
      console.log('Utilizador deslogado com sucesso.');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const NavLink = ({ to, children }) => (
    <Link
      to={to}
      onClick={() => {
        // Fecha a sidebar mobile ao clicar num link
        if (isOpenOnMobile && toggleMobileSidebar) {
          toggleMobileSidebar();
        }
      }}
      className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 hover:text-white"
    >
      {children}
    </Link>
  );

  return (
    <>
      {/* Overlay para ecrãs móveis quando a sidebar estiver aberta */}
      {isOpenOnMobile && (
        <div 
          className="fixed inset-0 z-20 bg-black opacity-50 md:hidden" 
          onClick={toggleMobileSidebar}
          aria-hidden="true"
        ></div>
      )}

      <aside 
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-gray-800 text-gray-100 p-4 space-y-2 flex flex-col
          transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex-shrink-0
          ${isOpenOnMobile ? 'translate-x-0' : '-translate-x-full'}
        `}
        aria-label="Sidebar principal"
      >
        <div className="flex justify-between items-center md:justify-center">
          <div className="text-2xl font-bold text-white text-center md:mb-5">
            WasteCtrl
          </div>
          {/* Botão de Fechar para mobile, visível apenas em md:hidden */}
          <button 
            onClick={toggleMobileSidebar} 
            className="md:hidden p-1 text-gray-300 hover:text-white"
            aria-label="Fechar menu"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="flex-grow overflow-y-auto"> {/* Adicionado overflow-y-auto se os links excederem a altura */}
          {userProfile && (
            <>
              {(userProfile.role === 'master' || userProfile.role === 'gerente' || userProfile.role === 'operacional') && (
                <NavLink to="/lancamento">Lançamento de Pesagem</NavLink>
              )}

              {(userProfile.role === 'master' || userProfile.role === 'gerente') && (
                <NavLink to="/dashboard">Dashboards</NavLink>
              )}

              {userProfile.role === 'master' && (
                <>
                  <hr className="my-2 border-gray-600" />
                  <p className="px-4 py-2 text-xs text-gray-400 uppercase">Administração</p>
                  <NavLink to="/admin/usuarios">Gerir Usuários</NavLink>
                  <NavLink to="/admin/clientes">Gerir Clientes</NavLink>
                  <NavLink to="/admin/empresas-coleta">Gerir Empresas de Coleta</NavLink>
                </>
              )}
            </>
          )}
        </nav>
        <div className="mt-auto pt-4 border-t border-gray-700">
          {userProfile && (
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
