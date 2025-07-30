import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const linkClasses = "font-comfortaa text-early-frost hover:text-apricot-orange transition-colors duration-300";

  return (
    <footer className="bg-blue-coral text-white">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <h3 className="text-2xl font-bold">Ctrl+Waste</h3>
            <p className="text-gray-400 mt-2">Otimizando a gestão de resíduos.</p>
          </div>
          <div className="flex space-x-6">
            <Link to="/" className={linkClasses}>Início</Link>
            <Link to="/produto" className={linkClasses}>O Produto</Link>
            <Link to="/contato" className={linkClasses}>Contato</Link>
          </div>
        </div>
        <hr className="my-6 border-gray-700" />
        <p className="text-center text-gray-400 text-sm">
          &copy; {currentYear} Ctrl+Waste. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
};
