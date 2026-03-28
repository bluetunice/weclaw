/**
 * Claw Agent 页面
 * 自主 Agent 任务执行界面
 */
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useModel } from "../contexts/ModelContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useSettings } from "../contexts/SettingsContext";
import {
  ClawTask,
  ClawStep,
  ClawStepStatus,
  ClawFile,
  ClawMessage,
} from "../types/claw";
import {
  loadClawTasks,
  saveClawTask,
  deleteClawTask,
  loadActiveClawTaskId,
  saveActiveClawTaskId,
} from "../utils/clawStorage";
import { opLog } from "../utils/operationLogger";
import { logTokenUsage } from "../utils/tokenLogger";
import { Skill } from "../types";

// 组件
import ClawAgentConversationList from "../components/claw/ClawAgentConversationList";
import ClawAgentHeader from "../components/claw/ClawAgentHeader";
import ClawAgentSteps from "../components/claw/ClawAgentSteps";
import ClawAgentInput from "../components/claw/ClawAgentInput";
import FilePreview from "../components/claw/FilePreview";
import TaskFilePanel from "../components/claw/TaskFilePanel";


const ClawAgent: React.FC = () => {
  const navigate = useNavigate();
  const { models, activeModel, setActiveModel } = useModel();
  const { activeWorkspace, selectWorkspace } = useWorkspace();
  const { t } = useSettings();

  // ── 状态 ─────────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState<ClawTask[]>([]);
  const [activeTask, setActiveTask] = useState<ClawTask | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isConversationListCollapsed, setIsConversationListCollapsed] = useState(true);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  
  // Token 统计
  const [totalTokens, setTotalTokens] = useState(0);
  const [sessionTokens, setSessionTokens] = useState(0);
  
  // 面板宽度
  const [conversationListWidth, setConversationListWidth] = useState(260);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  
  // 输入框高度
  const [chatInputHeight, setChatInputHeight] = useState(160);
  const MIN_INPUT_HEIGHT = 100;
  const MAX_INPUT_HEIGHT = 400;
  
  // 文件预览
  const [previewFile, setPreviewFile] = useState<{ path: string; content: string } | null>(null);
  
  // Plan 模式
  const [isPlanMode, setIsPlanMode] = useState(false);

  // ── 加载存储的任务 ─────────────────────────────────────────────────
  useEffect(() => {
    const loadAndScanTasks = async () => {
      try {
        const savedTasks = loadClawTasks();
        const savedActiveId = loadActiveClawTaskId();

        console.log(`从本地存储加载了 ${savedTasks.length} 个 Claw 任务`);

        if (savedTasks.length > 0) {
          // 扫描已完成但没有文件的任务目录
          const updatedTasks = await Promise.all(savedTasks.map(async (task) => {
            // 如果任务已完成但没有文件记录，扫描目录重新生成文件列表
            if (task.status === "done" && (!task.files || task.files.length === 0) && task.sessionDirName) {
              try {
                const result = await window.electron?.ipcRenderer?.invoke(
                  "claw-scan-directory",
                  task.sessionDirName
                );
                if (result?.success && result.files && result.files.length > 0) {
                  const clawFiles: ClawFile[] = result.files.map((f: { name: string; path: string; type: string; size: number; createdAt: string }, idx: number) => ({
                    id: `file-${idx}`,
                    name: f.name,
                    path: f.path,
                    type: f.type,
                    size: f.size,
                    createdAt: f.createdAt
                  }));
                  console.log(`任务 ${task.id} 扫描到 ${clawFiles.length} 个文件`);
                  return { ...task, files: clawFiles };
                }
              } catch (scanError) {
                console.error(`扫描任务 ${task.id} 目录失败:`, scanError);
              }
            }
            return task;
          }));

          setTasks(updatedTasks);

          // 恢复活跃任务
          if (savedActiveId) {
            const foundTask = updatedTasks.find((task) => task.id === savedActiveId);
            if (foundTask) {
              setActiveTask(foundTask);
            } else if (updatedTasks.length > 0) {
              setActiveTask(updatedTasks[0]);
            }
          } else if (updatedTasks.length > 0) {
            setActiveTask(updatedTasks[0]);
          }

          // 计算总 token
          const total = updatedTasks.reduce((sum, task) => sum + (task.totalTokens || 0), 0);
          setTotalTokens(total);
        }
      } catch (error) {
        console.error("加载 Claw 任务数据时出错:", error);
      }
    };

    loadAndScanTasks();
  }, []);

  // ── 监听 Sidebar 切换任务 ─────────────────────────────────────────
  useEffect(() => {
    const handleSessionChange = (e: Event) => {
      const taskId = (e as CustomEvent<string>).detail;
      const found = tasks.find((task) => task.id === taskId);
      if (found) {
        setActiveTask(found);
        saveActiveClawTaskId(taskId);
        setSessionTokens(found.totalTokens || 0);
      }
    };
    window.addEventListener("claw-session-change", handleSessionChange);
    return () => window.removeEventListener("claw-session-change", handleSessionChange);
  }, [tasks]);

  // ── 任务变化自动保存 ─────────────────────────────────────────────
  useEffect(() => {
    if (tasks.length > 0) {
      try {
        const saveTimer = setTimeout(() => {
          // 保存所有任务
          tasks.forEach((task) => saveClawTask(task));
          if (activeTask) {
            saveActiveClawTaskId(activeTask.id);
          }
        }, 1000);
        return () => clearTimeout(saveTimer);
      } catch (error) {
        console.error("自动保存任务时出错:", error);
      }
    }
  }, [tasks, activeTask]);

  // ── 拖拽处理 ─────────────────────────────────────────────────────
  const handleVerticalMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing("vertical");
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      if (isResizing === "left") {
        const newWidth = Math.max(180, Math.min(400, e.clientX));
        setConversationListWidth(newWidth);
      } else if (isResizing === "vertical") {
        const newHeight = Math.max(MIN_INPUT_HEIGHT, Math.min(MAX_INPUT_HEIGHT, window.innerHeight - e.clientY));
        setChatInputHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(null);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = isResizing === "vertical" ? "row-resize" : "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  // ── 创建新任务 ───────────────────────────────────────────────────
  const createNewTask = async () => {
    const now = new Date();
    const sessionDirName = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    
    // 创建会话目录
    let sessionPath = "";
    try {
      const result = await window.electron?.ipcRenderer?.invoke(
        "create-claw-session-dir",
        { taskId: `task-${Date.now()}`, sessionDirName },
        activeWorkspace?.path
      );
      if (result?.success) {
        sessionPath = result.path;
      }
    } catch (error) {
      console.error("创建会话目录失败:", error);
    }

    const newTask: ClawTask = {
      id: `task-${Date.now()}`,
      goal: t("clawAgent.newTaskTitle") || "新任务",
      status: "idle",
      steps: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sessionDirName,
      context: activeWorkspace?.path || "",
    };

    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    setActiveTask(newTask);
    setInput("");
    setSessionTokens(0);
    
    // 记录操作
    opLog.clawNew(newTask.goal);
    
    // 记录到历史
    window.electron?.ipcRenderer?.invoke("log-operation", {
      operation_type: "claw_new",
      operation_target: newTask.id,
      operation_status: "completed",
      permission_check: "allowed",
      details: `创建新 Claw 任务: ${newTask.goal}`
    });
  };

  // ── 删除任务 ─────────────────────────────────────────────────────
  const deleteTask = (taskId: string) => {
    if (!confirm(t("clawAgent.deleteConfirm") || "确定要删除这个任务吗？")) {
      return;
    }

    const taskToDelete = tasks.find(t => t.id === taskId);
    const updatedTasks = tasks.filter((task) => task.id !== taskId);
    setTasks(updatedTasks);

    // 从 localStorage 中删除任务
    deleteClawTask(taskId);

    if (activeTask?.id === taskId) {
      setActiveTask(updatedTasks[0] || null);
      saveActiveClawTaskId(updatedTasks[0]?.id || null);
    }

    // 更新总 token
    const total = updatedTasks.reduce((sum, task) => sum + (task.totalTokens || 0), 0);
    setTotalTokens(total);
    
    // 记录操作
    opLog.clawDelete(taskToDelete?.goal ?? taskId);
    
    // 记录到历史
    window.electron?.ipcRenderer?.invoke("log-operation", {
      operation_type: "claw_delete",
      operation_target: taskId,
      operation_status: "completed",
      permission_check: "allowed",
      details: `删除 Claw 任务: ${taskToDelete?.goal}`
    });
  };

  // ── 批量删除任务 ─────────────────────────────────────────────────
  const deleteSelectedTasks = (taskIds: string[]) => {
    const updatedTasks = tasks.filter((task) => !taskIds.includes(task.id));
    setTasks(updatedTasks);

    // 从 localStorage 中删除任务
    taskIds.forEach(taskId => deleteClawTask(taskId));

    if (activeTask && taskIds.includes(activeTask.id)) {
      setActiveTask(updatedTasks[0] || null);
      saveActiveClawTaskId(updatedTasks[0]?.id || null);
    }

    // 更新总 token
    const total = updatedTasks.reduce((sum, task) => sum + (task.totalTokens || 0), 0);
    setTotalTokens(total);

    // 记录操作
    opLog.clawDelete(`${taskIds.length} 个任务`);

    // 记录到历史
    window.electron?.ipcRenderer?.invoke("log-operation", {
      operation_type: "claw_delete_batch",
      operation_target: taskIds.join(", "),
      operation_status: "completed",
      permission_check: "allowed",
      details: `批量删除 ${taskIds.length} 个 Claw 任务`
    });
  };

  // ── 重新运行任务 ─────────────────────────────────────────────────
  const retryTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !activeModel) return;

    // 重置任务状态
    const resetTask: ClawTask = {
      ...task,
      status: "planning",
      steps: task.steps.map(step => ({
        ...step,
        status: "pending" as ClawStepStatus,
        output: undefined,
        error: undefined,
        startedAt: undefined,
        finishedAt: undefined,
        durationMs: undefined,
      })),
      finalOutput: undefined,
      error: undefined,
      updatedAt: new Date().toISOString(),
    };

    setActiveTask(resetTask);
    setTasks(tasks.map(t => t.id === taskId ? resetTask : t));
    setInput(task.goal);
    setIsLoading(true);
    setIsPaused(false);

    try {
      await executeTask(resetTask, task.goal);
    } catch (error) {
      console.error("重试任务失败:", error);
    }
  };

  // ── 暂停任务 ─────────────────────────────────────────────────────
  const pauseTask = useCallback(() => {
    if (activeTask && (activeTask.status === "running" || activeTask.status === "planning")) {
      const updatedTask: ClawTask = {
        ...activeTask,
        status: "paused",
        updatedAt: new Date().toISOString(),
      };
      setActiveTask(updatedTask);
      setTasks(tasks.map(t => t.id === activeTask.id ? updatedTask : t));
      setIsPaused(true);
      setIsLoading(false);
     
    }
  }, [activeTask, tasks]);

  // ── 继续任务 ─────────────────────────────────────────────────────
  const resumeTask = useCallback(async () => {
    if (!activeTask || !activeModel) return;
    if (activeTask.status !== "paused") return;

    const resumedTask: ClawTask = {
      ...activeTask,
      status: "running",
      updatedAt: new Date().toISOString(),
    };
    setActiveTask(resumedTask);
    setTasks(tasks.map(t => t.id === activeTask.id ? resumedTask : t));
    setIsPaused(false);
    setIsLoading(true);

    try {
      await executeTask(resumedTask, activeTask.goal);
    } catch (error) {
      console.error("继续任务失败:", error);
    }
  }, [activeTask, tasks, activeModel]);

  // ── 暂停指定任务 ─────────────────────────────────────────────────
  const pauseTaskById = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || (task.status !== "running" && task.status !== "planning")) return;

    const updatedTask: ClawTask = {
      ...task,
      status: "paused",
      updatedAt: new Date().toISOString(),
    };
    
    if (activeTask?.id === taskId) {
      setActiveTask(updatedTask);
      setIsPaused(true);
      setIsLoading(false);
    }
    setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
  
  }, [activeTask, tasks]);

  // ── 继续指定任务 ─────────────────────────────────────────────────
  const resumeTaskById = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !activeModel) return;
    if (task.status !== "paused") return;

    // 切换到该任务
    setActiveTask(task);
    setSessionTokens(task.totalTokens || 0);
    
    const resumedTask: ClawTask = {
      ...task,
      status: "running",
      updatedAt: new Date().toISOString(),
    };
    setTasks(tasks.map(t => t.id === taskId ? resumedTask : t));
    setIsPaused(false);
    setIsLoading(true);

    try {
      await executeTask(resumedTask, task.goal);
    } catch (error) {
      console.error("继续任务失败:", error);
    }
  }, [tasks, activeModel]);

  // ── 执行任务 ─────────────────────────────────────────────────────
  const executeTask = async (task: ClawTask, userInput: string, isMultiTurn = false) => {
    if (!activeModel || !userInput.trim()) return;

    const isDeepSeek = (activeModel as any).model_type === "deepseek";
    const isKimi = (activeModel as any).model_type === "kimi";

    // 获取当前任务（可能是更新后的版本）
    let currentTask = tasks.find(t => t.id === task.id) || task;
    
    // 构建消息历史
    const existingMessages = currentTask.messages || [];
    
    // 如果是多轮对话且有历史消息，加载历史
    let allMessages: { role: "system" | "user" | "assistant"; content: string }[] = [];
    
    if (isMultiTurn && existingMessages.length > 0) {
      // 多轮对话：使用之前的历史消息，加上当前输入
      allMessages = [
        ...existingMessages.map(m => ({ role: m.role as "system" | "user" | "assistant", content: m.content })),
        { role: "user", content: userInput }
      ];
    } else {
      // 首次对话：构建初始消息
      allMessages = [
        { role: "system", content: buildClawSystemPrompt(task.context, selectedSkills) },
        { role: "user", content: userInput }
      ];
    }

    // 更新任务状态
    if (!isMultiTurn) {
      currentTask = {
        ...currentTask,
        status: "planning",
        goal: userInput,
        updatedAt: new Date().toISOString(),
      };
      setActiveTask(currentTask);
      setTasks(tasks.map(t => t.id === task.id ? currentTask : t));
    } else {
      // 多轮对话：添加用户消息到历史
      const userMessage: ClawMessage = {
        id: `msg-${Date.now()}-user`,
        role: "user",
        content: userInput,
        createdAt: new Date().toISOString(),
      };
      currentTask = {
        ...currentTask,
        messages: [...(currentTask.messages || []), userMessage],
        updatedAt: new Date().toISOString(),
      };
      setActiveTask(currentTask);
      setTasks(tasks.map(t => t.id === task.id ? currentTask : t));
    }

    try {
      // 调用 AI 生成计划（使用完整消息历史）
      const response = await window.electron?.ipcRenderer?.invoke(
        "call-model",
        activeModel.id,
        allMessages,
        { 
          stream: false,
          skills: selectedSkills.length > 0 ? selectedSkills.map(s => ({
            id: s.id,
            name: s.name,
            content: s.content
          })) : undefined
        }
      );

      // 解析 AI 响应为步骤
      const steps = parseStepsFromResponse(response.content || "");
      
      // 创建步骤
      const taskSteps: ClawStep[] = steps.map((step, index) => ({
        id: `step-${Date.now()}-${index}`,
        index,
        type: step.type,
        title: step.title,
        description: step.description,
        status: "pending" as ClawStepStatus,
      }));

      currentTask = {
        ...currentTask,
        status: "running",
        steps: taskSteps,
        modelId: activeModel.id,
        modelName: activeModel.name,
        updatedAt: new Date().toISOString(),
      };
      setActiveTask(currentTask);
      setTasks(tasks.map(t => t.id === task.id ? currentTask : t));

      // 执行每个步骤
      let taskTokens = 0;
      // 文件列表
      let taskFiles: ClawFile[] = currentTask.files || [];
      
      // 文件创建回调
      const handleFileCreated = (file: ClawFile) => {
        taskFiles = [...taskFiles, file];
        currentTask = {
          ...currentTask,
          files: taskFiles,
        };
        setActiveTask({ ...currentTask });
        setTasks(tasks.map(t => t.id === task.id ? currentTask : t));
        
        // 记录文件创建操作
        opLog.clawFileCreate(currentTask.goal, file.name, file.path);
      };
      
      for (let i = 0; i < taskSteps.length; i++) {
        const step = taskSteps[i];
        
        // 记录步骤开始
        opLog.clawStepStart(currentTask.goal, step.title);
        
        // 更新当前步骤为运行中
        currentTask = {
          ...currentTask,
          steps: currentTask.steps.map((s, idx) => 
            idx === i ? { ...s, status: "running" as ClawStepStatus, startedAt: new Date().toISOString() } : s
          ),
        };
        setActiveTask({ ...currentTask });
        setTasks(tasks.map(t => t.id === task.id ? currentTask : t));

        // 执行步骤
        const stepResult = await executeStep(step, currentTask, userInput, handleFileCreated);
        
        // 更新步骤结果
        currentTask = {
          ...currentTask,
          steps: currentTask.steps.map((s, idx) => 
            idx === i ? stepResult : s
          ),
        };
        setActiveTask({ ...currentTask });
        setTasks(tasks.map(t => t.id === task.id ? currentTask : t));

        // 记录步骤完成
        if (stepResult.status === "done") {
          opLog.clawStepComplete(currentTask.goal, step.title);
        } else if (stepResult.status === "failed") {
          opLog.clawStepFailed(currentTask.goal, step.title);
        }

        // 累加 token
        taskTokens += stepResult.tokens || 0;
      }

      // 获取AI响应内容
      const aiResponseContent = response?.content || generateFinalOutput(taskSteps);
      
      // 添加AI响应到对话历史
      const assistantMessage: ClawMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: "assistant",
        content: aiResponseContent,
        createdAt: new Date().toISOString(),
        tokens: taskTokens,
      };
      
      // 保存完整的对话历史
      // 首次对话时添加system消息，后续对话直接在现有消息后添加user+assistant
      const newMessages: ClawMessage[] = isMultiTurn 
        ? [
            { id: `msg-${Date.now()}-user`, role: "user", content: userInput, createdAt: new Date().toISOString() },
            assistantMessage,
          ]
        : [
            { id: `msg-${Date.now()}-system`, role: "system", content: buildClawSystemPrompt(task.context, selectedSkills), createdAt: new Date().toISOString() },
            { id: `msg-${Date.now()}-user`, role: "user", content: userInput, createdAt: new Date().toISOString() },
            assistantMessage,
          ];
      
      const updatedMessages = [...(currentTask.messages || []), ...newMessages];

      // 任务完成
      currentTask = {
        ...currentTask,
        status: "done",
        finalOutput: aiResponseContent,
        totalTokens: (currentTask.totalTokens || 0) + taskTokens,
        messages: updatedMessages,
        finishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setActiveTask(currentTask);
      setTasks(tasks.map(t => t.id === task.id ? currentTask : t));
      setSessionTokens(taskTokens);
      setTotalTokens(prev => prev + taskTokens);

      // 保存会话内容到 .md 文件（用于长记忆）
      saveSessionToMd(currentTask);

      // 记录任务完成
      opLog.clawRun(currentTask.goal, "success");

      // 记录 token 消耗
      if (taskTokens > 0) {
        logTokenUsage({
          modelName: activeModel.name,
          promptTokens: Math.floor(taskTokens * 0.5),
          completionTokens: Math.floor(taskTokens * 0.5),
          totalTokens: taskTokens,
          conversationId: task.id
        });
      }

      // 记录到历史
      window.electron?.ipcRenderer?.invoke("log-operation", {
        operation_type: "claw_complete",
        operation_target: task.id,
        operation_status: "completed",
        permission_check: "allowed",
        details: `Claw 任务完成: ${task.goal}，消耗 ${taskTokens} tokens`
      });

    } catch (error) {
      console.error("执行任务失败:", error);
      
      currentTask = {
        ...currentTask,
        status: "failed",
        error: error instanceof Error ? error.message : "未知错误",
        updatedAt: new Date().toISOString(),
      };
      setActiveTask(currentTask);
      setTasks(tasks.map(t => t.id === task.id ? currentTask : t));

      // 保存会话内容到 .md 文件（用于长记忆）
      saveSessionToMd(currentTask);

      // 记录错误到历史
      window.electron?.ipcRenderer?.invoke("log-operation", {
        operation_type: "claw_complete",
        operation_target: task.id,
        operation_status: "failed",
        permission_check: "allowed",
        details: `Claw 任务失败: ${task.goal}，错误: ${error instanceof Error ? error.message : "未知错误"}`
      });
    }

    setIsLoading(false);
  };

  // ── 执行单个步骤 ─────────────────────────────────────────────────
  const executeStep = async (
    step: ClawStep, 
    task: ClawTask, 
    originalGoal: string,
    onFileCreated?: (file: ClawFile) => void
  ): Promise<ClawStep> => {
    const stepStartTime = Date.now();
    let stepTokens = 0;

    try {
      // 根据步骤类型执行不同的操作
      let output = "";
      
      switch (step.type) {
        case "think":
          // 思考步骤：调用 AI 分析
          output = await callAIForStep(task, step, "分析");
          break;
          
        case "search":
          // 搜索步骤：搜索网页
          output = await performWebSearch(step.description);
          break;
          
        case "file":
          // 文件操作步骤
          output = await handleFileOperation(task, step, onFileCreated);
          break;
          
        case "code":
          // 代码执行步骤
          output = await handleCodeExecution(task, step);
          break;
          
        case "write":
          // 写作步骤
          output = await callAIForStep(task, step, "生成内容");
          break;
          
        case "summarize":
          // 总结步骤
          output = await callAIForStep(task, step, "总结");
          break;
          
        default:
          output = await callAIForStep(task, step, "处理");
      }

      // 记录操作
      window.electron?.ipcRenderer?.invoke("log-operation", {
        operation_type: "claw_step",
        operation_target: step.id,
        operation_status: "completed",
        permission_check: "allowed",
        details: `Claw 步骤完成: ${step.title}`
      });

      return {
        ...step,
        status: "done",
        output,
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - stepStartTime,
        tokens: stepTokens,
      };
    } catch (error) {
      // 记录错误
      window.electron?.ipcRenderer?.invoke("log-operation", {
        operation_type: "claw_step",
        operation_target: step.id,
        operation_status: "failed",
        permission_check: "allowed",
        details: `Claw 步骤失败: ${step.title}，错误: ${error instanceof Error ? error.message : "未知错误"}`
      });

      return {
        ...step,
        status: "failed",
        error: error instanceof Error ? error.message : "未知错误",
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - stepStartTime,
      };
    }
  };

  // ── 构建 Claw 系统提示词 ────────────────────────────────────────
  const buildClawSystemPrompt = (context?: string, skills?: Skill[]): string => {
    let prompt = `你是一个自主 Agent 助手，名为 Claw，能够帮助用户完成复杂任务。

## 核心能力
1. **文件操作**：读取、创建、修改文件和目录
2. **命令执行**：在终端执行系统命令
3. **网页搜索**：搜索互联网获取信息
4. **代码生成**：生成和执行代码
5. **内容创作**：生成文章、文档等内容

## 工作方式
1. 理解用户需求
2. 将复杂任务拆解为多个步骤
3. 按步骤依次执行
4. 每个步骤完成后汇报结果
5. 最终汇总完成情况

## 输出格式要求
你必须按照以下 JSON 格式输出任务计划（只需输出 JSON，不要其他内容）：

\`\`\`json
{
  "steps": [
    {
      "type": "think|search|file|code|write|summarize",
      "title": "步骤标题",
      "description": "步骤详细描述"
    }
  ]
}
\`\`\`

## 注意事项
- 每个步骤必须是可执行的
- 步骤顺序要合理
- 描述要清晰明确
`;

    if (context) {
      prompt += `\n\n## 当前工作目录\n${context}\n`;
    }

    if (skills && skills.length > 0) {
      prompt += `\n\n## 可用技能\n${skills.map(s => `- ${s.name}: ${s.description}`).join('\n')}\n`;
    }

    return prompt;
  };

  // ── 解析 AI 响应为步骤 ─────────────────────────────────────────
  const parseStepsFromResponse = (content: string): Array<{type: ClawStep['type']; title: string; description: string}> => {
    try {
      // 尝试提取 JSON
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        if (parsed.steps && Array.isArray(parsed.steps)) {
          return parsed.steps.map((s: any) => ({
            type: s.type || "think",
            title: s.title || "未命名步骤",
            description: s.description || "",
          }));
        }
      }
    } catch (error) {
      console.warn("解析步骤失败，使用默认步骤:", error);
    }

    // 默认步骤
    return [
      { type: "think" as const, title: "分析需求", description: "理解用户任务并制定执行计划" },
      { type: "search" as const, title: "收集信息", description: "搜索相关资料和信息" },
      { type: "write" as const, title: "执行任务", description: "根据计划执行任务并输出结果" },
    ];
  };

  // ── 调用 AI 处理步骤 ────────────────────────────────────────────
  const callAIForStep = async (
    task: ClawTask, 
    step: ClawStep, 
    action: string
  ): Promise<string> => {
    if (!activeModel) throw new Error("未选择模型");

    const messages = [
      { 
        role: "system" as const, 
        content: `你正在执行任务 "${task.goal}" 的步骤 "${step.title}"。\n\n步骤描述: ${step.description}\n\n请 ${action}并输出结果。` 
      },
      { role: "user" as const, content: `请执行步骤: ${step.title}` }
    ];

    const response = await window.electron?.ipcRenderer?.invoke(
      "call-model",
      activeModel.id,
      messages,
      { stream: false }
    );

    return response?.content || "";
  };

  // ── 执行网页搜索 ─────────────────────────────────────────────────
  const performWebSearch = async (query: string): Promise<string> => {
    // 这里可以调用搜索引擎 API
    // 目前使用模拟实现
    return `搜索结果 for: ${query}\n\n(网页搜索功能需要配置搜索引擎 API)`;
  };

  // ── 处理文件操作 ───────────────────────────────────────────────
  const handleFileOperation = async (
    task: ClawTask, 
    step: ClawStep,
    onFileCreated?: (file: ClawFile) => void
  ): Promise<string> => {
    // 解析文件操作指令
    const action = step.description.toLowerCase();
    
    if (action.includes("创建") || action.includes("write") || action.includes("生成")) {
      // 创建文件
      const fileMatch = step.description.match(/文件[:：]\s*(.+?)(?:\s|$)/) || step.description.match(/file[:：]\s*(.+?)(?:\s|$)/);
      const contentMatch = step.description.match(/内容[:：]\s*(.+)/);
      if (fileMatch) {
        const filePath = fileMatch[1].trim();
        const content = contentMatch ? contentMatch[1] : "// 文件内容";
        
        const result = await window.electron?.ipcRenderer?.invoke(
          "claw-write-file",
          `${task.sessionDirName || 'claw-workspace'}/${filePath}`,
          content
        );
        
        if (result?.success) {
          // 记录创建的文件信息
          const newFile: ClawFile = {
            id: `file-${Date.now()}`,
            name: filePath.split('/').pop() || filePath,
            path: result.path,
            type: filePath.split('.').pop() || 'txt',
            size: content.length,
            createdAt: new Date().toISOString(),
          };
          
          // 回调通知文件创建
          if (onFileCreated) {
            onFileCreated(newFile);
          }
          
          // 记录文件创建成功
          opLog.clawFileCreate(task.goal, newFile.name, newFile.path);
          
          return `文件创建成功: ${result.path}`;
        } else {
          // 记录文件创建失败
          opLog.clawFileError(task.goal, filePath, result?.error || "未知错误");
          return `文件创建失败: ${result?.error}`;
        }
      }
    } else if (action.includes("读取") || action.includes("read")) {
      // 读取文件
      const fileMatch = step.description.match(/文件[:：]\s*(.+)/) || step.description.match(/file[:：]\s*(.+)/);
      if (fileMatch) {
        const filePath = fileMatch[1].trim();
        const result = await window.electron?.ipcRenderer?.invoke(
          "claw-read-file",
          filePath
        );
        
        if (result?.success) {
          // 设置文件预览
          setPreviewFile({ path: result.path, content: result.content || "" });
          return `文件读取成功: ${result.path}\n\n${result.content?.substring(0, 500)}...`;
        } else {
          return `文件读取失败: ${result?.error}`;
        }
      }
    }
    
    return "文件操作指令解析失败";
  };

  // ── 处理代码执行 ─────────────────────────────────────────────────
  const handleCodeExecution = async (task: ClawTask, step: ClawStep): Promise<string> => {
    const commandMatch = step.description.match(/命令[:：]\s*(.+)/) || step.description.match(/command[:：]\s*(.+)/);
    if (commandMatch) {
      const command = commandMatch[1].trim();
      const cwd = task.sessionDirName || activeWorkspace?.path;
      
      // 记录命令执行
      opLog.clawCommandExec(task.goal, command);
      
      const result = await window.electron?.ipcRenderer?.invoke(
        "claw-exec-command",
        command,
        cwd,
        60000
      );
      
      if (result?.success) {
        return `命令执行成功:\n${result.stdout}`;
      } else {
        return `命令执行失败:\n${result?.stderr || result?.error}`;
      }
    }
    
    return "命令解析失败";
  };

  // ── 生成最终输出 ─────────────────────────────────────────────────
  const generateFinalOutput = (steps: ClawStep[]): string => {
    const completed = steps.filter(s => s.status === "done").length;
    const failed = steps.filter(s => s.status === "failed").length;
    
    return `任务完成！\n\n总计 ${steps.length} 个步骤\n- 完成: ${completed}\n- 失败: ${failed}`;
  };

  // ── 发送消息 ─────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || !activeTask || !activeModel) return;

    const userInput = input;
    setInput("");
    setIsLoading(true);

    try {
      // 判断是否是多轮对话：如果任务已有对话历史，则是多轮对话
      const isMultiTurn = activeTask.messages && activeTask.messages.length > 0;
      await executeTask(activeTask, userInput, isMultiTurn);
    } catch (error) {
      console.error("发送消息失败:", error);
    }

    setIsLoading(false);
  };

  // ── 键盘事件 ─────────────────────────────────────────────────────
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── 打开文件 ─────────────────────────────────────────────────────
  const handleOpenFile = async (filePath: string) => {
    const result = await window.electron?.ipcRenderer?.invoke(
      "claw-read-file",
      filePath
    );
    
    if (result?.success) {
      setPreviewFile({ path: result.path, content: result.content || "" });
    }
  };

  // ── 工作区选择 ─────────────────────────────────────────────────────
  const handleWorkspaceSelect = (workspaceId: number) => {
    console.log("工作区切换:", workspaceId);
    // 工作区切换后，可以在这里添加相关逻辑
  };

  const handleAddWorkspace = async () => {
    try {
      const success = await selectWorkspace();
      if (success) {
        window.electron?.ipcRenderer?.invoke("log-operation", {
          operation_type: "workspace_add",
          operation_target: "新工作区",
          operation_status: "completed",
          permission_check: "allowed",
          details: "添加新工作区"
        });
      }
    } catch (error) {
      console.error("添加工作区失败:", error);
    }
  };

  // ── 打开目录 ─────────────────────────────────────────────────────
  const handleOpenFolder = async () => {
    if (activeTask?.sessionDirName) {
      await window.electron?.ipcRenderer?.invoke(
        "open-folder",
        activeTask.sessionDirName
      );
    }
  };

  // 保存会话内容到 .md 文件（用于长记忆）
  const saveSessionToMd = async (task: ClawTask) => {
    if (!task.sessionDirName) return;

    let md = `# ${task.goal}\n\n`;
    md += `**状态**: ${task.status}\n`;
    md += `**模型**: ${task.modelName || "未知"}\n`;
    md += `**创建时间**: ${new Date(task.createdAt).toLocaleString()}\n\n`;

    if (task.totalTokens) {
      md += `**消耗 Tokens**: ${task.totalTokens.toLocaleString()}\n\n`;
    }

    // 保存对话历史
    if (task.messages && task.messages.length > 0) {
      md += `---\n\n## 对话历史\n\n`;
      task.messages.forEach((msg, index) => {
        const roleLabel = msg.role === "user" ? "用户" : msg.role === "assistant" ? "助手" : "系统";
        md += `### ${index + 1}. ${roleLabel}\n\n`;
        md += `${msg.content}\n\n`;
      });
    }

    md += `---\n\n## 步骤\n\n`;

    task.steps.forEach((step, index) => {
      md += `### ${index + 1}. ${step.title}\n\n`;
      md += `- **类型**: ${step.type}\n`;
      md += `- **状态**: ${step.status}\n`;
      if (step.description) md += `- **描述**: ${step.description}\n`;
      if (step.durationMs) md += `- **耗时**: ${step.durationMs}ms\n`;
      if (step.tokens) md += `- **Tokens**: ${step.tokens}\n`;
      md += `\n`;

      if (step.output) {
        md += `**输出**:\n\n${step.output}\n\n`;
      }
      if (step.error) {
        md += `**错误**:\n\n${step.error}\n\n`;
      }
    });

    if (task.finalOutput) {
      md += `---\n\n## 最终结果\n\n${task.finalOutput}\n`;
    }

    try {
      await window.electron?.ipcRenderer?.invoke(
        "save-claw-session-md",
        {
          sessionDirName: task.sessionDirName,
          content: md,
          workspacePath: activeWorkspace?.path
        }
      );
      console.log("会话内容已保存到 session.md");
    } catch (error) {
      console.error("保存会话内容失败:", error);
    }
  };

  // 导出对话为 Markdown
  const handleExportMarkdown = () => {
    if (!activeTask) return;

    let md = `# ${activeTask.goal}\n\n`;
    md += `**状态**: ${activeTask.status}\n`;
    md += `**模型**: ${activeTask.modelName || "未知"}\n`;
    md += `**创建时间**: ${new Date(activeTask.createdAt).toLocaleString()}\n\n`;
    
    if (activeTask.totalTokens) {
      md += `**消耗 Tokens**: ${activeTask.totalTokens.toLocaleString()}\n\n`;
    }

    md += `---\n\n## 步骤\n\n`;

    activeTask.steps.forEach((step, index) => {
      md += `### ${index + 1}. ${step.title}\n\n`;
      md += `- **类型**: ${step.type}\n`;
      md += `- **状态**: ${step.status}\n`;
      if (step.description) md += `- **描述**: ${step.description}\n`;
      if (step.durationMs) md += `- **耗时**: ${step.durationMs}ms\n`;
      if (step.tokens) md += `- **Tokens**: ${step.tokens}\n`;
      md += `\n`;
      
      if (step.output) {
        md += `**输出**:\n\n${step.output}\n\n`;
      }
      if (step.error) {
        md += `**错误**:\n\n${step.error}\n\n`;
      }
    });

    if (activeTask.finalOutput) {
      md += `---\n\n## 最终结果\n\n${activeTask.finalOutput}\n`;
    }

    // 下载文件
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `claw-${activeTask.id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 选择任务
  const handleSelectTask = async (task: ClawTask) => {
    setActiveTask(task);
    saveActiveClawTaskId(task.id);
    setSessionTokens(task.totalTokens || 0);

    // 如果任务有 sessionDirName，加载之前保存的会话内容
    if (task.sessionDirName) {
      try {
        const result = await window.electron?.ipcRenderer?.invoke(
          "load-claw-session-md",
          { 
            sessionDirName: task.sessionDirName,
            workspacePath: activeWorkspace?.path
          }
        );
        if (result?.success && result.content) {
          // 解析保存的内容，恢复对话历史
          console.log("加载了会话历史内容");
        }
      } catch (error) {
        console.error("加载会话内容失败:", error);
      }
    }
  };

  // 切换任务列表
  const toggleTaskList = () => {
    setIsConversationListCollapsed(!isConversationListCollapsed);
  };

  return (
    <div className="flex h-full overflow-hidden relative">
      {/* 左侧任务列表 - 侧滑弹框 */}
      <div 
        className={`fixed top-12 inset-y-0 left-0 z-30 transform transition-transform duration-200 ease-out ${
          isConversationListCollapsed ? "-translate-x-full" : "translate-x-0"
        }`}
        style={{ width: conversationListWidth }}
      >
        <div className="h-full shadow-2xl bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
          <ClawAgentConversationList
            tasks={tasks}
            activeTask={activeTask}
            isCollapsed={isConversationListCollapsed}
            onNewTask={createNewTask}
            onToggleCollapse={toggleTaskList}
            onSelectTask={handleSelectTask}
            onDeleteTask={deleteTask}
            onDeleteSelectedTasks={deleteSelectedTasks}
            onRetryTask={retryTask}
            onPauseTask={pauseTaskById}
            onResumeTask={resumeTaskById}
          />
        </div>
      </div>
      
      {/* 遮罩层 - 点击关闭 */}
      {!isConversationListCollapsed && (
        <div 
          className="fixed inset-0 z-20"
          onClick={toggleTaskList}
        />
      )}

      {/* 中间主区域 */}
      <div className="flex-1 flex flex-col overflow-hidden h-full min-w-0">
        {/* 头部 */}
        <ClawAgentHeader
          activeTask={activeTask}
          activeWorkspace={activeWorkspace}
          onOpenFolder={handleOpenFolder}
          onRetry={() => activeTask && retryTask(activeTask.id)}
          onPause={pauseTask}
          onResume={resumeTask}
          onExportMd={handleExportMarkdown}
          onToggleTaskList={toggleTaskList}
          isTaskListOpen={!isConversationListCollapsed}
          onSelectWorkspace={handleWorkspaceSelect}
          onAddWorkspace={handleAddWorkspace}
        />

        {/* 步骤列表 */}
        <div className="flex-1 overflow-y-auto">
          <ClawAgentSteps
            activeTask={activeTask}
            isLoading={isLoading}
          />
        </div>

       
        {/* 任务/文件面板 */}
        <TaskFilePanel
          allTasks={tasks}
          activeTask={activeTask}
          onSelectTask={(task: ClawTask) => {
            setActiveTask(task);
            saveActiveClawTaskId(task.id);
            setSessionTokens(task.totalTokens || 0);
          }}
          onOpenFile={handleOpenFile}
        />

        {/* 拖拽条 */}
        <div
          onMouseDown={handleVerticalMouseDown}
          onDoubleClick={() => setChatInputHeight(160)}
          title="拖拽调整输入框高度，双击重置"
          className="h-px bg-gray-200 dark:bg-gray-700 hover:bg-blue-400 dark:hover:bg-blue-500 cursor-row-resize transition-all duration-150 flex-shrink-0"
          style={{ cursor: 'row-resize' }}
        />

        {/* 输入框 */}
        <div style={{ minHeight: chatInputHeight }} className="flex-shrink-0">
          <ClawAgentInput
            input={input}
            activeTask={activeTask}
            activeModel={activeModel}
            isLoading={isLoading}
            models={models}
            selectedSkills={selectedSkills}
            inputHeight={chatInputHeight}
            isPlanMode={isPlanMode}
            onInputChange={setInput}
            onSendMessage={sendMessage}
            onKeyPress={handleKeyPress}
            onSelectModel={(modelId: number) => {
              const model = models.find(m => m.id === modelId);
              if (model) setActiveModel(model);
            }}
            onSelectSkills={setSelectedSkills}
            onNavigateToSkills={() => navigate('/skills')}
            onNavigateToModels={() => navigate('/models')}
            onNewTask={createNewTask}
            onTogglePlanMode={() => setIsPlanMode(!isPlanMode)}
          />
        </div>
      </div>

      {/* 文件预览模态框 */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
};

export default ClawAgent;
