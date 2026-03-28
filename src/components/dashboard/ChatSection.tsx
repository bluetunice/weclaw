import React from "react";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { SectionCard, StatsRow } from "./SectionCard";
import { Conversation } from "../../types";
import { timeAgo } from "./dashboardTypes";

interface Props {
  conversations: Conversation[];
  collapsed: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  t: (k: string) => string;
}

export const ChatSection: React.FC<Props> = ({ conversations, collapsed, onToggle, onNavigate, t }) => {
  const chatTotal   = conversations.length;
  const totalMsg    = conversations.reduce((s, c) => s + c.messages.length, 0);
  const userMsg     = conversations.reduce((s, c) => s + c.messages.filter((m) => m.role === "user").length, 0);
  const recentChats = [...conversations].sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime()).slice(0, 4);
  const modelUsage  = conversations.reduce<Record<string, number>>((acc, c) => {
    const m = c.modelName || "未知"; acc[m] = (acc[m] || 0) + 1; return acc;
  }, {});
  const topModel = Object.entries(modelUsage).sort((a, b) => b[1] - a[1])[0];

  return (
    <SectionCard
      icon={<ChatBubbleLeftRightIcon className="h-4 w-4 text-sky-600" />}
      iconBg="bg-sky-50"
      title={t("dashboard.chat")}
      collapsed={collapsed}
      onToggle={onToggle}
      onNavigate={onNavigate}
      summary={
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <span className="text-gray-500 dark:text-gray-400">{t("dashboard.chat")} <strong className="text-gray-800 dark:text-gray-100">{chatTotal}</strong></span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className="text-gray-500 dark:text-gray-400"><strong className="text-sky-600">{totalMsg}</strong></span>
          {topModel && <><span className="text-gray-300 dark:text-gray-600">|</span><strong className="text-purple-600 truncate">{topModel[0]}</strong></>}
        </div>
      }
    >
      <StatsRow items={[
        { label: t("dashboard.chat"), value: chatTotal,          cls: "text-gray-800 dark:text-gray-100" },
        { label: "Messages",           value: totalMsg,           cls: "text-sky-600" },
        { label: "User",               value: userMsg,            cls: "text-blue-600" },
        { label: "AI",                 value: totalMsg - userMsg, cls: "text-purple-600" },
      ]} />
      {Object.keys(modelUsage).length > 0 && (
        <div className="px-5 py-3 border-b border-gray-50 dark:border-gray-700">
          <div className="space-y-1.5">
            {Object.entries(modelUsage).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, cnt]) => (
              <div key={name} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 dark:text-gray-400 w-24 truncate flex-shrink-0">{name}</span>
                <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full" style={{ width: `${chatTotal > 0 ? Math.round((cnt / chatTotal) * 100) : 0}%` }} />
                </div>
                <span className="text-[11px] text-gray-400 w-6 text-right flex-shrink-0">{cnt}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="divide-y divide-gray-50 dark:divide-gray-700">
        {recentChats.length === 0
          ? <p className="text-sm text-gray-400 text-center py-5">{t("dashboard.noChat")}</p>
          : recentChats.map((c) => {
              const lastMsg = c.messages[c.messages.length - 1];
              return (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 dark:hover:bg-gray-700/40">
                  <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center">
                    <ChatBubbleLeftRightIcon className="h-4 w-4 text-sky-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{c.title}</p>
                    <span className="text-[11px] text-gray-400 truncate max-w-[140px] block">
                      {lastMsg ? lastMsg.content.replace(/!\[.*?\]\(.*?\)/g, "[img]").substring(0, 40) + (lastMsg.content.length > 40 ? "…" : "") : t("dashboard.noChat")}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[11px] text-gray-400">{timeAgo(c.lastMessageAt, t)}</span>
                    <span className="text-[11px] text-gray-300 dark:text-gray-600">{c.messages.length}</span>
                  </div>
                </div>
              );
            })}
      </div>
      <div className="px-5 py-2.5 border-t border-gray-50 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-700/30 flex justify-between text-xs text-gray-400">
        <span>{recentChats.length}</span>
        {topModel && <span>{topModel[0]}</span>}
      </div>
    </SectionCard>
  );
};
