import React, { useState, useEffect, useCallback } from "react";
import { useSettings } from "../../contexts/SettingsContext";
import { Workflow } from "../../types";
import { loadWorkflows, saveWorkflow, deleteWorkflow } from "../../utils/workflowStorage";
import { WorkflowListPage } from "./WorkflowListPage";
import { WorkflowEditorPage } from "./WorkflowEditorPage";
import { OutputViewer } from "./OutputViewer";
import { opLog } from "../../utils/operationLogger";

const EMPTY_DRAFT: Partial<Workflow> = {
  name: "", description: "", trigger: "manual", triggerConfig: {}, steps: [], enabled: true,
};

const WorkflowEnhanced: React.FC = () => {
  const { t } = useSettings();
  const [workflows,       setWorkflows]       = useState<Workflow[]>([]);
  const [runningWorkflow, setRunningWorkflow] = useState<string | null>(null);
  const [viewingOutput,   setViewingOutput]   = useState<string | null>(null);
  const [editingId,       setEditingId]       = useState<string | null>(null);
  const [isCreating,      setIsCreating]      = useState(false);
  const [draft,           setDraft]           = useState<Partial<Workflow>>(EMPTY_DRAFT);

  useEffect(() => { setWorkflows(loadWorkflows()); }, []);

  // ── 保存 ──────────────────────────────────────────────────────────────────
  const handleSaveWorkflow = useCallback((wf: Workflow) => {
    saveWorkflow(wf);
    setWorkflows((prev) => {
      const idx = prev.findIndex((w) => w.id === wf.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = wf; return next; }
      return [wf, ...prev];
    });
    opLog.wfSave(wf.name);
    setEditingId(null);
  }, []);

  // ── 新建 ──────────────────────────────────────────────────────────────────
  const createWorkflow = () => {
    if (!draft.name?.trim()) { alert(t("workflow.requiredName")); return; }
    const wf: Workflow = {
      id:            `wf-${Date.now()}`,
      name:          draft.name!,
      description:   draft.description || "",
      trigger:       draft.trigger || "manual",
      triggerConfig: draft.triggerConfig || {},
      steps:         [],
      canvas:        { nodes: [], edges: [] },
      enabled:       draft.enabled !== false,
      createdAt:     new Date(),
      updatedAt:     new Date(),
    };
    saveWorkflow(wf);
    setWorkflows((prev) => [wf, ...prev]);
    opLog.wfCreate(wf.name);
    setDraft(EMPTY_DRAFT);
    setIsCreating(false);
    setEditingId(wf.id);
  };

  // ── 运行（模拟）──────────────────────────────────────────────────────────
  const runWorkflow = (workflowId: string) => {
    if (runningWorkflow) return;
    setRunningWorkflow(workflowId);
    setWorkflows((prev) => prev.map((w) =>
      w.id === workflowId ? { ...w, lastRunStatus: "running" } : w,
    ));
    setTimeout(() => {
      const wf = workflows.find((w) => w.id === workflowId);
      if (!wf) return;
      const ok      = Math.random() > 0.2;
      const updated = {
        ...wf,
        lastRun:       new Date(),
        lastRunStatus: (ok ? "success" : "failed") as "success" | "failed",
        lastRunOutput: ok
          ? `[${new Date().toLocaleTimeString()}] 工作流执行成功，共运行 ${wf.steps.length} 个节点\n✓ 所有步骤执行完毕`
          : `[${new Date().toLocaleTimeString()}] 工作流执行失败\n✗ 步骤出错`,
        updatedAt: new Date(),
      };
      saveWorkflow(updated);
      setWorkflows((prev) => prev.map((w) => w.id === workflowId ? updated : w));
      opLog.wfRun(wf.name, ok ? "success" : "error");
      setRunningWorkflow(null);
    }, 2000);
  };

  // ── 切换启用 ──────────────────────────────────────────────────────────────
  const toggleWorkflow = (id: string) => {
    setWorkflows((prev) => prev.map((w) => {
      if (w.id !== id) return w;
      const updated = { ...w, enabled: !w.enabled, updatedAt: new Date() };
      saveWorkflow(updated);
      opLog.wfToggle(w.name, updated.enabled);
      return updated;
    }));
  };

  // ── 删除 ──────────────────────────────────────────────────────────────────
  const removeWorkflow = (id: string) => {
    if (!confirm(t("workflow.deleteConfirm"))) return;
    const wf = workflows.find((w) => w.id === id);
    deleteWorkflow(id);
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
    if (wf) opLog.wfDelete(wf.name);
  };

  const getTriggerLabel = (wf: Workflow) => {
    if (wf.trigger === "scheduled" && wf.triggerConfig?.schedule)
      return `${t("workflow.triggerInfo.scheduled")} (${wf.triggerConfig.schedule})`;
    return t(`workflow.triggerInfo.${wf.trigger}`) || wf.trigger;
  };

  // ── 编辑器视图 ────────────────────────────────────────────────────────────
  if (editingId) {
    const wf = workflows.find((w) => w.id === editingId);
    if (wf) {
      return (
        <WorkflowEditorPage
          workflow={wf}
          onSave={handleSaveWorkflow}
          onBack={() => setEditingId(null)}
          t={t}
        />
      );
    }
  }

  // ── 列表视图 ──────────────────────────────────────────────────────────────
  return (
    <>
      <WorkflowListPage
        workflows={workflows}
        runningWorkflow={runningWorkflow}
        isCreating={isCreating}
        draft={draft}
        onDraftChange={setDraft}
        onCreateSubmit={createWorkflow}
        onCreateCancel={() => { setIsCreating(false); setDraft(EMPTY_DRAFT); }}
        onCreateOpen={() => setIsCreating(true)}
        onRun={runWorkflow}
        onToggle={toggleWorkflow}
        onDelete={removeWorkflow}
        onEdit={setEditingId}
        onViewOutput={setViewingOutput}
        getTriggerLabel={getTriggerLabel}
        t={t}
      />
      {viewingOutput && (
        <OutputViewer
          workflow={workflows.find((w) => w.id === viewingOutput)!}
          onClose={() => setViewingOutput(null)}
          t={t}
        />
      )}
    </>
  );
};

export default WorkflowEnhanced;
