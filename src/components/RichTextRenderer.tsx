import React, { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  materialLight,
  oneDark
} from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  DocumentArrowDownIcon,
  ClipboardIcon,
  CheckIcon,
  CodeBracketIcon
} from "@heroicons/react/24/outline";
import { useSettings } from "@/contexts/SettingsContext";

/* ─────────── 语言映射表 ─────────── */
const LANGUAGE_MAP: Record<string, string> = {
  js: "JavaScript",
  javascript: "JavaScript",
  ts: "TypeScript",
  typescript: "TypeScript",
  jsx: "React JSX",
  tsx: "React TSX",
  py: "Python",
  python: "Python",
  java: "Java",
  cpp: "C++",
  c: "C",
  cs: "C#",
  csharp: "C#",
  go: "Go",
  rust: "Rust",
  swift: "Swift",
  kt: "Kotlin",
  kotlin: "Kotlin",
  php: "PHP",
  rb: "Ruby",
  ruby: "Ruby",
  md: "Markdown",
  markdown: "Markdown",
  json: "JSON",
  yaml: "YAML",
  yml: "YAML",
  sql: "SQL",
  bash: "Bash",
  sh: "Shell",
  shell: "Shell",
  zsh: "Shell",
  html: "HTML",
  htm: "HTML",
  css: "CSS",
  scss: "SCSS",
  sass: "SASS",
  less: "LESS",
  dockerfile: "Docker",
  docker: "Docker",
  graphql: "GraphQL",
  gql: "GraphQL",
  r: "R",
  perl: "Perl",
  pl: "Perl",
  xml: "XML",
  toml: "TOML",
  ini: "INI",
  vue: "Vue",
  diff: "Diff",
  log: "Log",
  text: "文本",
  plaintext: "纯文本"
};

const EXT_MAP: Record<string, string> = {
  javascript: "js",
  js: "js",
  typescript: "ts",
  ts: "ts",
  jsx: "jsx",
  tsx: "tsx",
  python: "py",
  py: "py",
  java: "java",
  c: "c",
  cpp: "cpp",
  "c++": "cpp",
  csharp: "cs",
  cs: "cs",
  go: "go",
  rust: "rs",
  swift: "swift",
  kotlin: "kt",
  php: "php",
  ruby: "rb",
  markdown: "md",
  md: "md",
  json: "json",
  yaml: "yaml",
  yml: "yml",
  sql: "sql",
  bash: "sh",
  shell: "sh",
  html: "html",
  htm: "html",
  css: "css",
  scss: "scss",
  sass: "sass",
  less: "less",
  dockerfile: "dockerfile",
  docker: "dockerfile",
  graphql: "graphql",
  gql: "graphql",
  xml: "xml",
  toml: "toml",
  ini: "ini",
  text: "txt",
  plaintext: "txt"
};

const MIME_MAP: Record<string, string> = {
  javascript: "application/javascript",
  js: "application/javascript",
  typescript: "application/typescript",
  ts: "application/typescript",
  jsx: "application/javascript",
  tsx: "application/typescript",
  python: "text/x-python",
  py: "text/x-python",
  java: "text/x-java",
  c: "text/x-c",
  cpp: "text/x-c++",
  csharp: "text/x-csharp",
  cs: "text/x-csharp",
  go: "text/x-go",
  rust: "text/x-rust",
  html: "text/html",
  css: "text/css",
  json: "application/json",
  xml: "application/xml",
  yaml: "text/x-yaml",
  yml: "text/x-yaml",
  markdown: "text/markdown",
  md: "text/markdown"
};

// react-syntax-highlighter 语言标识修正
const PRISM_LANG_MAP: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  rb: "ruby",
  rs: "rust",
  kt: "kotlin",
  cs: "csharp",
  md: "markdown",
  sh: "bash",
  zsh: "bash",
  shell: "bash",
  htm: "html",
  yml: "yaml",
  gql: "graphql",
  docker: "dockerfile",
  pl: "perl"
};

/* ─────────── CodeBlock 子组件 ─────────── */
interface CodeBlockProps {
  lang: string;
  codeContent: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ lang, codeContent }) => {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const { settings } = useSettings();

  const normalized = lang.toLowerCase().trim() || "text";
  const prismLang = PRISM_LANG_MAP[normalized] || normalized;
  const languageName =
    LANGUAGE_MAP[normalized] ||
    lang.charAt(0).toUpperCase() + lang.slice(1) ||
    "Code";
  const lineCount = codeContent.split("\n").length;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(codeContent);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = codeContent;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [codeContent]);

  const handleDownload = useCallback(() => {
    try {
      const ext = EXT_MAP[normalized] || lang || "txt";
      const mime = MIME_MAP[normalized] || "text/plain";
      const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const fname = `${languageName.replace(/\s+/g, "-").toLowerCase()}-${ts}.${ext}`;
      const blob = new Blob([codeContent], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fname;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch (err) {
      console.error("下载失败:", err);
    }
  }, [codeContent, lang, normalized, languageName]);

  const isDark = settings.theme === "dark";

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 shadow-sm bg-[#f8f9fc] dark:bg-[#1e2433]" style={{ overflowX: "auto" }}>
      {/* 头部栏 */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#eef0f5] dark:bg-[#252d3d] border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center space-x-2.5">
          {/* macOS 圆点 */}
          <div className="flex items-center space-x-1.5">
            <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <div className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
          <div className="flex items-center space-x-1.5">
            <CodeBracketIcon className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
              {languageName}
            </span>
            {normalized !== "text" && normalized !== "plaintext" && (
              <span className="px-1.5 py-0.5 text-[10px] bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-500 font-mono">
                {lang}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono mr-1">
            {lineCount} 行
          </span>

          {/* 复制按钮 */}
          <button
            onClick={handleCopy}
            title={copied ? "已复制" : "复制代码"}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
              copied
                ? "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-700"
                : "bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-100"
            }`}
          >
            {copied ? (
              <>
                <CheckIcon className="h-3.5 w-3.5" />
                <span>已复制</span>
              </>
            ) : (
              <>
                <ClipboardIcon className="h-3.5 w-3.5" />
                <span>复制</span>
              </>
            )}
          </button>

          {/* 下载按钮 */}
          <button
            onClick={handleDownload}
            title={downloaded ? "已下载" : "下载文件"}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
              downloaded
                ? "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-700"
                : "bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-100"
            }`}
          >
            {downloaded ? (
              <>
                <CheckIcon className="h-3.5 w-3.5" />
                <span>已下载</span>
              </>
            ) : (
              <>
                <DocumentArrowDownIcon className="h-3.5 w-3.5" />
                <span>下载</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 代码高亮区域 */}
      <SyntaxHighlighter
        language={prismLang}
        style={isDark ? oneDark : materialLight}
        showLineNumbers
        lineNumberStyle={{
          minWidth: "2.5em",
          paddingRight: "1em",
          color: isDark ? "#636d83" : "#aab0c0",
          fontSize: "11px",
          userSelect: "none"
        }}
        customStyle={{
          margin: 0,
          padding: "1rem",
          background: isDark ? "#1e2433" : "#f8f9fc",
          fontSize: "13px",
          lineHeight: "1.6",
          maxHeight: "520px",
          overflowY: "auto"
        }}
        codeTagProps={{
          style: {
            fontFamily:
              "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace"
          }
        }}
        wrapLongLines={false}
      >
        {codeContent}
      </SyntaxHighlighter>
    </div>
  );
};

/* ─────────── 行内代码处理 ─────────── */
const InlineCode: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 text-rose-600 dark:text-rose-400 rounded text-[0.85em] font-mono border border-gray-200 dark:border-gray-600">
    {children}
  </code>
);

/* ─────────── 主组件 ─────────── */
interface RichTextRendererProps {
  content: string;
  isCode?: boolean;
  language?: string;
}

const RichTextRenderer: React.FC<RichTextRendererProps> = ({
  content,
  isCode = false,
  language = "text"
}) => {
  const { settings } = useSettings();
  const isDark = settings.theme === "dark";

  if (!content) return null;

  if (isCode) {
    return <CodeBlock lang={language} codeContent={content} />;
  }

  return (
    <div className="rich-text-content overflow-x-hidden">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 代码块
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");
            if (match) {
              return (
                <CodeBlock
                  lang={match[1]}
                  codeContent={codeString}
                />
              );
            }
            return (
              <InlineCode {...props}>{children}</InlineCode>
            );
          },
          // 表格
          table({ children }) {
            return (
              <div className="my-3 overflow-x-auto">
                <table className="min-w-full text-sm border-collapse">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return (
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                {children}
              </thead>
            );
          },
          th({ children }) {
            return (
              <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="px-3 py-2 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
                {children}
              </td>
            );
          },
          tr({ children }) {
            return (
              <tr className="even:bg-gray-50 even:dark:bg-gray-700/30">
                {children}
              </tr>
            );
          },
          // 链接
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {children}
              </a>
            );
          },
          // 引用
          blockquote({ children }) {
            return (
              <blockquote className="pl-3 border-l-4 border-blue-300 dark:border-blue-500 text-gray-600 dark:text-gray-300 italic my-2">
                {children}
              </blockquote>
            );
          },
          // 列表
          ul({ children }) {
            return <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>;
          },
          li({ children }) {
            return <li className="text-gray-700 dark:text-gray-200">{children}</li>;
          },
          // 标题
          h1({ children }) {
            return <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-4 mb-2">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-3 mb-2">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-3 mb-1">{children}</h3>;
          },
          // 分隔线
          hr() {
            return <hr className="my-4 border-gray-200 dark:border-gray-600" />;
          },
          // 段落
          p({ children }) {
            return (
              <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed my-2 break-words">
                {children}
              </p>
            );
          },
          // 图片
          img({ src, alt }) {
            if (!src) return null;
            // base64 图片直接渲染
            if (src.startsWith("data:image/")) {
              return (
                <img
                  src={src}
                  alt={alt || ""}
                  className="max-w-full max-h-64 rounded-lg my-2 inline-block"
                  style={{ objectFit: "contain" }}
                />
              );
            }
            // 普通 URL 图片
            return (
              <img
                src={src}
                alt={alt || ""}
                className="max-w-full max-h-64 rounded-lg my-2 inline-block"
                style={{ objectFit: "contain" }}
              />
            );
          },
          // 强调
          strong({ children }) {
            return <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>;
          },
          em({ children }) {
            return <em className="italic">{children}</em>;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default RichTextRenderer;
