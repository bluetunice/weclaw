import React from "react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { HistorySyncConfig } from "../../types";

// ─── 同步配置存储键 ────────────────────────────────────────────────────────────
export const SYNC_CONFIG_KEY = "claw_history_sync_config";

export const DEFAULT_SYNC_CONFIG: HistorySyncConfig = {
  enabled: false,
  serverUrl: "",
  authType: "none",
  authToken: "",
  authUsername: "",
  authPassword: "",
  authHeaderName: "X-API-Key",
  scheduleType: "interval",
  intervalMinutes: 30,
  cronExpression: "0 */1 * * *",
  syncOnStartup: false,
  maxRecords: 200,
};

// ─── 配置 IO ──────────────────────────────────────────────────────────────────
export function loadSyncConfig(): HistorySyncConfig {
  try {
    const raw = localStorage.getItem(SYNC_CONFIG_KEY);
    if (!raw) return { ...DEFAULT_SYNC_CONFIG };
    return { ...DEFAULT_SYNC_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SYNC_CONFIG };
  }
}

export function saveSyncConfig(cfg: HistorySyncConfig) {
  localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(cfg));
}

// ─── 构建请求头 ────────────────────────────────────────────────────────────────
export function buildAuthHeaders(cfg: HistorySyncConfig): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cfg.authType === "bearer" && cfg.authToken) {
    headers["Authorization"] = `Bearer ${cfg.authToken}`;
  } else if (cfg.authType === "basic" && cfg.authUsername) {
    const b64 = btoa(`${cfg.authUsername}:${cfg.authPassword || ""}`);
    headers["Authorization"] = `Basic ${b64}`;
  } else if (cfg.authType === "apikey" && cfg.authToken) {
    headers[cfg.authHeaderName || "X-API-Key"] = cfg.authToken;
  }
  return headers;
}

// ─── Cron 简易解析 ─────────────────────────────────────────────────────────────
export function parseCronNextMs(cronExpr: string): number {
  try {
    const parts = cronExpr.trim().split(/\s+/);
    if (parts.length !== 5) return -1;
    const [minPart, hourPart] = parts;
    const now = new Date();
    let nextMs = -1;

    if (minPart.startsWith("*/") && hourPart === "*") {
      const step = parseInt(minPart.slice(2));
      if (!isNaN(step) && step > 0) nextMs = step * 60 * 1000;
    } else if (minPart === "0" && hourPart.startsWith("*/")) {
      const step = parseInt(hourPart.slice(2));
      if (!isNaN(step) && step > 0) nextMs = step * 60 * 60 * 1000;
    } else if (minPart === "0" && !isNaN(parseInt(hourPart))) {
      const targetHour = parseInt(hourPart);
      const next = new Date(now);
      next.setHours(targetHour, 0, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      nextMs = next.getTime() - now.getTime();
    } else {
      nextMs = 60 * 60 * 1000;
    }
    return nextMs;
  } catch {
    return -1;
  }
}

// ─── 状态图标（返回 JSX 元素） ────────────────────────────────────────────────
export function getStatusIcon(status: string): React.ReactElement {
  switch ((status || "").toLowerCase()) {
    case "success":
      return React.createElement(CheckCircleIcon, { className: "h-5 w-5 text-green-500" });
    case "warning":
      return React.createElement(ExclamationTriangleIcon, { className: "h-5 w-5 text-yellow-500" });
    case "error":
      return React.createElement(XCircleIcon, { className: "h-5 w-5 text-red-500" });
    default:
      return React.createElement(InformationCircleIcon, { className: "h-5 w-5 text-blue-500" });
  }
}

// ─── 状态 badge 颜色（同时包含 light / dark 变体） ────────────────────────────
export function getStatusColor(status: string): string {
  switch ((status || "").toLowerCase()) {
    case "success":
      return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
    case "warning":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300";
    case "error":
      return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
    default:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
  }
}

// ─── 权限颜色（边框 + 背景，同时包含 light / dark 变体） ─────────────────────
export function getPermissionColor(check: string): string {
  if (!check)
    return "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700";
  if (check.includes("within") || check.includes("allowed"))
    return "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800";
  if (check.includes("outside") || check.includes("denied"))
    return "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800";
  return "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700";
}
