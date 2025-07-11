// src/components/InstallButton.jsx

import React, { useState, useEffect } from 'react';

const InstallButton = () => {
  // 1. Criamos um estado para guardar o evento de instalação
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    // 2. "Ouvimos" o evento que o navegador dispara
    const handleBeforeInstallPrompt = (event) => {
      // Impede que o mini-infobar padrão apareça no Chrome
      event.preventDefault();
      // Guarda o evento para que ele possa ser disparado mais tarde.
      setInstallPrompt(event);
      console.log("Evento de instalação capturado!");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Função de limpeza para remover o "ouvinte" quando o componente não for mais usado
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    // Se não tivermos um evento guardado, não fazemos nada
    if (!installPrompt) {
      return;
    }

    // 4. Mostra o diálogo de instalação oficial do navegador
    const result = await installPrompt.prompt();
    console.log(`Resultado da instalação: ${result.outcome}`);

    // O prompt só pode ser usado uma vez. Limpamos o estado.
    setInstallPrompt(null);
  };

  // 3. Se não houver evento de instalação, não renderizamos nada (o botão fica invisível)
  if (!installPrompt) {
    return null;
  }

  // Se houver um evento, mostramos nosso botão personalizado!
  return (
    <button
      onClick={handleInstallClick}
      style={{
        // Estilos de exemplo para destacar o botão
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '12px 20px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      }}
    >
      Instalar Aplicativo
    </button>
  );
};

export default InstallButton;