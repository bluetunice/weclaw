import React, { useRef } from "react";
import {
  ChatBubbleLeftRightIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { Conversation, Message } from "../../types";
import MessageItem from "./MessageItem";
import { useSettings } from "../../contexts/SettingsContext";

interface MessageListProps {
  activeConversation: Conversation | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  isLoading: boolean;
  activeModel: any;
  onNewConversation: () => void;
  onCopyMessage: (content: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({
  activeConversation,
  messagesEndRef,
  isLoading,
  activeModel,
  onNewConversation,
  onCopyMessage,
}) => {
  const { t } = useSettings();

  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <div className="h-full overflow-y-auto overflow-x-hidden scrollbar-chat">
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 min-h-full">
          {!activeConversation ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {t("chat.selectOrCreate")}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {t("chat.selectOrCreateHint")}
                </p>
                <button
                  onClick={onNewConversation}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-chat-user-bg/80 to-chat-user-hover/60 text-chat-user-text hover:from-chat-user-bg hover:to-chat-user-hover hover:text-chat-user-text/90 px-4 py-2 rounded-lg transition-all duration-200 font-medium shadow-sm border border-chat-user-border/60"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>{t("chat.startNew")}</span>
                </button>
              </div>
            </div>
          ) : activeConversation.messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="h-16 w-16 mx-auto mb-4 text-primary-300 dark:text-primary-600" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {t("chat.startChat")}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {t("chat.startChatHint")}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {activeConversation.messages.map((message: Message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  onCopyMessage={onCopyMessage}
                />
              ))}
            </div>
          )}

          {/* 加载状态指示器 */}
          {isLoading && (
            <div className="flex items-start gap-3 px-0 py-2">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
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
              <div className="pt-1.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    WeClaw
                  </span>
                  {activeModel?.name && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50 rounded-full">
                      {activeModel.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-2 w-2 bg-emerald-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="h-2 w-2 bg-emerald-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="h-2 w-2 bg-emerald-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* 锚点 */}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};

export default MessageList;
