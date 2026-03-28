import React from "react";
import { WorkflowNodeType } from "../../types";
import { NODE_META, NODE_GROUPS } from "./nodeConstants";

interface NodeLibraryPanelProps {
  t: (k: string) => string;
}

export const NodeLibraryPanel: React.FC<NodeLibraryPanelProps> = ({ t }) => (
  <div className="w-48 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {t("workflow.nodeLibrary")}
      </p>
    </div>
    <div className="p-2 space-y-3">
      {NODE_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="text-[10px] font-semibold text-gray-400 uppercase px-1 mb-1">{group.label}</p>
          <div className="space-y-1">
            {group.types.map((type: WorkflowNodeType) => {
              const meta = NODE_META[type];
              return (
                <div
                  key={type}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("nodeType", type)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-grab active:cursor-grabbing border ${meta.border} ${meta.color} hover:shadow-sm transition-shadow`}
                >
                  <meta.Icon className={`h-3.5 w-3.5 ${meta.textColor} flex-shrink-0`} />
                  <span className={`text-xs font-medium ${meta.textColor} truncate`}>{meta.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default NodeLibraryPanel;
