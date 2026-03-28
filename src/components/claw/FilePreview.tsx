/**
 * 文件预览组件
 */
import React, { useState, useEffect } from "react";
import {
  XMarkIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  EyeIcon,
  ClipboardIcon,
} from "@heroicons/react/24/outline";

interface Props {
  file: {
    path: string;
    content: string;
  };
  onClose: () => void;
}

// 获取文件语言
function getLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const langMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    h: 'c',
    hpp: 'cpp',
    cs: 'csharp',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    scala: 'scala',
    html: 'html',
    css: 'css',
    scss: 'scss',
    less: 'less',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
    md: 'markdown',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    dockerfile: 'dockerfile',
    toml: 'toml',
    ini: 'ini',
    conf: 'text',
    txt: 'text',
  };
  return langMap[ext] || 'text';
}

// 获取文件图标
function getFileIcon(filePath: string): React.ReactNode {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const codeExts = ['js', 'jsx', 'ts', 'tsx', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'cs', 'php', 'swift', 'kt', 'scala', 'h', 'hpp'];
  const iconExts = ['html', 'css', 'scss', 'less', 'json', 'yaml', 'yml', 'xml', 'md', 'sql', 'sh', 'bash', 'zsh', 'dockerfile', 'toml', 'ini', 'conf', 'txt'];
  
  if (codeExts.includes(ext)) {
    return <CodeBracketIcon className="h-5 w-5" />;
  }
  if (iconExts.includes(ext)) {
    return <DocumentTextIcon className="h-5 w-5" />;
  }
  return <DocumentTextIcon className="h-5 w-5" />;
}

const FilePreview: React.FC<Props> = ({ file, onClose }) => {
  const [copied, setCopied] = useState(false);
  
  const fileName = file.path.split(/[/\\]/).pop() || 'file';
  const language = getLanguage(file.path);
  const FileIcon = getFileIcon(file.path);

  // 复制到剪贴板
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(file.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  // 键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // 计算行号宽度
  const lineCount = file.content.split('\n').length;
  const lineNumberWidth = Math.max(30, Math.ceil(Math.log10(lineCount)) * 10 + 16);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex-shrink-0 text-blue-500 dark:text-blue-400">
              {FileIcon}
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                {fileName}
              </h3>
              <p className="text-xs text-gray-400 truncate">
                {file.path}
              </p>
            </div>
            <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
              {language}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 复制按钮 */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <span className="text-green-500">✓</span>
                  <span>已复制</span>
                </>
              ) : (
                <>
                  <ClipboardIcon className="h-3.5 w-3.5" />
                  <span>复制</span>
                </>
              )}
            </button>
            
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-auto bg-gray-900 dark:bg-gray-900">
          <div className="flex min-h-full">
            {/* 行号 */}
            <div 
              className="flex-shrink-0 px-3 py-3 text-right text-xs font-mono text-gray-500 bg-gray-800 dark:bg-gray-800/50 select-none border-r border-gray-700"
              style={{ width: lineNumberWidth }}
            >
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i} className="leading-5">
                  {i + 1}
                </div>
              ))}
            </div>
            
            {/* 代码内容 */}
            <pre className="flex-1 p-3 text-xs font-mono text-gray-100 overflow-x-auto">
              <code>{file.content}</code>
            </pre>
          </div>
        </div>

        {/* 底部统计 */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-400">
          <span>{lineCount} 行</span>
          <span>{(file.content.length / 1024).toFixed(1)} KB</span>
        </div>
      </div>
    </div>
  );
};

export default FilePreview;
