import React, { useRef, useState } from "react";
import { CanvasNode, WorkflowCanvas, WorkflowNodeType } from "../../types";
import { NODE_META } from "./nodeConstants";
import { useCanvasInteraction } from "./useCanvasInteraction";
import { NodeLibraryPanel } from "./NodeLibraryPanel";
import { CanvasToolbar } from "./CanvasToolbar";
import { CanvasEdges } from "./CanvasEdges";
import { CanvasNodes } from "./CanvasNodes";
import { NodeConfigPanel } from "./NodeConfigPanel";

interface WorkflowCanvasProps {
  canvas:    WorkflowCanvas;
  onChange:  (canvas: WorkflowCanvas) => void;
  t:         (k: string) => string;
  readOnly?: boolean;
}

// SVG 箭头定义
const SvgDefs: React.FC = () => (
  <defs>
    <marker id="arrow"       markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" />
    </marker>
    <marker id="arrow-draft" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#6366f1" />
    </marker>
  </defs>
);

export const WorkflowCanvasEditor: React.FC<WorkflowCanvasProps> = ({
  canvas, onChange, t, readOnly = false,
}) => {
  const svgRef       = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLibrary, setShowLibrary] = useState(true);

  const {
    pan, zoom, draftEdge, selectedNode, setSelectedNode, hoverTarget,
    onNodeMouseDown, onPortMouseDown, onBgMouseDown,
    onSvgMouseMove, onSvgMouseUp,
    deleteEdge, handleNodeSave, handleNodeDelete,
    onWheel, fitView, setZoom,
  } = useCanvasInteraction(canvas, onChange, svgRef, containerRef);

  const { nodes, edges } = canvas;

  // 从节点库拖入
  const onLibDrop = (type: WorkflowNodeType, e: React.DragEvent) => {
    e.preventDefault();
    const rect = svgRef.current!.getBoundingClientRect();
    const pt   = {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top  - pan.y) / zoom,
    };
    const meta    = NODE_META[type];
    const newNode: CanvasNode = {
      id:       `node-${Date.now()}`,
      type,
      position: { x: pt.x - 80, y: pt.y - 32 },
      data:     { label: meta.label, description: meta.description, config: {}, enabled: true },
    };
    onChange({ nodes: [...nodes, newNode], edges });
  };

  const selectedNodeObj = nodes.find((n) => n.id === selectedNode) ?? null;

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">

      {/* 节点库 */}
      {showLibrary && !readOnly && <NodeLibraryPanel t={t} />}

      {/* 画布区 */}
      <div className="flex-1 flex flex-col min-w-0">
        <CanvasToolbar
          zoom={zoom}
          showLibrary={showLibrary}
          selectedNodeType={selectedNodeObj?.type ?? null}
          onToggleLibrary={() => setShowLibrary((v) => !v)}
          onZoomIn={() => setZoom((z) => Math.min(2, z + 0.1))}
          onZoomOut={() => setZoom((z) => Math.max(0.3, z - 0.1))}
          onFitView={fitView}
          onDeleteNode={handleNodeDelete}
          t={t}
        />

        <div
          ref={containerRef}
          className="flex-1 overflow-hidden relative"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            const type = e.dataTransfer.getData("nodeType") as WorkflowNodeType;
            if (type) onLibDrop(type, e);
          }}
        >
          <svg
            ref={svgRef}
            className="w-full h-full select-none"
            onMouseDown={onBgMouseDown}
            onMouseMove={onSvgMouseMove}
            onMouseUp={onSvgMouseUp}
            onMouseLeave={onSvgMouseUp}
            onWheel={onWheel}
          >
            <SvgDefs />
            {/* 背景点阵 */}
            <defs>
              <pattern
                id="grid"
                width={20 * zoom} height={20 * zoom}
                patternUnits="userSpaceOnUse"
                x={pan.x % (20 * zoom)} y={pan.y % (20 * zoom)}
              >
                <circle cx={10 * zoom} cy={10 * zoom} r="0.8" fill="#d1d5db" opacity="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
              <CanvasEdges
                edges={edges} nodes={nodes} zoom={zoom}
                onDelete={deleteEdge}
                draftEdge={draftEdge}
              />
              <CanvasNodes
                nodes={nodes} zoom={zoom}
                selectedNode={selectedNode} hoverTarget={hoverTarget}
                readOnly={readOnly}
                onNodeMouseDown={onNodeMouseDown}
                onPortMouseDown={onPortMouseDown}
              />
            </g>
          </svg>

          {/* 空状态 */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-gray-400 text-sm">{t("workflow.canvasEmpty")}</p>
                <p className="text-gray-300 text-xs mt-1">{t("workflow.canvasEmptyHint")}</p>
              </div>
            </div>
          )}

          {/* 节点配置面板 —— absolute 浮层，叠在画布右侧，不压缩画布宽度 */}
          {selectedNodeObj && !readOnly && (
            <div
              className="absolute top-0 right-0 h-full z-20 flex"
              style={{ pointerEvents: "none" }}
            >
              {/* 半透明遮罩点击空白关闭 */}
              <div
                className="flex-1"
                style={{ pointerEvents: "auto" }}
                onClick={() => setSelectedNode(null)}
              />
              <div style={{ pointerEvents: "auto" }}>
                <NodeConfigPanel
                  node={selectedNodeObj}
                  onSave={handleNodeSave}
                  onDelete={handleNodeDelete}
                  onClose={() => setSelectedNode(null)}
                  t={t}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowCanvasEditor;
