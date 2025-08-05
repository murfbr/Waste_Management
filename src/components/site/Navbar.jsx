import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from "../Vertical-Azul-SVG.svg";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const lang = i18n.language;
  const prefix = lang === 'pt' ? '' : `/${lang}`;

  const navLinks = [
    { to: '/', label: t('navbar.home') },
    { to: '/produto', label: t('navbar.product') },
    { to: '/sobre', label: t('navbar.about') },
    { to: '/contato', label: t('navbar.contact') },
  ];

  const languages = [
    { code: 'pt', label: 'Português' },
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' }
  ];

  const currentLang = i18n.language;
  const selected = languages.find(l => l.code === currentLang) || languages[0];

  const changeLanguage = (lng) => {
    const path = location.pathname.replace(/^\/(en|es)/, '');
    i18n.changeLanguage(lng);
    if (lng === 'pt') {
      navigate(path || '/');
    } else {
      navigate(`/${lng}${path}`);
    }
    setIsLangOpen(false);
    setIsMobileMenuOpen(false);
  };

  const linkClasses = "font-comfortaa text-rich-soil hover:text-apricot-orange transition-colors duration-300";
  const activeLinkClasses = "text-apricot-orange font-semibold";

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">

        {/* Logo */}
        <Link to={`${prefix}/`} onClick={handleLinkClick}>
          <img src={logo} alt="Ctrl+Waste" className="h-12 w-auto" />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={`${prefix}${link.to}`}
              className={({ isActive }) => (isActive ? `${linkClasses} ${activeLinkClasses}` : linkClasses)}
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Dropdown Idioma Desktop */}
        <div className="hidden md:flex items-center space-x-4 relative">
          <button onClick={() => setIsLangOpen(!isLangOpen)} className="text-sm text-rich-soil hover:text-apricot-orange">
            {selected.code.toUpperCase()} ▼
          </button>
          {isLangOpen && (
            <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-md z-50">
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

        {/* Botão Login Desktop */}
        <Link to={`${prefix}/login`} className="hidden md:block bg-apricot-orange text-white font-lexend font-semibold text-corpo py-2 px-6 rounded-lg hover:bg-apricot-orange transition-colors duration-300">
          {t('navbar.login')}
        </Link>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-blue-coral focus:outline-none">
            {isMobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Panel */}
      <div className={`md:hidden absolute w-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full opacity-0'}`} style={{ top: '100%', left: 0 }}>
        {isMobileMenuOpen && (
          <div className="flex flex-col px-8 py-4 space-y-4">
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={`${prefix}${link.to}`}
                onClick={handleLinkClick}
                className={({ isActive }) => (isActive ? `${linkClasses} ${activeLinkClasses}` : linkClasses)}
              >
                {link.label}
              </NavLink>
            ))}
            <hr />
            <Link to={`${prefix}/login`} onClick={handleLinkClick} className="bg-apricot-orange text-white font-lexend font-semibold text-corpo py-3 px-4 rounded-lg text-center hover:bg-apricot-orange transition-colors duration-300">
              {t('navbar.login')}
            </Link>

            {/* Idioma Dropdown Mobile */}
            <div className="pt-4">
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
          </div>
        )}
      </div>
    </header>
  );
}
