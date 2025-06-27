// src/layouts/MainLayout.jsx

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/app/Sidebar'; 

const HamburgerIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
  </svg>
);

export default function MainLayout() {
  // Estado para a sidebar no mobile (lógica existente mantida)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // NOVO: Estado para controlar a sidebar recolhida no desktop/tablet
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // NOVO: Função para alternar o estado recolhido
  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="relative flex h-screen bg-gray-100 overflow-hidden">
      
      {/* Sidebar agora recebe as novas props para o controlo de recolhimento */}
      <Sidebar 
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse} 
      />

      {/* Container do Conteúdo Principal */}
      <div className="flex-1 flex flex-col w-full">
        
        {/* Header do Mobile */}
        <header className="bg-white shadow-md md:hidden flex-shrink-0"> 
          <div className="flex items-center justify-between h-16 px-4">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
                aria-label="Abrir menu principal"
              >
                <HamburgerIcon />
              </button>
              <div className="text-xl font-semibold text-gray-700">
                CtrlWaste
              </div>
              <div className="w-8"></div>
          </div>
        </header>

        {/* Área de Conteúdo Principal */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 sm:px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
