import React from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Skill, SkillCategory } from "../../types";
import SkillCard from "./SkillCard";

interface SkillListProps {
  skills: Skill[];
  search: string;
  activeCategory: "all" | SkillCategory;
  onSearchChange: (v: string) => void;
  onCategoryChange: (v: "all" | SkillCategory) => void;
  onEdit: (skill: Skill) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onExportSingle: (skill: Skill) => void;
  onUse: (skill: Skill) => void;
  t: (key: string) => string;
}

const ALL_CATEGORIES: ("all" | SkillCategory)[] = [
  "all", "productivity", "coding", "writing", "analysis", "communication", "custom",
];

const SkillList: React.FC<SkillListProps> = ({
  skills, search, activeCategory,
  onSearchChange, onCategoryChange,
  onEdit, onDelete, onToggle, onExportSingle, onUse, t,
}) => {
  const filtered = skills.filter((s) => {
    const matchCat = activeCategory === "all" || s.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.tags.some((tag) => tag.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  const catLabel = (cat: "all" | SkillCategory): string => {
    if (cat === "all") return t("skills.categoryAll");
    return t(`skills.cat.${cat}`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 搜索栏 */}
      <div className="flex items-center gap-3 px-1 mb-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("skills.searchPlaceholder")}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20"
          />
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
          {filtered.length} / {skills.length}
        </span>
      </div>

      {/* 分类 Tab */}
      <div className="flex gap-1.5 flex-wrap mb-4 px-0.5">
        {ALL_CATEGORIES.map((cat) => {
          const count = cat === "all" ? skills.length : skills.filter((s) => s.category === cat).length;
          if (count === 0 && cat !== "all") return null;
          return (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-all duration-150 ${
                activeCategory === cat
                  ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              {catLabel(cat)}
              <span className={`ml-1 ${activeCategory === cat ? "text-blue-100" : "text-gray-400 dark:text-gray-500"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 技能网格 */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
          <MagnifyingGlassIcon className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm">
            {search
              ? t("skills.notFound").replace("{q}", search)
              : t("skills.emptyCategory")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 overflow-y-auto pb-2">
          {filtered.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggle={onToggle}
              onExportSingle={onExportSingle}
              onUse={onUse}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillList;
