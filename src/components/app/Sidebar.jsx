// src/components/app/Sidebar.jsx

import React, { useState, useContext, useRef, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AuthContext from "../../context/AuthContext";
import { signOut } from "firebase/auth";
import ConfirmationModal from "./ConfirmationModal";
import logoSvg from "../Simbolo-Laranja-SVG.svg";
import { FiZap, FiGrid, FiFileText, FiUsers, FiBriefcase, FiLogOut, FiChevronsLeft, FiChevronsRight, FiX, FiArchive, FiTruck,
  FiBookOpen, FiTool,} from "react-icons/fi"; // Biblioteca de ícones Feather

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

// --- COMPONENTES DE ÍCONE (agora usando react-icons) ---
const IconWrapper = ({ children }) => (
  <div className="w-6 h-6">{children}</div>
);

const LançamentoIcon = () => (
  <IconWrapper>
    <FiZap className="w-full h-full" />
  </IconWrapper>
);
const DashboardIcon = () => (
  <IconWrapper>
    <FiGrid className="w-full h-full" />
  </IconWrapper>
);
const DocsIcon = () => (
  <IconWrapper>
    <FiFileText className="w-full h-full" />
  </IconWrapper>
);
const AdminUsersIcon = () => (
  <IconWrapper>
    <FiUsers className="w-full h-full" />
  </IconWrapper>
);
const AdminClientesIcon = () => (
  <IconWrapper>
    <FiBriefcase className="w-full h-full" />
  </IconWrapper>
);
const LogoutIcon = () => (
  <IconWrapper>
    <FiLogOut className="w-full h-full" />
  </IconWrapper>
);
const ChevronDoubleLeftIcon = (props) => (
  <FiChevronsLeft {...props} />
);
const ChevronDoubleRightIcon = (props) => (
  <FiChevronsRight {...props} />
);
const CloseIcon = () => (
  <IconWrapper>
    <FiX className="w-full h-full" />
  </IconWrapper>
);
const MtrIcon = () => (
  <IconWrapper>
    <FiArchive className="w-full h-full" />
  </IconWrapper>
);
const FornecedorIcon = () => (
  <IconWrapper>
    <FiTruck className="w-full h-full" />
  </IconWrapper>
);
const GlossarioIcon = () => (
  <IconWrapper>
    <FiBookOpen className="w-full h-full" />
  </IconWrapper>
);
const ToolsIcon = () => (
  <IconWrapper>
    <FiTool className="w-full h-full" />
  </IconWrapper>
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