import React, { useRef, useEffect } from 'react';

export default function LazySection({ children, onVisible }) {
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if(onVisible) {
            onVisible();
          }
          // Depois de se tornar visível uma vez, já não precisamos de o observar.
          // A verificação 'currentRef' garante que não tentamos remover um observador de um elemento que já não existe.
          if (ref.current) {
            observer.unobserve(ref.current);
          }
        }
      },
      {
        // Começa a carregar os dados 50px antes de a secção entrar completamente no ecrã.
        rootMargin: '0px 0px 50px 0px',
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    // Função de limpeza para quando o componente é desmontado
    return () => {
      if (currentRef) {
        // A chave para a correção é remover o observador do mesmo elemento que foi observado
        observer.unobserve(currentRef);
      }
    };
  }, [onVisible]);

  return <div ref={ref}>{children}</div>;
}
