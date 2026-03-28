import React from "react";
import {
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowsPointingOutIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

interface CanvasToolbarProps {
  zoom: number;
  showLibrary: boolean;
  selectedNodeType?: string | null;
  onToggleLibrary: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onDeleteNode: () => void;
  t: (k: string) => string;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  zoom,
  showLibrary,
  selectedNodeType,
  onToggleLibrary,
  onZoomIn,
  onZoomOut,
  onFitView,
  onDeleteNode,
  t,
}) => (
  <div className="flex items-center justify-between px-3 py-1.5 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 gap-2">
    <div className="flex items-center gap-1">
      <button
        onClick={onToggleLibrary}
        className={`text-xs px-2 py-1 rounded border transition-colors ${
          showLibrary
            ? "bg-blue-50 text-blue-600 border-blue-200"
            : "text-gray-500 border-gray-200 hover:bg-gray-50"
        }`}
      >
        {t("workflow.nodeLibrary")}
      </button>
    </div>

    <div className="flex items-center gap-1">
      <button
        onClick={onZoomIn}
        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        title="+"
      >
        <MagnifyingGlassPlusIcon className="h-4 w-4 text-gray-500" />
      </button>
      <span className="text-xs text-gray-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
      <button
        onClick={onZoomOut}
        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        title="-"
      >
        <MagnifyingGlassMinusIcon className="h-4 w-4 text-gray-500" />
      </button>
      <button
        onClick={onFitView}
        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        title={t("workflow.fitView")}
      >
        <ArrowsPointingOutIcon className="h-4 w-4 text-gray-500" />
      </button>
      {selectedNodeType && selectedNodeType !== "start" && (
        <button
          onClick={onDeleteNode}
          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
          title={t("workflow.node.delete")}
        >
          <TrashIcon className="h-4 w-4 text-red-500" />
        </button>
      )}
    </div>
  </div>
);

export default CanvasToolbar;
