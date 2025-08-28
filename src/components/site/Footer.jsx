import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Ícones SVG customizados
const InstagramIcon = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const LinkedinIcon = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const MailIcon = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const PhoneIcon = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

export default function Footer() {
  const { t, i18n } = useTranslation('site');
  const location = useLocation();
  const lang = i18n.language;
  const prefix = lang === 'pt' ? '' : `/${lang}`;
  const currentYear = new Date().getFullYear();

  const linkClasses = "font-comfortaa text-early-frost hover:text-apricot-orange transition-colors duration-300";
  
  const socialLinks = [
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/ctrl.waste/',
      icon: InstagramIcon
    },
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/company/ctrl-waste/posts/',
      icon: LinkedinIcon
    }
  ];

  return (
    <footer className="bg-blue-coral text-white">
      <div className="container mx-auto px-6 py-12">
        {/* Seção principal do footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* Logo e descrição */}
          <div className="md:col-span-1">
            <h3 className="text-3xl font-bold font-lexend mb-4">Ctrl+Waste</h3>
            <p className="text-early-frost font-comfortaa mb-6 leading-relaxed">
              {t('footer.slogan')}
            </p>
            
            {/* Redes Sociais */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/10 hover:bg-apricot-orange p-3 rounded-full transition-all duration-300 hover:scale-110 group"
                    aria-label={`Seguir no ${social.name}`}
                  >
                    <IconComponent 
                      size={20} 
                      className="text-early-frost group-hover:text-white transition-colors duration-300" 
                    />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Links de navegação */}
          <div className="md:col-span-1">
            <h4 className="text-xl font-semibold font-lexend mb-6 text-early-frost">
              {t('footer.navigation') || 'Navegação'}
            </h4>
            <nav className="space-y-3">
              <Link 
                to={`${prefix}/`} 
                className={`${linkClasses} block hover:translate-x-2 transition-all duration-300`}
              >
                {t('footer.links.home')}
              </Link>
              <Link 
                to={`${prefix}/produto`} 
                className={`${linkClasses} block hover:translate-x-2 transition-all duration-300`}
              >
                {t('footer.links.product')}
              </Link>
              <Link 
                to={`${prefix}/contato`} 
                className={`${linkClasses} block hover:translate-x-2 transition-all duration-300`}
              >
                {t('footer.links.contact')}
              </Link>
            </nav>
          </div>

          {/* Informações de contato */}
          <div className="md:col-span-1">
            <h4 className="text-xl font-semibold font-lexend mb-6 text-early-frost">
              {t('footer.contact') || 'Contato'}
            </h4>
            <div className="space-y-4">
              <a 
                href="mailto:contato@ctrlwaste.com" 
                className="flex items-center space-x-3 text-early-frost hover:text-apricot-orange transition-colors duration-300"
              >
                <MailIcon size={18} />
                <span className="font-comfortaa">contato@ctrlwaste.com.br</span>
              </a>
              <a 
                href="https://wa.me/5521995091590?text=Ol%C3%A1%21%20Gostaria%20de%20mais%20informa%C3%A7%C3%B5es." 
                className="flex items-center space-x-3 text-early-frost hover:text-apricot-orange transition-colors duration-300"
              >
                <PhoneIcon size={18} />
                <span className="font-comfortaa">+55 (21) 99509-1590</span>
              </a>
            </div>
          </div>
        </div>

        {/* Divisor */}
        <div className="border-t border-white/20 pt-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            
            {/* Copyright */}
            <p className="text-center md:text-left font-comfortaa text-early-frost text-sm">
              &copy; {currentYear} Ctrl+Waste. {t('footer.rights')}
            </p>

            {/* Links legais (FAZER) 
            <div className="flex space-x-6 text-sm">
              <Link 
                to={`${prefix}/privacidade`} 
                className="font-comfortaa text-early-frost hover:text-apricot-orange transition-colors duration-300"
              >
                {t('footer.privacy') || 'Privacidade'}
              </Link>
              <Link 
                to={`${prefix}/termos`} 
                className="font-comfortaa text-early-frost hover:text-apricot-orange transition-colors duration-300"
              >
                {t('footer.terms') || 'Termos'}
                
              </Link>
              
            </div>
            */}
          </div>
        </div>
      </div>
    </footer>
  );
}