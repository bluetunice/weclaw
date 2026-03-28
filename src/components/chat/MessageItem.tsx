import React, { useState } from "react";
import { ClipboardIcon, CheckIcon } from "@heroicons/react/24/outline";
import RichTextRenderer from "../RichTextRenderer";
import { Message } from "../../types";
import { useSettings } from "../../contexts/SettingsContext";

interface MessageItemProps {
  message: Message;
  onCopyMessage: (content: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onCopyMessage
}) => {
  const { t } = useSettings();
  const [copied, setCopied] = useState(false);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);
    if (diffMin < 1) return t("chat.justNow");
    if (diffHour < 1)
      return t("chat.minutesAgo").replace("{n}", String(diffMin));
    if (diffDay < 1) return t("chat.hoursAgo").replace("{n}", String(diffHour));
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handleCopy = async () => {
    await onCopyMessage(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── 用户消息 ── */
  if (message.role === "user") {
    const attachments: any[] = message.metadata?.attachments || [];

    // 过滤掉content中的Markdown图片语法，因为我们会通过attachments显示图片
    const cleanContent = message.content?.replace(/!\[.*?\]\(data:image\/[^)]+\)/g, "").trim() || "";

    return (
      <div className="flex justify-end px-4 py-2 group">
        <div className="flex items-end gap-2 max-w-[80%]">
          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 mb-1">
            <button
              onClick={handleCopy}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={t("chat.copy")}
            >
              {copied ? (
                <CheckIcon className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <ClipboardIcon className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            {/* 附件渲染（图片独立展示，文件显示为标签） */}
            {attachments.filter((a) => a.isImage).map((img) => (
              <div key={img.id} className="rounded-xl overflow-hidden shadow-sm max-w-[260px]">
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  className="max-w-full max-h-64 object-contain block"
                />
              </div>
            ))}
            {attachments.filter((a) => !a.isImage).length > 0 && (
              <div className="flex flex-wrap gap-1.5 justify-end">
                {attachments.filter((a) => !a.isImage).map((file) => (
                  <div
                    key={file.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700/50 rounded-lg text-xs text-indigo-600 dark:text-indigo-300 font-medium max-w-[200px]"
                  >
                    <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="truncate">{file.name}</span>
                  </div>
                ))}
              </div>
            )}
            {cleanContent && (
              <div className="bg-[#4f6ef7] text-white px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed shadow-sm max-w-full">
                <div className="whitespace-pre-wrap break-words">
                  {cleanContent}
                </div>
              </div>
            )}
            <span className="text-[10px] text-gray-400 dark:text-gray-500 pr-1">
              {formatTime(message.timestamp)}
            </span>
          </div>

          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-sm mb-5">
            <svg
              className="h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  /* ── 系统消息 ── */
  if (message.role === "system") {
    return (
      <div className="flex justify-center px-4 py-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium shadow-sm">
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  /* ── AI 助手消息 ── */
  return (
    <div className="flex items-start gap-3 px-4 py-3 group max-w-[90%]">
      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm mt-0.5">
        <svg
          className="h-4 w-4 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
            WeClaw
          </span>
          {message.metadata?.model && (
            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50 rounded-full font-medium">
              {message.metadata.model}
            </span>
          )}
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {formatTime(message.timestamp)}
          </span>
        </div>

        <div className="text-gray-800 dark:text-gray-100 text-sm leading-relaxed overflow-x-hidden">
          <RichTextRenderer content={message.content} />
        </div>

        <div className="flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            {copied ? (
              <>
                <CheckIcon className="h-3 w-3 text-green-500" />
                <span className="text-green-500">{t("chat.copied")}</span>
              </>
            ) : (
              <>
                <ClipboardIcon className="h-3 w-3" />
                <span>{t("chat.copy")}</span>
              </>
            )}
          </button>

          {message.tokens != null && message.tokens > 0 && (
            <span className="text-[10px] text-gray-300 dark:text-gray-600 font-mono">
              {message.tokens} tokens
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
