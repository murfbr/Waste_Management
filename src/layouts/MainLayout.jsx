// src/layouts/MainLayout.jsx

import React, { useState, useContext } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/app/Sidebar'; 
import AuthContext from '../context/AuthContext'; 

// --- MUDANÇA: Importação do logo SVG ---
import logoSvg from '../components/Simbolo-Laranja-SVG.svg';

const HamburgerIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
  </svg>
);

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const { userProfile } = useContext(AuthContext);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const shouldShowSidebar = userProfile && userProfile.role !== 'operacional';

  return (
    <div className="relative flex h-screen bg-gray-100 overflow-hidden">
      
      {shouldShowSidebar && (
        <Sidebar 
          isOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse} 
        />
      )}

      <div className="flex-1 flex flex-col w-full">
        
        <header className="bg-white shadow-md md:hidden flex-shrink-0"> 
          <div className="flex items-center justify-between h-16 px-4">
              {shouldShowSidebar ? (
                <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
                  aria-label="Abrir menu principal"
                >
                  <HamburgerIcon />
                </button>
              ) : (
                <div className="w-1/3"></div>
              )}

              {/* --- MUDANÇA: Substituição do texto pelo logo no header mobile --- */}
              <div className="flex justify-center w-1/3">
                <img src={logoSvg} alt="CtrlWaste" className="h-8 w-auto" />
              </div>

              <div className="w-1/3"></div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}