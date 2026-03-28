import React, { useRef, useState } from "react";
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { Skill, SkillPackage } from "../../types";
import { exportSkillPackage, parseSkillPackage } from "./skillUtils";

interface SkillImportExportProps {
  skills: Skill[];
  onImport: (skills: Skill[]) => void;
  onClose: () => void;
  t: (key: string) => string;
}

const SkillImportExport: React.FC<SkillImportExportProps> = ({
  skills, onImport, onClose, t,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<{
    ok: boolean;
    message: string;
    count?: number;
  } | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);

  const customSkills = skills.filter((s) => !s.builtin);

  const handleExportAll = () => {
    exportSkillPackage(customSkills);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      processImport(text);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleUrlImport = async () => {
    if (!urlInput.trim()) return;
    setUrlLoading(true);
    setImportResult(null);
    try {
      const resp = await fetch(urlInput.trim());
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const text = await resp.text();
      processImport(text);
    } catch (err: any) {
      setImportResult({ ok: false, message: `${t("skills.ie.fetchFail")}${err.message}` });
    } finally {
      setUrlLoading(false);
    }
  };

  const processImport = (text: string) => {
    const pkg: SkillPackage | null = parseSkillPackage(text);
    if (!pkg) {
      setImportResult({ ok: false, message: t("skills.ie.invalidFormat") });
      return;
    }
    const existing = new Set(skills.map((s) => s.id));
    const toImport = pkg.skills
      .filter((s) => !s.builtin)
      .map((s) => ({
        ...s,
        id: existing.has(s.id) ? `${s.id}_${Date.now()}` : s.id,
        builtin: false,
      }));
    if (toImport.length === 0) {
      setImportResult({ ok: false, message: t("skills.ie.noImportable") });
      return;
    }
    onImport(toImport);
    setImportResult({ ok: true, message: t("skills.ie.importSuccess"), count: toImport.length });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {t("skills.ie.title")}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* 导出区 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
              {t("skills.ie.exportTitle")}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              {t("skills.ie.exportDesc").replace("{n}", String(customSkills.length))}
            </p>
            <button
              onClick={handleExportAll}
              disabled={customSkills.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              {t("skills.ie.exportBtn")}
            </button>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700" />

          {/* 本地文件导入 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
              {t("skills.ie.importFileTitle")}
            </h3>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              <ArrowUpTrayIcon className="h-4 w-4" />
              {t("skills.ie.importFileBtn")}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileImport}
            />
          </div>

          {/* URL 导入 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
              {t("skills.ie.importUrlTitle")}
            </h3>
            <div className="flex gap-2">
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUrlImport()}
                placeholder="https://example.com/my-skills.json"
                className="flex-1 px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-blue-400 dark:focus:border-blue-500"
              />
              <button
                onClick={handleUrlImport}
                disabled={urlLoading || !urlInput.trim()}
                className="px-4 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {urlLoading ? t("skills.ie.importing") : t("skills.ie.importUrlBtn")}
              </button>
            </div>
          </div>

          {/* 结果提示 */}
          {importResult && (
            <div
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
                importResult.ok
                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700"
                  : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700"
              }`}
            >
              {importResult.ok ? (
                <CheckCircleIcon className="h-4 w-4 flex-shrink-0" />
              ) : (
                <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0" />
              )}
              <span>
                {importResult.message}
                {importResult.count != null &&
                  t("skills.ie.importCount").replace("{n}", String(importResult.count))}
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            {t("skills.ie.close")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SkillImportExport;
