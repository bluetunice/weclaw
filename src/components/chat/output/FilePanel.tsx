import React, { useState, useMemo } from "react";
import {
  ClipboardIcon,
  CheckIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  EyeIcon,
  Bars3BottomLeftIcon,
  Bars3Icon,
  ChevronRightIcon,
  ChevronDownIcon,
  FolderOpenIcon
} from "@heroicons/react/24/outline";
import { OutputFile, FileLanguage } from "../../../types";
import { useSettings } from "../../../contexts/SettingsContext";

interface FilePanelProps {
  files: OutputFile[];
  activeFileId?: string;
  onFileSelect: (fileId: string) => void;
}

// ── 语言 → 图标色 / 标签 ──────────────────────────────────────────────────────

const langMeta: Record<
  FileLanguage,
  { label: string; iconColor: string; previewable: boolean }
> = {
  typescript: { label: "TS", iconColor: "text-blue-500", previewable: false },
  tsx: { label: "TSX", iconColor: "text-blue-400", previewable: false },
  javascript: { label: "JS", iconColor: "text-yellow-500", previewable: false },
  jsx: { label: "JSX", iconColor: "text-yellow-400", previewable: false },
  python: { label: "PY", iconColor: "text-green-500", previewable: false },
  java: { label: "JV", iconColor: "text-orange-500", previewable: false },
  go: { label: "GO", iconColor: "text-cyan-500", previewable: false },
  rust: { label: "RS", iconColor: "text-orange-600", previewable: false },
  cpp: { label: "C++", iconColor: "text-purple-500", previewable: false },
  c: { label: "C", iconColor: "text-purple-400", previewable: false },
  csharp: { label: "C#", iconColor: "text-violet-500", previewable: false },
  html: { label: "HTML", iconColor: "text-red-400", previewable: true },
  css: { label: "CSS", iconColor: "text-sky-400", previewable: false },
  scss: { label: "SCSS", iconColor: "text-pink-400", previewable: false },
  json: { label: "JSON", iconColor: "text-emerald-400", previewable: false },
  yaml: { label: "YAML", iconColor: "text-teal-400", previewable: false },
  toml: { label: "TOML", iconColor: "text-teal-500", previewable: false },
  xml: { label: "XML", iconColor: "text-orange-300", previewable: false },
  markdown: { label: "MD", iconColor: "text-gray-500", previewable: true },
  sql: { label: "SQL", iconColor: "text-indigo-400", previewable: false },
  shell: { label: "SH", iconColor: "text-green-400", previewable: false },
  dockerfile: { label: "🐳", iconColor: "text-blue-300", previewable: false },
  plaintext: { label: "TXT", iconColor: "text-gray-400", previewable: false }
};

// ── 轻量 Markdown 渲染 ────────────────────────────────────────────────────────

const MarkdownPreview: React.FC<{ content: string }> = ({ content }) => {
  const html = useMemo(() => {
    const s = content
      .replace(
        /^#{6}\s+(.+)$/gm,
        "<h6 class='text-xs font-bold mt-2 mb-1'>$1</h6>"
      )
      .replace(
        /^#{5}\s+(.+)$/gm,
        "<h5 class='text-xs font-bold mt-2 mb-1'>$1</h5>"
      )
      .replace(
        /^#{4}\s+(.+)$/gm,
        "<h4 class='text-sm font-bold mt-2 mb-1'>$1</h4>"
      )
      .replace(
        /^#{3}\s+(.+)$/gm,
        "<h3 class='text-sm font-bold mt-3 mb-1'>$1</h3>"
      )
      .replace(
        /^#{2}\s+(.+)$/gm,
        "<h2 class='text-base font-bold mt-3 mb-1.5'>$1</h2>"
      )
      .replace(
        /^#{1}\s+(.+)$/gm,
        "<h1 class='text-lg font-bold mt-4 mb-2'>$1</h1>"
      )
      .replace(
        /`([^`]+)`/g,
        "<code class='px-1 py-px bg-gray-100 dark:bg-gray-700 text-red-500 dark:text-red-300 rounded text-[11px] font-mono'>$1</code>"
      )
      .replace(/\*\*(.+?)\*\*/g, "<strong class='font-semibold'>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em class='italic'>$1</em>")
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        "<a href='$2' target='_blank' class='text-blue-500 hover:underline'>$1</a>"
      )
      .replace(/^[-*+]\s+(.+)$/gm, "<li class='ml-4 list-disc text-xs'>$1</li>")
      .replace(
        /^\d+\.\s+(.+)$/gm,
        "<li class='ml-4 list-decimal text-xs'>$1</li>"
      )
      .replace(
        /^---+$/gm,
        "<hr class='my-3 border-gray-200 dark:border-gray-700'>"
      )
      .replace(/\n\n/g, "</p><p class='my-1'>")
      .replace(/\n/g, "<br>");
    return `<div class='text-xs leading-relaxed text-gray-700 dark:text-gray-200'><p class='my-1'>${s}</p></div>`;
  }, [content]);
  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      className="px-4 py-3 overflow-y-auto"
    />
  );
};

// ── HTML iframe 预览 ──────────────────────────────────────────────────────────

const HtmlPreview: React.FC<{ content: string }> = ({ content }) => {
  const blob = useMemo(
    () => URL.createObjectURL(new Blob([content], { type: "text/html" })),
    [content]
  );
  return (
    <iframe
      src={blob}
      className="w-full h-full border-0"
      sandbox="allow-scripts allow-same-origin"
      title="HTML Preview"
    />
  );
};

// ── 代码视图（带行号） ────────────────────────────────────────────────────────

const CodeView: React.FC<{ content: string; wrap: boolean }> = ({
  content,
  wrap
}) => {
  const lines = content.split("\n");
  return (
    <div className="h-full overflow-auto">
      <table className="text-[11px] font-mono w-full border-collapse">
        <tbody>
          {lines.map((line, idx) => (
            <tr
              key={idx}
              className="hover:bg-gray-50 dark:hover:bg-gray-700/50 group"
            >
              <td className="select-none pr-3 pl-3 py-px text-gray-300 dark:text-gray-600 text-right align-top w-8 border-r border-gray-100 dark:border-gray-700 sticky left-0 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700/50">
                {idx + 1}
              </td>
              <td
                className={`pl-4 pr-4 py-px text-gray-800 dark:text-gray-100 align-top ${
                  wrap ? "whitespace-pre-wrap break-all" : "whitespace-pre"
                }`}
              >
                {line || " "}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── 文件树侧边栏 ──────────────────────────────────────────────────────────────

interface FileSidebarProps {
  files: OutputFile[];
  activeFileId?: string;
  onFileSelect: (fileId: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const FileSidebar: React.FC<FileSidebarProps> = ({
  files,
  activeFileId,
  onFileSelect,
  collapsed,
  onToggle
}) => {
  const { t } = useSettings();

  // 按 messageId 分组
  const groups = useMemo(() => {
    const map = new Map<string, OutputFile[]>();
    files.forEach((f) => {
      const arr = map.get(f.messageId) ?? [];
      arr.push(f);
      map.set(f.messageId, arr);
    });
    return Array.from(map.entries()).map(([msgId, fs], idx) => ({
      msgId,
      label: `#${idx + 1}`,
      files: fs
    }));
  }, [files]);

  // 每个分组是否展开
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set()
  );
  const toggleGroup = (id: string) =>
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // 始终展开，不显示折叠状态
  if (collapsed) {
    return null;
  }

  return (
    <div className="w-44 flex-shrink-0 flex flex-col border-r border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 overflow-hidden">
      {/* 侧边栏顶栏 - 不显示收起按钮 */}
      <div className="flex items-center px-2 py-1.5  dark:border-gray-700">
        <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
          {t("chat.file.files")} {files.length > 0 && `(${files.length})`}
        </span>
      </div>

      {/* 文件树 */}
      <div className="flex-1 min-h-0 overflow-y-auto py-1">
        {groups.map(({ msgId, label, files: gFiles }) => {
          const isGroupCollapsed = collapsedGroups.has(msgId);
          return (
            <div key={msgId}>
              {/* 分组标题（多消息时才显示） */}
              {groups.length > 1 && (
                <button
                  onClick={() => toggleGroup(msgId)}
                  className="w-full flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                  {isGroupCollapsed ? (
                    <ChevronRightIcon className="h-2.5 w-2.5 flex-shrink-0" />
                  ) : (
                    <ChevronDownIcon className="h-2.5 w-2.5 flex-shrink-0" />
                  )}
                  <FolderOpenIcon className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">
                    {t("chat.file.message")} {label}
                  </span>
                  <span className="ml-auto text-[9px] bg-gray-200 dark:bg-gray-700 px-1 rounded">
                    {gFiles.length}
                  </span>
                </button>
              )}
              {!isGroupCollapsed &&
                gFiles.map((f) => {
                  const m = langMeta[f.language] ?? langMeta.plaintext;
                  const isActive = f.id === activeFileId;
                  const fileName = f.path.split("/").pop() ?? f.path;
                  return (
                    <button
                      key={f.id}
                      onClick={() => onFileSelect(f.id)}
                      className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-left transition-colors ${
                        groups.length > 1 ? "pl-6" : ""
                      } ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-800 dark:hover:text-gray-200"
                      }`}
                      title={f.path}
                    >
                      <span
                        className={`text-[9px] font-bold flex-shrink-0 ${m.iconColor}`}
                      >
                        {m.label}
                      </span>
                      <span className="text-[11px] truncate">{fileName}</span>
                      {f.modified && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── 主组件 ───────────────────────────────────────────────────────────────────

const FilePanel: React.FC<FilePanelProps> = ({
  files,
  activeFileId,
  onFileSelect
}) => {
  const { t } = useSettings();
  const [copied, setCopied] = useState(false);
  const [wrap, setWrap] = useState(false);
  const [previewMode, setPreviewMode] = useState<"source" | "preview">(
    "source"
  );

  // 当前活动文件
  const resolvedActiveId = activeFileId ?? files[0]?.id;
  const activeFile = useMemo(
    () => files.find((f) => f.id === resolvedActiveId),
    [files, resolvedActiveId]
  );

  // 文件切换时重置预览模式
  const handleFileSelect = (id: string) => {
    onFileSelect(id);
    setPreviewMode("source");
    setCopied(false);
  };

  const handleCopy = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeFile.path.split("/").pop() ?? "file.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const meta = activeFile
    ? (langMeta[activeFile.language] ?? langMeta.plaintext)
    : null;
  const canPreview = meta?.previewable ?? false;
  const lineCount = activeFile ? activeFile.content.split("\n").length : 0;
  const charCount = activeFile ? activeFile.content.length : 0;

  // 空状态
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
        <CodeBracketIcon className="h-10 w-10 mb-3" />
        <span className="text-xs">{t("chat.file.noFile")}</span>
        <p className="text-[10px] mt-1.5 text-center max-w-[160px] text-gray-300 dark:text-gray-600">
          {t("chat.file.fileHint")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* 文件树侧边栏 - 始终展开，不显示收起按钮 */}
      <FileSidebar
        files={files}
        activeFileId={resolvedActiveId}
        onFileSelect={handleFileSelect}
        collapsed={false}
        onToggle={() => {}}
      />

      {/* 右侧编辑器区域 */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {activeFile ? (
          <>
            {/* 工具栏 */}
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
              {/* 文件路径 */}
              <div className="flex items-center gap-1.5 min-w-0">
                <DocumentTextIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
                <span
                  className="text-[11px] text-gray-600 dark:text-gray-300 font-mono truncate max-w-[120px]"
                  title={activeFile.path}
                >
                  {activeFile.path}
                </span>
                <span className="text-[9px] text-gray-300 dark:text-gray-600 hidden sm:inline-block flex-shrink-0">
                  {lineCount}L · {charCount}C
                </span>
              </div>

              {/* 操作 */}
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  onClick={async () => {
                    if (!activeFile) return;
                    // 尝试通过Electron打开文件
                    try {
                      await window.electron?.ipcRenderer?.invoke("open-file-in-editor", activeFile.path);
                    } catch (e) {
                      console.error("打开文件失败:", e);
                      alert("打开文件失败: " + (e instanceof Error ? e.message : String(e)));
                    }
                  }}
                  className="flex items-center gap-0.5 px-1.5 py-1 text-[10px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="在编辑器中打开"
                >
                  <EyeIcon className="h-3 w-3" />
                  <span>打开</span>
                </button>
                <div className="w-px h-3 bg-gray-200 dark:bg-gray-600 mx-0.5" />

                {canPreview && (
                  <>
                    <button
                      onClick={() => setPreviewMode("source")}
                      className={`flex items-center gap-0.5 px-1.5 py-1 text-[10px] rounded transition-colors ${
                        previewMode === "source"
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300"
                          : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      }`}
                    >
                      <CodeBracketIcon className="h-3 w-3" />
                      <span>{t("chat.file.source")}</span>
                    </button>
                    <button
                      onClick={() => setPreviewMode("preview")}
                      className={`flex items-center gap-0.5 px-1.5 py-1 text-[10px] rounded transition-colors ${
                        previewMode === "preview"
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300"
                          : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      }`}
                    >
                      <EyeIconOutline className="h-3 w-3" />
                      <span>{t("chat.file.preview")}</span>
                    </button>
                    <div className="w-px h-3 bg-gray-200 dark:bg-gray-600 mx-0.5" />
                  </>
                )}

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-0.5 px-1.5 py-1 text-[10px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  {copied ? (
                    <CheckIcon className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <ClipboardIcon className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {copied ? t("chat.file.copied") : t("chat.file.copy")}
                  </span>
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-0.5 px-1.5 py-1 text-[10px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                  <span>{t("chat.file.download")}</span>
                </button>
              </div>
            </div>

            {/* 内容区 */}
            <div className="flex-1 min-h-0 overflow-hidden bg-white dark:bg-gray-800">
              {previewMode === "preview" && activeFile.language === "html" ? (
                <HtmlPreview content={activeFile.content} />
              ) : previewMode === "preview" &&
                activeFile.language === "markdown" ? (
                <div className="h-full overflow-y-auto">
                  <MarkdownPreview content={activeFile.content} />
                </div>
              ) : (
                <CodeView content={activeFile.content} wrap={false} />
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
            <DocumentTextIcon className="h-8 w-8 mb-2" />
            <span className="text-xs">{t("chat.file.selectFile")}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilePanel;
