/**
 * Claw Agent 任务步骤展示组件
 * 参考 DeepSeek 网页版交互：简洁、紧凑、流式展示
 */
import React, { useState } from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  LightBulbIcon,
  PencilSquareIcon,
  CpuChipIcon,
  ClipboardDocumentIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ClawTask, ClawStep, ClawStepStatus, ClawMessage } from "../../types/claw";
import { useSettings } from "../../contexts/SettingsContext";

// 步骤类型图标（更小）
const stepTypeIcons: Record<string, React.ReactNode> = {
  think: <LightBulbIcon className="h-3 w-3" />,
  search: <MagnifyingGlassIcon className="h-3 w-3" />,
  file: <DocumentTextIcon className="h-3 w-3" />,
  code: <CodeBracketIcon className="h-3 w-3" />,
  write: <PencilSquareIcon className="h-3 w-3" />,
  summarize: <CpuChipIcon className="h-3 w-3" />,
  api: <CpuChipIcon className="h-3 w-3" />,
  custom: <CpuChipIcon className="h-3 w-3" />,
};

// 步骤状态颜色
const stepStatusColors: Record<ClawStepStatus, string> = {
  pending: "text-gray-400",
  running: "text-blue-500",
  done: "text-green-500",
  failed: "text-red-500",
  skipped: "text-gray-400",
};

// 步骤类型颜色
const stepTypeColors: Record<string, string> = {
  think: "text-purple-500",
  search: "text-blue-500",
  file: "text-amber-500",
  code: "text-green-500",
  write: "text-pink-500",
  summarize: "text-cyan-500",
  api: "text-indigo-500",
  custom: "text-gray-500",
};

interface Props {
  activeTask: ClawTask | null;
  isLoading: boolean;
}

// 格式化时长
function formatDuration(ms?: number): string {
  if (!ms) return "";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${((ms % 60000) / 1000).toFixed(0)}s`;
}

// 复制文本到剪贴板
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

// 下载文件
const downloadFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// 检测代码语言
const detectLanguage = (content: string): string => {
  if (content.startsWith("```")) {
    const match = content.match(/^```(\w+)/);
    if (match) return match[1];
  }
  if (content.includes("function") || content.includes("const ") || content.includes("let ") || content.includes("=>")) {
    return content.includes(": ") && (content.includes("interface") || content.includes("type ")) ? "typescript" : "javascript";
  }
  if (content.includes("import ") && content.includes("from")) {
    return "javascript";
  }
  if (content.startsWith("<") && content.includes(">") && (content.includes("</") || content.includes("/>"))) {
    return content.includes("className") || content.includes("div") ? "jsx" : "html";
  }
  if (content.trim().startsWith("{") && content.trim().endsWith("}")) {
    try {
      JSON.parse(content);
      return "json";
    } catch {}
  }
  if (content.includes("def ") || content.includes("import ") && !content.includes("from")) {
    return "python";
  }
  if (content.includes("#!/bin/bash") || content.includes("echo ")) {
    return "bash";
  }
  if (content.includes("SELECT ") || content.includes("INSERT ") || content.includes("UPDATE ")) {
    return "sql";
  }
  return "text";
};

// 渲染代码块（带高亮、复制、下载、折叠）
const CodeBlock: React.FC<{ content: string; isDark: boolean }> = ({ content, isDark }) => {
  const [copied, setCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const language = detectLanguage(content);

  const codeStyle = isDark ? oneDark : oneLight;
  const codeLines = content.split("\n").length;
  const previewLines = content.split("\n").slice(0, 3).join("\n");

  const handleCopy = async () => {
    const success = await copyToClipboard(content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const ext = language === "javascript" ? "js" : language === "typescript" ? "ts" : language === "python" ? "py" : language === "json" ? "json" : language === "html" ? "html" : language === "css" ? "css" : "txt";
    downloadFile(content, `code.${ext}`);
  };

  return (
    <div className="mt-1 rounded overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* 代码块工具栏 */}
      <div className="flex items-center justify-between px-2 py-1 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title={isCollapsed ? "展开代码" : "收起代码"}
          >
            {isCollapsed ? (
              <ChevronRightIcon className="h-3 w-3 text-gray-500" />
            ) : (
              <ChevronDownIcon className="h-3 w-3 text-gray-500" />
            )}
          </button>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">{language}</span>
          {isCollapsed && (
            <span className="text-[10px] text-gray-400">({codeLines} 行)</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="复制"
          >
            {copied ? (
              <CheckCircleIcon className="h-3 w-3 text-green-500" />
            ) : (
              <ClipboardDocumentIcon className="h-3 w-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
            )}
          </button>
          <button
            onClick={handleDownload}
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="下载"
          >
            <ArrowDownTrayIcon className="h-3 w-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
          </button>
        </div>
      </div>
      {/* 代码内容 */}
      {isCollapsed ? (
        <div 
          className="p-2 bg-gray-50 dark:bg-gray-900 cursor-pointer font-mono text-[10px] text-gray-600 dark:text-gray-400 whitespace-pre"
          onClick={() => setIsCollapsed(false)}
        >
          {previewLines}{codeLines > 3 ? "\n..." : ""}
        </div>
      ) : (
        <SyntaxHighlighter
          language={language}
          style={codeStyle}
          customStyle={{
            margin: 0,
            padding: "0.5rem",
            fontSize: "11px",
            background: isDark ? "#1f2937" : "#f6f8fa",
            borderRadius: 0,
          }}
          showLineNumbers
        >
          {content}
        </SyntaxHighlighter>
      )}
    </div>
  );
};

// 渲染输出内容
const OutputContent: React.FC<{ output: string; isDark: boolean; isThink: boolean }> = ({ output, isDark, isThink }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // 判断是否为 Markdown 或包含代码块
  const isMarkdown = output.includes("```") || output.includes("#") || output.includes("**") || output.includes("- ");
  
  // 判断是否为文件类型内容（包含路径）
  const isFileContent = output.match(/[:\/]([^\s]+\.[a-zA-Z]+)/) !== null;

  if (isMarkdown) {
    return (
      <div className="markdown-content prose prose-xs dark:prose-invert max-w-none">
        <ReactMarkdown
          components={{
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              const isInline = !match;
              return isInline ? (
                <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]" {...props}>
                  {children}
                </code>
              ) : (
                <CodeBlock
                  content={String(children).replace(/\n$/, "")}
                  isDark={isDark}
                />
              );
            },
          }}
        >
          {output}
        </ReactMarkdown>
      </div>
    );
  }

  if (isFileContent) {
    // 文件内容支持展开/收起
    const codeLanguage = detectLanguage(output);
    const isCode = codeLanguage !== "text";
    
    return (
      <div className={`space-y-1 ${isThink ? "bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded" : ""}`}>
        {/* 操作栏 */}
        <div className="flex items-center justify-between px-2 pt-1.5">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-3 w-3" />
            ) : (
              <ChevronRightIcon className="h-3 w-3" />
            )}
            <span>{isExpanded ? "收起" : "展开"}</span>
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => copyToClipboard(output)}
              className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="复制"
            >
              <ClipboardDocumentIcon className="h-3 w-3 text-gray-400" />
            </button>
            <button
              onClick={() => downloadFile(output, `file-${Date.now()}.txt`)}
              className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="下载"
            >
              <ArrowDownTrayIcon className="h-3 w-3 text-gray-400" />
            </button>
          </div>
        </div>
        
        {/* 内容区域 */}
        {(isExpanded || !isCode) && (
          isCode ? (
            <CodeBlock content={output} isDark={isDark} />
          ) : (
            <div className="px-2 pb-2 whitespace-pre-wrap break-words text-[10px] text-gray-600 dark:text-gray-400">
              {output}
            </div>
          )
        )}
      </div>
    );
  }

  // 普通文本
  return (
    <div className={`whitespace-pre-wrap break-words rounded p-2 text-[10px] ${isThink ? "bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800" : "bg-gray-50 dark:bg-gray-800/50"}`}>
      {output}
    </div>
  );
};

// 渲染单个步骤（DeepSeek 风格）
const StepItem: React.FC<{
  step: ClawStep;
  index: number;
  isLast: boolean;
}> = ({ step, index, isLast }) => {
  const { settings } = useSettings();
  const isDark = settings.theme === "dark";
  const isThink = step.type === "think";
  const isFile = step.type === "file";

  // think 和 file 类型默认展开
  const [isExpanded, setIsExpanded] = useState(step.status === "running" || step.status === "done" || isThink || isFile);

  const statusColor = stepStatusColors[step.status];
  const typeColor = stepTypeColors[step.type] || stepTypeColors["custom"];
  const TypeIcon = stepTypeIcons[step.type] || stepTypeIcons["custom"];

  // think 和 file 类型始终显示，其他类型只显示 done/running/failed
  if (!isThink && !isFile && step.status !== "done" && step.status !== "running" && step.status !== "failed") {
    return null;
  }

  return (
    <div className="relative">
      {/* 连接线 */}
      {!isLast && (
        <div className="absolute left-[11px] top-6 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
      )}
      
      <div className="flex gap-2">
        {/* 状态图标 - think/file 类型使用特殊颜色 */}
        <div className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full ${isThink ? "bg-purple-100 dark:bg-purple-900/30" : isFile ? "bg-amber-100 dark:bg-amber-900/30" : step.status === "running" ? "bg-blue-100 dark:bg-blue-900/30" : step.status === "done" ? "bg-green-100 dark:bg-green-900/30" : step.status === "failed" ? "bg-red-100 dark:bg-red-900/30" : "bg-gray-100 dark:bg-gray-700"}`}>
          {isThink ? (
            <LightBulbIcon className="h-3 w-3 text-purple-500" />
          ) : isFile ? (
            <DocumentTextIcon className="h-3 w-3 text-amber-500" />
          ) : step.status === "running" ? (
            <ArrowPathIcon className="h-3 w-3 text-blue-500 animate-spin" />
          ) : step.status === "done" ? (
            <CheckCircleIcon className="h-3 w-3 text-green-500" />
          ) : step.status === "failed" ? (
            <XCircleIcon className="h-3 w-3 text-red-500" />
          ) : (
            <span className="text-[10px] text-gray-400">{index + 1}</span>
          )}
        </div>

        {/* 步骤内容 */}
        <div className="flex-1 pb-3">
          {/* 步骤标题 */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 w-full text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded py-1 px-1.5 -ml-1.5 transition-colors"
          >
            <span className={typeColor}>{TypeIcon}</span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 flex-1 truncate">
              {step.title}
            </span>
            {isExpanded ? (
              <ChevronDownIcon className="h-3 w-3 text-gray-400" />
            ) : (
              <ChevronRightIcon className="h-3 w-3 text-gray-400" />
            )}
          </button>

          {/* 步骤详情（可展开） */}
          {isExpanded && (
            <div className="mt-1 ml-0.5">
              {/* 元信息 */}
              <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-1.5">
                <span className={statusColor}>
                  {step.status === "running" ? "执行中" : step.status === "done" ? "已完成" : step.status === "failed" ? "失败" : ""}
                </span>
                {step.durationMs && <span>{formatDuration(step.durationMs)}</span>}
                {step.tokens && step.tokens > 0 && <span>{(step.tokens / 1000).toFixed(1)}K</span>}
              </div>

              {/* 步骤输出 */}
              {(step.output || step.error) && (
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5">
                  {step.error ? (
                    <div className="text-red-500 text-[10px] p-1.5 bg-red-50 dark:bg-red-900/20 rounded">
                      {step.error}
                    </div>
                  ) : step.output ? (
                    <OutputContent output={step.output} isDark={isDark} isThink={isThink} />
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 对话历史消息项
const MessageItem: React.FC<{
  message: ClawMessage;
  index: number;
  isLast: boolean;
}> = ({ message, index, isLast }) => {
  const { settings } = useSettings();
  const isDark = settings.theme === "dark";
  const isUser = message.role === "user";
  
  const [isExpanded, setIsExpanded] = useState(true);

  // 判断是否为 Markdown 或包含代码块
  const isMarkdown = message.content.includes("```") || message.content.includes("#") || message.content.includes("**") || message.content.includes("- ");

  return (
    <div className="relative">
      {/* 连接线 */}
      {!isLast && (
        <div className="absolute left-[11px] top-6 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
      )}
      
      <div className="flex gap-2">
        {/* 角色图标 */}
        <div className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full ${isUser ? "bg-blue-100 dark:bg-blue-900/30" : "bg-green-100 dark:bg-green-900/30"}`}>
          {isUser ? (
            <UserIcon className="h-3 w-3 text-blue-500" />
          ) : (
            <ChatBubbleLeftRightIcon className="h-3 w-3 text-green-500" />
          )}
        </div>

        {/* 消息内容 */}
        <div className="flex-1 pb-3">
          {/* 消息标题 */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 w-full text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded py-1 px-1.5 -ml-1.5 transition-colors"
          >
            <span className={`text-xs font-medium ${isUser ? "text-blue-600 dark:text-blue-400" : "text-green-600 dark:text-green-400"}`}>
              {isUser ? "用户" : "助手"}
            </span>
            <span className="text-[10px] text-gray-400 flex-1 truncate">
              {message.content.slice(0, 50)}{message.content.length > 50 ? "..." : ""}
            </span>
            {isExpanded ? (
              <ChevronDownIcon className="h-3 w-3 text-gray-400" />
            ) : (
              <ChevronRightIcon className="h-3 w-3 text-gray-400" />
            )}
          </button>

          {/* 消息详情（可展开） */}
          {isExpanded && (
            <div className="mt-1 ml-0.5">
              {/* 元信息 */}
              <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-1.5">
                <span>{new Date(message.createdAt).toLocaleString()}</span>
                {message.tokens && message.tokens > 0 && <span>{(message.tokens / 1000).toFixed(1)}K</span>}
              </div>

              {/* 消息内容 */}
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {isMarkdown ? (
                  <div className="markdown-content prose prose-xs dark:prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        code({ className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || "");
                          const isInline = !match;
                          return isInline ? (
                            <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]" {...props}>
                              {children}
                            </code>
                          ) : (
                            <CodeBlock
                              content={String(children).replace(/\n$/, "")}
                              isDark={isDark}
                            />
                          );
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ClawAgentSteps: React.FC<Props> = ({
  activeTask,
  isLoading,
}) => {
  const { t, settings } = useSettings();
  const isDark = settings.theme === "dark";

  if (!activeTask) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <CpuChipIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">{t("clawAgent.noTaskSelected") || "请选择一个任务或创建新任务"}</p>
        </div>
      </div>
    );
  }

  // 规划中状态
  if (activeTask.status === "planning") {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <LightBulbIcon className="h-8 w-8 mx-auto mb-2 text-purple-500 animate-pulse" />
          <p className="text-xs">{t("clawAgent.planning") || "正在分析任务并制定计划..."}</p>
        </div>
      </div>
    );
  }

  // 无步骤时
  if (activeTask.steps.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-xs">{t("clawAgent.waitingForInput") || "描述你想要完成的任务"}</p>
        </div>
      </div>
    );
  }

  // 过滤显示的步骤（显示 done、running、failed 状态，以及 think/file 类型的步骤）
  const visibleSteps = activeTask.steps.filter(
    step => step.status === "done" || step.status === "running" || step.status === "failed" || step.type === "think" || step.type === "file"
  );

  // 获取对话历史（排除 system 消息）
  const messages = (activeTask.messages || []).filter(m => m.role !== "system");
  // 对话轮数 = assistant 消息数量（每轮包含 user + assistant）
  const conversationRounds = messages.filter(m => m.role === "assistant").length;

  return (
    <div className="p-3 space-y-2">
      {/* 任务目标（更简洁） */}
      <div className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2">
        {activeTask.goal}
      </div>

      {/* 对话历史（多轮对话时显示） */}
      {conversationRounds > 0 && (
        <div className="mb-4">
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
            <ChatBubbleLeftRightIcon className="h-3 w-3" />
            对话历史 ({conversationRounds} 轮)
          </div>
          <div className="space-y-0.5 bg-gray-50 dark:bg-gray-800/30 rounded-lg p-2">
            {messages.map((message, index) => (
              <MessageItem
                key={message.id}
                message={message}
                index={index}
                isLast={index === messages.length - 1}
              />
            ))}
            {messages.length === 0 && conversationRounds > 0 && (
              <div className="text-[10px] text-gray-400 text-center py-2">
                {conversationRounds} 轮对话已完成
              </div>
            )}
          </div>
        </div>
      )}

      {/* 步骤列表 */}
      {visibleSteps.length > 0 ? (
        <div className="space-y-0.5">
          {visibleSteps.map((step, index) => (
            <StepItem
              key={step.id}
              step={step}
              index={index}
              isLast={index === visibleSteps.length - 1}
            />
          ))}
        </div>
      ) : (
        <div className="text-xs text-gray-400 text-center py-2">
          暂无执行记录
        </div>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <div className="flex items-center gap-2 py-2 text-blue-500">
          <ArrowPathIcon className="h-3 w-3 animate-spin" />
          <span className="text-xs">{t("clawAgent.executing") || "执行中..."}</span>
        </div>
      )}
    </div>
  );
};

export default ClawAgentSteps;
