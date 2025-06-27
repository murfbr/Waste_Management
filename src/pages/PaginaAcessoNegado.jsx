// src/pages/PaginaAcessoNegado.jsx
import React from 'react';
import { Link } from 'react-router-dom';

// Ícone para um feedback visual mais forte de acesso bloqueado.
const LockClosedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

export default function PaginaAcessoNegado() {
  return (
    // Container para centralizar o conteúdo na tela.
    <div className="flex items-center justify-center h-full p-4 bg-gray-50">
        <div className="text-center p-10 bg-white shadow-xl rounded-2xl max-w-md w-full">
            <LockClosedIcon />
            <h1 className="text-3xl font-bold text-gray-800 mt-4 mb-2">Acesso Negado</h1>
            <p className="text-gray-600 mb-8">
                Você não tem permissão para visualizar esta página.
            </p>
            <Link 
                to="/app/lancamento" // Corrigido para o caminho correto da página inicial do app
                className="inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
            >
                Voltar para a Página Inicial
            </Link>
        </div>
    </div>
  );
}
