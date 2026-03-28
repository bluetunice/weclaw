/**
 * Claw Agent 会话列表组件
 */
import React, { useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  FolderIcon,
  PauseIcon,
  PlayIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { ClawTask } from "../../types/claw";
import { useSettings } from "../../contexts/SettingsContext";

// 任务状态配置
const taskStatusCfg: Record<string, { cls: string; dot: string; icon: string }> = {
  idle:       { cls: "text-gray-500 bg-gray-50",        dot: "bg-gray-400", icon: "○" },
  planning:   { cls: "text-purple-600 bg-purple-50",   dot: "bg-purple-400", icon: "◔" },
  running:    { cls: "text-blue-600 bg-blue-50",        dot: "bg-blue-500 animate-pulse", icon: "◐" },
  paused:     { cls: "text-amber-600 bg-amber-50",     dot: "bg-amber-400", icon: "⏸" },
  done:       { cls: "text-green-600 bg-green-50",      dot: "bg-green-500", icon: "✓" },
  failed:     { cls: "text-red-600 bg-red-50",          dot: "bg-red-500", icon: "✕" },
  cancelled:  { cls: "text-gray-400 bg-gray-100",       dot: "bg-gray-300", icon: "⊘" },
};

interface Props {
  tasks: ClawTask[];
  activeTask: ClawTask | null;
  isCollapsed: boolean;
  onNewTask: () => void;
  onToggleCollapse: () => void;
  onSelectTask: (task: ClawTask) => void;
  onDeleteTask: (taskId: string) => void;
  onDeleteSelectedTasks?: (taskIds: string[]) => void;
  onRetryTask: (taskId: string) => void;
  onPauseTask?: (taskId: string) => void;
  onResumeTask?: (taskId: string) => void;
}

// 计算相对时间
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "刚刚";
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  return `${Math.floor(diff / 86400)}天前`;
}

const ClawAgentConversationList: React.FC<Props> = ({
  tasks,
  activeTask,
  isCollapsed,
  onNewTask,
  onToggleCollapse,
  onSelectTask,
  onDeleteTask,
  onDeleteSelectedTasks,
  onRetryTask,
  onPauseTask,
  onResumeTask,
}) => {
  const { t } = useSettings();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  
  // 过滤任务
  const filteredTasks = searchQuery.trim()
    ? tasks.filter(task => 
        task.goal.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.status.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tasks;
  
  // 一键删除全部任务
  const handleDeleteAll = () => {
    if (!confirm(t("clawAgent.deleteAllConfirm") || "确定要删除所有任务吗？此操作不可恢复。")) {
      return;
    }
    // 逐个删除所有任务
    tasks.forEach(task => onDeleteTask(task.id));
  };

  // 切换选择模式
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    if (!isSelectMode) {
      setSelectedTasks(new Set());
    }
  };

  // 切换单个任务选择
  const toggleTaskSelect = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  // 全选
  const handleSelectAll = () => {
    if (selectedTasks.size === filteredTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(filteredTasks.map(t => t.id)));
    }
  };

  // 批量删除选中任务
  const handleBatchDelete = () => {
    if (selectedTasks.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedTasks.size} 个任务吗？此操作不可恢复。`)) {
      return;
    }
    if (onDeleteSelectedTasks) {
      onDeleteSelectedTasks(Array.from(selectedTasks));
    }
    setSelectedTasks(new Set());
    setIsSelectMode(false);
  };

  if (isCollapsed) {
    return (
      <div className="h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-700 flex flex-col">
        {/* 折叠时的图标按钮 */}
        <div className="p-2 flex flex-col items-center gap-2">
          <button
            onClick={onNewTask}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            title={t("clawAgent.newTask") || "新建任务"}
          >
            <PlusIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            title="展开"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* 活跃任务指示 */}
        {activeTask && (
          <div className="mt-auto p-2 flex justify-center">
            <div className={`w-3 h-3 rounded-full ${
              activeTask.status === "running" || activeTask.status === "planning"
                ? "bg-blue-500 animate-pulse"
                : activeTask.status === "done"
                ? "bg-green-500"
                : activeTask.status === "failed"
                ? "bg-red-500"
                : "bg-gray-400"
            }`} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-700 flex flex-col">
      {/* 头部 */}
      <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          {isSelectMode ? (
            <>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                已选 {selectedTasks.size} 项
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleSelectAll}
                  className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-xs text-gray-600 dark:text-gray-400"
                  title="全选"
                >
                  {selectedTasks.size === filteredTasks.length ? "取消全选" : "全选"}
                </button>
                <button
                  onClick={handleBatchDelete}
                  disabled={selectedTasks.size === 0}
                  className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="删除选中"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={toggleSelectMode}
                  className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                  title="取消选择"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {t("clawAgent.tasks") || "任务列表"}
              </h2>
              <div className="flex items-center gap-1">
                {tasks.length > 0 && (
                  <>
                    <button
                      onClick={toggleSelectMode}
                      className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                      title="选择"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                    <button
                      onClick={handleDeleteAll}
                      className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 dark:text-gray-400 hover:text-red-500"
                      title="删除全部"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={onNewTask}
                  className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                  title={t("clawAgent.newTask") || "新建任务"}
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={onToggleCollapse}
                  className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                  title="收起"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
        
        {/* 搜索框 */}
        {tasks.length > 0 && (
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索任务..."
              className="w-full pl-7 pr-7 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700 dark:text-gray-300 placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <XMarkIcon className="h-3 w-3 text-gray-400" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 任务列表 */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {filteredTasks.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            {searchQuery 
              ? "没有找到匹配的任务" 
              : t("clawAgent.noTasks") || "暂无任务"}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredTasks.map((task) => {
              const sc = taskStatusCfg[task.status] || taskStatusCfg["idle"];
              const isActive = activeTask?.id === task.id;
              
              return (
                <div
                  key={task.id}
                  onClick={() => isSelectMode ? toggleTaskSelect(task.id, { stopPropagation: () => {} } as React.MouseEvent) : onSelectTask(task)}
                  className={`group px-2 py-1.5 cursor-pointer transition-colors ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/30 border-l-2 border-blue-500"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 border-l-2 border-transparent"
                  } ${isSelectMode ? 'cursor-pointer' : ''}`}
                >
                  <div className="flex items-center gap-1.5">
                    {/* 复选框 - 选择模式显示 */}
                    {isSelectMode && (
                      <div 
                        onClick={(e) => toggleTaskSelect(task.id, e)}
                        className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center ${
                          selectedTasks.has(task.id)
                            ? "bg-blue-500 border-blue-500"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        {selectedTasks.has(task.id) && (
                          <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    )}
                    
                    {/* 状态图标 - 非选择模式显示 */}
                    {!isSelectMode && (
                      <div className={`flex-shrink-0 text-[10px] ${sc.dot.replace('bg-', 'text-')}`}>
                        {sc.icon}
                      </div>
                    )}
                    
                    {/* 任务信息 */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                        {task.goal}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[9px] px-1 py-0.5 rounded ${sc.cls}`}>
                          {task.status === "planning" 
                            ? t("clawAgent.status.planning")
                            : t(`clawAgent.status.${task.status}`) || task.status}
                        </span>
                        <span className="text-[9px] text-gray-400">
                          {task.steps.filter(s => s.status === "done").length}/{task.steps.length}
                        </span>
                        <span className="text-[9px] text-gray-400">
                          {timeAgo(task.updatedAt)}
                        </span>
                      </div>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* 暂停按钮 */}
                      {(task.status === "running" || task.status === "planning") && onPauseTask && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPauseTask(task.id);
                          }}
                          className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/30 text-gray-500 dark:text-gray-400 hover:text-amber-500"
                          title={t("clawAgent.pause") || "暂停"}
                        >
                          <PauseIcon className="h-3 w-3" />
                        </button>
                      )}
                      {/* 继续按钮 */}
                      {task.status === "paused" && onResumeTask && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onResumeTask(task.id);
                          }}
                          className="p-0.5 rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-gray-500 dark:text-gray-400 hover:text-green-500"
                          title="继续"
                        >
                          <PlayIcon className="h-3 w-3" />
                        </button>
                      )}
                      {/* 重试按钮 */}
                      {(task.status === "failed" || task.status === "done") && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRetryTask(task.id);
                          }}
                          className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
                          title={t("clawAgent.retry") || "重试"}
                        >
                          <ArrowPathIcon className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTask(task.id);
                        }}
                        className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 dark:text-gray-400 hover:text-red-500"
                        title={t("clawAgent.delete") || "删除"}
                      >
                        <TrashIcon className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Token 消耗 */}
                  {task.totalTokens && task.totalTokens > 0 && (
                    <div className="mt-0.5 text-[9px] text-gray-400 ml-3">
                      {(task.totalTokens / 1000).toFixed(1)}K
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* 底部统计 */}
      <div className="px-2 py-1.5 border-t border-gray-100 dark:border-gray-700 text-[10px] text-gray-400">
        <div className="flex justify-between">
          <span>
            {searchQuery 
              ? `${filteredTasks.length} / ${tasks.length}` 
              : `${tasks.length}`}
          </span>
          <span>
            {filteredTasks.filter(t => t.status === "done").length} {t("clawAgent.completed") || "完成"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ClawAgentConversationList;
