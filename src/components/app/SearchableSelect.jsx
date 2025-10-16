// src/components/SearchableSelect.jsx
import React, { useState, useMemo, useRef, useEffect } from 'react';

// Um componente de select com um campo de busca interno
export const SearchableSelect = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selectRef = useRef(null);

  // Lógica para fechar o dropdown ao clicar fora
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filtra as opções com base na busca (a partir de 3 caracteres)
  const filteredOptions = useMemo(() => {
    if (query.length < 3) {
      return options; // Mostra tudo se a busca for curta
    }
    const lowerQuery = query.toLowerCase();
    return options.filter(opt => 
      opt.label.toLowerCase().includes(lowerQuery)
    );
  }, [query, options]);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative font-comfortaa" ref={selectRef}>
      {/* O botão que parece um input e mostra o valor selecionado */}
      <button
        type="button"
        className="w-full p-2 text-left bg-white border border-early-frost rounded-md text-corpo text-rich-soil flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? 'text-rich-soil' : 'text-gray-500'}>
            {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* O painel do dropdown que só aparece quando está aberto */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg border border-early-frost rounded-md">
            {/* O campo de busca DENTRO do dropdown */}
            <div className="p-2">
                <input
                    type="text"
                    placeholder="Buscar (mín. 3 letras)..."
                    className="w-full p-2 border border-early-frost rounded-md"
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                />
            </div>
            {/* A lista de opções */}
            <ul className="max-h-60 overflow-y-auto p-1">
                {filteredOptions.length > 0 ? filteredOptions.map(option => (
                    <li
                        key={option.value}
                        className="p-2 rounded-md hover:bg-apricot-orange/80 hover:text-white cursor-pointer"
                        onClick={() => {
                            onChange(option.value);
                            setIsOpen(false);
                            setQuery('');
                        }}
                    >
                        {option.label}
                    </li>
                )) : (
                    <li className="p-2 text-gray-500">Nenhum resultado encontrado.</li>
                )}
            </ul>
        </div>
      )}
    </div>
  );
};