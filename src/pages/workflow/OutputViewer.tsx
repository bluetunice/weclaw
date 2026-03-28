import React from "react";
import { XMarkIcon, ClockIcon, ArrowPathIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { Workflow } from "../../types";
import { NODE_META } from "../../components/workflow/nodeConstants";

interface OutputViewerProps {
  workflow: Workflow;
  onClose:  () => void;
  t:        (k: string) => string;
}

export const OutputViewer: React.FC<OutputViewerProps> = ({ workflow, onClose, t }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl">
      {/* 头部 */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {workflow.name} · {t("workflow.output.title")}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">{t("workflow.outputSubtitle")}</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <XMarkIcon className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-auto p-5">
        {workflow.lastRun ? (
          <div className="space-y-5">
            {/* 概要卡 */}
            <div className="grid grid-cols-3 gap-3">
              <div className="card p-3">
                <p className="text-xs text-gray-400">{t("workflow.output.lastRunTime")}</p>
                <p className="text-sm font-semibold mt-1 text-gray-800 dark:text-gray-100">
                  {workflow.lastRun.toLocaleString()}
                </p>
              </div>
              <div className="card p-3">
                <p className="text-xs text-gray-400">{t("workflow.output.runStatus")}</p>
                <span className={`inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                  workflow.lastRunStatus === "success" ? "bg-green-100 text-green-700" :
                  workflow.lastRunStatus === "failed"  ? "bg-red-100 text-red-700" :
                  "bg-blue-100 text-blue-700"
                }`}>
                  {t(`workflow.status.${workflow.lastRunStatus ?? "running"}`)}
                </span>
              </div>
              <div className="card p-3">
                <p className="text-xs text-gray-400">{t("workflow.output.stepsCount")}</p>
                <p className="text-lg font-bold mt-1 text-gray-800 dark:text-gray-100">{workflow.steps.length}</p>
              </div>
            </div>

            {/* 输出日志 */}
            {workflow.lastRunOutput && (
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">{t("workflow.output.output")}</p>
                <pre className="bg-gray-900 text-green-400 text-xs p-4 rounded-lg font-mono overflow-auto whitespace-pre-wrap">
                  {workflow.lastRunOutput}
                </pre>
              </div>
            )}

            {/* 步骤列表 */}
            <div>
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">{t("workflow.output.steps")}</p>
              <div className="space-y-2">
                {workflow.steps.map((s, i) => {
                  const meta = NODE_META[s.type];
                  return (
                    <div key={s.id} className={`flex items-start gap-3 p-3 rounded-lg border ${meta.border} ${meta.color}`}>
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-600">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <meta.Icon className={`h-3.5 w-3.5 ${meta.textColor}`} />
                          <span className={`text-xs font-medium ${meta.textColor}`}>{s.name}</span>
                          <span className="text-[10px] text-gray-400">({meta.label})</span>
                        </div>
                        {s.description && (
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{s.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center">
            <div className="text-center">
              <ClockIcon className="h-10 w-10 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-400 text-sm">{t("workflow.output.noRecord")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default OutputViewer;
