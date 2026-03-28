import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  PaperAirplaneIcon,
  PlusIcon,
  PaperClipIcon,
  XMarkIcon,
  DocumentIcon
} from "@heroicons/react/24/outline";
import ModelSelector from "../ModelSelector";
import WorkspaceSelector from "../WorkspaceSelector";
import SkillSelector from "./SkillSelector";
import { ModelConfig, Skill } from "../../types";
import { useSettings } from "../../contexts/SettingsContext";

export interface AttachedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  isImage: boolean;
  fileId?: string; // DeepSeek 官方上传后的 file_id
}

interface ChatInputProps {
  input: string;
  activeConversation: any;
  activeModel: ModelConfig | null;
  isLoading: boolean;
  models: ModelConfig[];
  activeWorkspace: any;
  selectedSkills: Skill[];
  onInputChange: (value: string) => void;
  onSendMessage: (attachments?: AttachedFile[]) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onAddToInput: (text: string) => void;
  onClearInput: () => void;
  onSelectModel: (modelId: number) => void;
  onSelectWorkspace: (workspaceId: number) => void;
  onAddWorkspace: () => void;
  onNewConversation: () => void;
  onSelectSkills: (skills: Skill[]) => void;
  inputHeight?: number;
  onNavigateToSkills?: () => void;
  onNavigateToModels?: () => void;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  activeConversation,
  activeModel,
  isLoading,
  models,
  selectedSkills,
  onInputChange,
  onSendMessage,
  onKeyPress,
  onAddToInput,
  onClearInput,
  onSelectModel,
  onSelectWorkspace,
  onAddWorkspace,
  onNewConversation,
  onSelectSkills,
  inputHeight,
  onNavigateToSkills,
  onNavigateToModels
}) => {
  const { t } = useSettings();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [isComposing, setIsComposing] = useState(false); // IME 输入状态

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    // 如果有外部高度限制，使用外部高度减去工具栏高度，否则使用自动高度
    if (inputHeight) {
      const toolbarHeight = 40; // 工具栏高度
      ta.style.height = Math.max(60, inputHeight - toolbarHeight) + "px";
    } else {
      ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
    }
  }, [input, inputHeight]);

  const canSend =
    (!!input.trim() || attachments.length > 0) &&
    !!activeConversation &&
    !!activeModel &&
    !isLoading;

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files);
      const results: AttachedFile[] = [];

      for (const file of arr) {
        if (file.size > MAX_FILE_SIZE) {
          alert(t("chat.fileSizeExceeded").replace("{name}", file.name));
          continue;
        }
        try {
          const dataUrl = await readFileAsDataUrl(file);
          results.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl,
            isImage: file.type.startsWith("image/")
          });
        } catch {
          console.error("读取文件失败:", file.name);
        }
      }

      setAttachments((prev) => [...prev, ...results]);
    },
    [t]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSend = () => {
    if (!canSend) return;
    onSendMessage(attachments.length > 0 ? attachments : undefined);
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 如果正在使用 IME 输入，不处理 Enter 键
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSend();
      return;
    }
    onKeyPress(e);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  };

  const quickActions = [
    { key: "chat.quickSummarize", promptKey: "chat.quickSummarizePrompt" },
    { key: "chat.quickTranslate", promptKey: "chat.quickTranslatePrompt" },
    { key: "chat.quickExplain", promptKey: "chat.quickExplainPrompt" },
    { key: "chat.quickCode", promptKey: "chat.quickCodePrompt" },
    { key: "chat.quickOptimize", promptKey: "chat.quickOptimizePrompt" }
  ];

  return (
    <div className="flex-shrink-0 px-4 pb-4 pt-2 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
      {/* 附件预览区 */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 px-1">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="relative group flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden"
              style={{ maxWidth: 160 }}
            >
              {att.isImage ? (
                <img
                  src={att.dataUrl}
                  alt={att.name}
                  className="h-14 w-14 object-cover flex-shrink-0"
                />
              ) : (
                <div className="h-14 w-14 flex items-center justify-center bg-blue-50 dark:bg-blue-900/30 flex-shrink-0">
                  <DocumentIcon className="h-7 w-7 text-blue-400 dark:text-blue-300" />
                </div>
              )}
              <div className="flex-1 min-w-0 pr-6 py-1">
                <p className="text-[11px] text-gray-700 dark:text-gray-200 font-medium truncate leading-tight">
                  {att.name}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                  {formatSize(att.size)}
                </p>
              </div>
              <button
                onClick={() => removeAttachment(att.id)}
                className="absolute top-1 right-1 h-4 w-4 rounded-full bg-gray-600/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title={t("chat.removeAttachment")}
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 输入框主体 */}
      <div
        className={`relative border rounded-2xl bg-white dark:bg-gray-700 shadow-sm transition-all duration-200 ${
          dragOver
            ? "border-blue-400 ring-2 ring-blue-400/20 bg-blue-50/30 dark:bg-blue-900/20"
            : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-400/20 dark:focus-within:ring-blue-500/20"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {dragOver && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl pointer-events-none z-10">
            <div className="flex flex-col items-center gap-1 text-blue-500">
              <PaperClipIcon className="h-6 w-6" />
              <span className="text-xs font-medium">{t("chat.dropHint")}</span>
            </div>
          </div>
        )}

        {/* 文本域 */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder={
            !activeModel
              ? t("chat.placeholderNoModel")
              : t("chat.placeholderReady").replace("{model}", activeModel.name)
          }
          disabled={!activeConversation || !activeModel || isLoading}
          className="w-full px-4 pt-3.5 pb-1 resize-none appearance-none outline-none focus:outline-none bg-transparent text-gray-800 dark:text-gray-100 text-sm leading-relaxed placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          rows={2}
          style={{ border: "none", boxShadow: "none" }}
        />

        {/* 底部工具栏 */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          {/* 左侧工具 */}
          <div className="flex items-center gap-1.5">
            <WorkspaceSelector
              onSelectWorkspace={onSelectWorkspace}
              onAddWorkspace={onAddWorkspace}
            />
            <ModelSelector
              models={models}
              activeModel={activeModel}
              onSelectModel={onSelectModel}
              onNavigateToModels={onNavigateToModels}
            />
            
            {/* Skill 选择器 */}
            <SkillSelector
              selectedSkills={selectedSkills}
              onSelectSkills={onSelectSkills}
              onNavigateToSkills={onNavigateToSkills}
            />
            
            <div className="h-3.5 w-px bg-gray-200 dark:bg-gray-600 mx-0.5" />

            {/* 上传文件 */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!activeConversation}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title={t("chat.uploadFile")}
            >
              <PaperClipIcon className="h-3.5 w-3.5" />
              <span>{t("chat.fileBtn")}</span>
            </button>

            <div className="h-3.5 w-px bg-gray-200 dark:bg-gray-600 mx-0.5" />

            {/* 新建对话 */}
            <button
              onClick={onNewConversation}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
              title={t("chat.newConversation")}
            >
              <PlusIcon className="h-3.5 w-3.5" />
              <span>{t("chat.newChatBtn")}</span>
            </button>
          </div>

          {/* 右侧：字符数 + 发送 */}
          <div className="flex items-center gap-2">
            {input.length > 200 && (
              <span
                className={`text-[10px] font-mono ${
                  input.length > 1800 ? "text-red-400" : "text-gray-400"
                }`}
              >
                {input.length}/2000
              </span>
            )}
            {attachments.length > 0 && (
              <span className="text-[10px] text-blue-500 font-medium">
                {t("chat.attachmentsCount").replace(
                  "{n}",
                  String(attachments.length)
                )}
              </span>
            )}
            <button
              onClick={handleSend}
              disabled={!canSend}
              className={`flex items-center justify-center h-8 w-8 rounded-xl transition-all duration-200 ${
                canSend
                  ? "bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md active:scale-95"
                  : "bg-gray-100 dark:bg-gray-600 text-gray-300 dark:text-gray-500 cursor-not-allowed"
              }`}
              title={t("chat.sendBtn")}
            >
              {isLoading ? (
                <div className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <PaperAirplaneIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-0.5">
        {quickActions.map(({ key, promptKey }) => (
          <button
            key={key}
            onClick={() => onAddToInput(t(promptKey))}
            disabled={!activeConversation}
            className="flex-shrink-0 px-2.5 py-1 text-[11px] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-full hover:border-gray-300 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
          >
            {t(key)}
          </button>
        ))}
        {input.trim() && (
          <button
            onClick={onClearInput}
            className="flex-shrink-0 px-2.5 py-1 text-[11px] text-red-400 border border-red-100 rounded-full hover:bg-red-50 transition-all duration-150"
          >
            {t("chat.clearInput")}
          </button>
        )}
      </div>

      {/* 隐藏的 input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && processFiles(e.target.files)}
      />
    </div>
  );
};

export default ChatInput;
