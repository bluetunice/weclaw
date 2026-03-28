import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  TrashIcon,
  PlayIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  CommandLineIcon,
  WindowIcon
} from "@heroicons/react/24/outline";
import { useSettings } from "../../../contexts/SettingsContext";

export interface LogEntry {
  id: string;
  type: "stdout" | "stderr" | "info" | "input" | "system";
  content: string;
  time: string;
}

interface TerminalPanelProps {
  cwd?: string;
  defaultCollapsed?: boolean;
}

const TerminalPanel: React.FC<TerminalPanelProps> = ({
  cwd,
  defaultCollapsed = false
}) => {
  const { t } = useSettings();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [expanded, setExpanded] = useState(false); // 展开时占高度
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [input, setInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const logEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const CONTAINER_HEIGHT = 180;

  const scrollToBottom = () => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!collapsed) scrollToBottom();
  }, [logs, collapsed]);

  const now = () =>
    new Date().toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });

  const addLog = useCallback((type: LogEntry["type"], content: string) => {
    setLogs((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, type, content, time: now() }
    ]);
  }, []);

  const executeCommand = useCallback(async () => {
    const cmd = input.trim();
    if (!cmd || isRunning) return;

    setInput("");
    setIsRunning(true);
    addLog("input", `$ ${cmd}`);
    setHistory((prev) => [cmd, ...prev].slice(0, 50));
    setHistoryIndex(-1);

    try {
      const result = await window.electron?.ipcRenderer?.invoke(
        "claw-exec-command",
        cmd,
        cwd,
        60000
      );

      if (result) {
        if (result.stdout) {
          result.stdout.split("\n").forEach((line: string) => {
            if (line) addLog("stdout", line);
          });
        }
        if (result.stderr) {
          result.stderr.split("\n").forEach((line: string) => {
            if (line) addLog("stderr", line);
          });
        }
        if (!result.stdout && !result.stderr) {
          addLog(
            "info",
            result.success
              ? t("terminal.emptyOutput") || "(无输出)"
              : result.error || `exit ${result.exitCode}`
          );
        }
      }
    } catch (err: any) {
      addLog("stderr", err?.message || String(err));
    } finally {
      setIsRunning(false);
    }
  }, [input, isRunning, cwd, addLog, t]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      executeCommand();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const next = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(next);
      setInput(history[next] || "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex <= 0) {
        setHistoryIndex(-1);
        setInput("");
        return;
      }
      const next = historyIndex - 1;
      setHistoryIndex(next);
      setInput(history[next] || "");
    }
  };

  const handleClear = () => {
    setLogs([]);
  };

  const logTypeStyle = (type: LogEntry["type"]) => {
    switch (type) {
      case "stdout":
        return "dark:text-gray-100 text-gray-800";
      case "stderr":
        return "dark:text-red-400 text-red-600";
      case "input":
        return "dark:text-green-400 text-green-600";
      case "system":
        return "dark:text-yellow-400 text-yellow-600";
      case "info":
        return "dark:text-gray-400 text-gray-400";
      default:
        return "dark:text-gray-100 text-gray-800";
    }
  };

  if (collapsed) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 dark:bg-gray-900 dark:border-t dark:border-gray-700 bg-gray-50 border-t border-gray-200 flex-shrink-0">
        <button
          onClick={() => {
            setCollapsed(false);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="flex items-center gap-1 text-xs dark:text-gray-400 dark:hover:text-green-400 text-gray-500 hover:text-green-600 transition-colors"
          title={t("terminal.expand") || "展开终端"}
        >
          <ArrowsPointingOutIcon className="h-3.5 w-3.5" />
          <span className="text-[10px] font-medium">
            {t("terminal.title") || "终端"}
          </span>
        </button>
        {logs.length > 0 && (
          <span className="text-[10px] dark:text-gray-600 text-gray-400">
            {logs.length} {t("terminal.lines") || "行"}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col dark:bg-gray-900 dark:border-t dark:border-gray-700 bg-gray-100 border-t border-gray-200 flex-shrink-0 overflow-hidden"
      style={{ height: expanded ? 320 : CONTAINER_HEIGHT }}
    >
      {/* 终端头部 */}
      <div className="flex items-center justify-between px-3 py-1.5 dark:bg-gray-900 dark:border-b dark:border-gray-700/50 bg-gray-200 border-b border-gray-300/50 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <WindowIcon className="h-3 w-3 dark:text-green-400 text-green-600" />
          <span className="text-[10px] font-semibold dark:text-gray-300 text-gray-600 tracking-wide">
            {t("terminal.title") || "终端"}
          </span>
          {cwd && (
            <span
              className="text-[9px] dark:text-gray-500 text-gray-400 font-mono ml-1 truncate max-w-[80px]"
              title={cwd}
            >
              {cwd.split("/").pop()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleClear}
            className="p-1 dark:text-gray-500 dark:hover:text-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
            title={t("terminal.clear") || "清空"}
          >
            <TrashIcon className="h-3 w-3" />
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 dark:text-gray-500 dark:hover:text-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
            title={
              expanded
                ? t("terminal.shrink") || "收起"
                : t("terminal.expand") || "展开"
            }
          >
            {expanded ? (
              <ArrowsPointingInIcon className="h-3 w-3" />
            ) : (
              <ArrowsPointingOutIcon className="h-3 w-3" />
            )}
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 dark:text-gray-500 dark:hover:text-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
            title={t("terminal.collapse") || "收起"}
          >
            <span className="text-[10px] font-bold leading-none">×</span>
          </button>
        </div>
      </div>

      {/* 日志输出区 */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-1.5 font-mono dark:bg-gray-900 bg-gray-50">
        {logs.length === 0 && (
          <p className="text-[10px] dark:text-gray-500 text-gray-400 italic">
            {t("terminal.ready") || "输入命令开始执行..."}
          </p>
        )}
        {logs.map((log) => (
          <div
            key={log.id}
            className={`text-[10px] leading-5 ${logTypeStyle(log.type)}`}
          >
            <span className="dark:text-gray-600 text-gray-300 mr-2 select-none">{log.time}</span>
            {log.content}
          </div>
        ))}
        {isRunning && (
          <div className="text-[10px] leading-5 dark:text-green-400 text-green-600 animate-pulse">
            <span className="dark:text-gray-600 text-gray-300 mr-2">{now()}</span>
            <span>⟳ {t("terminal.running") || "执行中..."}</span>
          </div>
        )}
        <div ref={logEndRef} />
      </div>

      {/* 命令输入区 */}
      <div className="flex items-center gap-2 px-3 py-1.5 dark:bg-gray-900 dark:border-t dark:border-gray-700/50 bg-gray-200 border-t border-gray-300/50 flex-shrink-0">
        <CommandLineIcon className="h-3 w-3 dark:text-green-500 text-green-600 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isRunning}
          placeholder={
            isRunning
              ? t("terminal.running") || "执行中..."
              : t("terminal.placeholder") || "输入命令，按 Enter 执行..."
          }
          className="flex-1 dark:bg-transparent bg-transparent text-[10px] dark:text-gray-100 text-gray-800 placeholder:dark:text-gray-500 placeholder:text-gray-400 outline-none font-mono disabled:opacity-40"
          spellCheck={false}
          autoComplete="off"
        />
        <button
          onClick={executeCommand}
          disabled={!input.trim() || isRunning}
          className="flex items-center gap-1 px-2 py-0.5 text-[10px] dark:text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 dark:disabled:opacity-30 dark:disabled:bg-indigo-600 text-white bg-green-600 hover:bg-green-500 disabled:opacity-30 disabled:bg-green-600 rounded transition-colors font-medium flex-shrink-0"
        >
          <PlayIcon className="h-2.5 w-2.5" />
          {isRunning ? t("terminal.running") || "..." : "Run"}
        </button>
      </div>
    </div>
  );
};

export default TerminalPanel;
