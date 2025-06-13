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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="relative min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar 
        isOpenOnMobile={isMobileSidebarOpen} 
        toggleMobileSidebar={toggleMobileSidebar} 
      />

      {/* Conteúdo Principal - com margem para compensar o sidebar fixo */}
      <div className="flex flex-col min-h-screen md:ml-64">
        {/* Header da Área de Conteúdo (onde o botão hamburger pode ficar) */}
        <header className="bg-white shadow-md md:hidden"> 
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={toggleMobileSidebar}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                  aria-expanded={isMobileSidebarOpen}
                  aria-controls="mobile-sidebar"
                  aria-label="Abrir menu principal"
                >
                  <HamburgerIcon />
                </button>
              </div>
              <div className="text-xl font-semibold text-gray-700">
                WasteCtrl
              </div>
              <div className="w-10"> {/* Espaçador */}
              </div>
            </div>
          </div>
        </header>

        {/* Área de Conteúdo Principal com scroll interno */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}