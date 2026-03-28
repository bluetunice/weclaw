/**
 * Claw Agent 头部组件
 */
import React from "react";
import {
  FolderOpenIcon,
  ArrowPathIcon,
  PauseIcon,
  PlayIcon,
  DocumentArrowDownIcon,
  ListBulletIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { ClawTask } from "../../types/claw";
import { Workspace } from "../../types";
import { useSettings } from "../../contexts/SettingsContext";

// 任务状态配置
const taskStatusCfg: Record<string, { cls: string; text: string }> = {
  idle:       { cls: "bg-gray-100 text-gray-600",        text: "空闲" },
  planning:   { cls: "bg-purple-100 text-purple-600",   text: "规划中" },
  running:    { cls: "bg-blue-100 text-blue-600",        text: "执行中" },
  paused:     { cls: "bg-amber-100 text-amber-600",     text: "已暂停" },
  done:       { cls: "bg-green-100 text-green-600",      text: "已完成" },
  failed:     { cls: "bg-red-100 text-red-600",          text: "失败" },
  cancelled:  { cls: "bg-gray-100 text-gray-400",       text: "已取消" },
};

interface Props {
  activeTask: ClawTask | null;
  activeWorkspace: Workspace | null;
  onOpenFolder: () => void;
  onRetry: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onExportMd?: () => void;
  onToggleTaskList?: () => void;
  isTaskListOpen?: boolean;
  onSelectWorkspace?: (workspaceId: number) => void;
  onAddWorkspace?: () => void;
}

const ClawAgentHeader: React.FC<Props> = ({
  activeTask,
  activeWorkspace,
  onOpenFolder,
  onRetry,
  onPause,
  onResume,
  onExportMd,
  onToggleTaskList,
  isTaskListOpen,
  onSelectWorkspace,
  onAddWorkspace,
}) => {
  const { t } = useSettings();
  const [showWorkspaceMenu, setShowWorkspaceMenu] = React.useState(false);
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    loadWorkspaces();
  }, []);

  // 点击外部关闭菜单
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowWorkspaceMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadWorkspaces = async () => {
    try {
      const data = await window.electron?.ipcRenderer?.invoke('get-workspaces');
      setWorkspaces(data || []);
    } catch (error) {
      console.error('加载工作区失败:', error);
    }
  };

  const handleSwitchWorkspace = async (workspaceId: number) => {
    try {
      const success = await window.electron?.ipcRenderer?.invoke('switch-workspace', workspaceId);
      if (success) {
        await loadWorkspaces();
        onSelectWorkspace?.(workspaceId);
        setShowWorkspaceMenu(false);
      }
    } catch (error) {
      console.error('切换工作区失败:', error);
    }
  };

  if (!activeTask) {
    return (
      <div className="flex-shrink-0 h-14 px-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Claw Agent
          </h1>
          {/* 工作区选择器 */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FolderOpenIcon className="h-3.5 w-3.5" />
              <span className="max-w-[120px] truncate">
                {activeWorkspace?.name || '未设置工作区'}
              </span>
              <ChevronDownIcon className={`h-3 w-3 transition-transform ${showWorkspaceMenu ? 'rotate-180' : ''}`} />
            </button>
            {showWorkspaceMenu && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[200px]">
                {workspaces.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-gray-500">
                    暂无工作区
                  </div>
                ) : (
                  workspaces.map(workspace => (
                    <button
                      key={workspace.id}
                      onClick={() => handleSwitchWorkspace(workspace.id!)}
                      className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
                        activeWorkspace?.id === workspace.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className={`h-1.5 w-1.5 rounded-full ${
                        activeWorkspace?.id === workspace.id ? 'bg-blue-500' : 'bg-gray-300'
                      }`} />
                      <div className="truncate">{workspace.name}</div>
                    </button>
                  ))
                )}
                {onAddWorkspace && (
                  <button
                    onClick={() => { setShowWorkspaceMenu(false); onAddWorkspace(); }}
                    className="w-full px-3 py-2 text-left text-xs text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    + 添加工作区
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const sc = taskStatusCfg[activeTask.status] || taskStatusCfg["idle"];
  const isRunning = activeTask.status === "running" || activeTask.status === "planning";
  const isPaused = activeTask.status === "paused";
  const isDone = activeTask.status === "done";
  const isFailed = activeTask.status === "failed";

  return (
    <div className="flex-shrink-0 h-14 px-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* 左侧：任务列表按钮 + 工作区 + 任务信息 */}
      <div className="flex items-center gap-3 min-w-0">
        {/* 任务列表切换按钮 */}
        {onToggleTaskList && (
          <button
            onClick={onToggleTaskList}
            className={`flex-shrink-0 p-2 rounded-lg transition-colors border ${
              isTaskListOpen 
                ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400" 
                : "bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            }`}
            title={isTaskListOpen ? "收起任务列表" : "展开任务列表"}
          >
            {isTaskListOpen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            ) : (
              <ListBulletIcon className="w-4 h-4" />
            )}
          </button>
        )}
        
        {/* 工作区选择器 */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FolderOpenIcon className="h-3.5 w-3.5" />
            <span className="max-w-[100px] truncate">
              {activeWorkspace?.name || '未设置工作区'}
            </span>
            <ChevronDownIcon className={`h-3 w-3 transition-transform ${showWorkspaceMenu ? 'rotate-180' : ''}`} />
          </button>
          {showWorkspaceMenu && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[200px]">
              {workspaces.length === 0 ? (
                <div className="px-3 py-2 text-xs text-gray-500">
                  暂无工作区
                </div>
              ) : (
                workspaces.map(workspace => (
                  <button
                    key={workspace.id}
                    onClick={() => handleSwitchWorkspace(workspace.id!)}
                    className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
                      activeWorkspace?.id === workspace.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className={`h-1.5 w-1.5 rounded-full ${
                      activeWorkspace?.id === workspace.id ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                    <div className="truncate">{workspace.name}</div>
                  </button>
                ))
              )}
              {onAddWorkspace && (
                <button
                  onClick={() => { setShowWorkspaceMenu(false); onAddWorkspace(); }}
                  className="w-full px-3 py-2 text-left text-xs text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  + 添加工作区
                </button>
              )}
            </div>
          )}
        </div>
        
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200 truncate">
          {activeTask.goal.length > 40 ? activeTask.goal.substring(0, 40) + "..." : activeTask.goal}
        </h1>
        <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full ${sc.cls}`}>
          {activeTask.status === "planning" 
            ? t("clawAgent.status.planning")
            : t(`clawAgent.status.${activeTask.status}`) || sc.text}
        </span>
        
        {/* 步骤进度 */}
        {activeTask.steps.length > 0 && (
          <span className="text-xs text-gray-400">
            {activeTask.steps.filter(s => s.status === "done").length}/{activeTask.steps.length} {t("clawAgent.steps") || "步"}
          </span>
        )}
      </div>

      {/* 右侧：操作按钮 */}
      <div className="flex items-center gap-2">
        {/* 导出 Markdown */}
        {onExportMd && activeTask && (
          <button
            onClick={onExportMd}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="导出为 Markdown"
          >
            <DocumentArrowDownIcon className="h-4 w-4" />
          </button>
        )}

        {/* 打开目录 */}
        {activeTask.sessionDirName && (
          <button
            onClick={onOpenFolder}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={t("clawAgent.openFolder") || "打开目录"}
          >
            <FolderOpenIcon className="h-4 w-4" />
            <span>{t("clawAgent.openFolder") || "打开目录"}</span>
          </button>
        )}

        {/* 重试按钮 */}
        {(isDone || isFailed) && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            title={t("clawAgent.retry") || "重试"}
          >
            <ArrowPathIcon className="h-4 w-4" />
            <span>{t("clawAgent.retry") || "重试"}</span>
          </button>
        )}

        {/* 暂停/继续按钮 */}
        {isRunning && onPause && (
          <button
            onClick={onPause}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
            title={t("clawAgent.pause") || "暂停"}
          >
            <PauseIcon className="h-4 w-4" />
            <span>{t("clawAgent.pause") || "暂停"}</span>
          </button>
        )}
        {isPaused && onResume && (
          <button
            onClick={onResume}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
            title="继续"
          >
            <PlayIcon className="h-4 w-4" />
            <span>继续</span>
          </button>
        )}
        
      </div>
    </div>
  );
};

export default ClawAgentHeader;
