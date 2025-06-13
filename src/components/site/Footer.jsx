import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-gray-800 text-white">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <h3 className="text-2xl font-bold">CtrlWaste</h3>
            <p className="text-gray-400 mt-2">Otimizando a gestão de resíduos.</p>
          </div>
          <div className="flex space-x-6">
            <Link to="/" className="hover:text-green-400">Início</Link>
            <Link to="/produto" className="hover:text-green-400">O Produto</Link>
            <Link to="/contato" className="hover:text-green-400">Contato</Link>
          </div>
        </div>
        <hr className="my-6 border-gray-700" />
        <p className="text-center text-gray-400 text-sm">
          &copy; {currentYear} CtrlWaste. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
};
