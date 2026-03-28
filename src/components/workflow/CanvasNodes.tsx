import React from "react";
import { CanvasNode } from "../../types";
import { NODE_META, NODE_W, NODE_H, PORT_R, outPortPos } from "./nodeConstants";

interface CanvasNodesProps {
  nodes:        CanvasNode[];
  zoom:         number;
  selectedNode: string | null;
  hoverTarget:  string | null;
  readOnly:     boolean;
  onNodeMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onPortMouseDown: (
    e: React.MouseEvent, nodeId: string, handle: string, sx: number, sy: number,
  ) => void;
}

export const CanvasNodes: React.FC<CanvasNodesProps> = ({
  nodes, zoom, selectedNode, hoverTarget, readOnly,
  onNodeMouseDown, onPortMouseDown,
}) => (
  <>
    {nodes.map((node) => {
      const meta  = NODE_META[node.type];
      const isSel = selectedNode === node.id;
      const isHov = hoverTarget  === node.id;
      const nx    = node.position.x;
      const ny    = node.position.y;

      const outPorts: Array<{ handle: "default" | "true" | "false"; label?: string }> =
        node.type === "condition"
          ? [{ handle: "true", label: "T" }, { handle: "false", label: "F" }]
          : node.type === "end"
          ? []
          : [{ handle: "default" }];

      return (
        <g
          key={node.id}
          transform={`translate(${nx},${ny})`}
          onMouseDown={(e) => !readOnly && onNodeMouseDown(e, node.id)}
          style={{ cursor: readOnly ? "default" : "grab" }}
        >
          {/* 选中/hover 光环 */}
          {(isSel || isHov) && (
            <rect
              x={-3} y={-3} width={NODE_W + 6} height={NODE_H + 6} rx="10"
              fill="none"
              stroke={isSel ? "#3b82f6" : "#6366f1"}
              strokeWidth={2 / zoom}
              strokeDasharray={isHov && !isSel ? `${4 / zoom} ${2 / zoom}` : undefined}
            />
          )}

          {/* 节点主体 via foreignObject */}
          <foreignObject width={NODE_W} height={NODE_H}>
            <div
              xmlns="http://www.w3.org/1999/xhtml"
              className={`w-full h-full flex flex-col items-center justify-center px-2 rounded-lg border-2 ${meta.border} ${meta.color}`}
            >
              <div className="flex items-center gap-1.5">
                <meta.Icon className={`h-4 w-4 flex-shrink-0 ${meta.textColor}`} />
                <span className={`text-xs font-semibold ${meta.textColor} truncate max-w-[100px]`}>
                  {node.data.label}
                </span>
              </div>
              {node.data.description && (
                <p className="text-[9px] text-gray-400 dark:text-gray-500 truncate max-w-[140px] mt-0.5">
                  {node.data.description}
                </p>
              )}
            </div>
          </foreignObject>

          {/* 输入端口（左侧）*/}
          {node.type !== "start" && (
            <circle
              cx={0} cy={NODE_H / 2} r={PORT_R}
              fill={isHov ? "#818cf8" : "white"}
              stroke={isHov ? "#6366f1" : "#94a3b8"}
              strokeWidth={1.5}
              pointerEvents="none"
              className="dark:fill-gray-700"
            />
          )}

          {/* 输出端口（右侧）*/}
          {outPorts.map(({ handle, label: portLabel }) => {
            const pp     = outPortPos(node, handle);
            const localY = pp.y - ny;
            return (
              <g
                key={handle}
                onMouseDown={(e) => !readOnly && onPortMouseDown(e, node.id, handle, pp.x, pp.y)}
                style={{ cursor: readOnly ? "default" : "crosshair" }}
              >
                <circle cx={NODE_W} cy={localY} r={PORT_R + 4} fill="transparent" />
                <circle
                  cx={NODE_W} cy={localY} r={PORT_R}
                  fill={handle === "true" ? "#22c55e" : handle === "false" ? "#ef4444" : "#3b82f6"}
                  stroke="white" strokeWidth={1.5}
                />
                {portLabel && (
                  <text
                    x={NODE_W + PORT_R + 4} y={localY}
                    dominantBaseline="central" fontSize={9}
                    fill={handle === "true" ? "#22c55e" : "#ef4444"}
                  >
                    {portLabel}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      );
    })}
  </>
);

export default CanvasNodes;
