import React from 'react';
import { Outlet } from 'react-router-dom';

// Importando os componentes de seus respectivos arquivos
import Navbar from '../components/site/Navbar';
import Footer from '../components/site/Footer';
import ScrollToTop from '../utils/ScrollToTop';
import WhatsAppButton from '../services/whatsAppButton'; // 1. Importe o botão

export default function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-gray-50">
      <ScrollToTop />
      <Navbar />
      <main className="flex-grow">
        {/* O conteúdo da página específica (ex: HomePage) será renderizado aqui */}
        <Outlet /> 
      </main>
      <Footer />
      <WhatsAppButton /> {/* 2. Adicione o componente aqui */}
    </div>
  );
}