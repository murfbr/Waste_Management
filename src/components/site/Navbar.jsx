import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from "../Vertical-Azul-SVG.svg";

// --- Custom Hook para fechar o dropdown ao clicar fora ---
const useOutsideClick = (callback) => {
  const ref = useRef();

  useEffect(() => {
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, [callback]);

  return ref;
};

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const { t, i18n } = useTranslation('site');
  const location = useLocation();
  const navigate = useNavigate();

  const langDropdownRef = useOutsideClick(() => setIsLangOpen(false));

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { to: '/', label: t('navbar.home') },
    { to: '/produto', label: t('navbar.product') },
    { to: '/sobre', label: t('navbar.about') },
    { to: '/contato', label: t('navbar.contact') },
  ];

  const languages = [
    { code: 'pt', label: 'Português' },
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
  ];

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];
  const langPrefix = i18n.language === 'pt' ? '' : `/${i18n.language}`;

  const changeLanguage = (lng) => {
    const path = location.pathname.replace(/^\/(en|es)/, '');
    i18n.changeLanguage(lng);
    const newPath = lng === 'pt' ? (path || '/') : `/${lng}${path}`;
    navigate(newPath);
    setIsLangOpen(false);
    setIsMobileMenuOpen(false);
  };

  const linkClasses = "font-comfortaa text-rich-soil hover:text-apricot-orange transition-colors duration-300";
  const activeLinkClasses = "text-apricot-orange font-semibold";

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link to={`${langPrefix}/`} onClick={handleLinkClick}>
          <img src={logo} alt="Ctrl+Waste" className="h-12 w-auto" />
        </Link>

        {/* Desktop Menu (Centralizado) */}
        <div className="hidden md:flex flex-grow justify-center">
          <div className="flex items-center space-x-8">
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={`${langPrefix}${link.to}`}
                className={({ isActive }) => (isActive ? `${linkClasses} ${activeLinkClasses}` : linkClasses)}
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Itens à Direita (Desktop) */}
        <div className="hidden md:flex items-center space-x-5">
          {/* Dropdown de Idiomas */}
          <div className="relative" ref={langDropdownRef}>
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center space-x-2 text-sm text-rich-soil hover:text-apricot-orange transition-colors duration-300"
              aria-haspopup="true"
              aria-expanded={isLangOpen}
            >
              <span className="text-xl">🌍</span>
              <span>{currentLang.code.toUpperCase()}</span>
            </button>
            {isLangOpen && (
              <div className="absolute right-0 mt-3 py-2 w-36 bg-white shadow-xl rounded-md z-50 ring-1 ring-black ring-opacity-5">
                {languages.map(l => (
                  <button
                    key={l.code}
                    onClick={() => changeLanguage(l.code)}
                    className="px-4 py-2 text-sm hover:bg-gray-100 w-full text-left"
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botão de Login */}
          <Link to={`${langPrefix}/login`} className="bg-apricot-orange text-white font-lexend font-semibold py-2 px-6 rounded-lg hover:opacity-90 transition-opacity duration-300">
            {t('navbar.login')}
          </Link>
        </div>

        {/* Botão do Menu Mobile */}
        <div className="md:hidden">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-blue-coral focus:outline-none">
            {isMobileMenuOpen ? (
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Painel do Menu Mobile */}
      {isMobileMenuOpen && (
         <div className="md:hidden bg-white shadow-lg">
           <div className="flex flex-col px-6 py-4 space-y-3">
             {navLinks.map(link => (
               <NavLink
                 key={link.to}
                 to={`${langPrefix}${link.to}`}
                 onClick={handleLinkClick}
                 className={({ isActive }) => `py-2 text-lg ${isActive ? `${linkClasses} ${activeLinkClasses}` : linkClasses}`}
               >
                 {link.label}
               </NavLink>
             ))}
             <hr className="my-3"/>
             <Link
                to={`${langPrefix}/login`}
                onClick={handleLinkClick}
                className="bg-apricot-orange text-white font-lexend font-semibold py-3 px-4 rounded-lg text-center hover:opacity-90 transition-opacity duration-300 w-full"
             >
               {t('navbar.login')}
             </Link>

            {/* Seletor de Idiomas Mobile (NOVA VERSÃO) */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-start space-x-4 px-1 py-2">
                <span className="text-2xl">🌍</span>
                <div className="flex items-center space-x-2">
                  {languages.map(l => (
                    <button
                      key={l.code}
                      onClick={() => changeLanguage(l.code)}
                      className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200 ${
                        currentLang.code === l.code
                          ? 'bg-apricot-orange text-white shadow-sm'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {l.code.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

           </div>
         </div>
       )}
    </header>
  );
}