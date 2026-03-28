import React, { useState } from "react";

// ── 任务列表弹框 ─────────────────────────────────────────────────────────────────────
interface TaskListModalProps {
  tasks: ClawTask[];
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  onTaskSelect: (taskId: string) => void;
}

const TaskListModal: React.FC<TaskListModalProps> = ({
  tasks,
  isOpen,
  onClose,
  sessionId,
  onTaskSelect,
}) => {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // 过滤当前会话的任务
  const sessionTasks = tasks.filter((t) => t.sessionId === sessionId);

  // 按创建时间排序（最新的在前）
  const sortedTasks = [...sessionTasks].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "text-blue-500 animate-pulse";
      case "done":
        return "text-green-500";
      case "failed":
        return "text-red-500";
      case "paused":
        return "text-yellow-500";
      default:
        return "text-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "running":
        return "执行中";
      case "done":
        return "已完成";
      case "failed":
        return "失败";
      case "paused":
        return "已暂停";
      default:
        return "等待中";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[70vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <BoltIcon className="h-5 w-5 text-indigo-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              当前会话的任务
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({sortedTasks.length} 个任务)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* 任务列表 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {sortedTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              暂无任务
            </div>
          ) : (
            sortedTasks.map((task) => (
              <div
                key={task.id}
                className={`border rounded-lg overflow-hidden transition-all ${
                  expandedTaskId === task.id
                    ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {/* 任务标题栏 */}
                <div
                  onClick={() =>
                    setExpandedTaskId(
                      expandedTaskId === task.id ? null : task.id
                    )
                  }
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <BoltIcon
                    className={`h-4 w-4 flex-shrink-0 ${getStatusColor(
                      task.status
                    )}`}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {task.goal || "未命名任务"}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {getStatusText(task.status)} · {formatDate(task.createdAt)}
                    </div>
                  </div>

                  <ChevronRightIcon
                    className={`h-4 w-4 text-gray-400 transition-transform ${
                      expandedTaskId === task.id ? "rotate-90" : ""
                    }`}
                  />
                </div>

                {/* 展开的任务详情 */}
                {expandedTaskId === task.id && (
                  <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
                    {/* 步骤列表 */}
                    {task.steps.length > 0 && (
                      <div className="space-y-2 mb-4">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                          执行步骤 ({task.steps.length})
                        </div>
                        {task.steps.map((step, index) => (
                          <div
                            key={step.id}
                            className="flex items-start gap-2 text-sm"
                          >
                            <span className="flex-shrink-0 mt-0.5">
                              {step.status === "done" ? (
                                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                              ) : step.status === "running" ? (
                                <ClockIcon className="h-4 w-4 text-blue-500 animate-spin" />
                              ) : step.status === "failed" ? (
                                <XCircleIcon className="h-4 w-4 text-red-500" />
                              ) : (
                                <CircleIcon className="h-4 w-4 text-gray-400" />
                              )}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="text-gray-900 dark:text-gray-100">
                                {step.description || `步骤 ${index + 1}`}
                              </div>
                              {step.output && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                  {step.output}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 操作按钮 */}
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskSelect(task.id);
                          onClose();
                        }}
                        className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-lg transition-colors"
                      >
                        查看详情
                      </button>
                      {task.status === "failed" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // 这里可以添加重试逻辑
                            onTaskSelect(task.id);
                            onClose();
                          }}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          重试
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskListModal;
