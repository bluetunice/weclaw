/**
 * Claw Agent 任务/文件面板组件
 * 悬浮在发送框顶部，采用 Tab 切换交互方式
 * 任务：当前会话的步骤及进度
 * 文件：最终生成的文件（done 状态任务的文件）
 */
import React, { useState } from "react";
import {
  ListBulletIcon,
  DocumentDuplicateIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { ClawTask, ClawFile, ClawStep } from "../../types/claw";

interface Props {
  allTasks: ClawTask[];
  activeTask: ClawTask | null;
  onSelectTask: (task: ClawTask) => void;
  onOpenFile: (filePath: string) => void;
}

const TaskFilePanel: React.FC<Props> = ({
  allTasks,
  activeTask,
  onSelectTask,
  onOpenFile,
}) => {
  // Tab 切换状态
  const [activeTab, setActiveTab] = useState<"tasks" | "files">("tasks");
  // 当前 Tab 内容的展开/收起状态
  const [contentExpanded, setContentExpanded] = useState(false);

  // 获取当前会话的 sessionDirName
  const currentSessionDir = activeTask?.sessionDirName;

  // 获取当前会话的所有任务
  const sessionTasks: ClawTask[] = currentSessionDir
    ? allTasks.filter(task => task.sessionDirName === currentSessionDir)
    : allTasks;

  // 计算会话的整体状态（优先级：failed > paused > running > planning > done > idle）
  const getSessionStatus = (): ClawTask["status"] => {
    if (sessionTasks.some(t => t.status === "failed")) return "failed";
    if (sessionTasks.some(t => t.status === "paused")) return "paused";
    if (sessionTasks.some(t => t.status === "running")) return "running";
    if (sessionTasks.some(t => t.status === "planning")) return "planning";
    if (sessionTasks.every(t => t.status === "done")) return "done";
    return "idle";
  };

  const sessionStatus = getSessionStatus();

  // 任务 Tab：显示当前 activeTask 的步骤及进度
  const currentSteps: ClawStep[] = activeTask?.steps || [];

  // 计算步骤进度（使用会话状态）
  const getStepProgress = (): string => {
    if (!activeTask || sessionTasks.length === 0) return "";
    
    if (sessionStatus === "planning") return "规划中...";
    if (sessionStatus === "paused") return "已暂停";
    if (sessionStatus === "idle") return "等待开始";
    
    const doneSteps = currentSteps.filter(s => s.status === "done").length;
    const totalSteps = currentSteps.length;
    const runningStep = currentSteps.find(s => s.status === "running");
    
    if (runningStep) {
      return `执行中: ${runningStep.title}`;
    }
    
    if (sessionStatus === "done") {
      return "已完成";
    }
    
    if (sessionStatus === "failed") {
      return "执行失败";
    }
    
    return `${doneSteps}/${totalSteps} 步骤完成`;
  };

  // 文件 Tab：显示最终生成的文件（done 状态任务的文件）
  const finalFiles: ClawFile[] = currentSessionDir
    ? allTasks
        .filter(task => 
          task.sessionDirName === currentSessionDir && 
          task.status === "done" &&
          task.files && task.files.length > 0
        )
        .flatMap(task => task.files || [])
    : allTasks
        .filter(task => 
          task.status === "done" && 
          task.files && task.files.length > 0
        )
        .flatMap(task => task.files || []);

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 没有步骤和文件时不显示面板
  if (currentSteps.length === 0 && finalFiles.length === 0) {
    return null;
  }

  // Tab 切换时自动展开内容
  const handleTabChange = (tab: "tasks" | "files") => {
    setActiveTab(tab);
    setContentExpanded(true);
    setContentExpanded(!contentExpanded)
  };

  return (
    <div className="mx-4 mb-2 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
      {/* Tab 切换 */}
      <div className="flex items-center border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <button
          onClick={() => handleTabChange("tasks")}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium transition-colors ${
            activeTab === "tasks"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <ListBulletIcon className="h-3 w-3" />
          任务列表
          <span className="text-[10px]">({currentSteps.length})</span>
           {/* 展开/收起按钮 */}
        <button
          className="px-2 py-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title={contentExpanded ? "收起" : "展开"}
        >
          {contentExpanded ? (
            <ChevronUpIcon className="h-3 w-3" />
          ) : (
            <ChevronDownIcon className="h-3 w-3" />
          )}
        </button>
        </button>
        <button
          onClick={() => handleTabChange("files")}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium transition-colors ${
            activeTab === "files"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <DocumentDuplicateIcon className="h-3 w-3" />
          文件列表
          <span className="text-[10px]">({finalFiles.length})</span>
          {/* 展开/收起按钮 */}
        <button
          className="px-2 py-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title={contentExpanded ? "收起" : "展开"}
        >
          {contentExpanded ? (
            <ChevronUpIcon className="h-3 w-3" />
          ) : (
            <ChevronDownIcon className="h-3 w-3" />
          )}
        </button>
        </button>
        
      </div>

      {/* Tab 内容区域 - 可展开/收起 */}
      {contentExpanded && (
        <div className="max-h-32 overflow-y-auto">
          {activeTab === "tasks" ? (
            // 任务列表 - 当前会话的步骤及进度
            currentSteps.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {currentSteps.map((step, index) => (
                  <button
                    key={step.id}
                    className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${
                      step.status === "running"
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : step.status === "done"
                        ? "bg-green-50/50 dark:bg-green-900/10"
                        : step.status === "failed"
                        ? "bg-red-50/50 dark:bg-red-900/10"
                        : ""
                    }`}
                  >
                    {/* 步骤序号 */}
                    <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-[10px] font-medium rounded-full bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                      {index + 1}
                    </span>
                    {/* 状态图标 */}
                    <div className={`flex-shrink-0 ${
                      step.status === "done" ? "text-green-500" :
                      step.status === "failed" ? "text-red-500" :
                      step.status === "running" ? "text-blue-500" :
                      step.status === "skipped" ? "text-gray-400" :
                      "text-gray-300"
                    }`}>
                      {step.status === "done" ? <CheckCircleIcon className="h-3 w-3" /> :
                       step.status === "failed" ? <XCircleIcon className="h-3 w-3" /> :
                       step.status === "running" ? <ArrowPathIcon className="h-3 w-3 animate-spin" /> :
                       step.status === "skipped" ? <ClockIcon className="h-3 w-3" /> :
                       <ClockIcon className="h-3 w-3" />}
                    </div>
                    {/* 步骤信息 */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-800 dark:text-gray-200 truncate">
                        {step.title}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                        {step.description}
                      </p>
                    </div>
                  </button>
                ))}
                {/* 整体进度 */}
                <div className="px-2 py-1 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    {getStepProgress()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-2 text-center text-gray-400 text-xs">
                暂无步骤
              </div>
            )
          ) : (
            // 文件列表 - 最终生成的文件
            finalFiles.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {finalFiles.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => {
                      onOpenFile(file.path);
                    }}
                    className="w-full flex items-center gap-1.5 px-2 py-1.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <EyeIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    <DocumentTextIcon className="h-3 w-3 text-amber-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-800 dark:text-gray-200 truncate">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {file.path}
                      </p>
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">
                      {formatFileSize(file.size)}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-2 text-center text-gray-400 text-xs">
                暂无生成文件
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default TaskFilePanel;
