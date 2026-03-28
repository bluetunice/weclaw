import React from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Tool, ToolPermission, ToolType } from "../../types";
import ToolCard from "./ToolCard";

interface ToolListProps {
  tools: Tool[];
  search: string;
  activeType: "all" | ToolType;
  onSearchChange: (v: string) => void;
  onTypeChange: (v: "all" | ToolType) => void;
  onEdit: (tool: Tool) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onPermissionChange: (id: string, perm: ToolPermission) => void;
  t: (key: string) => string;
}

const ALL_TYPES: ("all" | ToolType)[] = ["all", "builtin", "script", "api"];

const ToolList: React.FC<ToolListProps> = ({
  tools, search, activeType,
  onSearchChange, onTypeChange,
  onEdit, onDelete, onToggle, onPermissionChange, t,
}) => {
  const filtered = tools.filter((tool) => {
    const matchType = activeType === "all" || tool.type === activeType;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      tool.name.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
      tool.category.toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  const grouped = filtered.reduce<Record<string, Tool[]>>((acc, tool) => {
    const g = tool.category || t("tools.typeAll");
    (acc[g] = acc[g] || []).push(tool);
    return acc;
  }, {});

  const typeLabel = (type: "all" | ToolType): string => {
    if (type === "all") return t("tools.typeAll");
    return t(`tools.type.${type}`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 搜索 */}
      <div className="flex items-center gap-3 px-1 mb-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("tools.searchPlaceholder")}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20"
          />
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
          {filtered.length} / {tools.length}
        </span>
      </div>

      {/* 类型过滤 Tab */}
      <div className="flex gap-1.5 flex-wrap mb-4 px-0.5">
        {ALL_TYPES.map((type) => {
          const count = type === "all" ? tools.length : tools.filter((tl) => tl.type === type).length;
          if (count === 0 && type !== "all") return null;
          return (
            <button
              key={type}
              onClick={() => onTypeChange(type)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-all duration-150 ${
                activeType === type
                  ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              {typeLabel(type)}
              <span className={`ml-1 ${activeType === type ? "text-blue-100" : "text-gray-400 dark:text-gray-500"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 工具列表（分组） */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
          <MagnifyingGlassIcon className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm">
            {search
              ? t("tools.notFound").replace("{q}", search)
              : t("tools.emptyType")}
          </p>
        </div>
      ) : (
        <div className="overflow-y-auto pb-2 space-y-5">
          {Object.entries(grouped).map(([group, groupTools]) => (
            <div key={group}>
              <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-0.5">
                {group}
                <span className="ml-1.5 font-normal normal-case">({groupTools.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {groupTools.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggle={onToggle}
                    onPermissionChange={onPermissionChange}
                    t={t}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ToolList;
