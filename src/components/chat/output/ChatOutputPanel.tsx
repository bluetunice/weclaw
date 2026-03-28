import React, { useState, useMemo } from "react";
import {
  XMarkIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  CodeBracketSquareIcon,
  FolderIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import {
  CodePlan,
  TodoPlan,
  OutputFile,
  PlanStepStatus,
  ChatPanelMode,
} from "../../../types";
import { useSettings } from "../../../contexts/SettingsContext";

export interface ChatOutputState {
  codePlans: CodePlan[];
  todoPlan: TodoPlan | null;
  files: OutputFile[];
  activeFileId?: string;
}

interface ChatOutputPanelProps {
  state: ChatOutputState;
  mode: ChatPanelMode;
  onModeChange: (mode: ChatPanelMode) => void;
  onClose: () => void;
  onStepStatusChange: (planId: string, stepId: string, status: PlanStepStatus) => void;
  onTodoItemToggle: (itemId: string, done: boolean) => void;
  onTodoItemAdd: (text: string) => void;
  onTodoItemDelete: (itemId: string) => void;
  onFileSelect: (fileId: string) => void;
  onActivePlanChange: (planId: string) => void;
}

// ── Tab 定义 ─────────────────────────────────────────────────────────────────

type OutputTab = "output" | "files";

interface TabConfig {
  mode: OutputTab;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  labelKey: string;
}

const ChatOutputPanel: React.FC<ChatOutputPanelProps> = ({
  state,
  mode,
  onModeChange,
  onClose,
  onStepStatusChange,
  onTodoItemToggle,
  onTodoItemAdd,
  onTodoItemDelete,
  onFileSelect,
  onActivePlanChange,
}) => {
  const { t } = useSettings();
  const [activePlanIndex, setActivePlanIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<OutputTab>("output");
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [pickerFileId, setPickerFileId] = useState<string | null>(null);

  const { codePlans, todoPlan, files, activeFileId } = state;

  // 当前显示的 CodePlan
  const activePlan = codePlans[activePlanIndex] ?? codePlans[0] ?? null;

  const tabs: TabConfig[] = [
    {
      mode: "output",
      icon: DocumentTextIcon,
      labelKey: "chat.panel.output",
    },
    {
      mode: "files",
      icon: FolderIcon,
      labelKey: "chat.panel.files",
    },
  ];

  // 构建文件树结构
  const fileTree = useMemo(() => {
    const root: { [key: string]: any } = {};
    files.forEach((file) => {
      const parts = file.path.split("/");
      let current = root;
      parts.forEach((part, idx) => {
        if (!current[part]) {
          current[part] = {
            name: part,
            isFile: idx === parts.length - 1,
            file: idx === parts.length - 1 ? file : null,
            children: idx === parts.length - 1 ? undefined : {},
          };
        }
        if (idx < parts.length - 1) {
          current = current[part].children || {};
        }
      });
    });
    return root;
  }, [files]);

  const handlePlanPrev = () => {
    const next = Math.max(0, activePlanIndex - 1);
    setActivePlanIndex(next);
    onActivePlanChange(codePlans[next]?.id ?? "");
  };

  const handlePlanNext = () => {
    const next = Math.min(codePlans.length - 1, activePlanIndex + 1);
    setActivePlanIndex(next);
    onActivePlanChange(codePlans[next]?.id ?? "");
  };

  // 渲染文件树
  const renderFileTree = (
    tree: { [key: string]: any },
    level: number = 0
  ): React.ReactNode => {
    return Object.entries(tree)
      .sort((a, b) => {
        // 文件夹在前，文件在后
        if (a[1].isFile !== b[1].isFile) return a[1].isFile ? 1 : -1;
        return a[0].localeCompare(b[0]);
      })
      .map(([name, node]) => {
        const isActive = node.file?.id === activeFileId;
        const hasChildren = node.children && Object.keys(node.children).length > 0;
        const [expanded, setExpanded] = useState(level === 0);

        if (node.isFile && node.file) {
          const meta: any = getLangMeta(node.file.language);
          return (
            <button
              key={node.file.id}
              onClick={() => onFileSelect(node.file.id)}
              className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-left text-[11px] transition-colors ${
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
              <CodeBracketSquareIcon className={`h-3 w-3 flex-shrink-0 ${meta?.iconColor || "text-gray-400"}`} />
              <span className="truncate">{name}</span>
            </button>
          );
        }

        return (
          <div key={name}>
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center gap-1 px-2 py-1.5 text-left text-[11px] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              style={{ paddingLeft: `${level * 12 + 4}px` }}
            >
              {expanded ? (
                <ChevronDownIcon className="h-3 w-3 flex-shrink-0" />
              ) : (
                <ChevronRightIcon className="h-3 w-3 flex-shrink-0" />
              )}
              <FolderIcon className="h-3 w-3 flex-shrink-0 text-yellow-500" />
              <span className="truncate">{name}</span>
            </button>
            {expanded && hasChildren && renderFileTree(node.children, level + 1)}
          </div>
        );
      });
  };

  return (
    <div className="flex flex-col h-full border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 min-w-0 overflow-hidden">
      {/* 顶部 Tab 栏 */}
      <div className="flex items-center flex-shrink-0 border-b border-gray-100 dark:border-gray-700">
        {/* Tab 按钮 */}
        <div className="flex-1 flex items-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.mode;
            return (
              <button
                key={tab.mode}
                onClick={() => setActiveTab(tab.mode)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-medium border-b-2 transition-all duration-150 ${
                  isActive
                    ? "border-b-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10"
                    : "border-b-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{t(tab.labelKey)}</span>
              </button>
            );
          })}
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={t("chat.panel.close")}
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      {/* 内容区 */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {/* 输出产物 Tab */}
        {activeTab === "output" && (
          <div className="h-full overflow-y-auto p-3 space-y-4">
            {/* CodePlan 列表 */}
            {codePlans.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                  {t("chat.panel.codeplan")} ({codePlans.length})
                </h3>
                {codePlans.map((plan, idx) => (
                  <button
                    key={plan.id}
                    onClick={() => {
                      setActivePlanIndex(idx);
                      onActivePlanChange(plan.id);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
                      activePlanIndex === idx
                        ? "border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-medium text-gray-700 dark:text-gray-200 truncate">
                        {plan.title}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-2">
                        {plan.steps.length} {t("chat.panel.steps")}
                      </span>
                    </div>
                    {/* 显示关联的文件 */}
                    {plan.steps.some((s) => s.filePath) && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {plan.steps
                          .filter((s) => s.filePath)
                          .map((s) => {
                            const file = files.find((f) => f.path === s.filePath);
                            return file ? (
                              <button
                                key={s.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onFileSelect(file.id);
                                  setActiveTab("files");
                                }}
                                className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                              >
                                {file.path.split("/").pop()}
                              </button>
                            ) : null;
                          })}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Todo 列表 */}
            {todoPlan && (
              <div className="space-y-2">
                <h3 className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                  {t("chat.panel.todo")} ({todoPlan.items.length})
                </h3>
                <div className="space-y-1">
                  {todoPlan.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <button
                        onClick={() => onTodoItemToggle(item.id, !item.done)}
                        className={`flex-shrink-0 w-4 h-4 rounded border ${
                          item.done
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        {item.done && (
                          <svg className="w-full h-full p-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <span
                        className={`text-[12px] ${
                          item.done
                            ? "text-gray-400 line-through"
                            : "text-gray-700 dark:text-gray-200"
                        }`}
                      >
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 空状态 */}
            {codePlans.length === 0 && !todoPlan && (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400 dark:text-gray-500">
                <DocumentTextIcon className="h-10 w-10 mb-2" />
                <span className="text-xs">{t("chat.panel.noContent")}</span>
              </div>
            )}
          </div>
        )}

        {/* 全部文件 Tab */}
        {activeTab === "files" && (
          <div className="h-full overflow-hidden flex">
            {/* 文件树 */}
            <div className="flex-1 overflow-y-auto py-2">
              {files.length > 0 ? (
                renderFileTree(fileTree)
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                  <FolderIcon className="h-10 w-10 mb-2" />
                  <span className="text-xs">{t("chat.file.noFile")}</span>
                </div>
              )}
            </div>

            {/* 文件预览 */}
            {activeFileId && (
              <div className="w-[180px] border-l border-gray-100 dark:border-gray-700 flex flex-col">
                <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                    {t("chat.file.preview")}
                  </span>
                </div>
                <div className="flex-1 overflow-auto p-2">
                  {(() => {
                    const file = files.find((f) => f.id === activeFileId);
                    if (!file) return null;
                    const lines = file.content.split("\n");
                    return (
                      <pre className="text-[9px] font-mono text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-all">
                        {lines.slice(0, 50).join("\n")}
                        {lines.length > 50 && "\n..."}
                      </pre>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// 语言元数据
const langMeta: Record<string, { label: string; iconColor: string }> = {
  typescript: { label: "TS", iconColor: "text-blue-500" },
  tsx: { label: "TSX", iconColor: "text-blue-400" },
  javascript: { label: "JS", iconColor: "text-yellow-500" },
  jsx: { label: "JSX", iconColor: "text-yellow-400" },
  python: { label: "PY", iconColor: "text-green-500" },
  java: { label: "JV", iconColor: "text-orange-500" },
  go: { label: "GO", iconColor: "text-cyan-500" },
  rust: { label: "RS", iconColor: "text-orange-600" },
  html: { label: "HTML", iconColor: "text-red-400" },
  css: { label: "CSS", iconColor: "text-sky-400" },
  json: { label: "JSON", iconColor: "text-emerald-400" },
  markdown: { label: "MD", iconColor: "text-gray-500" },
  plaintext: { label: "TXT", iconColor: "text-gray-400" },
};

function getLangMeta(lang: string) {
  return langMeta[lang] || langMeta.plaintext;
}

export default ChatOutputPanel;
