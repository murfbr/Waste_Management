// src/components/Sidebar.jsx
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext'; // Certifique-se de que este caminho está correto
import { signOut } from 'firebase/auth';

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
      if (!authInstanceFromContext) {
        console.error('Instância de autenticação do Firebase não disponível no AuthContext.');
        return;
      }
      await signOut(authInstanceFromContext);
      if (toggleMobileSidebar && typeof toggleMobileSidebar === 'function') {
        toggleMobileSidebar();
      }
      navigate('/login');
      console.log('Utilizador deslogado com sucesso.');
    } catch (error)
    {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const NavLink = ({ to, children }) => (
    <Link
      to={to}
      onClick={() => {
        if (isOpenOnMobile && toggleMobileSidebar && typeof toggleMobileSidebar === 'function') {
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
      {/* Overlay para telemóvel */}
      {isOpenOnMobile && (
        <div
          className="fixed inset-0 z-20 bg-black opacity-50 md:hidden"
          onClick={toggleMobileSidebar}
          aria-hidden="true"
        ></div>
      )}

      {/* Contentor da Sidebar */}
      <aside
        className={`
          bg-gray-800 text-gray-100 w-64 flex flex-col
          fixed inset-y-0 left-0 z-30 h-screen
          transform transition-transform duration-300 ease-in-out
          ${isOpenOnMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        aria-label="Sidebar principal"
      >
        {/* Cabeçalho da Sidebar (parte de altura fixa) */}
        <div className="p-4 flex justify-between items-center md:justify-center border-b border-gray-700 flex-shrink-0">
          <div className="text-2xl font-bold text-white">
            WasteCtrl
          </div>
          <button
            onClick={toggleMobileSidebar}
            className="md:hidden p-1 text-gray-300 hover:text-white"
            aria-label="Fechar menu"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Links de Navegação (parte rolável) */}
        <nav className="flex-grow overflow-y-auto p-4">
          {userProfile ? (
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
          ) : (
            <p className="p-4 text-gray-400">Carregando menu...</p>
          )}
        </nav>

        {/* Rodapé da Sidebar (parte de altura fixa, fica no fundo) */}
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