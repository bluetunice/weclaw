import React from "react";
import { CanvasEdge, CanvasNode } from "../../types";
import { bezierPath, outPortPos, inPortPos } from "./nodeConstants";

interface CanvasEdgesProps {
  edges:      CanvasEdge[];
  nodes:      CanvasNode[];
  zoom:       number;
  onDelete:   (eid: string) => void;
  draftEdge?: { sx: number; sy: number; mx: number; my: number } | null;
}

export const CanvasEdges: React.FC<CanvasEdgesProps> = ({
  edges, nodes, zoom, onDelete, draftEdge,
}) => (
  <>
    {/* ── 已有连线 ── */}
    {edges.map((edge) => {
      const src = nodes.find((n) => n.id === edge.source);
      const tgt = nodes.find((n) => n.id === edge.target);
      if (!src || !tgt) return null;
      const sp   = outPortPos(src, edge.sourceHandle as any);
      const tp   = inPortPos(tgt);
      const midX = (sp.x + tp.x) / 2;
      const midY = (sp.y + tp.y) / 2;
      return (
        <g key={edge.id}>
          <path
            d={bezierPath(sp.x, sp.y, tp.x, tp.y)}
            fill="none"
            stroke="#94a3b8"
            strokeWidth={1.5 / zoom}
            markerEnd="url(#arrow)"
          />
          {/* 删除按钮 */}
          <g className="group cursor-pointer" onClick={() => onDelete(edge.id)}>
            <circle
              cx={midX} cy={midY} r={8 / zoom}
              fill="white" stroke="#e2e8f0" strokeWidth={1 / zoom}
              opacity="0" className="group-hover:opacity-100"
            />
            <text
              x={midX} y={midY} textAnchor="middle" dominantBaseline="central"
              fontSize={10 / zoom} fill="#ef4444" opacity="0" className="group-hover:opacity-100"
            >×</text>
          </g>
          {/* 连线标签 */}
          {edge.sourceHandle === "true" && !edge.label && (
            <text x={midX} y={midY - 8 / zoom} textAnchor="middle" fontSize={9 / zoom} fill="#22c55e">True</text>
          )}
          {edge.sourceHandle === "false" && !edge.label && (
            <text x={midX} y={midY - 8 / zoom} textAnchor="middle" fontSize={9 / zoom} fill="#ef4444">False</text>
          )}
          {edge.label && (
            <text
              x={midX} y={midY - 8 / zoom} textAnchor="middle" fontSize={10 / zoom}
              fill={edge.sourceHandle === "true" ? "#22c55e" : edge.sourceHandle === "false" ? "#ef4444" : "#94a3b8"}
            >
              {edge.label}
            </text>
          )}
        </g>
      );
    })}

    {/* ── 草稿连线 ── */}
    {draftEdge && (
      <path
        d={bezierPath(draftEdge.sx, draftEdge.sy, draftEdge.mx, draftEdge.my)}
        fill="none"
        stroke="#6366f1"
        strokeWidth={1.5 / zoom}
        strokeDasharray={`${6 / zoom} ${3 / zoom}`}
        markerEnd="url(#arrow-draft)"
        pointerEvents="none"
      />
    )}
  </>
);

export default CanvasEdges;
