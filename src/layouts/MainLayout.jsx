// src/layouts/MainLayout.jsx

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/app/Sidebar'; // O seu Sidebar.jsx responsivo

// Ícone Hamburger (pode usar react-icons ou um SVG mais elaborado)
const HamburgerIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
  </svg>
);

export default function MainLayout() {
  // Estado para controlar a visibilidade da sidebar no mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    // Container principal que organiza o layout com Flexbox
    <div className="relative flex h-screen bg-gray-100 overflow-hidden">
      
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} // Passando o estado de visibilidade
        toggleSidebar={toggleSidebar} // Passando a função para fechar/abrir
      />

      {/* Container do Conteúdo Principal (o que fica à direita da sidebar) */}
      <div className="flex-1 flex flex-col w-full">
        
        {/* Header da Área de Conteúdo (visível apenas no mobile para abrir a sidebar) */}
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
              <div className="w-8"></div> {/* Espaçador para centralizar o título */}
          </div>
        </header>

        {/* Área de Conteúdo Principal com scroll interno */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 sm:px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
