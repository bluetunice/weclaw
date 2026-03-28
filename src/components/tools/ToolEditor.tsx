import React, { useState, useEffect } from "react";
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Tool, ToolParam, ToolType, ToolPermission } from "../../types";
import { newTool, newParam } from "./toolUtils";

interface ToolEditorProps {
  tool: Tool | null;
  onSave: (tool: Tool) => void;
  onClose: () => void;
  t: (key: string) => string;
}

const TOOL_TYPES: ToolType[] = ["builtin", "script", "api"];
const PERMISSIONS: ToolPermission[] = ["read_only", "read_write", "disabled"];
const PARAM_TYPES = ["string", "number", "boolean", "array", "object"] as const;
const COMMON_ICONS = ["🔧", "📄", "📁", "🌐", "✉️", "⌨️", "🔍", "🗄️", "📊", "🔐", "📡", "⚙️", "🚀", "🤖"];

const ToolEditor: React.FC<ToolEditorProps> = ({ tool, onSave, onClose, t }) => {
  const [form, setForm] = useState<Tool>(() => tool ?? newTool());
  const [tab, setTab] = useState<"basic" | "params" | "connection">("basic");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setForm(tool ?? newTool());
    setErrors({});
    setTab("basic");
  }, [tool]);

  const set = <K extends keyof Tool>(key: K, val: Tool[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };

  const addParam = () => set("params", [...form.params, newParam()]);
  const removeParam = (idx: number) =>
    set("params", form.params.filter((_, i) => i !== idx));
  const updateParam = (idx: number, field: keyof ToolParam, val: any) =>
    set("params", form.params.map((p, i) => (i === idx ? { ...p, [field]: val } : p)));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = t("tools.editor.nameRequired");
    if (form.type === "api"    && !form.apiEndpoint?.trim())   e.apiEndpoint   = t("tools.editor.apiEndpointRequired");
    if (form.type === "script" && !form.scriptContent?.trim()) e.scriptContent = t("tools.editor.scriptContentRequired");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ ...form, updatedAt: new Date().toISOString() });
  };

  const connectionTabLabel = form.type === "api"
    ? t("tools.editor.tabApi")
    : t("tools.editor.tabScript");

  const tabs = [
    { key: "basic"      as const, label: t("tools.editor.tabBasic") },
    { key: "params"     as const, label: `${t("tools.editor.tabParams")} (${form.params.length})` },
    ...(form.type !== "builtin"
      ? [{ key: "connection" as const, label: connectionTabLabel }]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {tool ? t("tools.editor.titleEdit") : t("tools.editor.titleNew")}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Tab */}
        <div className="flex gap-1 px-6 pt-3">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === key
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {label}
              {key === "connection" && (errors.apiEndpoint || errors.scriptContent) && (
                <span className="ml-1 text-red-500">*</span>
              )}
            </button>
          ))}
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {tab === "basic" && (
            <>
              <div className="flex items-start gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("tools.editor.icon")}
                  </label>
                  <div className="flex flex-wrap gap-1.5 w-36">
                    {COMMON_ICONS.map((ic) => (
                      <button
                        key={ic}
                        onClick={() => set("icon", ic)}
                        className={`text-lg p-1 rounded-lg transition-colors ${
                          form.icon === ic
                            ? "bg-blue-100 dark:bg-blue-900/40 ring-2 ring-blue-400"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t("tools.editor.name")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder={t("tools.editor.namePlaceholder")}
                      className={`w-full px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 border text-gray-900 dark:text-gray-100 outline-none ${
                        errors.name ? "border-red-400" : "border-gray-200 dark:border-gray-600 focus:border-blue-400"
                      }`}
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t("tools.editor.type")}
                    </label>
                    <select
                      value={form.type}
                      onChange={(e) => set("type", e.target.value as ToolType)}
                      disabled={!!tool?.builtin}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-400 disabled:opacity-50"
                    >
                      {TOOL_TYPES.map((tp) => (
                        <option key={tp} value={tp}>{t(`tools.type.${tp}`)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("tools.editor.desc")}
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder={t("tools.editor.descPlaceholder")}
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-400 resize-none"
                  style={{ boxShadow: "none" }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("tools.editor.category")}
                  </label>
                  <input
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                    placeholder={t("tools.editor.categoryPlaceholder")}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("tools.editor.permission")}
                  </label>
                  <select
                    value={form.permission}
                    onChange={(e) => set("permission", e.target.value as ToolPermission)}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-400"
                  >
                    {PERMISSIONS.map((p) => (
                      <option key={p} value={p}>{t(`tools.perm.${p}`)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {tab === "params" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("tools.editor.paramsHint")}
                </p>
                <button
                  onClick={addParam}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  {t("tools.editor.addParam")}
                </button>
              </div>

              {form.params.length === 0 && (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                  {t("tools.editor.noParams")}
                </div>
              )}

              {form.params.map((param, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {t("tools.editor.paramNum")}{idx + 1}
                    </span>
                    <button
                      onClick={() => removeParam(idx)}
                      className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">{t("tools.editor.paramName")}</label>
                      <input
                        value={param.name}
                        onChange={(e) => updateParam(idx, "name", e.target.value)}
                        placeholder="param_name"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono outline-none focus:border-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">{t("tools.editor.paramType")}</label>
                      <select
                        value={param.type}
                        onChange={(e) => updateParam(idx, "type", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-400"
                      >
                        {PARAM_TYPES.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">{t("tools.editor.paramDesc")}</label>
                    <input
                      value={param.description}
                      onChange={(e) => updateParam(idx, "description", e.target.value)}
                      placeholder={t("tools.editor.paramDescPlaceholder")}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={param.required}
                        onChange={(e) => updateParam(idx, "required", e.target.checked)}
                        className="rounded"
                      />
                      {t("tools.editor.paramRequired")}
                    </label>
                    <div className="flex-1">
                      <input
                        value={param.default != null ? String(param.default) : ""}
                        onChange={(e) => updateParam(idx, "default", e.target.value || undefined)}
                        placeholder={t("tools.editor.paramDefault")}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-400"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "connection" && form.type === "api" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("tools.editor.apiEndpoint")} <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.apiEndpoint ?? ""}
                  onChange={(e) => set("apiEndpoint", e.target.value)}
                  placeholder="https://api.example.com/endpoint"
                  className={`w-full px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 border text-gray-900 dark:text-gray-100 outline-none ${
                    errors.apiEndpoint ? "border-red-400" : "border-gray-200 dark:border-gray-600 focus:border-blue-400"
                  }`}
                />
                {errors.apiEndpoint && <p className="text-xs text-red-500 mt-1">{errors.apiEndpoint}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("tools.editor.apiMethod")}
                </label>
                <select
                  value={form.apiMethod ?? "GET"}
                  onChange={(e) => set("apiMethod", e.target.value as Tool["apiMethod"])}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-400"
                >
                  {["GET", "POST", "PUT", "DELETE"].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("tools.editor.apiHeaders")}
                </label>
                <textarea
                  value={form.apiHeaders ? JSON.stringify(form.apiHeaders, null, 2) : ""}
                  onChange={(e) => {
                    try {
                      const h = e.target.value ? JSON.parse(e.target.value) : undefined;
                      set("apiHeaders", h);
                    } catch {}
                  }}
                  placeholder={'{\n  "Authorization": "Bearer token",\n  "Content-Type": "application/json"\n}'}
                  rows={5}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-400 resize-none"
                  style={{ boxShadow: "none" }}
                />
              </div>
            </div>
          )}

          {tab === "connection" && form.type === "script" && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("tools.editor.scriptContent")} <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                {t("tools.editor.scriptHint")}
              </p>
              <textarea
                value={form.scriptContent ?? ""}
                onChange={(e) => set("scriptContent", e.target.value)}
                placeholder={"#!/bin/bash\n# 通过 $PARAM_NAME 访问参数\necho \"Hello $PARAM_NAME\""}
                rows={14}
                className={`w-full px-3 py-2.5 text-sm font-mono rounded-lg bg-gray-50 dark:bg-gray-700 border text-gray-900 dark:text-gray-100 outline-none resize-none leading-relaxed ${
                  errors.scriptContent ? "border-red-400" : "border-gray-200 dark:border-gray-600 focus:border-blue-400"
                }`}
                style={{ boxShadow: "none" }}
              />
              {errors.scriptContent && <p className="text-xs text-red-500 mt-1">{errors.scriptContent}</p>}
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            {t("tools.editor.cancel")}
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm transition-colors"
          >
            {tool ? t("tools.editor.saveEdit") : t("tools.editor.saveNew")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToolEditor;
