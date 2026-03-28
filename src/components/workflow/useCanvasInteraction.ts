import { useRef, useState, useCallback } from "react";
import { CanvasNode, CanvasEdge, WorkflowCanvas } from "../../types";
import { inPortPos, outPortPos, NODE_W, NODE_H } from "./nodeConstants";

export interface DraftEdge {
  sourceId:     string;
  sourceHandle: string;
  sx: number; sy: number;
  mx: number; my: number;
}

export function useCanvasInteraction(
  canvas: WorkflowCanvas,
  onChange: (c: WorkflowCanvas) => void,
  svgRef: React.RefObject<SVGSVGElement>,
  containerRef: React.RefObject<HTMLDivElement>,
) {
  const { nodes, edges } = canvas;

  const [pan,  setPan]  = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [draftEdge,    setDraftEdge]    = useState<DraftEdge | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const dragging = useRef<{
    nodeId: string;
    startMouse: { x: number; y: number };
    startPos:   { x: number; y: number };
  } | null>(null);

  const panning = useRef<{
    start:    { x: number; y: number };
    startPan: { x: number; y: number };
  } | null>(null);

  // ── 坐标转换 ──────────────────────────────────────────────────────────────
  const svgPoint = useCallback((clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top  - pan.y) / zoom,
    };
  }, [pan, zoom, svgRef]);

  // ── 节点拖拽开始 ───────────────────────────────────────────────────────────
  const onNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId)!;
    dragging.current = { nodeId, startMouse: { x: e.clientX, y: e.clientY }, startPos: { ...node.position } };
    setSelectedNode(nodeId);
  }, [nodes]);

  // ── 端口拖线开始 ───────────────────────────────────────────────────────────
  const onPortMouseDown = useCallback((
    e: React.MouseEvent, nodeId: string, handle: string, sx: number, sy: number,
  ) => {
    e.stopPropagation();
    const rect = svgRef.current!.getBoundingClientRect();
    setDraftEdge({
      sourceId: nodeId, sourceHandle: handle, sx, sy,
      mx: (e.clientX - rect.left - pan.x) / zoom,
      my: (e.clientY - rect.top  - pan.y) / zoom,
    });
  }, [pan, zoom, svgRef]);

  // ── 背景按下（平移）────────────────────────────────────────────────────────
  const onBgMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setSelectedNode(null);
    panning.current = { start: { x: e.clientX, y: e.clientY }, startPan: { ...pan } };
  }, [pan]);

  // ── 鼠标移动 ───────────────────────────────────────────────────────────────
  const onSvgMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging.current) {
      const dx = (e.clientX - dragging.current.startMouse.x) / zoom;
      const dy = (e.clientY - dragging.current.startMouse.y) / zoom;
      const newNodes = nodes.map((n) =>
        n.id === dragging.current!.nodeId
          ? { ...n, position: { x: dragging.current!.startPos.x + dx, y: dragging.current!.startPos.y + dy } }
          : n,
      );
      onChange({ nodes: newNodes, edges });
      return;
    }
    if (draftEdge) {
      const rect = svgRef.current!.getBoundingClientRect();
      setDraftEdge((prev) => prev ? {
        ...prev,
        mx: (e.clientX - rect.left - pan.x) / zoom,
        my: (e.clientY - rect.top  - pan.y) / zoom,
      } : null);
      return;
    }
    if (panning.current) {
      const dx = e.clientX - panning.current.start.x;
      const dy = e.clientY - panning.current.start.y;
      setPan({ x: panning.current.startPan.x + dx, y: panning.current.startPan.y + dy });
    }
  }, [nodes, edges, draftEdge, pan, zoom, onChange, svgRef]);

  // ── 鼠标抬起 ───────────────────────────────────────────────────────────────
  const onSvgMouseUp = useCallback((e: React.MouseEvent) => {
    dragging.current = null;
    panning.current  = null;
    if (draftEdge) {
      const pt = svgPoint(e.clientX, e.clientY);
      const target = nodes.find((n) => {
        const ip = inPortPos(n);
        return n.id !== draftEdge.sourceId && Math.abs(pt.x - ip.x) < 20 && Math.abs(pt.y - ip.y) < 20;
      });
      if (target) {
        const newEdge: CanvasEdge = {
          id: `e-${Date.now()}`,
          source: draftEdge.sourceId,
          target: target.id,
          sourceHandle: draftEdge.sourceHandle as any,
        };
        onChange({ nodes, edges: [...edges, newEdge] });
      }
      setDraftEdge(null);
    }
  }, [draftEdge, nodes, edges, svgPoint, onChange]);

  // ── 删除连线 ──────────────────────────────────────────────────────────────
  const deleteEdge = useCallback((eid: string) => {
    onChange({ nodes, edges: edges.filter((e) => e.id !== eid) });
  }, [nodes, edges, onChange]);

  // ── 更新节点 ──────────────────────────────────────────────────────────────
  const handleNodeSave = useCallback((updated: CanvasNode) => {
    onChange({ nodes: nodes.map((n) => n.id === updated.id ? updated : n), edges });
  }, [nodes, edges, onChange]);

  // ── 删除节点 ──────────────────────────────────────────────────────────────
  const handleNodeDelete = useCallback(() => {
    if (!selectedNode) return;
    onChange({
      nodes: nodes.filter((n) => n.id !== selectedNode),
      edges: edges.filter((e) => e.source !== selectedNode && e.target !== selectedNode),
    });
    setSelectedNode(null);
  }, [selectedNode, nodes, edges, onChange]);

  // ── 缩放 ──────────────────────────────────────────────────────────────────
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.min(2, Math.max(0.3, z - e.deltaY * 0.001)));
  }, []);

  // ── 适配视图 ──────────────────────────────────────────────────────────────
  const fitView = useCallback(() => {
    if (nodes.length === 0) { setPan({ x: 0, y: 0 }); setZoom(1); return; }
    const minX = Math.min(...nodes.map((n) => n.position.x)) - 40;
    const minY = Math.min(...nodes.map((n) => n.position.y)) - 40;
    const maxX = Math.max(...nodes.map((n) => n.position.x + NODE_W)) + 40;
    const maxY = Math.max(...nodes.map((n) => n.position.y + NODE_H)) + 40;
    const cw = containerRef.current?.clientWidth  ?? 800;
    const ch = containerRef.current?.clientHeight ?? 600;
    const z  = Math.min(cw / (maxX - minX), ch / (maxY - minY), 1.5);
    setZoom(z);
    setPan({ x: -minX * z + (cw - (maxX - minX) * z) / 2, y: -minY * z + (ch - (maxY - minY) * z) / 2 });
  }, [nodes, containerRef]);

  // ── hover 连线目标高亮 ─────────────────────────────────────────────────────
  const hoverTarget = draftEdge
    ? nodes.find((n) => {
        const ip = inPortPos(n);
        return (
          n.id !== draftEdge.sourceId &&
          Math.abs(draftEdge.mx - ip.x) < 24 &&
          Math.abs(draftEdge.my - ip.y) < 24
        );
      })?.id ?? null
    : null;

  return {
    pan, zoom, draftEdge, selectedNode, setSelectedNode, hoverTarget,
    onNodeMouseDown, onPortMouseDown, onBgMouseDown,
    onSvgMouseMove, onSvgMouseUp,
    deleteEdge, handleNodeSave, handleNodeDelete,
    onWheel, fitView,
    setZoom,
  };
}
