import React, { useState, useCallback } from "react";
import {
  SparklesIcon,
  PlusIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";
import { Skill, SkillCategory } from "../types";
import {
  loadSkills,
  saveSkills,
  exportSkillPackage,
} from "../components/skills/skillUtils";
import { opLog } from "../utils/operationLogger";
import { useSettings } from "../contexts/SettingsContext";
import SkillList from "../components/skills/SkillList";
import SkillEditor from "../components/skills/SkillEditor";
import SkillImportExport from "../components/skills/SkillImportExport";

const SkillManager: React.FC = () => {
  const { t } = useSettings();

  const [skills, setSkills] = useState<Skill[]>(() => loadSkills());
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | SkillCategory>("all");

  const [editorSkill, setEditorSkill] = useState<Skill | null | undefined>(undefined);
  const [showIE, setShowIE] = useState(false);
  const [usedSkill, setUsedSkill] = useState<Skill | null>(null);

  const enabledCount = skills.filter((s) => s.enabled).length;
  const customCount  = skills.filter((s) => !s.builtin).length;

  const handleSave = useCallback(
    (skill: Skill) => {
      setSkills((prev) => {
        const idx = prev.findIndex((s) => s.id === skill.id);
        const isNew = idx < 0;
        const next = isNew
          ? [...prev, skill]
          : prev.map((s) => (s.id === skill.id ? skill : s));
        saveSkills(next);
        if (isNew) opLog.skillCreate(skill.name);
        else        opLog.skillSave(skill.name);
        return next;
      });
      setEditorSkill(undefined);
    },
    []
  );

  const handleDelete = useCallback((id: string) => {
    if (!confirm(t("skills.deleteConfirm"))) return;
    setSkills((prev) => {
      const skill = prev.find((s) => s.id === id);
      const next = prev.filter((s) => s.id !== id);
      saveSkills(next);
      if (skill) opLog.skillDelete(skill.name);
      return next;
    });
  }, [t]);

  const handleToggle = useCallback((id: string) => {
    setSkills((prev) => {
      const next = prev.map((s) =>
        s.id === id ? { ...s, enabled: !s.enabled, updatedAt: new Date().toISOString() } : s
      );
      const skill = next.find((s) => s.id === id);
      saveSkills(next);
      if (skill) opLog.skillToggle(skill.name, skill.enabled);
      return next;
    });
  }, []);

  const handleExportSingle = useCallback((skill: Skill) => {
    exportSkillPackage([skill]);
  }, []);

  const handleImport = useCallback((imported: Skill[]) => {
    setSkills((prev) => {
      const next = [...prev, ...imported];
      saveSkills(next);
      return next;
    });
    opLog.skillImport(imported.length);
  }, []);

  const handleUse = useCallback((skill: Skill) => {
    setSkills((prev) => {
      const next = prev.map((s) =>
        s.id === skill.id
          ? { ...s, usageCount: (s.usageCount ?? 0) + 1, updatedAt: new Date().toISOString() }
          : s
      );
      saveSkills(next);
      return next;
    });
    opLog.skillUse(skill.name);
    setUsedSkill(skill);
    setTimeout(() => setUsedSkill(null), 3000);
  }, []);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* 页头 */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {t("skills.title")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {t("skills.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowIE(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowsRightLeftIcon className="h-3.5 w-3.5" />
            {t("skills.importExport")}
          </button>
          <button
            onClick={() => setEditorSkill(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm transition-colors"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            {t("skills.newSkill")}
          </button>
        </div>
      </div>

      {/* 统计横条 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t("skills.allSkills"), value: skills.length, color: "text-gray-800 dark:text-gray-100" },
          { label: t("skills.enabled"),   value: enabledCount,  color: "text-blue-600" },
          { label: t("skills.custom"),    value: customCount,   color: "text-violet-600" },
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

      {/* 技能列表 */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 min-h-0">
        <SkillList
          skills={skills}
          search={search}
          activeCategory={activeCategory}
          onSearchChange={setSearch}
          onCategoryChange={setActiveCategory}
          onEdit={setEditorSkill}
          onDelete={handleDelete}
          onToggle={handleToggle}
          onExportSingle={handleExportSingle}
          onUse={handleUse}
          t={t}
        />
      </div>

      {/* 使用技能 Toast */}
      {usedSkill && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-gray-900 dark:bg-gray-700 text-white rounded-xl shadow-xl animate-fade-in">
          <SparklesIcon className="h-4 w-4 text-blue-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium">{t("skills.usedToast")}{usedSkill.name}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
              {usedSkill.description}
            </p>
          </div>
        </div>
      )}

      {/* 编辑器弹框 */}
      {editorSkill !== undefined && (
        <SkillEditor
          skill={editorSkill}
          onSave={handleSave}
          onClose={() => setEditorSkill(undefined)}
          t={t}
        />
      )}

      {/* 导入/导出弹框 */}
      {showIE && (
        <SkillImportExport
          skills={skills}
          onImport={handleImport}
          onClose={() => setShowIE(false)}
          t={t}
        />
      )}
    </div>
  );
};

export default SkillManager;
