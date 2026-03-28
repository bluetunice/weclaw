import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useModel } from "../contexts/ModelContext";
import { useSettings } from "../contexts/SettingsContext";
import { useTask } from "../contexts/TaskContext";
import { loadConversations } from "../utils/storage";
import { loadWorkflows } from "../utils/workflowStorage";
import { loadTokenLogs, TokenRecord, fmtTokens } from "../utils/tokenLogger";
import {
  Conversation,
  OperationHistory,
  Skill,
  Tool,
  Workflow
} from "../types";
import { ClawTask } from "../types/claw";
import { loadSkills } from "../components/skills/skillUtils";
import { loadTools } from "../components/tools/toolUtils";
import {
  TopStatCards,
  StatCardItem
} from "../components/dashboard/TopStatCards";
import { WorkflowSection } from "../components/dashboard/WorkflowSection";
import { ChatSection } from "../components/dashboard/ChatSection";
import { TaskSection } from "../components/dashboard/TaskSection";
import { HistorySection } from "../components/dashboard/HistorySection";
import { SkillSection } from "../components/dashboard/SkillSection";
import { ToolSection } from "../components/dashboard/ToolSection";
import { ClawSection } from "../components/dashboard/ClawSection";
import { loadClawTasks } from "../utils/clawStorage";
import {
  BeakerIcon,
  BoltIcon,
  ArrowPathIcon,
  ListBulletIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
  CurrencyDollarIcon
} from "@heroicons/react/24/outline";

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { activeModel, models } = useModel();
  const { t, settings } = useSettings();
  const { tasks: rawTasks } = useTask();

  const tasks = useMemo(
    () =>
      rawTasks.map((tk) => ({
        id: tk.id,
        title: tk.title,
        status: tk.status,
        priority: tk.priority,
        createdAt: new Date(tk.createdAt),
        updatedAt: new Date(tk.updatedAt),
        description: tk.description,
        createdBy: tk.createdBy,
        tags: tk.tags
      })),
    [rawTasks]
  );

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [history, setHistory] = useState<OperationHistory[]>([]);
  const [histLoading, setHistLoading] = useState(true);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [tokenLogs, setTokenLogs] = useState<TokenRecord[]>([]);
  const [clawTasks, setClawTasks] = useState<ClawTask[]>([]);

  // 默认全部收起
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    claw: true,
    workflow: true,
    task: true,
    chat: true,
    history: true,
    skills: true,
    tools: true,
    token: false
  });
  const toggle = (key: string) =>
    setCollapsed((p) => ({ ...p, [key]: !p[key] }));

  useEffect(() => {
    setWorkflows(loadWorkflows());
    setConversations(loadConversations());
    setSkills(loadSkills());
    setTools(loadTools());
    setTokenLogs(loadTokenLogs());
    setClawTasks(loadClawTasks());
  }, []);

  // ── 监听 localStorage 变化，保持数据同步 ─────────────────────────────
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "claw_tasks") {
        setClawTasks(loadClawTasks());
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    setHistLoading(true);
    window.electron?.ipcRenderer
      ?.invoke("get-history", 1000)
      .then((data: OperationHistory[]) => setHistory(data || []))
      .catch(() => setHistory([]))
      .finally(() => setHistLoading(false));
  }, []);

  // ── 派生统计值（供顶部卡片用）──
  const chatTotal = conversations.length;
  const totalMsg = conversations.reduce((s, c) => s + c.messages.length, 0);
  const wfTotal = workflows.length;
  const wfEnabled = workflows.filter((w) => w.enabled).length;
  const taskTotal = tasks.length;
  const taskInProgress = tasks.filter(
    (tk) => tk.status === "in_progress"
  ).length;
  const skillTotal = skills.length;
  const skillEnabled = skills.filter((s) => s.enabled).length;
  const toolTotal = tools.length;
  const toolEnabled = tools.filter((t) => t.enabled).length;
  const toolReadWrite = tools.filter(
    (t) => t.permission === "read_write" && t.enabled
  ).length;
  const histTotal = history.length;
  const histFailed = history.filter((h) =>
    ["failed", "error"].includes((h.operation_status || "").toLowerCase())
  ).length;

  // Token 消耗统计
  const today = new Date().toISOString().slice(0, 10);
  const totalTokensAll = tokenLogs.reduce((s, r) => s + r.totalTokens, 0);
  const todayTokens = tokenLogs
    .filter((r) => r.date === today)
    .reduce((s, r) => s + r.totalTokens, 0);
  const tokenLimit = settings.tokenLimit || 1000000;
  const isOverLimit = todayTokens > tokenLimit;

  const clawTotal = clawTasks.length;
  const clawRunning = clawTasks.filter(
    (tk) => tk.status === "running" || tk.status === "planning"
  ).length;
  const clawFailed = clawTasks.filter((tk) => tk.status === "failed").length;
  const clawTotalTokens = clawTasks.reduce(
    (s, tk) => s + (tk.totalTokens ?? 0),
    0
  );

  const topStats: StatCardItem[] = [
    {
      title: t("nav.models"),
      value: activeModel?.name ?? t("workspace.noSet"),
      sub: `${t("dashboard.total")} ${models.length}`,
      icon: BeakerIcon,
      color: "bg-purple-50 text-purple-600"
    },
    {
      title: t("dashboard.claw") || "Claw",
      value: clawTotal.toString(),
      sub:
        clawRunning > 0
          ? `${clawRunning} ${t("dashboard.status.running")}`
          : clawFailed > 0
            ? `${clawFailed} ${t("dashboard.status.failed")}`
            : t("dashboard.status.success"),
      icon: BoltIcon,
      color:
        clawFailed > 0
          ? "bg-red-50 text-red-600"
          : clawRunning > 0
            ? "bg-indigo-50 text-indigo-600"
            : "bg-indigo-50 text-indigo-600",
      action: () => navigate("/claw")
    },
    {
      title: t("nav.chat"),
      value: chatTotal.toString(),
      sub: `${totalMsg} ${t("dashboard.noChat").includes("记录") ? "条消息" : "messages"}`,
      icon: ChatBubbleLeftRightIcon,
      color: "bg-sky-50 text-sky-600",
      action: () => navigate("/chat")
    },
    {
      title: t("nav.workflow"),
      value: `${wfEnabled}/${wfTotal}`,
      sub: `${t("dashboard.enabled")} / ${t("dashboard.total")}`,
      icon: ArrowPathIcon,
      color: "bg-emerald-50 text-emerald-600",
      action: () => navigate("/workflow")
    },
    {
      title: t("nav.skills"),
      value: `${skillEnabled}/${skillTotal}`,
      sub: `${t("dashboard.enabled")} / ${t("dashboard.total")}`,
      icon: SparklesIcon,
      color: "bg-violet-50 text-violet-600",
      action: () => navigate("/skills")
    },
    {
      title: t("nav.tasks"),
      value: taskTotal.toString(),
      sub: `${taskInProgress} ${t("tasks.inProgress")}`,
      icon: ListBulletIcon,
      color: "bg-amber-50 text-amber-600",
      action: () => navigate("/tasks")
    },
    {
      title: t("nav.tools"),
      value: `${toolEnabled}/${toolTotal}`,
      sub:
        toolReadWrite > 0
          ? `${toolReadWrite} ${t("dashboard.tools.readWrite")}`
          : t("dashboard.status.success"),
      icon: WrenchScrewdriverIcon,
      color:
        toolReadWrite > 0
          ? "bg-amber-50 text-amber-600"
          : "bg-teal-50 text-teal-600",
      action: () => navigate("/tools")
    },
    {
      title: t("nav.history"),
      value: histTotal.toString(),
      sub:
        histFailed > 0
          ? `${histFailed} ${t("history.syncFailed")}`
          : t("dashboard.status.success"),
      icon: ClockIcon,
      color:
        histFailed > 0 ? "bg-red-50 text-red-500" : "bg-gray-50 text-gray-500",
      action: () => navigate("/history")
    }
  ];

  return (
    <div className="space-y-5">
      {/* 页头 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t("dashboard.title")}
        </h1>
        <p className="text-gray-400 dark:text-gray-500 mt-0.5 text-sm">
          {t("dashboard.subtitle")}
        </p>
      </div>

      {/* Token 消耗统计 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-lg ${isOverLimit ? "bg-red-50" : "bg-green-50"}`}
            >
              <CurrencyDollarIcon
                className={`h-5 w-5 ${isOverLimit ? "text-red-500" : "text-green-500"}`}
              />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                {t("dashboard.tokenUsage") || "Token 消耗"}
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span
                  className={`text-2xl font-bold ${isOverLimit ? "text-red-500" : "text-green-500"}`}
                >
                  {fmtTokens(todayTokens)}
                </span>
                <span className="text-sm text-gray-400">
                  / {fmtTokens(tokenLimit)} {t("dashboard.today") || "今日"}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">
              {t("dashboard.totalTokens") || "累计消耗"}
            </p>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 mt-0.5">
              {fmtTokens(totalTokensAll)}
            </p>
          </div>
        </div>
        {/* 进度条 */}
        <div className="mt-3">
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isOverLimit ? "bg-red-500" : "bg-green-500"
              }`}
              style={{
                width: `${Math.min((todayTokens / tokenLimit) * 100, 100)}%`
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-gray-400">
              {Math.round((todayTokens / tokenLimit) * 100)}%{" "}
              {t("dashboard.used") || "已用"}
            </span>
            <span className="text-[10px] text-gray-400">
              {fmtTokens(Math.max(tokenLimit - todayTokens, 0))}{" "}
              {t("dashboard.remaining") || "剩余"}
            </span>
          </div>
        </div>
      </div>

      {/* 顶部统计卡片（4 列换行） */}
      <TopStatCards items={topStats} t={t} />

      {/* 双列模块区 */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* 左列 */}
        <div className="flex flex-col gap-4 flex-1 min-w-0">
          
          <ChatSection
            conversations={conversations}
            collapsed={collapsed.chat}
            onToggle={() => toggle("chat")}
            onNavigate={() => navigate("/chat")}
            t={t}
          />
          <ClawSection
            tasks={clawTasks}
            collapsed={collapsed.claw}
            onToggle={() => toggle("claw")}
            onNavigate={() => navigate("/claw")}
            t={t}
          />
          <WorkflowSection
            workflows={workflows}
            collapsed={collapsed.workflow}
            onToggle={() => toggle("workflow")}
            onNavigate={() => navigate("/workflow")}
            t={t}
          />
          <HistorySection
            history={history}
            loading={histLoading}
            collapsed={collapsed.history}
            onToggle={() => toggle("history")}
            onNavigate={() => navigate("/history")}
            t={t}
          />
        </div>
        {/* 右列 */}
        <div className="flex flex-col gap-4 flex-1 min-w-0">
          <TaskSection
            tasks={tasks}
            collapsed={collapsed.task}
            onToggle={() => toggle("task")}
            onNavigate={() => navigate("/tasks")}
            t={t}
          />
          <ToolSection
            tools={tools}
            collapsed={collapsed.tools}
            onToggle={() => toggle("tools")}
            onNavigate={() => navigate("/tools")}
            t={t}
          />
          <SkillSection
            skills={skills}
            collapsed={collapsed.skills}
            onToggle={() => toggle("skills")}
            onNavigate={() => navigate("/skills")}
            t={t}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
