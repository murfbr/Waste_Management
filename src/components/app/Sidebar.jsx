// src/components/app/Sidebar.jsx

import React, { useState, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import { signOut } from 'firebase/auth';
import ConfirmationModal from './ConfirmationModal'; 
import logoSvg from '../Simbolo-Laranja-SVG.svg';

// --- ÍCONES SVG (sem alterações) ---
const LançamentoIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const DashboardIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const DocsIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const EconomiaIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const GlossarioIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-9-5.747h18" /></svg>;
const AdminUsersIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.975 5.975 0 0112 13a5.975 5.975 0 016-5.197M15 21a9 9 0 00-9-5.197" /></svg>;
const AdminClientesIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const LogoutIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const ChevronDoubleLeftIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" /></svg>;
const ChevronDoubleRightIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" /></svg>;
const CloseIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>;


const NavItem = ({ to, icon, text, isCollapsed, onClick }) => {
  return (
    <NavLink 
      to={to} 
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center p-2.5 rounded-md transition duration-200 space-x-4 font-lexend text-corpo ` +
        (isActive
          ? 'bg-apricot-orange text-white' // Estilo para link ativo
          : 'text-white hover:bg-white/10') // Estilo para link inativo
      }
      title={isCollapsed ? text : ""}
    >
      {icon}
      <span className={`${isCollapsed ? 'hidden' : 'inline-block'}`}>{text}</span>
    </NavLink>
  );
};

export default function Sidebar({ isOpen, toggleSidebar, isCollapsed, onToggleCollapse }) {
  const { userProfile, currentUser, auth: authInstanceFromContext } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleConfirmLogout = async () => {
    try {
      await signOut(authInstanceFromContext);
      setIsLogoutModalOpen(false);
      if (isOpen && typeof toggleSidebar === 'function') toggleSidebar();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleLogoutRequest = () => {
    setIsLogoutModalOpen(true);
  };

  const handleLinkClick = () => {
    if (isOpen && typeof toggleSidebar === 'function') {
      toggleSidebar();
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-20 bg-black opacity-50 md:hidden" onClick={toggleSidebar}></div>
      )}

      <aside
        className={`
          bg-blue-coral text-white flex flex-col
          fixed inset-y-0 left-0 z-30 h-[100dvh]
          transform transition-all duration-300 ease-in-out
          md:relative
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
          ${isCollapsed ? 'w-20' : 'w-64'} 
        `}
        aria-label="Sidebar principal"
      >
        <div className={`p-4 flex items-center border-b border-white/20 flex-shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          
          {/* --- MUDANÇA: Substituição do H1 pela imagem do logo --- */}
          <img 
            src={logoSvg} 
            alt="CtrlWaste" 
            title="CtrlWaste"
            className={`h-8 w-auto transition-opacity duration-200 ${isCollapsed ? 'hidden' : 'inline-block'}`}
          />
           
           <span className={`font-lexend text-2xl font-bold text-white transition-opacity duration-200 ${isCollapsed ? 'inline-block' : 'hidden'}`}>
            <img 
            src={logoSvg} 
            alt="CtrlWaste" 
            className="h-8 w-auto"
            title="CtrlWaste"
          />
           </span>

          <button onClick={toggleSidebar} className="md:hidden p-1 text-white/80 hover:text-white" aria-label="Fechar menu">
            <CloseIcon />
          </button>
        </div>

        {/* O restante do código permanece o mesmo */}
        <nav className="flex-grow overflow-y-auto p-2 space-y-1">
          {userProfile ? (
            <>
              {(userProfile.role === 'master' || userProfile.role === 'gerente' || userProfile.role === 'operacional') && (
                <NavItem to="/app/lancamento" icon={<LançamentoIcon />} text="Lançamento" isCollapsed={isCollapsed} onClick={handleLinkClick} />
              )}
              {(userProfile.role === 'master' || userProfile.role === 'gerente') && (
                <NavItem to="/app/dashboard" icon={<DashboardIcon />} text="Dashboards" isCollapsed={isCollapsed} onClick={handleLinkClick} />
              )}
              
              {(userProfile.role === 'master' || userProfile.role === 'gerente') && (
                <>
                  <hr className={`my-2 border-white/20 ${isCollapsed && 'mx-4'}`} />
                  {!isCollapsed && <p className="px-4 pt-2 pb-1 text-xs font-lexend text-white/70 uppercase">Informativos</p>}
                  <NavItem to="/app/documentacao" icon={<DocsIcon />} text="Documentação" isCollapsed={isCollapsed} onClick={handleLinkClick} />
                  <NavItem to="/app/economia-circular" icon={<EconomiaIcon />} text="Economia Circular" isCollapsed={isCollapsed} onClick={handleLinkClick} />
                  <NavItem to="/app/glossario" icon={<GlossarioIcon />} text="Glossário" isCollapsed={isCollapsed} onClick={handleLinkClick} />
                </>
              )}
              
              
              {(userProfile.role === 'master' || userProfile.role === 'gerente') && (
                <>
                  <hr className={`my-2 border-white/20 ${isCollapsed && 'mx-4'}`} />
                  {!isCollapsed && <p className="px-4 pt-2 pb-1 text-xs font-lexend text-white/70 uppercase">Administração</p>}
                  <NavItem to="/app/admin/usuarios" icon={<AdminUsersIcon />} text="Usuários" isCollapsed={isCollapsed} onClick={handleLinkClick} />
                </>
              )}

              
              {userProfile.role === 'master' && (
                <>
                  <NavItem to="/app/admin/clientes" icon={<AdminClientesIcon />} text="Clientes" isCollapsed={isCollapsed} onClick={handleLinkClick} />
                  <NavItem to="/app/admin/empresas-coleta" icon={<AdminClientesIcon />} text="Empresas de Coleta" isCollapsed={isCollapsed} onClick={handleLinkClick} />
                </>
              )}
            </>
          ) : (
            <div className="p-4 text-white/60">...</div>
          )}
        </nav>

        <div className="p-2 border-t border-white/20 flex-shrink-0">
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex items-center justify-center w-full p-2.5 rounded-md transition duration-200 hover:bg-white/10 mb-2"
            title={isCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {isCollapsed ? <ChevronDoubleRightIcon className="w-6 h-6" /> : <ChevronDoubleLeftIcon className="w-6 h-6" />}
          </button>
        
          <div className={`font-comfortaa ${isCollapsed ? 'hidden' : 'block'}`}>
            {userProfile && userProfile.role && (
              <p className="text-xs text-white/70 text-center mb-1">
                Nível: {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}
              </p>
            )}
            {currentUser && currentUser.email && (
              <p className="text-xs text-white/60 text-center break-all mb-2 truncate" title={currentUser.email}>
                {currentUser.email}
              </p>
            )}
          </div>
          <button
            onClick={handleLogoutRequest}
            className={`w-full flex items-center font-lexend py-2 px-4 rounded-lg text-sm transition duration-200 bg-apricot-orange hover:opacity-90 ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogoutIcon />
            <span className={isCollapsed ? 'hidden' : 'ml-2'}>Sair</span>
          </button>
        </div>
      </aside>

      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onCancel={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Confirmar Saída"
        message="Tem certeza de que deseja encerrar a sessão?"
        confirmText="Sim, Sair"
        theme="danger"
      />
    </>
  );
}