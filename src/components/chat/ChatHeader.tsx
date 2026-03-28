import React from "react";
import {
  ChatBubbleLeftRightIcon,
  ClockIcon,
  ListBulletIcon
} from "@heroicons/react/24/outline";
import { Conversation } from "../../types";
import { useSettings } from "../../contexts/SettingsContext";

interface ChatHeaderProps {
  activeConversation: Conversation | null;
  onToggleConversationList?: () => void;
  isConversationListOpen?: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  activeConversation,
  onToggleConversationList,
  isConversationListOpen
}) => {
  const { t } = useSettings();

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) {
      return t("chat.minutesAgo").replace(
        "{n}",
        String(Math.floor(diffMs / (1000 * 60)))
      );
    } else if (diffHours < 24) {
      return t("chat.hoursAgo").replace("{n}", String(Math.floor(diffHours)));
    } else {
      return t("chat.daysAgo").replace(
        "{n}",
        String(Math.floor(diffHours / 24))
      );
    }
  };

  return (
    <div className="border-b border-gray-200/60 dark:border-gray-700/60 px-3 py-2 bg-gradient-to-r from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/80 backdrop-blur-sm flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* 切换对话列表按钮 */}
          {onToggleConversationList && (
            <button
              onClick={onToggleConversationList}
              className={`p-1.5 rounded-lg transition-colors ${
                isConversationListOpen
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              }`}
              title={isConversationListOpen ? "关闭对话列表" : "打开对话列表"}
            >
              <ListBulletIcon className="h-4 w-4" />
            </button>
          )}
          <div className="space-y-1">
          <h1
            className={`text-base font-semibold ${
              activeConversation
                ? "text-chat-assistant-text dark:text-gray-100"
                : "text-gray-900 dark:text-gray-100"
            }`}
          >
            {activeConversation?.title || t("chat.selectConversation")}
          </h1>
          {activeConversation && (
            <div className="flex flex-wrap items-center gap-1.5">
              {/* 时间信息 */}
              <div className="flex items-center text-xs px-1.5 py-0.5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-700/80 text-gray-700 dark:text-gray-300 rounded-full border border-gray-200 dark:border-gray-600">
                <ClockIcon className="h-3 w-3 mr-1" />
                <span>
                  {activeConversation.lastMessageAt &&
                    formatTime(activeConversation.lastMessageAt)}
                </span>
              </div>

              {/* 模型信息 */}
              {activeConversation.modelName && (
                <div className="flex items-center text-xs px-1.5 py-0.5 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-700/50">
                  <span className="mr-1 opacity-80">
                    {t("chat.modelLabel")}
                  </span>
                  <span className="font-medium">
                    {activeConversation.modelName}
                  </span>
                </div>
              )}

              {/* 消息统计 */}
              <div className="flex items-center text-xs px-1.5 py-0.5 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/20 text-green-700 dark:text-green-300 rounded-full border border-green-200 dark:border-green-700/50">
                <ChatBubbleLeftRightIcon className="h-3 w-3 mr-1" />
                <span className="font-medium">
                  {activeConversation.messages.length}
                </span>
                <span className="ml-0.5">{t("chat.msgCount")}</span>
              </div>

              {/* 对话ID */}
              <div className="flex items-center text-xs px-1.5 py-0.5 bg-gradient-to-r from-chat-system-bg/80 to-chat-system-hover/60 dark:from-gray-700/80 dark:to-gray-700/60 text-chat-system-text dark:text-gray-400 rounded-full border border-chat-system-border/60 dark:border-gray-600/60">
                <span className="font-mono text-[10px] opacity-90">
                  {activeConversation.id}
                </span>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
