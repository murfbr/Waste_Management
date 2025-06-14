// src/components/site/Navbar.jsx

import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Estilo para o link ativo, para dar feedback visual ao usuário
  const activeLinkStyle = {
    color: '#16a34a', // um tom de verde, tailwind: text-green-600
    fontWeight: '600',
  };

  const handleLinkClick = () => {
    // Fecha o menu mobile ao clicar em um link
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo/Nome da Empresa */}
        <div className="text-2xl font-bold text-gray-800">
          <Link to="/" onClick={handleLinkClick}>CtrlWaste</Link>
        </div>

        {/* Links do Menu para Desktop */}
        <div className="hidden md:flex items-center space-x-8">
          <NavLink to="/" style={({ isActive }) => (isActive ? activeLinkStyle : undefined)} className="text-gray-600 hover:text-green-600">Início</NavLink>
          <NavLink to="/produto" style={({ isActive }) => (isActive ? activeLinkStyle : undefined)} className="text-gray-600 hover:text-green-600">O Produto</NavLink>
          <NavLink to="/sobre" style={({ isActive }) => (isActive ? activeLinkStyle : undefined)} className="text-gray-600 hover:text-green-600">Sobre Nós</NavLink>
          <NavLink to="/contato" style={({ isActive }) => (isActive ? activeLinkStyle : undefined)} className="text-gray-600 hover:text-green-600">Contato</NavLink>
        </div>

        {/* Botão de Login para Desktop */}
        <Link to="/login" className="hidden md:block bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition duration-300">
          Acessar Sistema
        </Link>

        {/* Botão do Menu Mobile (Hamburger) */}
        <div className="md:hidden">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-800 focus:outline-none">
            {/* Ícone muda entre hamburger e 'X' */}
            {isMobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Painel do Menu Mobile */}
      {/* Usando classes do Tailwind para a transição */}
      <div className={`md:hidden absolute w-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full opacity-0'}`} style={{ top: '100%', left: 0 }}>
        {isMobileMenuOpen && (
          <div className="flex flex-col px-8 py-4 space-y-4">
            <NavLink to="/" style={({ isActive }) => (isActive ? activeLinkStyle : undefined)} onClick={handleLinkClick} className="text-gray-700 hover:text-green-600 py-2">Início</NavLink>
            <NavLink to="/produto" style={({ isActive }) => (isActive ? activeLinkStyle : undefined)} onClick={handleLinkClick} className="text-gray-700 hover:text-green-600 py-2">O Produto</NavLink>
            <NavLink to="/sobre" style={({ isActive }) => (isActive ? activeLinkStyle : undefined)} onClick={handleLinkClick} className="text-gray-700 hover:text-green-600 py-2">Sobre Nós</NavLink>
            <NavLink to="/contato" style={({ isActive }) => (isActive ? activeLinkStyle : undefined)} onClick={handleLinkClick} className="text-gray-700 hover:text-green-600 py-2">Contato</NavLink>
            <hr />
            <Link to="/login" onClick={handleLinkClick} className="bg-green-600 text-white font-bold py-3 px-4 rounded-lg text-center hover:bg-green-700 transition duration-300">
              Acessar Sistema
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
