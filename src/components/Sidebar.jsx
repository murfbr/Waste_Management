// src/components/Sidebar.jsx

import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Importa useNavigate para redirecionamento
import AuthContext from '../context/AuthContext'; // Para aceder ao role e função de logout
import { signOut } from 'firebase/auth'; // Importa a função signOut do Firebase

export default function Sidebar() {
  const { userProfile, auth: authInstanceFromContext } = useContext(AuthContext); // Pega a instância 'auth' do contexto
  const navigate = useNavigate(); // Hook para navegação programática

  // Função para lidar com o logout
  const handleLogout = async () => {
    try {
      await signOut(authInstanceFromContext); // Usa a instância 'auth' do contexto
      navigate('/login'); // Redireciona para a página de login após o logout
      console.log('Utilizador deslogado com sucesso.');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Poderia mostrar uma mensagem de erro para o utilizador aqui
    }
  };

  // Função auxiliar para renderizar um item de link da sidebar
  const NavLink = ({ to, children }) => (
    <Link
      to={to}
      className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 hover:text-white"
    >
      {children}
    </Link>
  );

  return (
    <aside className="w-64 bg-gray-800 text-gray-100 p-4 space-y-2 flex flex-col">
      <div className="text-2xl font-bold text-white mb-5 text-center">
        WasteCtrl
      </div>
      <nav className="flex-grow">
        {/* Links baseados no role */}
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
                <NavLink to="/admin/usuarios">Gerir Utilizadores</NavLink>
                <NavLink to="/admin/hoteis">Gerir Hotéis</NavLink>
                {/* Adicionar mais links de admin aqui */}
              </>
            )}
          </>
        )}
      </nav>
      <div className="mt-auto pt-4 border-t border-gray-700">
        {userProfile && (
            <p className="text-xs text-gray-400 text-center mb-2">
                Nível: {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}
            </p>
        )}
        {/* Botão de Logout */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition duration-200"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
