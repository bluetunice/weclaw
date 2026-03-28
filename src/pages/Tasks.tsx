import React, { useState, useMemo } from "react";
import { useSettings } from "../contexts/SettingsContext";
import { useTask, Task } from "../contexts/TaskContext";
import { opLog } from "../utils/operationLogger";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  ClockIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ChevronUpIcon
} from "@heroicons/react/24/outline";

interface TaskFilter {
  status?: Task["status"];
  priority?: Task["priority"];
  assignedTo?: string;
}

interface TaskFormData {
  title: string;
  description: string;
  status: Task["status"];
  priority: Task["priority"];
  assignedTo: string;
  estimatedHours: string;
  dueDate: string;
  tags: string;
  notes: string;
}

const emptyForm = (): TaskFormData => ({
  title: "",
  description: "",
  status: "pending",
  priority: "medium",
  assignedTo: "",
  estimatedHours: "",
  dueDate: "",
  tags: "",
  notes: "",
});

function taskToForm(task: Task): TaskFormData {
  return {
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    assignedTo: task.assignedTo || "",
    estimatedHours: task.estimatedHours?.toString() || "",
    dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
    tags: task.tags.join(", "),
    notes: task.notes || "",
  };
}

const Tasks: React.FC = () => {
  const { t } = useSettings();
  const { tasks, addTask, updateTask, deleteTask } = useTask();

  const [filter, setFilter] = useState<TaskFilter>({});
  const [isCreating, setIsCreating] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<TaskFormData>(emptyForm());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filtered tasks (memoized)
  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (filter.status) result = result.filter((t) => t.status === filter.status);
    if (filter.priority) result = result.filter((t) => t.priority === filter.priority);
    if (filter.assignedTo) result = result.filter((t) => t.assignedTo === filter.assignedTo);
    return result;
  }, [tasks, filter]);

  // 分页计算
  const totalPages = Math.ceil(filteredTasks.length / pageSize);
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTasks.slice(start, start + pageSize);
  }, [filteredTasks, currentPage, pageSize]);

  // 筛选变化时重置页码
  const handleFilterChange = (newFilter: TaskFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const toggleTaskExpanded = (taskId: string) => {
    const next = new Set(expandedTasks);
    if (next.has(taskId)) {
      next.delete(taskId);
    } else {
      next.add(taskId);
    }
    setExpandedTasks(next);
  };

  // ── Open forms ──────────────────────────────────────────────
  const openCreate = () => {
    setFormData(emptyForm());
    setEditingTask(null);
    setIsCreating(true);
  };

  const openEdit = (task: Task) => {
    setFormData(taskToForm(task));
    setEditingTask(task);
    setIsCreating(true);
  };

  const closeForm = () => {
    setIsCreating(false);
    setEditingTask(null);
    setFormData(emptyForm());
  };

  // ── Submit form ─────────────────────────────────────────────
  const handleSubmit = () => {
    if (!formData.title.trim()) {
      alert(t("tasks.titlePlaceholder"));
      return;
    }

    const taskData = {
      title: formData.title.trim(),
      description: formData.description,
      status: formData.status,
      priority: formData.priority,
      createdBy: t("tasks.currentUser"),
      assignedTo: formData.assignedTo || undefined,
      estimatedHours: formData.estimatedHours ? Number(formData.estimatedHours) : undefined,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
      tags: formData.tags.split(",").map((s) => s.trim()).filter(Boolean),
      notes: formData.notes || undefined,
    };

    if (editingTask) {
      updateTask({ ...editingTask, ...taskData });
      opLog.taskUpdate(taskData.title, editingTask.status, taskData.status);
    } else {
      addTask(taskData);
      opLog.taskCreate(taskData.title);
    }

    closeForm();
  };

  const handleDelete = (taskId: string) => {
    if (confirm(t("tasks.deleteConfirm"))) {
      const task = tasks.find((tk) => tk.id === taskId);
      deleteTask(taskId);
      if (task) opLog.taskDelete(task.title);
    }
  };

  const handleMarkComplete = (task: Task) => {
    updateTask({ ...task, status: "completed" });
    opLog.taskComplete(task.title);
  };

  // ── Badges ───────────────────────────────────────────────────
  const getPriorityBadge = (priority: Task["priority"]) => {
    const cfg: Record<string, string> = {
      low: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
      medium: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
      high: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
      critical: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${cfg[priority]}`}>
        {t(`dashboard.priority.${priority}`)}
      </span>
    );
  };

  const getStatusBadge = (status: Task["status"]) => {
    const cfg: Record<string, string> = {
      pending: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
      in_progress: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
      completed: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
      cancelled: "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400",
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${cfg[status]}`}>
        {t(`dashboard.status.${status}`)}
      </span>
    );
  };

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "completed": return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "in_progress": return <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      case "pending": return <ClockIcon className="h-5 w-5 text-amber-500" />;
      case "cancelled": return <ExclamationCircleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ─── Task statistics ─────────────────────────────────────────
  const totalCount = tasks.length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const pendingCount = tasks.filter((t) => t.status === "pending").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t("tasks.title")}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t("tasks.subtitle")}</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center space-x-1.5 text-xs">
          <PlusIcon className="h-3.5 w-3.5" />
          <span>{t("tasks.create")}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card p-3">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              {t("tasks.status")}
            </label>
            <select
              className="input text-xs"
              value={filter.status || ""}
              onChange={(e) =>
                handleFilterChange({ ...filter, status: (e.target.value as Task["status"]) || undefined })
              }
            >
              <option value="">{t("tasks.statusAll")}</option>
              <option value="pending">{t("dashboard.status.pending")}</option>
              <option value="in_progress">{t("dashboard.status.in_progress")}</option>
              <option value="completed">{t("dashboard.status.completed")}</option>
              <option value="cancelled">{t("dashboard.status.cancelled")}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              {t("tasks.priority")}
            </label>
            <select
              className="input text-xs"
              value={filter.priority || ""}
              onChange={(e) =>
                setFilter({ ...filter, priority: (e.target.value as Task["priority"]) || undefined })
              }
            >
              <option value="">{t("tasks.priorityAll")}</option>
              <option value="low">{t("dashboard.priority.low")}</option>
              <option value="medium">{t("dashboard.priority.medium")}</option>
              <option value="high">{t("dashboard.priority.high")}</option>
              <option value="critical">{t("dashboard.priority.critical")}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              {t("tasks.responsible")}
            </label>
            <select
              className="input text-xs"
              value={filter.assignedTo || ""}
              onChange={(e) => setFilter({ ...filter, assignedTo: e.target.value || undefined })}
            >
              <option value="">{t("tasks.allResponsible")}</option>
              <option value="系统管理员">{t("tasks.systemAdmin")}</option>
              <option value="当前用户">{t("tasks.currentUser")}</option>
            </select>
          </div>
          <div className="flex-1" />
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {t("tasks.totalTasks").replace("{count}", filteredTasks.length.toString())}
          </div>
        </div>
      </div>

      {/* Create / Edit Form */}
      {isCreating && (
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            {editingTask ? t("tasks.edit") : t("tasks.createNew")}
          </h2>
          <div className="space-y-3">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t("tasks.taskTitle")}
              </label>
              <input
                type="text"
                className="input text-xs"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t("tasks.titlePlaceholder")}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t("tasks.taskDesc")}
              </label>
              <textarea
                className="input text-xs min-h-[80px]"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Status + Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t("tasks.status")}
                </label>
                <select
                  className="input text-xs"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Task["status"] })}
                >
                  <option value="pending">{t("dashboard.status.pending")}</option>
                  <option value="in_progress">{t("dashboard.status.in_progress")}</option>
                  <option value="completed">{t("dashboard.status.completed")}</option>
                  <option value="cancelled">{t("dashboard.status.cancelled")}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t("tasks.priority")}
                </label>
                <select
                  className="input text-xs"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task["priority"] })}
                >
                  <option value="low">{t("dashboard.priority.low")}</option>
                  <option value="medium">{t("dashboard.priority.medium")}</option>
                  <option value="high">{t("dashboard.priority.high")}</option>
                  <option value="critical">{t("dashboard.priority.critical")}</option>
                </select>
              </div>
            </div>

            {/* Estimated Hours + Due Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t("tasks.estimatedHours")}
                </label>
                <input
                  type="number"
                  className="input text-xs"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                  placeholder="0"
                  min="0"
                  step="0.5"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t("tasks.dueDate")}
                </label>
                <input
                  type="date"
                  className="input text-xs"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t("tasks.tags")}
              </label>
              <input
                type="text"
                className="input text-xs"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder={t("tasks.exampleTags")}
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2">
              <button onClick={closeForm} className="btn-secondary text-xs">
                {t("tasks.cancel")}
              </button>
              <button onClick={handleSubmit} className="btn-primary text-xs">
                {editingTask ? t("tasks.edit") : t("tasks.createBtn")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="card p-6 text-center">
            <DocumentTextIcon className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("tasks.noTasks")}</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id} className="card">
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button
                      onClick={() => toggleTaskExpanded(task.id)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex-shrink-0"
                    >
                      {expandedTasks.has(task.id)
                        ? <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                        : <ChevronRightIcon className="h-4 w-4 text-gray-400" />}
                    </button>
                    <div className="flex-shrink-0">{getStatusIcon(task.status)}</div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                        {task.title}
                      </h3>
                      <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                        {getPriorityBadge(task.priority)}
                        {getStatusBadge(task.status)}
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                          {formatDate(task.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 flex-shrink-0 ml-2">
                    {task.status !== "completed" && task.status !== "cancelled" && (
                      <button
                        onClick={() => handleMarkComplete(task)}
                        className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
                        title={t("tasks.markComplete")}
                      >
                        <CheckIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(task)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                      title={t("tasks.edit")}
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                      title={t("tasks.delete")}
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {expandedTasks.has(task.id) && (
                  <div className="mt-3 pl-8 space-y-2">
                    {task.description && (
                      <div>
                        <h4 className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                          {t("tasks.expandDesc")}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                          {task.description}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <h4 className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                          {t("tasks.details")}
                        </h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">{t("tasks.creator")}</span>
                            <span className="text-gray-700 dark:text-gray-300">{task.createdBy}</span>
                          </div>
                          {task.assignedTo && (
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">{t("tasks.assignee")}</span>
                              <span className="text-gray-700 dark:text-gray-300">{task.assignedTo}</span>
                            </div>
                          )}
                          {task.dueDate && (
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">{t("tasks.deadline")}</span>
                              <span className="text-gray-700 dark:text-gray-300">{formatDate(task.dueDate)}</span>
                            </div>
                          )}
                          {task.estimatedHours && (
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">{t("tasks.estimatedTime")}</span>
                              <span className="text-gray-700 dark:text-gray-300">{task.estimatedHours} {t("tasks.hours")}</span>
                            </div>
                          )}
                          {task.actualHours && (
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">{t("tasks.actualTime")}</span>
                              <span className="text-gray-700 dark:text-gray-300">{task.actualHours} {t("tasks.hours")}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                          {t("tasks.tagsNotes")}
                        </h4>
                        {task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1">
                            {task.tags.map((tag, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {task.notes && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                            {task.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {task.dependencies && task.dependencies.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                          {t("tasks.dependency")}
                        </h4>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {t("tasks.dependencyCount").replace("{count}", task.dependencies.length.toString())}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-3">
        <div className="card p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">{t("tasks.totalCount")}</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{totalCount}</p>
            </div>
            <DocumentTextIcon className="h-5 w-5 text-gray-300 dark:text-gray-600" />
          </div>
        </div>
        <div className="card p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">{t("tasks.inProgress")}</p>
              <p className="text-lg font-semibold text-blue-600">{inProgressCount}</p>
            </div>
            <ArrowPathIcon className="h-5 w-5 text-blue-300 dark:text-blue-700" />
          </div>
        </div>
        <div className="card p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">{t("tasks.completed")}</p>
              <p className="text-lg font-semibold text-green-600">{completedCount}</p>
            </div>
            <CheckCircleIcon className="h-5 w-5 text-green-300 dark:text-green-700" />
          </div>
        </div>
        <div className="card p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">{t("tasks.pending")}</p>
              <p className="text-lg font-semibold text-amber-600">{pendingCount}</p>
            </div>
            <ClockIcon className="h-5 w-5 text-amber-300 dark:text-amber-700" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tasks;
