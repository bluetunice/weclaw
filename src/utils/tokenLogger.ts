/**
 * Token 消耗记录工具
 * 每次模型调用完成后写入一条记录，供仪表盘图表使用
 */

export interface TokenRecord {
  id: string;
  date: string;       // "YYYY-MM-DD"
  timestamp: string;  // ISO 8601
  modelName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  conversationId?: string;
}

const TOKEN_LOGS_KEY = "claw_token_logs";
const MAX_TOKEN_LOGS = 2000;

// ─── 读写 ──────────────────────────────────────────────────────────────────────

export function loadTokenLogs(): TokenRecord[] {
  try {
    const raw = localStorage.getItem(TOKEN_LOGS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as TokenRecord[];
  } catch {
    return [];
  }
}

function persistTokenLogs(logs: TokenRecord[]) {
  localStorage.setItem(TOKEN_LOGS_KEY, JSON.stringify(logs));
}

// ─── 写入一条 Token 记录 ──────────────────────────────────────────────────────

export function logTokenUsage(opts: {
  modelName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  conversationId?: string;
}): void {
  try {
    const now = new Date();
    const record: TokenRecord = {
      id: `${now.getTime()}-${Math.random().toString(36).slice(2, 6)}`,
      date: now.toISOString().slice(0, 10), // YYYY-MM-DD
      timestamp: now.toISOString(),
      modelName: opts.modelName,
      promptTokens: opts.promptTokens || 0,
      completionTokens: opts.completionTokens || 0,
      totalTokens: opts.totalTokens || 0,
      conversationId: opts.conversationId,
    };
    const logs = loadTokenLogs();
    const next = [record, ...logs].slice(0, MAX_TOKEN_LOGS);
    persistTokenLogs(next);
  } catch {
    // 忽略
  }
}

// ─── 聚合统计 ─────────────────────────────────────────────────────────────────

/** 按天聚合：最近 N 天 */
export function aggregateByDay(logs: TokenRecord[], days = 30): {
  date: string;
  total: number;
  prompt: number;
  completion: number;
}[] {
  const today = new Date();
  const result: { date: string; total: number; prompt: number; completion: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayLogs = logs.filter((r) => r.date === dateStr);
    result.push({
      date: dateStr,
      total: dayLogs.reduce((s, r) => s + r.totalTokens, 0),
      prompt: dayLogs.reduce((s, r) => s + r.promptTokens, 0),
      completion: dayLogs.reduce((s, r) => s + r.completionTokens, 0),
    });
  }
  return result;
}

/** 按月聚合：最近 N 个月 */
export function aggregateByMonth(logs: TokenRecord[], months = 12): {
  month: string; // "YYYY-MM"
  label: string; // "1月" / "Jan"
  total: number;
  prompt: number;
  completion: number;
}[] {
  const today = new Date();
  const result: ReturnType<typeof aggregateByMonth> = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthLogs = logs.filter((r) => r.date.startsWith(month));
    result.push({
      month,
      label: `${d.getMonth() + 1}月`,
      total: monthLogs.reduce((s, r) => s + r.totalTokens, 0),
      prompt: monthLogs.reduce((s, r) => s + r.promptTokens, 0),
      completion: monthLogs.reduce((s, r) => s + r.completionTokens, 0),
    });
  }
  return result;
}

/** 按年聚合：最近 N 年 */
export function aggregateByYear(logs: TokenRecord[], years = 5): {
  year: string;
  total: number;
  prompt: number;
  completion: number;
}[] {
  const today = new Date();
  const result: ReturnType<typeof aggregateByYear> = [];

  for (let i = years - 1; i >= 0; i--) {
    const year = String(today.getFullYear() - i);
    const yearLogs = logs.filter((r) => r.date.startsWith(year));
    result.push({
      year,
      total: yearLogs.reduce((s, r) => s + r.totalTokens, 0),
      prompt: yearLogs.reduce((s, r) => s + r.promptTokens, 0),
      completion: yearLogs.reduce((s, r) => s + r.completionTokens, 0),
    });
  }
  return result;
}

/** 格式化 token 数（K / M 缩写） */
export function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
