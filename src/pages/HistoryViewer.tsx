import React, { useState, useEffect, useRef, useCallback } from "react";
import { OperationHistory, HistorySyncConfig } from "../types";
import { useSettings } from "../contexts/SettingsContext";
import {
  ClockIcon,
  FlagIcon,
  ArrowPathIcon,
  CircleStackIcon,
  CloudArrowUpIcon,
  WifiIcon
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { zhCN, enUS } from "date-fns/locale";

import {
  loadSyncConfig,
  saveSyncConfig,
  buildAuthHeaders,
  parseCronNextMs
} from "../components/history/historyUtils";
import {
  loadOpLogs,
  ACTION_LABELS,
  CATEGORY_LABELS
} from "../utils/operationLogger";
import HistoryFilterBar from "../components/history/HistoryFilterBar";
import HistoryItem from "../components/history/HistoryItem";
import HistoryPagination from "../components/history/HistoryPagination";
import HistorySyncPanel from "../components/history/HistorySyncPanel";

// ─── 主组件 ───────────────────────────────────────────────────────────────────
const HistoryViewer: React.FC = () => {
  const { t, settings } = useSettings();
  const dateLocale = settings.language === "en-US" ? enUS : zhCN;

  // ── 历史数据 ────────────────────────────────────────────────────────────────
  const [history, setHistory] = useState<OperationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── 筛选 / 搜索 ─────────────────────────────────────────────────────────────
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDetails, setShowDetails] = useState<number | null>(null);

  // ── 分页 ─────────────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ── 同步配置面板 ─────────────────────────────────────────────────────────────
  const [showSyncPanel, setShowSyncPanel] = useState(false);
  const [syncConfig, setSyncConfig] =
    useState<HistorySyncConfig>(loadSyncConfig);
  const [editConfig, setEditConfig] =
    useState<HistorySyncConfig>(loadSyncConfig);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLog, setSyncLog] = useState<
    { time: string; msg: string; ok: boolean }[]
  >([]);
  const [configDirty, setConfigDirty] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── 加载历史记录（Electron IPC + localStorage 操作日志合并）───────────────────
  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. 从 Electron IPC 获取文件系统操作记录
      let ipcData: OperationHistory[] = [];
      try {
        const data = await window.electron?.ipcRenderer?.invoke(
          "get-history",
          200
        );
        ipcData = data || [];
      } catch {
        // Electron 不可用时静默忽略
      }

      // 2. 从 localStorage 读取应用操作日志，转换为 OperationHistory 格式
      const opLogs = loadOpLogs();
      // IPC 的 id 是数字，本地日志用负数 id 避免冲突
      const localHistory: OperationHistory[] = opLogs.map((log, idx) => ({
        id: -(idx + 1),
        timestamp: log.timestamp,
        operation_type: `${CATEGORY_LABELS[log.category] || log.category} · ${ACTION_LABELS[log.action] || log.action}`,
        operation_target: log.target,
        operation_status:
          log.status === "error"
            ? "error"
            : log.status === "warning"
              ? "warning"
              : "success",
        permission_check: log.detail || "",
        details: log.detail || ""
      }));

      // 3. 合并并按时间倒序排列
      const merged = [...ipcData, ...localHistory].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setHistory(merged);
    } catch (error) {
      console.error("加载历史记录失败:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // ── 同步日志 ──────────────────────────────────────────────────────────────────
  function addSyncLog(msg: string, ok: boolean) {
    const time = format(new Date(), "HH:mm:ss");
    setSyncLog((prev) => [{ time, msg, ok }, ...prev].slice(0, 50));
  }

  function updateSyncStatus(
    cfg: HistorySyncConfig,
    status: "success" | "failed" | "syncing",
    message: string
  ) {
    const updated: HistorySyncConfig = {
      ...cfg,
      lastSyncAt: new Date().toISOString(),
      lastSyncStatus: status,
      lastSyncMessage: message
    };
    setSyncConfig(updated);
    saveSyncConfig(updated);
  }

  // ── 执行同步 ──────────────────────────────────────────────────────────────────
  const doSync = useCallback(
    async (cfg: HistorySyncConfig, records: OperationHistory[]) => {
      if (!cfg.serverUrl.trim()) {
        addSyncLog(t("history.noServerConfig"), false);
        return false;
      }
      setIsSyncing(true);
      const subset = records.slice(0, cfg.maxRecords || 200);
      try {
        const resp = await fetch(cfg.serverUrl, {
          method: "POST",
          headers: buildAuthHeaders(cfg),
          body: JSON.stringify({
            source: "claw-history",
            syncAt: new Date().toISOString(),
            count: subset.length,
            records: subset
          })
        });
        if (!resp.ok) {
          const msg = t("history.syncFailHttp")
            .replace("{status}", String(resp.status))
            .replace("{statusText}", resp.statusText);
          addSyncLog(msg, false);
          updateSyncStatus(cfg, "failed", msg);
          return false;
        }
        const msg = t("history.syncSuccessMsg").replace(
          "{count}",
          String(subset.length)
        );
        addSyncLog(msg, true);
        updateSyncStatus(cfg, "success", msg);
        return true;
      } catch (err: any) {
        const msg = t("history.syncException").replace(
          "{msg}",
          err?.message || String(err)
        );
        addSyncLog(msg, false);
        updateSyncStatus(cfg, "failed", msg);
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    [t]
  );

  // ── 定时调度 ──────────────────────────────────────────────────────────────────
  const scheduleNext = useCallback(
    (cfg: HistorySyncConfig, records: OperationHistory[]) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (!cfg.enabled) return;

      let delayMs = 0;
      if (cfg.scheduleType === "interval") {
        delayMs = (cfg.intervalMinutes || 30) * 60 * 1000;
      } else {
        delayMs = parseCronNextMs(cfg.cronExpression || "*/30 * * * *");
        if (delayMs <= 0) delayMs = 30 * 60 * 1000;
      }

      timerRef.current = setTimeout(async () => {
        await doSync(cfg, records);
        scheduleNext(cfg, records);
      }, delayMs);
    },
    [doSync]
  );

  useEffect(() => {
    scheduleNext(syncConfig, history);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [syncConfig, history, scheduleNext]);

  // 启动时同步
  useEffect(() => {
    if (
      syncConfig.enabled &&
      syncConfig.syncOnStartup &&
      syncConfig.serverUrl
    ) {
      doSync(syncConfig, history);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 配置表单处理 ──────────────────────────────────────────────────────────────
  function handleEditChange<K extends keyof HistorySyncConfig>(
    key: K,
    value: HistorySyncConfig[K]
  ) {
    setEditConfig((prev) => ({ ...prev, [key]: value }));
    setConfigDirty(true);
  }

  function handleSaveConfig() {
    setSyncConfig(editConfig);
    saveSyncConfig(editConfig);
    setConfigDirty(false);
    addSyncLog(t("history.configSaved"), true);
  }

  function handleCancelEdit() {
    setEditConfig(syncConfig);
    setConfigDirty(false);
  }

  function handleOpenPanel() {
    setEditConfig(syncConfig);
    setConfigDirty(false);
    setShowSyncPanel(true);
  }

  // ── 筛选 / 分页逻辑 ───────────────────────────────────────────────────────────
  const filteredHistory = history.filter((item) => {
    if (filter !== "all") {
      if (
        filter === "permission_denied" &&
        !(item.permission_check || "").includes("outside")
      )
        return false;
      if (filter === "success" && item.operation_status !== "success")
        return false;
      if (filter === "warning" && item.operation_status !== "warning")
        return false;
      if (filter === "error" && item.operation_status !== "error") return false;
    }
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      return (
        (item.operation_type || "").toLowerCase().includes(s) ||
        (item.operation_target || "").toLowerCase().includes(s) ||
        (item.permission_check || "").toLowerCase().includes(s)
      );
    }
    return true;
  });

  // 筛选/搜索/页大小变化时重置到第 1 页
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / pageSize));
  const pagedHistory = filteredHistory.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // ── 上次 / 下次同步文字 ────────────────────────────────────────────────────────
  const lastSyncText = syncConfig.lastSyncAt
    ? format(new Date(syncConfig.lastSyncAt), "MM-dd HH:mm:ss", {
        locale: dateLocale
      })
    : t("history.neverSync");

  function getNextSyncLabel(cfg: HistorySyncConfig) {
    if (!cfg.enabled) return t("history.notEnabled");
    if (cfg.scheduleType === "interval") {
      const m = cfg.intervalMinutes || 30;
      return m >= 60
        ? t("history.everyHours").replace("{n}", String(m / 60))
        : t("history.everyMinutes").replace("{n}", String(m));
    }
    return cfg.cronExpression || "-";
  }

  // ─── 渲染 ─────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* ── 页头 ── */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {t("history.title")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t("history.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenPanel}
            className={`btn-secondary flex items-center gap-1.5 text-xs ${
              syncConfig.enabled
                ? "border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:bg-blue-900/20 dark:hover:bg-blue-900/40"
                : ""
            }`}
          >
            <CloudArrowUpIcon className="h-3.5 w-3.5" />
            <span>{t("history.syncBtn2")}</span>
            {syncConfig.enabled && (
              <span className="ml-0.5 h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse inline-block" />
            )}
          </button>
          <button
            onClick={loadHistory}
            disabled={isLoading}
            className="btn-secondary flex items-center gap-1.5 text-xs"
          >
            <ArrowPathIcon
              className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>{t("history.refreshBtn")}</span>
          </button>
        </div>
      </div>

      {/* ── 同步状态横幅 ── */}
      {syncConfig.enabled && (
        <div
          className={`rounded-lg border px-4 py-2 flex flex-wrap items-center gap-3 text-xs ${
            syncConfig.lastSyncStatus === "failed"
              ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
              : "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300"
          }`}
        >
          <WifiIcon className="h-4 w-4 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-medium">{t("history.syncEnabled2")} · </span>
            <span className="truncate">
              {t("history.target")}
              {syncConfig.serverUrl || t("history.notSet")}
            </span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span>
              {t("history.lastSync")}
              {lastSyncText}
            </span>
            <span>
              {t("history.frequency")}
              {getNextSyncLabel(syncConfig)}
            </span>
            {syncConfig.lastSyncStatus === "failed" && (
              <span className="text-red-600 dark:text-red-400 font-medium">
                {t("history.syncFailed2")}
              </span>
            )}
            <button
              onClick={() => doSync(syncConfig, history)}
              disabled={isSyncing}
              className="flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-gray-800 border border-current hover:opacity-80 transition-opacity"
            >
              <ArrowPathIcon
                className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`}
              />
              <span>
                {isSyncing ? t("history.syncing") : t("history.syncNow2")}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ── 同步配置面板 ── */}
      {showSyncPanel && (
        <HistorySyncPanel
          editConfig={editConfig}
          isSyncing={isSyncing}
          configDirty={configDirty}
          syncLog={syncLog}
          history={history}
          onEditChange={handleEditChange}
          onSave={handleSaveConfig}
          onCancel={handleCancelEdit}
          onClose={() => {
            handleCancelEdit();
            setShowSyncPanel(false);
          }}
          onTestSync={() => doSync(editConfig, history)}
        />
      )}

      {/* ── 筛选栏 ── */}
      <HistoryFilterBar
        history={history}
        filter={filter}
        searchTerm={searchTerm}
        onFilterChange={setFilter}
        onSearchChange={setSearchTerm}
      />

      {/* ── 历史记录列表 ── */}
      <div className="card p-4">
        {isLoading ? (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              {t("history.loading")}
            </p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <ClockIcon className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-600" />
            <p className="mt-2 text-xs">{t("history.empty")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pagedHistory.map((item) => (
              <HistoryItem
                key={item.id}
                item={item}
                isExpanded={showDetails === item.id}
                dateLocale={dateLocale}
                onToggleDetails={(id) =>
                  setShowDetails(showDetails === id ? null : id)
                }
              />
            ))}
          </div>
        )}

        {filteredHistory.length > 0 && (
          <HistoryPagination
            totalCount={filteredHistory.length}
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>

      {/* ── 说明区 ── */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          {t("history.infoTitle")}
        </h2>
        <div className="space-y-2">
          {[
            {
              Icon: ClockIcon,
              color: "text-primary-600",
              title: t("history.infoContent"),
              desc: t("history.infoContentDesc")
            },
            {
              Icon: CircleStackIcon,
              color: "text-green-600",
              title: t("history.securityMonitor"),
              desc: t("history.securityMonitorDesc")
            },
            {
              Icon: CloudArrowUpIcon,
              color: "text-blue-600",
              title: t("history.syncDesc"),
              desc: t("history.syncDescContent")
            },
            {
              Icon: FlagIcon,
              color: "text-yellow-600",
              title: t("history.retentionTitle"),
              desc: t("history.retentionDesc")
            }
          ].map(({ Icon, color, title, desc }) => (
            <div key={title} className="flex items-start gap-2">
              <Icon className={`h-4 w-4 ${color} mt-0.5 flex-shrink-0`} />
              <div>
                <h3 className="text-xs font-medium text-gray-900 dark:text-gray-100">
                  {title}
                </h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HistoryViewer;
