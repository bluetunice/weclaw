import React, { useState } from "react";
import {
  Cog6ToothIcon,
  XMarkIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { HistorySyncConfig, OperationHistory } from "../../types";
import { useSettings } from "../../contexts/SettingsContext";

interface SyncLog {
  time: string;
  msg: string;
  ok: boolean;
}

interface HistorySyncPanelProps {
  editConfig: HistorySyncConfig;
  isSyncing: boolean;
  configDirty: boolean;
  syncLog: SyncLog[];
  history: OperationHistory[];
  onEditChange: <K extends keyof HistorySyncConfig>(
    key: K,
    value: HistorySyncConfig[K]
  ) => void;
  onSave: () => void;
  onCancel: () => void;
  onClose: () => void;
  onTestSync: () => void;
}

const HistorySyncPanel: React.FC<HistorySyncPanelProps> = ({
  editConfig,
  isSyncing,
  configDirty,
  syncLog,
  onEditChange,
  onSave,
  onCancel,
  onClose,
  onTestSync,
}) => {
  const { t } = useSettings();
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ── 复用样式片段 ──────────────────────────────────────────────────────────
  const labelCls =
    "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
  const toggleCls = (on: boolean) =>
    `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      on ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-600"
    }`;
  const thumbCls = (on: boolean) =>
    `inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
      on ? "translate-x-6" : "translate-x-1"
    }`;
  const chipCls = (active: boolean) =>
    `px-2 py-1 text-xs rounded border transition-colors ${
      active
        ? "bg-blue-100 border-blue-400 text-blue-700 dark:bg-blue-900/40 dark:border-blue-500 dark:text-blue-300"
        : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-400"
    }`;

  return (
    <div className="card p-0 overflow-hidden border-blue-200 dark:border-blue-800 ring-1 ring-blue-100 dark:ring-blue-900">
      {/* ── 面板标题栏 ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b border-blue-100 dark:border-blue-800">
        <div className="flex items-center space-x-2">
          <Cog6ToothIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            {t("history.syncConfigTitle")}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
        >
          <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* ── 表单区（双列） ── */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── 左列：基础配置 ── */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">
            {t("history.basicConfig")}
          </h3>

          {/* 启用开关 */}
          <div className="flex items-center justify-between">
            <label className={labelCls.replace(" mb-1", "")}>
              {t("history.enableSync")}
            </label>
            <button
              onClick={() => onEditChange("enabled", !editConfig.enabled)}
              className={toggleCls(editConfig.enabled)}
            >
              <span className={thumbCls(editConfig.enabled)} />
            </button>
          </div>

          {/* 服务器地址 */}
          <div>
            <label className={labelCls}>
              {t("history.serverUrl")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              className="input text-sm"
              placeholder={t("history.serverUrlPlaceholder")}
              value={editConfig.serverUrl}
              onChange={(e) => onEditChange("serverUrl", e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {t("history.serverUrlHint")}
            </p>
          </div>

          {/* 认证类型 */}
          <div>
            <label className={labelCls}>{t("history.authType")}</label>
            <select
              className="input text-sm"
              value={editConfig.authType}
              onChange={(e) =>
                onEditChange(
                  "authType",
                  e.target.value as HistorySyncConfig["authType"]
                )
              }
            >
              <option value="none">{t("history.authNone")}</option>
              <option value="bearer">{t("history.authBearer")}</option>
              <option value="basic">{t("history.authBasic")}</option>
              <option value="apikey">{t("history.authApiKey")}</option>
            </select>
          </div>

          {/* Bearer Token */}
          {editConfig.authType === "bearer" && (
            <div>
              <label className={labelCls}>{t("history.authBearer")}</label>
              <input
                type="password"
                className="input text-sm"
                placeholder="eyJhbGci..."
                value={editConfig.authToken || ""}
                onChange={(e) => onEditChange("authToken", e.target.value)}
              />
            </div>
          )}

          {/* Basic Auth */}
          {editConfig.authType === "basic" && (
            <div className="space-y-3">
              <div>
                <label className={labelCls}>{t("history.username")}</label>
                <input
                  type="text"
                  className="input text-sm"
                  placeholder="username"
                  value={editConfig.authUsername || ""}
                  onChange={(e) =>
                    onEditChange("authUsername", e.target.value)
                  }
                />
              </div>
              <div>
                <label className={labelCls}>{t("history.password")}</label>
                <input
                  type="password"
                  className="input text-sm"
                  placeholder="password"
                  value={editConfig.authPassword || ""}
                  onChange={(e) =>
                    onEditChange("authPassword", e.target.value)
                  }
                />
              </div>
            </div>
          )}

          {/* API Key */}
          {editConfig.authType === "apikey" && (
            <div className="space-y-3">
              <div>
                <label className={labelCls}>{t("history.headerName")}</label>
                <input
                  type="text"
                  className="input text-sm"
                  placeholder="X-API-Key"
                  value={editConfig.authHeaderName || "X-API-Key"}
                  onChange={(e) =>
                    onEditChange("authHeaderName", e.target.value)
                  }
                />
              </div>
              <div>
                <label className={labelCls}>{t("history.apiKeyValue")}</label>
                <input
                  type="password"
                  className="input text-sm"
                  placeholder="your-api-key"
                  value={editConfig.authToken || ""}
                  onChange={(e) => onEditChange("authToken", e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── 右列：定时规则 ── */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">
            {t("history.scheduleRules")}
          </h3>

          {/* 规则类型切换 */}
          <div>
            <label className={labelCls}>{t("history.ruleType")}</label>
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
              {(["interval", "cron"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onEditChange("scheduleType", mode)}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    editConfig.scheduleType === mode
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                  }`}
                >
                  {mode === "interval"
                    ? t("history.intervalMode")
                    : t("history.cronMode")}
                </button>
              ))}
            </div>
          </div>

          {/* 间隔模式 */}
          {editConfig.scheduleType === "interval" && (
            <div>
              <label className={labelCls}>{t("history.syncInterval")}</label>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  min={1}
                  max={1440}
                  className="input text-sm w-28"
                  value={editConfig.intervalMinutes ?? 30}
                  onChange={(e) =>
                    onEditChange(
                      "intervalMinutes",
                      Math.max(1, parseInt(e.target.value) || 30)
                    )
                  }
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t("history.minutes")}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {[5, 15, 30, 60, 120, 360].map((m) => (
                  <button
                    key={m}
                    onClick={() => onEditChange("intervalMinutes", m)}
                    className={chipCls(editConfig.intervalMinutes === m)}
                  >
                    {m >= 60 ? `${m / 60}h` : `${m}m`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cron 模式 */}
          {editConfig.scheduleType === "cron" && (
            <div>
              <label className={labelCls}>
                {t("history.cronExpr")}
                <span className="ml-1 text-xs text-gray-400 dark:text-gray-500 font-normal">
                  {t("history.cronHint")}
                </span>
              </label>
              <input
                type="text"
                className="input text-sm font-mono"
                placeholder="*/30 * * * *"
                value={editConfig.cronExpression || ""}
                onChange={(e) =>
                  onEditChange("cronExpression", e.target.value)
                }
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  {
                    labelKey: "history.everyMinutes",
                    labelArgs: { n: "30" },
                    expr: "*/30 * * * *",
                  },
                  {
                    labelKey: "history.everyHours",
                    labelArgs: { n: "1" },
                    expr: "0 */1 * * *",
                  },
                  {
                    labelKey: "history.everyHours",
                    labelArgs: { n: "2" },
                    expr: "0 */2 * * *",
                  },
                  {
                    label: t("history.cronPreset.daily0"),
                    expr: "0 0 * * *",
                  },
                  {
                    label: t("history.cronPreset.daily8"),
                    expr: "0 8 * * *",
                  },
                ].map(({ labelKey, labelArgs, label, expr }: any) => (
                  <button
                    key={expr}
                    onClick={() => onEditChange("cronExpression", expr)}
                    className={chipCls(editConfig.cronExpression === expr)}
                  >
                    {labelKey
                      ? t(labelKey).replace("{n}", labelArgs?.n || "")
                      : label}
                  </button>
                ))}
              </div>
              {editConfig.cronExpression && (
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  {t("history.cronExpr")}：
                  <code className="bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-1 rounded">
                    {editConfig.cronExpression}
                  </code>
                </p>
              )}
            </div>
          )}

          {/* 启动时同步 */}
          <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-700">
            <div>
              <label className={labelCls.replace(" mb-1", "")}>
                {t("history.syncOnStartup")}
              </label>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {t("history.syncOnStartupHint")}
              </p>
            </div>
            <button
              onClick={() =>
                onEditChange("syncOnStartup", !editConfig.syncOnStartup)
              }
              className={toggleCls(!!editConfig.syncOnStartup)}
            >
              <span className={thumbCls(!!editConfig.syncOnStartup)} />
            </button>
          </div>

          {/* 高级选项折叠 */}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-2">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              {showAdvanced ? (
                <ChevronDownIcon className="h-3.5 w-3.5" />
              ) : (
                <ChevronRightIcon className="h-3.5 w-3.5" />
              )}
              <span>{t("history.advancedOptions")}</span>
            </button>
            {showAdvanced && (
              <div className="mt-3">
                <label className={labelCls}>
                  {t("history.maxSyncRecords")}
                </label>
                <input
                  type="number"
                  min={10}
                  max={10000}
                  className="input text-sm w-32"
                  value={editConfig.maxRecords ?? 200}
                  onChange={(e) =>
                    onEditChange(
                      "maxRecords",
                      Math.max(10, parseInt(e.target.value) || 200)
                    )
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 底部操作栏 ── */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <button
          onClick={onTestSync}
          disabled={isSyncing || !editConfig.serverUrl}
          className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
        >
          <ArrowPathIcon
            className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
          />
          <span>
            {isSyncing ? t("history.syncing") : t("history.testSync")}
          </span>
        </button>
        <div className="flex items-center space-x-3">
          <button
            onClick={onCancel}
            disabled={!configDirty}
            className="btn-secondary disabled:opacity-40"
          >
            {t("history.cancel")}
          </button>
          <button
            onClick={onSave}
            disabled={!configDirty}
            className="btn-primary disabled:opacity-40"
          >
            {t("history.saveConfig")}
          </button>
        </div>
      </div>

      {/* ── 同步日志 ── */}
      {syncLog.length > 0 && (
        <div className="px-6 pb-4">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
            {t("history.syncLogs").replace(
              "{count}",
              String(Math.min(syncLog.length, 50))
            )}
          </h4>
          <div className="bg-gray-900 rounded-lg p-3 max-h-36 overflow-y-auto space-y-1 font-mono text-xs">
            {syncLog.map((l, i) => (
              <div key={i} className={l.ok ? "text-green-400" : "text-red-400"}>
                <span className="text-gray-500 mr-2">[{l.time}]</span>
                {l.ok ? "✓" : "✗"} {l.msg}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorySyncPanel;
