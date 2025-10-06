// src/components/app/LazySection.jsx
import React, { useState, useEffect, useRef } from 'react';

// Este componente usa a Intersection Observer API para detectar quando ele entra na tela.
// Ele renderiza um placeholder até ser visível, e então renderiza seus 'children'.
// A função 'onVisible' é chamada uma única vez quando o componente se torna visível.
export default function LazySection({ children, onVisible, minHeight = '300px' }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Se o elemento está visível na tela
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (onVisible) {
            onVisible();
          }
          // Para de observar após se tornar visível para não chamar a função múltiplas vezes
          observer.unobserve(ref.current);
        }
      },
      {
        rootMargin: '0px 0px 50px 0px', // Começa a carregar um pouco antes de chegar na tela
        threshold: 0.01 // Mesmo que 1% do componente esteja visível
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [onVisible]);

  return (
    <div ref={ref} style={{ minHeight: isVisible ? 'auto' : minHeight }}>
      {isVisible ? children : (
        // Placeholder simples enquanto não está visível
        <div className="w-full h-full flex items-center justify-center text-early-frost">
          Carregando seção...
        </div>
      )}
    </div>
  );
}