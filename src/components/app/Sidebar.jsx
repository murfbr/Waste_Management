// src/components/app/Sidebar.jsx

import React, { useState, useContext, useRef, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AuthContext from "../../context/AuthContext";
import { signOut } from "firebase/auth";
import ConfirmationModal from "./ConfirmationModal";
import logoSvg from "../Simbolo-Laranja-SVG.svg";

// --- HOOK CUSTOMIZADO PARA CLIQUE FORA ---
const useOutsideClick = (callback) => {
  const ref = useRef();

  useEffect(() => {
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [callback]);

  return ref;
};

// --- ÍCONES SVG (sem alteração) ---
const LançamentoIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
);
const DashboardIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);
const DocsIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);
const AdminUsersIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.975 5.975 0 0112 13a5.975 5.975 0 016-5.197M15 21a9 9 0 00-9-5.197"
    />
  </svg>
);
const AdminClientesIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);
const LogoutIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
);
const ChevronDoubleLeftIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5"
    />
  </svg>
);
const ChevronDoubleRightIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5"
    />
  </svg>
);
const CloseIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M6 18L18 6M6 6l12 12"
    ></path>
  </svg>
);
const MtrIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    ></path>
  </svg>
);
const FornecedorIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
    ></path>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M19 17H5.714C4.767 17 4 16.233 4 15.286V8.714C4 7.767 4.767 7 5.714 7H15l4 4v4.286zM4 12h15"
    ></path>
  </svg>
);
const GlossarioIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 20L12 4L20 20M7 14H17"
    />
  </svg>
);
const ToolsIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    ></path>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    ></path>
  </svg>
);

const NavItem = ({ to, icon, text, isCollapsed, onClick }) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center p-2.5 rounded-md transition duration-200 font-lexend text-corpo ${
          isCollapsed ? "justify-center space-x-0" : "space-x-4"
        } ` +
        (isActive
          ? "bg-apricot-orange text-white"
          : "text-white hover:bg-white/10")
      }
      title={isCollapsed ? text : ""}
    >
      {icon}
      <span className={`${isCollapsed ? "hidden" : "inline-block"}`}>
        {text}
      </span>
    </NavLink>
  );
};

const LanguageSelector = ({ isCollapsed }) => {
  const { i18n } = useTranslation("sidebar");
  const location = useLocation();
  const navigate = useNavigate();

  const [isLangOpen, setIsLangOpen] = useState(false);
  const langDropdownRef = useOutsideClick(() => setIsLangOpen(false));

  const languages = [
    { code: "pt", label: "Português" },
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
  ];
  const currentLang =
    languages.find((l) => l.code === i18n.language) || languages[0];

  const changeLanguage = (lng) => {
    const path = location.pathname.replace(/^\/(en|es)/, "");
    i18n.changeLanguage(lng);
    const newPath = lng === "pt" ? path || "/" : `/${lng}${path}`;
    navigate(newPath);
    setIsLangOpen(false);
  };

  if (isCollapsed) {
    return (
      <div className="relative group">
        <div className="flex items-center justify-center p-2.5 rounded-md transition duration-200 text-white hover:bg-white/10 cursor-pointer">
          <span className="text-xl">🌍</span>
        </div>
        <div className="absolute left-full top-0 ml-2 w-36 bg-blue-coral shadow-lg rounded-md hidden group-hover:block ring-1 ring-white/20 z-50">
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => changeLanguage(l.code)}
              className={`block w-full text-left px-4 py-2 text-sm text-white rounded-md ${
                currentLang.code === l.code
                  ? "bg-apricot-orange"
                  : "hover:bg-white/10"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative px-2 pt-2" ref={langDropdownRef}>
      <button
        onClick={() => setIsLangOpen(!isLangOpen)}
        className="w-full flex items-center justify-between p-2.5 rounded-md transition duration-200 text-white hover:bg-white/10"
        aria-haspopup="true"
        aria-expanded={isLangOpen}
      >
        <div className="flex items-center space-x-2">
          <span className="text-xl">🌍</span>
          <span>{currentLang.code.toUpperCase()}</span>
        </div>
        <span
          className={`transform transition-transform duration-200 ${
            isLangOpen ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>
      {isLangOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-full bg-blue-coral shadow-lg rounded-md ring-1 ring-white/20 z-50">
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => changeLanguage(l.code)}
              className={`block w-full text-left px-4 py-3 text-sm rounded-md text-white ${
                currentLang.code === l.code
                  ? "bg-apricot-orange"
                  : "hover:bg-white/10"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function Sidebar({
  isOpen,
  toggleSidebar,
  isCollapsed,
  onToggleCollapse,
}) {
  const {
    userProfile,
    currentUser,
    auth: authInstanceFromContext,
  } = useContext(AuthContext);
  const { t, i18n } = useTranslation("sidebar");
  const navigate = useNavigate();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const langPrefix = i18n.language === "pt" ? "" : `/${i18n.language}`;

  const handleConfirmLogout = async () => {
    try {
      await signOut(authInstanceFromContext);
      setIsLogoutModalOpen(false);
      if (isOpen && typeof toggleSidebar === "function") toggleSidebar();
      navigate(`${langPrefix}/login`);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const handleLogoutRequest = () => {
    setIsLogoutModalOpen(true);
  };

  const handleLinkClick = () => {
    if (isOpen && typeof toggleSidebar === "function") {
      toggleSidebar();
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black opacity-50 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      <aside
        className={`
          bg-blue-coral text-white flex flex-col
          fixed inset-y-0 left-0 z-30 h-[100dvh]
          transform transition-all duration-300 ease-in-out
          md:relative
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
          ${isCollapsed ? "w-20" : "w-64"} 
        `}
        aria-label="Sidebar principal"
      >
        <button
          onClick={onToggleCollapse}
          className="absolute top-1/2 right-0 hidden md:flex items-center justify-center w-6 h-12 transform translate-x-1/2 -translate-y-1/2 bg-blue-coral hover:bg-apricot-orange text-white rounded-r-lg cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-apricot-orange z-40"
          title={isCollapsed ? t("menu.expand") : t("menu.collapse")}
        >
          {isCollapsed ? (
            <ChevronDoubleRightIcon className="w-5 h-5" />
          ) : (
            <ChevronDoubleLeftIcon className="w-5 h-5" />
          )}
        </button>

        <div
          className={`p-4 flex items-center border-b border-white/20 flex-shrink-0 ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          <img
            src={logoSvg}
            alt="CtrlWaste"
            title="CtrlWaste"
            className={`h-8 w-auto transition-opacity duration-200 ${
              isCollapsed ? "hidden" : "inline-block"
            }`}
          />
          <span
            className={`font-lexend text-2xl font-bold text-white transition-opacity duration-200 ${
              isCollapsed ? "inline-block" : "hidden"
            }`}
          >
            <img
              src={logoSvg}
              alt="CtrlWaste"
              className="h-8 w-auto"
              title="CtrlWaste"
            />
          </span>
          <button
            onClick={toggleSidebar}
            className="md:hidden p-1 text-white/80 hover:text-white"
            aria-label="Fechar menu"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="flex-grow overflow-y-auto p-2 space-y-1">
          {userProfile ? (
            <>
              {(userProfile.role === "master" ||
                userProfile.role === "gerente" ||
                userProfile.role === "operacional") && (
                <NavItem
                  to={`${langPrefix}/app/lancamento`}
                  icon={<LançamentoIcon />}
                  text={t("navigation.entry")}
                  isCollapsed={isCollapsed}
                  onClick={handleLinkClick}
                />
              )}
              {(userProfile.role === "master" ||
                userProfile.role === "gerente") && (
                <NavItem
                  to={`${langPrefix}/app/dashboard`}
                  icon={<DashboardIcon />}
                  text={t("navigation.dashboards")}
                  isCollapsed={isCollapsed}
                  onClick={handleLinkClick}
                />
              )}
              {(userProfile.role === "master" ||
                userProfile.role === "gerente") && (
                <>
                  <hr
                    className={`my-2 border-white/20 ${isCollapsed && "mx-4"}`}
                  />
                  {!isCollapsed && (
                    <p className="px-4 pt-2 pb-1 text-xs font-lexend text-white/70 uppercase">
                      {t("navigation.info")}
                    </p>
                  )}
                  <NavItem
                    to={`${langPrefix}/app/glossario`}
                    icon={<GlossarioIcon />}
                    text={t("navigation.glossary")}
                    isCollapsed={isCollapsed}
                    onClick={handleLinkClick}
                  />
                </>
              )}
              {(userProfile.role === "master" ||
                userProfile.role === "gerente") && (
                <>
                  <hr
                    className={`my-2 border-white/20 ${isCollapsed && "mx-4"}`}
                  />
                  {!isCollapsed && (
                    <p className="px-4 pt-2 pb-1 text-xs font-lexend text-white/70 uppercase">
                      {t("navigation.admin")}
                    </p>
                  )}
                  <NavItem
                    to={`${langPrefix}/app/admin/usuarios`}
                    icon={<AdminUsersIcon />}
                    text={t("navigation.users")}
                    isCollapsed={isCollapsed}
                    onClick={handleLinkClick}
                  />
                </>
              )}
              {userProfile.role === "master" && (
                <>
                  <NavItem
                    to={`${langPrefix}/app/admin/clientes`}
                    icon={<AdminClientesIcon />}
                    text={t("navigation.clients")}
                    isCollapsed={isCollapsed}
                    onClick={handleLinkClick}
                  />
                  <NavItem
                    to={`${langPrefix}/app/admin/empresas-coleta`}
                    icon={<FornecedorIcon />}
                    text={t("navigation.collectors")}
                    isCollapsed={isCollapsed}
                    onClick={handleLinkClick}
                  />
                  <NavItem
                    to={`${langPrefix}/app/admin/gestao-mtr`}
                    icon={<MtrIcon />}
                    text="Gestão MTR/CDF"
                    isCollapsed={isCollapsed}
                    onClick={handleLinkClick}
                  />
                  <NavItem
                    to={`${langPrefix}/app/admin/master-tools`}
                    icon={<ToolsIcon />}
                    text={t("navigation.masterTools")}
                    isCollapsed={isCollapsed}
                    onClick={handleLinkClick}
                  />
                </>
              )}
            </>
          ) : (
            <div className="p-4 text-white/60">...</div>
          )}
        </nav>

        <div className="p-2 border-t border-white/20 flex-shrink-0">
          <LanguageSelector isCollapsed={isCollapsed} />

          <div
            className={`font-comfortaa mt-2 ${
              isCollapsed ? "hidden" : "block"
            }`}
          >
            {userProfile && userProfile.role && (
              <p className="text-xs text-white/70 text-center mb-1">
                {t("user.level")}:{" "}
                {userProfile.role.charAt(0).toUpperCase() +
                  userProfile.role.slice(1)}
              </p>
            )}
            {currentUser && currentUser.email && (
              <p
                className="text-xs text-white/60 text-center break-all mb-2 truncate"
                title={currentUser.email}
              >
                {currentUser.email}
              </p>
            )}
          </div>
          <button
            onClick={handleLogoutRequest}
            className={`w-full flex items-center font-lexend py-2 px-4 rounded-lg text-sm transition duration-200 bg-apricot-orange hover:opacity-90 mt-2 ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <LogoutIcon />
            <span className={isCollapsed ? "hidden" : "ml-2"}>
              {t("logout.button")}
            </span>
          </button>
        </div>
      </aside>

      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onCancel={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        title={t("logout.modalTitle")}
        message={t("logout.modalMessage")}
        confirmText={t("logout.modalConfirm")}
        theme="danger"
      />
    </>
  );
}
