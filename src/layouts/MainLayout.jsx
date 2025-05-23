// src/layouts/MainLayout.jsx

import React from 'react';
import { Outlet } from 'react-router-dom'; // Para renderizar as rotas filhas
import Sidebar from '../components/Sidebar'; // Importa o componente Sidebar real

export default function MainLayout() { // Removido 'children' pois não é usado quando se usa <Outlet /> para rotas filhas
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar /> {/* Usa o componente Sidebar importado */}

      {/* Área de Conteúdo Principal */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto"> {/* Ajustado padding e overflow */}
        {/* O Outlet renderizará o componente da rota ativa (ex: PaginaLancamento) */}
        <div className="max-w-7xl mx-auto"> {/* Adiciona um container para limitar a largura do conteúdo */}
          <Outlet />
        </div>
      </main>
    </div>
  );
}