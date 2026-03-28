import React, { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { CanvasNode } from "../../types";
import { NODE_META } from "./nodeConstants";
import { NodeTypeFields } from "./NodeTypeFields";

interface NodeConfigPanelProps {
  node:     CanvasNode;
  onSave:   (updated: CanvasNode) => void;
  onDelete: () => void;
  onClose:  () => void;
  t:        (k: string) => string;
}

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  node, onSave, onDelete, onClose, t,
}) => {
  const [label,  setLabel]  = useState(node.data.label);
  const [desc,   setDesc]   = useState(node.data.description ?? "");
  const [config, setConfig] = useState<Record<string, any>>({ ...node.data.config });

  const meta = NODE_META[node.type];

  const handleSave = () => {
    onSave({ ...node, data: { ...node.data, label, description: desc, config } });
  };

  const setField = (key: string, val: any) =>
    setConfig((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="w-80 flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl h-full animate-slide-in-right">
      {/* 标题栏 */}
      <div className={`flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 ${meta.color}`}>
        <div className="flex items-center gap-2">
          <meta.Icon className={`h-4 w-4 ${meta.textColor}`} />
          <span className={`font-semibold text-sm ${meta.textColor}`}>{meta.label}</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-black/5">
          <XMarkIcon className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {t("workflow.node.label")}
          </label>
          <input
            className="input text-sm w-full" value={label}
            onChange={(e) => setLabel(e.target.value)} placeholder={meta.label}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {t("workflow.node.description")}
          </label>
          <textarea
            className="input text-sm w-full min-h-[60px] resize-none"
            value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={meta.description}
          />
        </div>
        <NodeTypeFields type={node.type} config={config} onChange={setField} t={t} />
      </div>

      {/* 底部按钮 */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <button onClick={handleSave} className="btn-primary w-full text-sm">
          {t("workflow.node.save")}
        </button>
        {node.type !== "start" && (
          <button
            onClick={() => { if (window.confirm(t("workflow.node.deleteConfirm"))) onDelete(); }}
            className="w-full text-sm py-1.5 px-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            {t("workflow.node.delete")}
          </button>
        )}
      </div>
    </div>
  );
};

// 兼容旧导入：继续导出 NODE_META / NODE_GROUPS
export { NODE_META, NODE_GROUPS } from "./nodeConstants";

export default NodeConfigPanel;
