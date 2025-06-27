// src/components/utils/ScrollToTop.jsx

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Este componente escuta as mudanças de rota e rola a página para o topo.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // A cada mudança no 'pathname' (URL), executa o scroll para o topo.
    window.scrollTo(0, 0);
  }, [pathname]);

  // Não renderiza nenhum elemento visual.
  return null;
}
