import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  HomeIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
  ClipboardDocumentListIcon,
  CpuChipIcon,
  QueueListIcon,
  Cog6ToothIcon,
  ArrowRightCircleIcon,
  UserCircleIcon,
  BoltIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { useSettings } from "../contexts/SettingsContext";
import { useAuth } from "../contexts/AuthContext";
import { WeClawLogo } from "./WeClawLogo";
import {
  loadConversations,
  saveActiveConversationId,
  deleteConversation
} from "../utils/storage";
import { Conversation } from "../types";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface ClawSession {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { t } = useSettings();
  const { username, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);


  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };


  const navItems = [
    { to: "/dashboard", icon: HomeIcon, labelKey: "nav.dashboard" },
    { to: "/chat", icon: ChatBubbleLeftRightIcon, labelKey: "nav.chat" },
    { to: "/claw", icon: BoltIcon, labelKey: "nav.clawAgent", highlight: true },
    { to: "/workflow", icon: ArrowPathIcon, labelKey: "nav.workflow" },
    { to: "/skills", icon: SparklesIcon, labelKey: "nav.skills" },
    { to: "/tasks", icon: ClipboardDocumentListIcon, labelKey: "nav.tasks" }
  ];

  return (
    <aside
      className={`relative flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 transition-[width] duration-300 ease-in-out overflow-hidden ${
        collapsed ? "w-14" : "w-56"
      }`}
    >
      {/* Logo 区域 */}
      <div
        className={`flex items-center border-b border-gray-100 dark:border-gray-700 flex-shrink-0 transition-all duration-300 ${
          collapsed ? "px-0 py-4 justify-center" : "px-4 py-4"
        }`}
      >
        <div className="flex-shrink-0">
          <WeClawLogo size={collapsed ? 32 : 36} />
        </div>
        {!collapsed && (
          <div className="ml-2.5 overflow-hidden whitespace-nowrap">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
              WeClaw
            </h2>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight">
              {t("app.name")}
            </p>
          </div>
        )}
      </div>

      {/* 导航 + 会话列表区域 */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* 导航菜单 */}
        <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden">
          {navItems.map((item:any) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? t(item.labelKey) : undefined}
              className={({ isActive }) =>
                `group relative flex items-center transition-colors duration-150 mx-1.5 my-0.5 rounded-lg ${
                  collapsed
                    ? "justify-center px-0 py-2.5"
                    : "px-3 py-2.5 space-x-3 left-0"
                } ${
                  isActive
                    ? item.highlight
                      ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                      : "bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300"
                    : item.highlight
                      ? "text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-300"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* 激活指示条 */}
                  {isActive && !collapsed && (
                    <span
                      className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full -ml-1.5 ${
                        item.highlight
                          ? "bg-indigo-500 dark:bg-indigo-400"
                          : "bg-primary-600 dark:bg-primary-400"
                      }`}
                    />
                  )}

                  <item.icon
                    className={`flex-shrink-0 h-5 w-5 ${
                      isActive
                        ? item.highlight
                          ? "text-indigo-600 dark:text-indigo-400"
                          : "text-primary-600 dark:text-primary-400"
                        : item.highlight
                          ? "text-indigo-500 dark:text-indigo-400"
                          : "text-gray-500 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                    }`}
                  />

                  {!collapsed && (
                    <span
                      className={`text-sm font-medium whitespace-nowrap overflow-hidden ${
                        item.highlight && !isActive ? "font-semibold" : ""
                      }`}
                    >
                      {t(item.labelKey)}
                    </span>
                  )}

                  {/* 折叠态 Tooltip */}
                  {collapsed && (
                    <div className="pointer-events-none absolute left-full ml-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <div className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-gray-800 dark:bg-gray-600 rotate-45 -mr-0.5" />
                        <span className="bg-gray-800 dark:bg-gray-600 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap shadow-lg">
                          {t(item.labelKey)}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* 底部：用户菜单区域 */}
      <div
        className={`relative border-t border-gray-100 dark:border-gray-700 flex-shrink-0 ${
          collapsed ? "py-2 justify-center" : "px-3 py-3"
        }`}
        ref={menuRef}
      >
        {/* 用户按钮 */}
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className={`w-full flex items-center space-x-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
            collapsed ? "justify-center py-2" : "px-2 py-2"
          }`}
        >
          <UserCircleIcon className="h-6 w-6 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          {!collapsed && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
              {username}
            </span>
          )}
        </button>

        {/* 用户菜单弹框 */}
        {showUserMenu && !collapsed && (
          <div className="absolute bottom-full left-0 right-0 mb-1 mx-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50">
            <button
              onClick={() => {
                navigate("/history");
                setShowUserMenu(false);
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <QueueListIcon className="h-4 w-4 mr-3" />
              {t("sidebar.userMenu.history")}
            </button>
            <button
              onClick={() => {
                navigate("/models");
                setShowUserMenu(false);
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <CpuChipIcon className="h-4 w-4 mr-3" />
              {t("sidebar.userMenu.models")}
            </button>
            <button
              onClick={() => {
                navigate("/tools");
                setShowUserMenu(false);
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <WrenchScrewdriverIcon className="h-4 w-4 mr-3" />
              {t("sidebar.userMenu.tools")}
            </button>
            <button
              onClick={() => {
                navigate("/settings");
                setShowUserMenu(false);
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Cog6ToothIcon className="h-4 w-4 mr-3" />
              {t("sidebar.userMenu.settings")}
            </button>
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowRightCircleIcon className="h-4 w-4 mr-3" />
              {t("sidebar.userMenu.logout")}
            </button>
          </div>
        )}

        {/* 折叠状态菜单 */}
        {showUserMenu && collapsed && (
          <div className="absolute bottom-full left-full ml-1 mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50 min-w-[140px]">
            <button
              onClick={() => {
                navigate("/history");
                setShowUserMenu(false);
              }}
              className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <QueueListIcon className="h-4 w-4 mr-2" />
              {t("sidebar.userMenu.history")}
            </button>
            <button
              onClick={() => {
                navigate("/models");
                setShowUserMenu(false);
              }}
              className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <CpuChipIcon className="h-4 w-4 mr-2" />
              {t("sidebar.userMenu.models")}
            </button>
            <button
              onClick={() => {
                navigate("/tools");
                setShowUserMenu(false);
              }}
              className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <WrenchScrewdriverIcon className="h-4 w-4 mr-2" />
              {t("sidebar.userMenu.tools")}
            </button>
            <button
              onClick={() => {
                navigate("/settings");
                setShowUserMenu(false);
              }}
              className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Cog6ToothIcon className="h-4 w-4 mr-2" />
              {t("sidebar.userMenu.settings")}
            </button>
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowRightCircleIcon className="h-4 w-4 mr-2" />
              {t("sidebar.userMenu.logout")}
            </button>
          </div>
        )}

        {/* 展开/收起按钮 */}
        <button
          onClick={onToggle}
          title={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
          className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center h-7 w-7 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
            showUserMenu && collapsed ? "z-50" : ""
          }`}
        >
          {collapsed ? (
            <ChevronRightIcon className="h-4 w-4" />
          ) : (
            <ChevronLeftIcon className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
