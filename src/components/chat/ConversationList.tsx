import React, { useState } from "react";
import {
  ChatBubbleLeftRightIcon,
  TrashIcon,
  PlusIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  FunnelIcon
} from "@heroicons/react/24/outline";
import { Conversation } from "../../types";
import { useSettings } from "../../contexts/SettingsContext";

interface ConversationListProps {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  isConversationListCollapsed: boolean;
  searchQuery: string;
  filterByModel: string | null;
  availableModels: string[];
  onNewConversation: () => void;
  onToggleCollapse: () => void;
  onSelectConversation: (conversation: Conversation) => void;
  onDeleteConversation: (conversationId: string) => void;
  onDeleteSelectedConversations?: (conversationIds: string[]) => void;
  onSearchChange: (query: string) => void;
  onFilterChange: (model: string | null) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversation,
  isConversationListCollapsed,
  searchQuery,
  filterByModel,
  availableModels,
  onNewConversation,
  onToggleCollapse,
  onSelectConversation,
  onDeleteConversation,
  onDeleteSelectedConversations,
  onSearchChange,
  onFilterChange
}) => {
  const { t } = useSettings();
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  // 切换选择模式
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    if (!isSelectMode) {
      setSelectedConversations(new Set());
    }
  };

  // 切换单个对话选择
  const toggleConversationSelect = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedConversations);
    if (newSelected.has(conversationId)) {
      newSelected.delete(conversationId);
    } else {
      newSelected.add(conversationId);
    }
    setSelectedConversations(newSelected);
  };

  // 全选
  const handleSelectAll = () => {
    if (selectedConversations.size === filteredConversations.length) {
      setSelectedConversations(new Set());
    } else {
      setSelectedConversations(new Set(filteredConversations.map(c => c.id)));
    }
  };

  // 批量删除选中对话
  const handleBatchDelete = () => {
    if (selectedConversations.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedConversations.size} 个对话吗？此操作不可恢复。`)) {
      return;
    }
    if (onDeleteSelectedConversations) {
      onDeleteSelectedConversations(Array.from(selectedConversations));
    }
    setSelectedConversations(new Set());
    setIsSelectMode(false);
  };

  // 一键删除全部
  const handleDeleteAll = () => {
    if (!confirm(`确定要删除所有对话吗？此操作不可恢复。`)) {
      return;
    }
    if (onDeleteSelectedConversations) {
      onDeleteSelectedConversations(conversations.map(c => c.id));
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 1)
      return t("chat.minutesAgo").replace(
        "{n}",
        String(Math.floor(diffMs / (1000 * 60)))
      );
    if (diffHours < 24)
      return t("chat.hoursAgo").replace("{n}", String(Math.floor(diffHours)));
    return t("chat.daysAgo").replace("{n}", String(Math.floor(diffHours / 24)));
  };

  const filteredConversations = conversations.filter((conversation) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = (conversation.title || "")
        .toLowerCase()
        .includes(query);
      const matchesContent = conversation.messages.some((msg) =>
        (msg.content || "").toLowerCase().includes(query)
      );
      if (!matchesTitle && !matchesContent) return false;
    }
    if (filterByModel && conversation.modelName !== filterByModel) return false;
    return true;
  });

  return (
    <div
      className={`relative flex flex-col h-full flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-hidden transition-[width] duration-300 ease-in-out ${
        isConversationListCollapsed ? "w-14" : "w-64"
      }`}
    >
      {/* ── 头部 ── */}
      <div
        className={`flex items-center flex-shrink-0 border-b border-gray-200 dark:border-gray-700 transition-all duration-300 ${
          isConversationListCollapsed
            ? "flex-col gap-2 px-2 py-3"
            : isSelectMode
            ? "justify-between px-3 py-2"
            : "justify-between px-4 py-3"
        }`}
      >
        {!isConversationListCollapsed && (
          <div className="flex items-center gap-2 min-w-0">
            {isSelectMode ? (
              <>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  已选 {selectedConversations.size} 项
                </span>
              </>
            ) : (
              <>
                <ChatBubbleLeftRightIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                  {t("chat.conversationList")}
                </span>
              </>
            )}
          </div>
        )}

        <div
          className={`flex items-center ${
            isConversationListCollapsed ? "flex-col gap-2" : "gap-1.5"
          }`}
        >
          {isSelectMode ? (
            <>
              <Tooltip text="全选" disabled={!isConversationListCollapsed}>
                <button
                  onClick={handleSelectAll}
                  className={`flex items-center justify-center rounded-lg transition-all duration-200 text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 ${
                    isConversationListCollapsed ? "h-8 w-8" : "px-2 h-7"
                  }`}
                >
                  {selectedConversations.size === filteredConversations.length ? "取消全选" : "全选"}
                </button>
              </Tooltip>
              <Tooltip text="删除选中" disabled={!isConversationListCollapsed}>
                <button
                  onClick={handleBatchDelete}
                  disabled={selectedConversations.size === 0}
                  className={`flex items-center justify-center rounded-lg transition-all duration-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isConversationListCollapsed ? "h-8 w-8" : "h-7 w-7"
                  }`}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </Tooltip>
              <Tooltip text="取消选择" disabled={!isConversationListCollapsed}>
                <button
                  onClick={toggleSelectMode}
                  className={`flex items-center justify-center rounded-lg transition-all duration-200 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 ${
                    isConversationListCollapsed ? "h-8 w-8" : "h-7 w-7"
                  }`}
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </Tooltip>
            </>
          ) : (
            <>
              {conversations.length > 0 && (
                <>
                  <Tooltip text="选择" disabled={!isConversationListCollapsed}>
                    <button
                      onClick={toggleSelectMode}
                      className={`flex items-center justify-center rounded-lg transition-all duration-200 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 ${
                        isConversationListCollapsed ? "h-8 w-8" : "h-7 w-7"
                      }`}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  </Tooltip>
                  <Tooltip text="删除全部" disabled={!isConversationListCollapsed}>
                    <button
                      onClick={handleDeleteAll}
                      className={`flex items-center justify-center rounded-lg transition-all duration-200 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 ${
                        isConversationListCollapsed ? "h-8 w-8" : "h-7 w-7"
                      }`}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </Tooltip>
                </>
              )}
              <Tooltip
                text={t("chat.newConversation")}
                disabled={!isConversationListCollapsed}
              >
                <button
                  onClick={onNewConversation}
                  className={`flex items-center justify-center rounded-lg transition-all duration-200 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 shadow-sm ${
                    isConversationListCollapsed ? "h-8 w-8" : "h-7 w-7"
                  }`}
                  title={t("chat.newConversation")}
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </Tooltip>

              <Tooltip
                text={
                  isConversationListCollapsed
                    ? t("chat.expandSidebar")
                    : t("chat.collapseSidebar")
                }
                disabled={false}
              >
                <button
                  onClick={onToggleCollapse}
                  className={`flex items-center justify-center rounded-lg transition-all duration-200 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm ${
                    isConversationListCollapsed ? "h-8 w-8" : "h-7 w-7"
                  }`}
                  title={
                    isConversationListCollapsed
                      ? t("chat.expandSidebar")
                      : t("chat.collapseSidebar")
                  }
                >
                  {isConversationListCollapsed ? (
                    <ChevronRightIcon className="h-4 w-4" />
                  ) : (
                    <ChevronLeftIcon className="h-4 w-4" />
                  )}
                </button>
              </Tooltip>
            </>
          )}
        </div>
      </div>

      {/* ── 展开态内容 ── */}
      {!isConversationListCollapsed && (
        <div
          className={`flex-1 min-h-0 flex flex-col overflow-hidden transition-opacity duration-200 ${
            isConversationListCollapsed
              ? "opacity-0 pointer-events-none"
              : "opacity-100"
          }`}
        >
          {/* 搜索和过滤 */}
          <div className="px-3 pt-3 pb-2 space-y-2 flex-shrink-0">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder={t("chat.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-white dark:bg-gray-800 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {availableModels.length > 1 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <FunnelIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
                <button
                  onClick={() => onFilterChange(null)}
                  className={`px-2 py-0.5 text-[11px] rounded-full transition-colors ${
                    filterByModel === null
                      ? "bg-blue-100 text-blue-600 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
                  }`}
                >
                  {t("chat.filterAll")}
                </button>
                {availableModels.map((model) => (
                  <button
                    key={model}
                    onClick={() =>
                      onFilterChange(filterByModel === model ? null : model)
                    }
                    className={`px-2 py-0.5 text-[11px] rounded-full transition-colors truncate max-w-[80px] ${
                      filterByModel === model
                        ? "bg-blue-100 text-blue-600 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
                    }`}
                    title={model}
                  >
                    {model}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 对话列表 */}
          <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-3 space-y-1">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-10 text-gray-400 dark:text-gray-500">
                {searchQuery || filterByModel ? (
                  <>
                    <MagnifyingGlassIcon className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    <p className="text-xs">{t("chat.noMatch")}</p>
                    <button
                      onClick={() => {
                        onSearchChange("");
                        onFilterChange(null);
                      }}
                      className="mt-2 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {t("chat.clearFilter")}
                    </button>
                  </>
                ) : (
                  <>
                    <ChatBubbleLeftRightIcon className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    <p className="text-xs">{t("chat.noConversation")}</p>
                    <button
                      onClick={onNewConversation}
                      className="mt-2 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {t("chat.startNew")}
                    </button>
                  </>
                )}
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const isActive = activeConversation?.id === conversation.id;
                const lastMsg =
                  conversation.messages[conversation.messages.length - 1];
                const isSelected = selectedConversations.has(conversation.id);
                return (
                  <div
                    key={conversation.id}
                    onClick={() => isSelectMode ? toggleConversationSelect(conversation.id, { stopPropagation: () => {} } as React.MouseEvent) : onSelectConversation(conversation)}
                    className={`group relative px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                      isActive
                        ? "bg-blue-50 border border-blue-200 shadow-sm dark:bg-blue-900/30 dark:border-blue-700"
                        : "hover:bg-white dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {/* 复选框 - 选择模式显示 */}
                      {isSelectMode && (
                        <div 
                          onClick={(e) => toggleConversationSelect(conversation.id, e)}
                          className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded border flex items-center justify-center ${
                            isSelected
                              ? "bg-blue-500 border-blue-500"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {isSelected && (
                            <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span
                            className={`text-xs font-medium truncate flex-1 leading-5 ${
                              isActive
                                ? "text-blue-700 dark:text-blue-300"
                                : "text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {conversation.title}
                          </span>
                          {!isSelectMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteConversation(conversation.id);
                              }}
                              className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-all"
                              title={t("chat.deleteConversation")}
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        {lastMsg && (() => {
                          // 兼容 content 可能是数组（多模态消息）的情况
                          const rawContent = Array.isArray(lastMsg.content)
                            ? lastMsg.content.map((c: any) => typeof c === 'string' ? c : c?.text || '').join('')
                            : (lastMsg.content || '');
                          const displayContent = typeof rawContent === 'string' ? rawContent.substring(0, 60) : String(rawContent).substring(0, 60);
                          return (
                            <p
                              className={`text-[11px] truncate leading-4 mb-1.5 ${
                                isActive
                                  ? "text-blue-600/70 dark:text-blue-400/70"
                                  : "text-gray-400 dark:text-gray-500"
                              }`}
                            >
                              {displayContent}
                              {rawContent.length > 60 ? "…" : ""}
                            </p>
                          );
                        })()}
                        </div>

                    <div
                      className={`flex items-center gap-1.5 text-[10px] ${
                        isActive
                          ? "text-blue-500/80 dark:text-blue-400/80"
                          : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      <ClockIcon className="h-3 w-3 flex-shrink-0" />
                      <span>{formatTime(conversation.lastMessageAt)}</span>
                      <span className="ml-auto flex items-center gap-0.5">
                        <ChatBubbleLeftRightIcon className="h-3 w-3" />
                        {conversation.messages.length}
                      </span>
                      <span
                        className={`px-1.5 py-px rounded-full truncate max-w-[60px] ${
                          isActive
                            ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                        }`}
                        title={conversation.modelName}
                      >
                        {conversation.modelName}
                      </span>
                    </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── 折叠态：对话图标列表 ── */}
      {isConversationListCollapsed && (
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center py-2 gap-1.5 px-1 scrollbar-hide">
          {conversations.slice(0, 12).map((conversation) => {
            const isActive = activeConversation?.id === conversation.id;
            return (
              <Tooltip
                key={conversation.id}
                text={conversation.title}
                side="right"
                disabled={false}
              >
                <button
                  onClick={() => onSelectConversation(conversation)}
                  className={`relative h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                    isActive
                      ? "bg-blue-500 text-white shadow-sm"
                      : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                  }`}
                  title={conversation.title}
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4" />
                  {conversation.messages.length > 0 && (
                    <span
                      className={`absolute -top-0.5 -right-0.5 h-3.5 min-w-[14px] px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center leading-none ${
                        isActive
                          ? "bg-white text-blue-600"
                          : "bg-blue-500 text-white"
                      }`}
                    >
                      {conversation.messages.length > 99
                        ? "99+"
                        : conversation.messages.length}
                    </span>
                  )}
                </button>
              </Tooltip>
            );
          })}
          {conversations.length > 12 && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
              +{conversations.length - 12}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

/* ── 轻量 Tooltip 组件 ── */
interface TooltipProps {
  text: string;
  children: React.ReactElement;
  side?: "right" | "bottom";
  disabled?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({
  text,
  children,
  side = "right",
  disabled = false
}) => {
  if (disabled) return children;

  const posClass =
    side === "right"
      ? "left-full ml-2 top-1/2 -translate-y-1/2"
      : "top-full mt-1.5 left-1/2 -translate-x-1/2";

  return (
    <div className="relative group/tip inline-flex">
      {children}
      <div
        className={`absolute ${posClass} z-50 px-2 py-1 bg-gray-800 text-white text-[11px] rounded-md whitespace-nowrap pointer-events-none opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 shadow-lg`}
      >
        {text}
        {side === "right" && (
          <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-800" />
        )}
        {side === "bottom" && (
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-800" />
        )}
      </div>
    </div>
  );
};

export default ConversationList;
