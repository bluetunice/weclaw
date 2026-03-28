import React, { useState, useCallback } from "react";
import {
  WrenchScrewdriverIcon,
  PlusIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { Tool, ToolPermission, ToolType } from "../types";
import { loadTools, saveTools, PERMISSION_LABELS } from "../components/tools/toolUtils";
import { opLog } from "../utils/operationLogger";
import { useSettings } from "../contexts/SettingsContext";
import ToolList from "../components/tools/ToolList";
import ToolEditor from "../components/tools/ToolEditor";

const ToolManager: React.FC = () => {
  const { t } = useSettings();

  const [tools, setTools] = useState<Tool[]>(() => loadTools());
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<"all" | ToolType>("all");

  const [editorTool, setEditorTool] = useState<Tool | null | undefined>(undefined);

  const enabledCount   = tools.filter((tool) => tool.enabled && tool.permission !== "disabled").length;
  const readOnlyCount  = tools.filter((tool) => tool.permission === "read_only").length;
  const disabledCount  = tools.filter((tool) => tool.permission === "disabled" || !tool.enabled).length;

  const handleSave = useCallback((tool: Tool) => {
    setTools((prev) => {
      const idx = prev.findIndex((tl) => tl.id === tool.id);
      const isNew = idx < 0;
      const next = isNew
        ? [...prev, tool]
        : prev.map((tl) => (tl.id === tool.id ? tool : tl));
      saveTools(next);
      if (isNew) opLog.toolCreate(tool.name);
      else        opLog.toolSave(tool.name);
      return next;
    });
    setEditorTool(undefined);
  }, []);

  const handleDelete = useCallback((id: string) => {
    if (!confirm(t("tools.deleteConfirm"))) return;
    setTools((prev) => {
      const tool = prev.find((tl) => tl.id === id);
      const next = prev.filter((tl) => tl.id !== id);
      saveTools(next);
      if (tool) opLog.toolDelete(tool.name);
      return next;
    });
  }, [t]);

  const handleToggle = useCallback((id: string) => {
    setTools((prev) => {
      const next = prev.map((tl) =>
        tl.id === id ? { ...tl, enabled: !tl.enabled, updatedAt: new Date().toISOString() } : tl
      );
      const tool = next.find((tl) => tl.id === id);
      saveTools(next);
      if (tool) opLog.toolToggle(tool.name, tool.enabled);
      return next;
    });
  }, []);

  const handlePermissionChange = useCallback((id: string, perm: ToolPermission) => {
    setTools((prev) => {
      const next = prev.map((tl) =>
        tl.id === id ? { ...tl, permission: perm, updatedAt: new Date().toISOString() } : tl
      );
      const tool = next.find((tl) => tl.id === id);
      saveTools(next);
      if (tool) opLog.toolPermission(tool.name, perm);
      return next;
    });
  }, []);

  const setAllPermission = (perm: ToolPermission) => {
    setTools((prev) => {
      const next = prev.map((tl) => ({ ...tl, permission: perm, updatedAt: new Date().toISOString() }));
      saveTools(next);
      return next;
    });
  };

  const readWriteEnabled = tools.filter((tl) => tl.permission === "read_write" && tl.enabled);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* 页头 */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {t("tools.title")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {t("tools.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditorTool(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-violet-500 hover:bg-violet-600 text-white rounded-lg shadow-sm transition-colors"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            {t("tools.newTool")}
          </button>
        </div>
      </div>

      {/* 统计卡 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: t("tools.allTools"),  value: tools.length,  color: "text-gray-800 dark:text-gray-100" },
          { label: t("tools.available"), value: enabledCount,  color: "text-green-600" },
          { label: t("tools.readOnly"),  value: readOnlyCount, color: "text-amber-600" },
          { label: t("tools.disabled"),  value: disabledCount, color: "text-gray-400" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm px-3 py-2.5 text-center"
          >
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 权限安全提示 */}
      {readWriteEnabled.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl px-3 py-2.5">
          <ExclamationTriangleIcon className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium text-amber-800 dark:text-amber-400">
              {readWriteEnabled.length} {t("tools.warnTitle")}
            </p>
            <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-0.5">
              {t("tools.warnDesc")}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setAllPermission("read_only")}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors"
            >
              <ShieldCheckIcon className="h-3 w-3" />
              {t("tools.warnSetReadOnly")}
            </button>
          </div>
        </div>
      )}

      {/* 权限图例 */}
      <div className="flex items-center gap-4 px-1 flex-wrap">
        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{t("tools.permLabel")}</span>
        {(["read_only", "read_write", "disabled"] as ToolPermission[]).map((perm) => (
          <div key={perm} className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                perm === "read_only" ? "bg-amber-400" : perm === "read_write" ? "bg-green-500" : "bg-gray-400"
              }`}
            />
            {PERMISSION_LABELS[perm]}：
            {perm === "read_only"  && t("tools.permReadOnlyDesc")}
            {perm === "read_write" && t("tools.permReadWriteDesc")}
            {perm === "disabled"   && t("tools.permDisabledDesc")}
          </div>
        ))}
      </div>

      {/* 工具列表 */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 min-h-0">
        <ToolList
          tools={tools}
          search={search}
          activeType={activeType}
          onSearchChange={setSearch}
          onTypeChange={setActiveType}
          onEdit={setEditorTool}
          onDelete={handleDelete}
          onToggle={handleToggle}
          onPermissionChange={handlePermissionChange}
          t={t}
        />
      </div>

      {/* 编辑器弹框 */}
      {editorTool !== undefined && (
        <ToolEditor
          tool={editorTool}
          onSave={handleSave}
          onClose={() => setEditorTool(undefined)}
          t={t}
        />
      )}
    </div>
  );
};

export default ToolManager;
