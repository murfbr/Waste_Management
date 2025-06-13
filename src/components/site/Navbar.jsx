import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-gray-800">
          <Link to="/">CtrlWaste</Link>
        </div>
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-gray-600 hover:text-green-600">Início</Link>
          <Link to="/produto" className="text-gray-600 hover:text-green-600">O Produto</Link>
          <Link to="/sobre" className="text-gray-600 hover:text-green-600">Sobre Nós</Link>
          <Link to="/contato" className="text-gray-600 hover:text-green-600">Contato</Link>
        </div>
        <Link to="/login" className="hidden md:block bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition duration-300">
          Acessar Sistema
        </Link>
        <div className="md:hidden">
          {/* Botão de Menu Mobile (a funcionalidade pode ser adicionada depois) */}
          <button className="text-gray-800 focus:outline-none">
            <svg className="h-6 w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M4 6h16M4 12h16m-7 6h7"></path>
            </svg>
          </button>
        </div>
      </nav>
    </header>
  );
};
