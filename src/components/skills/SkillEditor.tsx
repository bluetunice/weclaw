import React, { useState, useEffect } from "react";
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Skill, SkillCategory } from "../../types";
import { CATEGORY_LABELS, newSkill } from "./skillUtils";

interface SkillEditorProps {
  skill: Skill | null;
  onSave: (skill: Skill) => void;
  onClose: () => void;
  t: (key: string) => string;
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as SkillCategory[];

const SkillEditor: React.FC<SkillEditorProps> = ({ skill, onSave, onClose, t }) => {
  const [form, setForm] = useState<Skill>(() => skill ?? newSkill());
  const [tagInput, setTagInput] = useState("");
  const [tab, setTab] = useState<"basic" | "content">("basic");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setForm(skill ?? newSkill());
    setTagInput("");
    setErrors({});
    setTab("basic");
  }, [skill]);

  const set = <K extends keyof Skill>(key: K, val: Skill[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      set("tags", [...form.tags, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    set("tags", form.tags.filter((tg) => tg !== tag));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = t("skills.editor.nameRequired");
    if (!form.content.trim()) e.content = t("skills.editor.contentRequired");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ ...form, updatedAt: new Date().toISOString() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {skill ? t("skills.editor.titleEdit") : t("skills.editor.titleNew")}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Tab 切换 */}
        <div className="flex gap-1 px-6 pt-3">
          {(["basic", "content"] as const).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === tabKey
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {tabKey === "basic" ? t("skills.editor.tabBasic") : t("skills.editor.tabContent")}
              {tabKey === "content" && errors.content && (
                <span className="ml-1 text-red-500">*</span>
              )}
            </button>
          ))}
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {tab === "basic" && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("skills.editor.name")} <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder={t("skills.editor.namePlaceholder")}
                  className={`w-full px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 border text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-400/30 ${
                    errors.name
                      ? "border-red-400"
                      : "border-gray-200 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-500"
                  }`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("skills.editor.desc")}
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder={t("skills.editor.descPlaceholder")}
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("skills.editor.category")}
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => set("category", e.target.value as SkillCategory)}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-400 dark:focus:border-blue-500"
                  >
                    {CATEGORIES.map((val) => (
                      <option key={val} value={val}>{t(`skills.cat.${val}`)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("skills.editor.version")}
                  </label>
                  <input
                    value={form.version}
                    onChange={(e) => set("version", e.target.value)}
                    placeholder="1.0.0"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-blue-400 dark:focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("skills.editor.author")}
                </label>
                <input
                  value={form.author}
                  onChange={(e) => set("author", e.target.value)}
                  placeholder={t("skills.editor.authorPlaceholder")}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-blue-400 dark:focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("skills.editor.sourceUrl")}
                </label>
                <input
                  value={form.sourceUrl ?? ""}
                  onChange={(e) => set("sourceUrl", e.target.value || undefined)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-blue-400 dark:focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("skills.editor.tags")}
                </label>
                <div className="flex gap-2">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    placeholder={t("skills.editor.tagsPlaceholder")}
                    className="flex-1 px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-blue-400 dark:focus:border-blue-500"
                  />
                  <button
                    onClick={addTag}
                    className="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full"
                      >
                        {tag}
                        <button onClick={() => removeTag(tag)}>
                          <TrashIcon className="h-2.5 w-2.5 text-gray-400 hover:text-red-500" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {tab === "content" && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("skills.editor.content")} <span className="text-red-500 ml-1">*</span>
              </label>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                {t("skills.editor.contentHint")}
              </p>
              <textarea
                value={form.content}
                onChange={(e) => set("content", e.target.value)}
                placeholder={t("skills.editor.contentPlaceholder")}
                rows={16}
                className={`w-full px-3 py-2.5 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 border font-mono text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-400/30 resize-none leading-relaxed ${
                  errors.content
                    ? "border-red-400"
                    : "border-gray-200 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-500"
                }`}
                style={{ boxShadow: "none" }}
              />
              {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content}</p>}
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5 text-right">
                {form.content.length} {t("skills.editor.chars")}
              </p>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            {t("skills.editor.cancel")}
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm transition-colors"
          >
            {skill ? t("skills.editor.saveEdit") : t("skills.editor.saveNew")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SkillEditor;
