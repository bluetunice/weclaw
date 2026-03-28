import React, { useState, useRef } from "react";
import {
  CheckCircleIcon,
  PlusIcon,
  ClipboardIcon,
  CheckIcon,
  TrashIcon,
  ExclamationCircleIcon,
  MinusCircleIcon,
  InformationCircleIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { TodoPlan, TodoItem } from "../../../types";
import { useSettings } from "../../../contexts/SettingsContext";

interface TodoPanelProps {
  todo: TodoPlan;
  onItemToggle: (itemId: string, done: boolean) => void;
  onItemAdd: (text: string) => void;
  onItemDelete: (itemId: string) => void;
  onFileClick?: (filePath: string) => void;
}

const priorityConfig = {
  high: {
    icon: ExclamationCircleIcon,
    color: "text-red-500 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-700/50",
    labelKey: "chat.todo.priority.high",
  },
  medium: {
    icon: InformationCircleIcon,
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-700/50",
    labelKey: "chat.todo.priority.medium",
  },
  low: {
    icon: MinusCircleIcon,
    color: "text-gray-400 dark:text-gray-500",
    bg: "bg-gray-50 dark:bg-gray-800/60",
    border: "border-gray-200 dark:border-gray-700",
    labelKey: "chat.todo.priority.low",
  },
};

const TodoPanel: React.FC<TodoPanelProps> = ({
  todo,
  onItemToggle,
  onItemAdd,
  onItemDelete,
  onFileClick,
}) => {
  const { t } = useSettings();
  const [newText, setNewText] = useState("");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const doneCount = todo.items.filter((i) => i.done).length;
  const total = todo.items.length;
  const progress = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  const handleAdd = () => {
    const text = newText.trim();
    if (!text) return;
    onItemAdd(text);
    setNewText("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAdd();
  };

  const handleCopyAll = () => {
    const text = todo.items
      .map((i) => `[${i.done ? "x" : " "}] ${i.text}`)
      .join("\n");
    navigator.clipboard.writeText(`${todo.title}\n\n${text}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearDone = () => {
    todo.items.filter((i) => i.done).forEach((i) => onItemDelete(i.id));
  };

  // 按优先级排序（high > medium > low > undefined），完成的排到末尾
  const sortedItems = [...todo.items].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const order = { high: 0, medium: 1, low: 2, undefined: 3 };
    return (order[a.priority ?? "undefined"] ?? 3) - (order[b.priority ?? "undefined"] ?? 3);
  });

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
            {todo.title}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            {doneCount > 0 && (
              <button
                onClick={handleClearDone}
                className="flex items-center gap-1 px-2 py-1 text-[11px] text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                title={t("chat.todo.clearDone")}
              >
                <TrashIcon className="h-3 w-3" />
                <span>{t("chat.todo.clearDone")}</span>
              </button>
            )}
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-1 px-2 py-1 text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              {copied ? (
                <CheckIcon className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <ClipboardIcon className="h-3.5 w-3.5" />
              )}
              <span>{copied ? t("chat.todo.copied") : t("chat.todo.copyAll")}</span>
            </button>
          </div>
        </div>

        {/* 进度条 */}
        <div className="mt-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              {t("chat.todo.progress")}
            </span>
            <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">
              {doneCount}/{total} · {progress}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 列表 */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1.5">
        {sortedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400 dark:text-gray-500">
            <ClipboardDocumentListIcon className="h-8 w-8 mb-2" />
            <span className="text-xs">{t("chat.todo.empty")}</span>
          </div>
        ) : (
          sortedItems.map((item) => {
            const pri = item.priority ? priorityConfig[item.priority] : null;
            const PriIcon = pri?.icon;
            return (
              <div
                key={item.id}
                className={`group flex items-start gap-2 px-3 py-2 rounded-xl border transition-all duration-150 ${
                  item.done
                    ? "bg-gray-50/60 dark:bg-gray-800/30 border-gray-100 dark:border-gray-700/40 opacity-60"
                    : pri
                    ? `${pri.bg} ${pri.border}`
                    : "bg-white dark:bg-gray-800/60 border-gray-200 dark:border-gray-700"
                }`}
              >
                {/* 勾选框 */}
                <button
                  onClick={() => onItemToggle(item.id, !item.done)}
                  className={`flex-shrink-0 mt-0.5 transition-transform duration-150 hover:scale-110 ${
                    item.done
                      ? "text-emerald-500 dark:text-emerald-400"
                      : "text-gray-300 dark:text-gray-600 hover:text-emerald-400 dark:hover:text-emerald-500"
                  }`}
                >
                  <CheckCircleIcon
                    className="h-4.5 w-4.5"
                    style={{ width: 18, height: 18 }}
                  />
                </button>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-xs leading-5 ${
                      item.done
                        ? "line-through text-gray-400 dark:text-gray-500"
                        : "text-gray-800 dark:text-gray-100"
                    }`}
                  >
                    {item.text}
                  </span>
                  {item.file && (
                    <button
                      onClick={() => onFileClick?.(item.file!)}
                      className="block mt-0.5 text-[10px] font-mono text-violet-500 dark:text-violet-400 hover:underline truncate max-w-full"
                      title={item.file}
                    >
                      {item.file.split("/").pop()}
                    </button>
                  )}
                </div>

                {/* 优先级 + 删除 */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {PriIcon && (
                    <span
                      className={`${pri!.color} flex-shrink-0`}
                      title={t(pri!.labelKey)}
                    >
                      <PriIcon style={{ width: 14, height: 14 }} />
                    </span>
                  )}
                  <button
                    onClick={() => onItemDelete(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-all"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 添加输入框 */}
      <div className="flex-shrink-0 px-3 pb-3 pt-2 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("chat.todo.placeholder")}
            className="flex-1 text-xs px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 dark:focus:border-blue-500 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
          />
          <button
            onClick={handleAdd}
            disabled={!newText.trim()}
            className="flex-shrink-0 h-7 w-7 flex items-center justify-center rounded-lg bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            title={t("chat.todo.addItem")}
          >
            <PlusIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodoPanel;
