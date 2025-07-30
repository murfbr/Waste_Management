import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLinkClick = () => {
    // Fecha o menu mobile ao clicar em um link
    setIsMobileMenuOpen(false);
  };

  // Definindo as classes para reutilização e clareza
  const linkClasses = "font-comfortaa text-rich-soil hover:text-apricot-orange transition-colors duration-300";
  const activeLinkClasses = "text-apricot-orange font-semibold";

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        
        {/* Logo */}
        <Link to="/" onClick={handleLinkClick} className="font-lexend text-acao font-bold text-rain-forest">
          Ctrl+Waste
        </Link>

        {/* Links do Menu para Desktop */}
        <div className="hidden md:flex items-center space-x-8">
          <NavLink to="/" className={({ isActive }) => (isActive ? `${linkClasses} ${activeLinkClasses}` : linkClasses)}>Início</NavLink>
          <NavLink to="/produto" className={({ isActive }) => (isActive ? `${linkClasses} ${activeLinkClasses}` : linkClasses)}>O Produto</NavLink>
          <NavLink to="/sobre" className={({ isActive }) => (isActive ? `${linkClasses} ${activeLinkClasses}` : linkClasses)}>Sobre Nós</NavLink>
          <NavLink to="/contato" className={({ isActive }) => (isActive ? `${linkClasses} ${activeLinkClasses}` : linkClasses)}>Contato</NavLink>
        </div>

        {/* Botão de Ação para Desktop */}
        <Link to="/login" className="hidden md:block bg-apricot-orange text-white font-lexend font-semibold text-corpo py-2 px-6 rounded-lg hover:bg-apricot-orange transition-colors duration-300">
          Acessar Sistema
        </Link>

        {/* Botão do Menu Mobile (Hamburger) */}
        <div className="md:hidden">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-rain-forest focus:outline-none">
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
      <div className={`md:hidden absolute w-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full opacity-0'}`} style={{ top: '100%', left: 0 }}>
        {isMobileMenuOpen && (
          <div className="flex flex-col px-8 py-4 space-y-4">
            <NavLink to="/" onClick={handleLinkClick} className={({ isActive }) => (isActive ? `${linkClasses} ${activeLinkClasses}` : linkClasses)} >Início</NavLink>
            <NavLink to="/produto" onClick={handleLinkClick} className={({ isActive }) => (isActive ? `${linkClasses} ${activeLinkClasses}` : linkClasses)}>O Produto</NavLink>
            <NavLink to="/sobre" onClick={handleLinkClick} className={({ isActive }) => (isActive ? `${linkClasses} ${activeLinkClasses}` : linkClasses)}>Sobre Nós</NavLink>
            <NavLink to="/contato" onClick={handleLinkClick} className={({ isActive }) => (isActive ? `${linkClasses} ${activeLinkClasses}` : linkClasses)}>Contato</NavLink>
            <hr />
            <Link to="/login" onClick={handleLinkClick} className="bg-apricot-orange text-white font-lexend font-semibold text-corpo py-3 px-4 rounded-lg text-center hover:bg-apricot-orange transition-colors duration-300">
              Acessar Sistema
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};