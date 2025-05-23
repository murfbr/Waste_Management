// src/pages/PaginaAcessoNegado.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function PaginaAcessoNegado() {
  return (
    <div className="text-center p-8">
      <h1 className="text-3xl font-bold text-red-600 mb-4">Acesso Negado</h1>
      <p className="text-gray-700 mb-6">
        Você não tem permissão para visualizar esta página.
      </p>
      <Link to="/lancamento" className="text-indigo-600 hover:text-indigo-800 font-semibold">
        Voltar para a Página Inicial
      </Link>
    </div>
  );
}