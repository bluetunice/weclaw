import React, { useState } from "react";
import {
  Cog6ToothIcon,
  DocumentArrowDownIcon,
  TrashIcon,
  InformationCircleIcon,
  ShieldExclamationIcon,
  ArrowPathIcon,
  FolderIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  KeyIcon
} from "@heroicons/react/24/outline";
import { useSettings } from "../contexts/SettingsContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useAuth } from "../contexts/AuthContext";

const Settings: React.FC = () => {
  const { settings, updateSettings, resetSettings, t } = useSettings();
  const { activeWorkspace, selectWorkspace, checkPermission } = useWorkspace();
  const { username, changeUserPassword } = useAuth();

  const [isExporting, setIsExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [testPath, setTestPath] = useState("");
  const [permissionResult, setPermissionResult] = useState<{
    allowed: boolean;
    reason: string;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // 密码修改
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleChangePassword = () => {
    setPasswordMsg(null);
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ type: "error", text: t("settings.passwordErrorEmpty") });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: t("settings.passwordErrorMismatch") });
      return;
    }
    if (newPassword.length < 4) {
      setPasswordMsg({ type: "error", text: t("settings.passwordErrorShort") });
      return;
    }
    const success = changeUserPassword(oldPassword, newPassword);
    if (success) {
      setPasswordMsg({ type: "success", text: t("settings.passwordSuccess") });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPasswordMsg({ type: "error", text: t("settings.passwordErrorWrong") });
    }
  };

  const handleExportHistory = async () => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      alert(t("settings.exportDone"));
    } catch {
      alert(t("settings.exportFail"));
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm(t("settings.clearConfirm"))) return;
    setIsClearing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert(t("settings.clearDone"));
    } catch {
      alert(t("settings.clearFail"));
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearCache = () => {
    if (confirm(t("settings.clearCacheConfirm"))) {
      alert(t("settings.clearCacheDone"));
    }
  };

  const handleResetSettings = () => {
    if (confirm(t("settings.resetConfirm"))) {
      resetSettings();
      alert(t("settings.resetDone"));
    }
  };

  const handleTestPermission = async () => {
    if (!testPath.trim()) {
      alert(t("workspace.inputPath"));
      return;
    }
    setIsTesting(true);
    try {
      const result = await checkPermission(testPath);
      setPermissionResult({
        allowed: result,
        reason: result ? t("workspace.pathInside") : t("workspace.pathOutside"),
      });
    } catch (error) {
      console.error("测试权限失败:", error);
      setPermissionResult({
        allowed: false,
        reason: t("workspace.testFailed"),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearWorkspace = () => {
    if (confirm(t("workspace.clearConfirm"))) {
      alert(t("workspace.clearDone"));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {t("settings.title")}
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t("settings.subtitle")}</p>
      </div>

      {/* 账号安全 */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
          <KeyIcon className="h-4 w-4 mr-1.5" />
          {t("settings.account")}
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <div className="h-8 w-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
              <span className="text-primary-600 dark:text-primary-400 text-xs font-medium">
                {username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{username}</p>
              <p className="text-[10px] text-gray-500">{t("settings.accountHint")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t("settings.oldPassword")}
              </label>
              <input
                type="password"
                className="input text-xs"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder={t("settings.oldPasswordPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t("settings.newPassword")}
              </label>
              <input
                type="password"
                className="input text-xs"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t("settings.newPasswordPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t("settings.confirmPassword")}
              </label>
              <input
                type="password"
                className="input text-xs"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("settings.confirmPasswordPlaceholder")}
              />
            </div>
          </div>

          {passwordMsg && (
            <div
              className={`p-2 rounded text-xs ${
                passwordMsg.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              {passwordMsg.text}
            </div>
          )}

          <button
            onClick={handleChangePassword}
            className="btn-primary text-xs"
          >
            {t("settings.changePassword")}
          </button>
        </div>
      </div>

      {/* 工作区设置 */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
          <FolderIcon className="h-4 w-4 mr-1.5" />
          {t("workspace.title")}
        </h2>
        <div className="space-y-3">
          {activeWorkspace ? (
            <>
              <div className="bg-green-50 border-l-2 border-green-400 p-2 rounded-r">
                <div className="flex">
                  <CheckCircleIcon className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <div className="ml-2">
                    <p className="text-xs font-medium text-green-800">
                      {t("workspace.setTitle")}
                    </p>
                    <p className="text-[10px] text-green-700 mt-0.5">
                      {t("workspace.setDesc")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-gray-500">{t("workspace.name")}</p>
                  <p className="text-xs font-medium">{activeWorkspace.name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">{t("workspace.path")}</p>
                  <p className="text-xs font-medium truncate">{activeWorkspace.path}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">{t("workspace.createdAt")}</p>
                  <p className="text-xs font-medium">
                    {new Date(activeWorkspace.created_at).toLocaleString("zh-CN")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">{t("workspace.status")}</p>
                  <p className="text-xs font-medium text-green-600">
                    {t("workspace.active")}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={selectWorkspace}
                  className="btn-primary flex items-center gap-1.5 text-xs"
                >
                  <FolderIcon className="h-3.5 w-3.5" />
                  <span>{t("workspace.change")}</span>
                </button>
                <button
                  onClick={handleClearWorkspace}
                  className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 text-xs"
                >
                  {t("workspace.clear")}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-3">
              <div className="bg-yellow-50 border-l-2 border-yellow-400 p-2 rounded-r inline-flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                <div className="ml-2">
                  <p className="text-xs font-medium text-yellow-800">
                    {t("workspace.noSet")}
                  </p>
                  <p className="text-[10px] text-yellow-700 mt-0.5">
                    {t("workspace.noSetDesc")}
                  </p>
                </div>
              </div>

              <button
                onClick={selectWorkspace}
                className="mt-3 btn-primary flex items-center gap-1.5 mx-auto text-xs"
              >
                <FolderIcon className="h-3.5 w-3.5" />
                <span>{t("workspace.setBtn")}</span>
              </button>
            </div>
          )}

          {/* 权限测试工具 */}
          <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
            <h3 className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1.5">
              {t("workspace.testTool")}
            </h3>
            <p className="text-[10px] text-gray-500 mb-2">
              {t("workspace.testPathHint")}
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                className="input flex-1 text-xs"
                value={testPath}
                onChange={(e) => setTestPath(e.target.value)}
                placeholder={t("workspace.testPathPlaceholder")}
              />
              <button
                onClick={handleTestPermission}
                disabled={!activeWorkspace || isTesting}
                className="btn-secondary disabled:opacity-50 text-xs"
              >
                {isTesting ? t("workspace.testing") : t("workspace.testBtn")}
              </button>
            </div>

            {permissionResult && (
              <div
                className={`mt-2 p-2 rounded border text-xs ${
                  permissionResult.allowed
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-center">
                  {permissionResult.allowed ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-400" />
                  ) : (
                    <XCircleIcon className="h-4 w-4 text-red-400" />
                  )}
                  <div className="ml-2">
                    <p
                      className={`font-medium ${
                        permissionResult.allowed
                          ? "text-green-800"
                          : "text-red-800"
                      }`}
                    >
                      {permissionResult.allowed
                        ? t("workspace.allowed")
                        : t("workspace.denied")}
                    </p>
                    <p
                      className={`text-[10px] ${
                        permissionResult.allowed
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {permissionResult.reason}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 应用程序设置 */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
          <Cog6ToothIcon className="h-4 w-4 mr-1.5" />
          {t("settings.app")}
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoStart}
                  onChange={(e) =>
                    updateSettings({ autoStart: e.target.checked })
                  }
                  className="h-3.5 w-3.5 text-primary-600"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">{t("settings.autoStart")}</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showNotifications}
                  onChange={(e) =>
                    updateSettings({ showNotifications: e.target.checked })
                  }
                  className="h-3.5 w-3.5 text-primary-600"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  {t("settings.notifications")}
                </span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t("settings.language")}
              </label>
              <div className="relative">
                <select
                  className="input appearance-none w-full pr-8 text-xs"
                  value={settings.language}
                  onChange={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const value = e.target.value as "zh-CN" | "en-US";
                    updateSettings({ language: value });
                  }}
                >
                  <option value="zh-CN">简体中文</option>
                  <option value="en-US">English</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t("settings.theme")}
              </label>
              <div className="relative">
                <select
                  className="input appearance-none w-full pr-8 text-xs"
                  value={settings.theme}
                  onChange={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const value = e.target.value as "light" | "dark" | "system";
                    updateSettings({ theme: value });
                  }}
                >
                  <option value="light">{t("settings.theme.light")}</option>
                  <option value="dark">{t("settings.theme.dark")}</option>
                  <option value="system">{t("settings.theme.system")}</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t("settings.historyDays")}
              </label>
              <input
                type="number"
                className="input text-xs"
                value={settings.keepHistoryDays}
                onChange={(e) =>
                  updateSettings({
                    keepHistoryDays: parseInt(e.target.value) || 30
                  })
                }
                min="1"
                max="365"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t("settings.maxEntries")}
              </label>
              <input
                type="number"
                className="input text-xs"
                value={settings.maxHistoryEntries}
                onChange={(e) =>
                  updateSettings({
                    maxHistoryEntries: parseInt(e.target.value) || 200
                  })
                }
                min="10"
                max="1000"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t("settings.tokenLimit") || "Token 限额"}
              </label>
              <input
                type="number"
                className="input text-xs"
                value={settings.tokenLimit}
                onChange={(e) =>
                  updateSettings({
                    tokenLimit: parseInt(e.target.value) || 1000000
                  })
                }
                min="1000"
                step="1000"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 数据管理 */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
          <DocumentArrowDownIcon className="h-4 w-4 mr-1.5" />
          {t("settings.data")}
        </h2>
        <div className="space-y-3">
          <div className="bg-blue-50 border-l-2 border-blue-400 p-2 rounded-r">
            <div className="flex">
              <InformationCircleIcon className="h-4 w-4 text-blue-400" />
              <div className="ml-2">
                <p className="text-xs text-blue-700">
                  {t("settings.dataLocalNote")}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <button
              onClick={handleExportHistory}
              disabled={isExporting}
              className="btn-secondary flex items-center justify-center gap-1.5 disabled:opacity-50 text-xs"
            >
              {isExporting ? (
                <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <DocumentArrowDownIcon className="h-3.5 w-3.5" />
              )}
              <span>
                {isExporting ? t("settings.exporting") : t("settings.export")}
              </span>
            </button>

            <button
              onClick={handleClearHistory}
              disabled={isClearing}
              className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 flex items-center justify-center gap-1.5 disabled:opacity-50 text-xs"
            >
              {isClearing ? (
                <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <TrashIcon className="h-3.5 w-3.5" />
              )}
              <span>
                {isClearing
                  ? t("settings.clearing")
                  : t("settings.clearHistory")}
              </span>
            </button>

            <button
              onClick={handleClearCache}
              className="btn-secondary flex items-center justify-center gap-1.5 text-xs"
            >
              <TrashIcon className="h-3.5 w-3.5" />
              <span>{t("settings.clearCache")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 安全设置 */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
          <ShieldExclamationIcon className="h-4 w-4 mr-1.5" />
          {t("settings.security")}
        </h2>
        <div className="space-y-3">
          <div className="bg-yellow-50 border-l-2 border-yellow-400 p-2 rounded-r">
            <div className="flex">
              <ShieldExclamationIcon className="h-4 w-4 text-yellow-400" />
              <div className="ml-2">
                <p className="text-xs font-medium text-yellow-800">
                  {t("settings.securityTitle2")}
                </p>
                <ul className="text-[10px] text-yellow-700 mt-1 list-disc list-inside space-y-0.5">
                  <li>{t("settings.securityItem1")}</li>
                  <li>{t("settings.securityItem2")}</li>
                  <li>{t("settings.securityItem3")}</li>
                  <li>{t("settings.securityItem4")}</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <div>
              <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                {t("settings.appPerms")}
              </p>
              <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">
                {t("settings.appPermsDesc")}
              </p>
            </div>
            <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">
              {t("settings.managePerms")}
            </button>
          </div>
        </div>
      </div>

      {/* 高级设置 */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          {t("settings.advanced")}
        </h2>
        <div className="space-y-3">
          <div className="p-2 border border-gray-200 dark:border-gray-700 rounded">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                  {t("settings.resetTitle")}
                </p>
                <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">
                  {t("settings.resetDesc")}
                </p>
              </div>
              <button
                onClick={handleResetSettings}
                className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 border border-red-200 rounded transition-colors"
              >
                {t("settings.reset")}
              </button>
            </div>
          </div>

          <div className="p-2 border border-gray-200 dark:border-gray-700 rounded">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                  {t("settings.devtoolsTitle")}
                </p>
                <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">
                  {t("settings.devtoolsDesc")}
                </p>
              </div>
              <button
                onClick={() =>
                  window.electron?.ipcRenderer?.send("open-devtools")
                }
                className="px-3 py-1.5 text-xs text-primary-600 hover:bg-primary-50 border border-primary-200 rounded transition-colors"
              >
                {t("settings.devtools")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 关于 */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          {t("settings.aboutTitle")} {t("app.name")}
        </h2>
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <p className="text-lg font-bold text-primary-600">1.0.0</p>
              <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">
                {t("settings.versionLabel")}
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <p className="text-lg font-bold text-primary-600">Electron</p>
              <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">
                {t("settings.frameworkLabel")}
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <p className="text-lg font-bold text-primary-600">React 18</p>
              <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">
                {t("settings.frontendLabel")}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400">{t("settings.aboutDesc")}</p>
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                © 2026 WeClaw Team · {t("settings.copyright")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
