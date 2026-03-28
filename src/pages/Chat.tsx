import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useModel } from "../contexts/ModelContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useSettings } from "../contexts/SettingsContext";
import {
  Conversation,
  Message,
} from "../types";
import {
  loadConversations,
  saveConversations,
  loadActiveConversationId,
  saveActiveConversationId,
  AutoSaver
} from "../utils/storage";
import { opLog } from "../utils/operationLogger";
import { logTokenUsage } from "../utils/tokenLogger";
import { Skill } from "../types";

// 导入新组件
import ConversationList from "../components/chat/ConversationList";
import ChatHeader from "../components/chat/ChatHeader";
import MessageList from "../components/chat/MessageList";
import ChatInput, { AttachedFile } from "../components/chat/ChatInput";

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const { models, activeModel, setActiveModel } = useModel();
  const { activeWorkspace, selectWorkspace } = useWorkspace();
  const { t } = useSettings();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConversationListCollapsed, setIsConversationListCollapsed] =
    useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterByModel, setFilterByModel] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [autoSaver] = useState(() => new AutoSaver());

  // ── 面板宽度状态 ─────────────────────────────────────────────────────────
  const [conversationListWidth, setConversationListWidth] = useState(260);
  const [isResizing, setIsResizing] = useState<string | null>(null);

  // ── 对话区域高度状态 ─────────────────────────────────────────────────────────
  const [chatInputHeight, setChatInputHeight] = useState(160); // 输入框高度
  const MIN_INPUT_HEIGHT = 100;
  const MAX_INPUT_HEIGHT = 400;

  // 垂直拖拽处理（调整输入框高度）
  const handleVerticalMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing("vertical");
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      if (isResizing === "left") {
        // 调整对话列表宽度
        const newWidth = Math.max(180, Math.min(400, e.clientX));
        setConversationListWidth(newWidth);
      } else if (isResizing === "vertical") {
        // 调整输入框高度（从窗口底部计算）
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

  // ── Skill 状态 ─────────────────────────────────────────────────────────
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);

  // 加载存储的对话数据
  useEffect(() => {
    try {
      const savedConversations = loadConversations();
      const savedActiveId = loadActiveConversationId();

      console.log(`从本地存储加载了 ${savedConversations.length} 个对话`);

      if (savedConversations.length > 0) {
        setConversations(savedConversations);

        // 恢复活跃对话
        if (savedActiveId) {
          const foundConversation = savedConversations.find(
            (conv) => conv.id === savedActiveId
          );
          if (foundConversation) {
            setActiveConversation(foundConversation);
          } else if (savedConversations.length > 0) {
            setActiveConversation(savedConversations[0]);
          }
        } else if (savedConversations.length > 0) {
          setActiveConversation(savedConversations[0]);
        }
      } else {
        // 如果没有存储的数据，创建一个欢迎对话
        const welcomeConversation: Conversation = {
          id: "welcome-" + Date.now(),
          title: t("chat.welcomeTitle"),
          createdAt: new Date(),
          lastMessageAt: new Date(),
          messages: [
            {
              id: "welcome-msg-" + Date.now(),
              role: "assistant",
              content: t("chat.welcomeContent"),
              timestamp: new Date(),
              model: "WeClaw",
              metadata: {
                model: "Welcome Bot",
                finish_reason: "completed"
              }
            }
          ],
          modelName: t("chat.welcomeModelName"),
          workspaceId: activeWorkspace?.id
        };

        setConversations([welcomeConversation]);
        setActiveConversation(welcomeConversation);
      }
    } catch (error) {
      console.error("加载对话数据时出错:", error);
      // 出错时创建一个空对话
      const errorConversation: Conversation = {
        id: "error-recovery-" + Date.now(),
        title: t("chat.recoveryTitle"),
        createdAt: new Date(),
        lastMessageAt: new Date(),
        messages: [
          {
            id: "error-msg-" + Date.now(),
            role: "system",
            content: t("chat.recoveryContent"),
            timestamp: new Date(),
            model: "System",
            metadata: {
              model: "System Recovery",
              finish_reason: "error"
            }
          }
        ],
        modelName: t("chat.recoveryModelName"),
        workspaceId: activeWorkspace?.id
      };

      setConversations([errorConversation]);
      setActiveConversation(errorConversation);
    }
  }, []);

  // 监听 Sidebar 切换会话
  useEffect(() => {
    const handleSessionChange = (e: Event) => {
      const sessionId = (e as CustomEvent<string>).detail;
      const found = conversations.find(c => c.id === sessionId);
      if (found) {
        setActiveConversation(found);
        saveActiveConversationId(sessionId);
      }
    };
    window.addEventListener("chat-session-change", handleSessionChange);
    return () => window.removeEventListener("chat-session-change", handleSessionChange);
  }, [conversations]);

  // 监听对话变化并自动保存
  useEffect(() => {
    if (conversations.length > 0) {
      try {
        // 使用防抖保存
        const saveTimer = setTimeout(() => {
          saveConversations(conversations);

          // 保存活跃对话ID
          if (activeConversation) {
            saveActiveConversationId(activeConversation.id);
          }

          console.log(`自动保存了 ${conversations.length} 个对话`);
        }, 1000); // 1秒延迟保存，防止频繁IO

        return () => clearTimeout(saveTimer);
      } catch (error) {
        console.error("自动保存对话时出错:", error);
      }
    }
  }, [conversations, activeConversation]);

  // 组件卸载时执行最后的保存
  useEffect(() => {
    return () => {
      try {
        autoSaver.flushSaveQueue();
      } catch (error) {
        console.error("组件卸载时保存数据出错:", error);
      }
    };
  }, [autoSaver]);

  // 滚动到底部：消息列表变化或加载状态变化时触发
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages, isLoading]);

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: t("chat.newConvTitle"),
      createdAt: new Date(),
      lastMessageAt: new Date(),
      modelName: activeModel?.name || t("chat.unknownModel"),
      modelId: activeModel?.id,
      workspaceId: activeWorkspace?.id,
      messages: []
    };

    const updatedConversations = [newConversation, ...conversations];
    setConversations(updatedConversations);
    setActiveConversation(newConversation);
    setInput("");

    // 立即保存新对话
    autoSaver.queueSave(newConversation);
    opLog.chatNew(newConversation.title);
  };

  const handleModelChange = async (modelId: number) => {
    const selectedModel = models.find((m) => m.id === modelId);
    if (selectedModel) {
      setActiveModel(selectedModel);

      // 如果当前有活跃对话，更新对话的模型信息
      if (activeConversation) {
        const updatedConversation = {
          ...activeConversation,
          modelName: selectedModel.name
        };
        setActiveConversation(updatedConversation);
        setConversations(
          conversations.map((c) =>
            c.id === activeConversation.id ? updatedConversation : c
          )
        );
      }

      // 记录模型切换
      window.electron?.ipcRenderer?.invoke("log-operation", {
        operation_type: "model_switch",
        operation_target: selectedModel.name,
        operation_status: "completed",
        permission_check: "allowed",
        details: `切换到模型: ${selectedModel.name}`
      });
    }
  };

  const handleWorkspaceSelect = (workspaceId: number) => {
    console.log("工作区切换:", workspaceId);
    // 这里可以添加工作区切换后的逻辑，比如重新加载对话等
  };

  const handleAddWorkspace = async () => {
    try {
      const success = await selectWorkspace();
      if (success) {
        // 记录操作
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

  const deleteConversation = (conversationId: string) => {
    if (confirm(t("chat.deleteConfirm"))) {
      const updatedConversations = conversations.filter(
        (c) => c.id !== conversationId
      );
      setConversations(updatedConversations);

      if (activeConversation?.id === conversationId) {
        setActiveConversation(updatedConversations[0] || null);
        // 删除活跃对话的存储记录
        if (activeConversation.id === conversationId) {
          saveActiveConversationId(updatedConversations[0]?.id || null);
        }
      }

      // 通知用户对话已删除并从存储中移除
      console.log(`对话 ${conversationId} 已删除`);
      opLog.chatDelete(activeConversation?.title ?? conversationId);

      // 触发自动保存
      saveConversations(updatedConversations);
    }
  };

  // 批量删除对话
  const deleteSelectedConversations = (conversationIds: string[]) => {
    const updatedConversations = conversations.filter(
      (c) => !conversationIds.includes(c.id)
    );
    setConversations(updatedConversations);

    if (activeConversation && conversationIds.includes(activeConversation.id)) {
      setActiveConversation(updatedConversations[0] || null);
      saveActiveConversationId(updatedConversations[0]?.id || null);
    }

    console.log(`批量删除了 ${conversationIds.length} 个对话`);
    opLog.chatDelete(`${conversationIds.length} 个对话`);

    // 触发自动保存
    saveConversations(updatedConversations);
  };

  // ─── Token 估算 & 上下文窗口管理 ────────────────────────────────────────────

  /**
   * 估算消息内容的 token 数
   * - 普通文本：按字符数 / 4（对中英文均较准确）
   * - 含 base64 图片：base64 部分按 3/4 估算
   */
  const estimateTokens = (content: string): number => {
    // 提取所有 base64 数据（Markdown 语法中的 dataUrl）
    const base64Matches = content.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/g) || [];
    let textContent = content;
    let base64Tokens = 0;
    for (const match of base64Matches) {
      const b64 = match.split(",")[1] || "";
      // base64 每个字符 ≈ 0.75 token（4 chars → 3 bytes）
      base64Tokens += Math.ceil(b64.length * 0.75);
      textContent = textContent.replace(match, "");
    }
    // 纯文本 token 估算（中英文均约 1 token / 4 字符）
    const textTokens = Math.ceil(textContent.length / 4);
    return textTokens + base64Tokens;
  };

  /**
   * 估算完整消息列表的总 token 数（overhead 约 4 tokens/message）
   */
  const estimateMessagesTokens = (messages: any[]): number => {
    return messages.reduce((sum, msg) => {
      if (typeof msg.content === "string") {
        return sum + estimateTokens(msg.content) + 4;
      }
      // 多部分 content 数组
      const partTokens = (msg.content as any[]).reduce((s: number, p: any) => {
        if (p.type === "text") return s + estimateTokens(p.text) + 4;
        if (p.type === "image_url") {
          const url = p.image_url?.url || "";
          return s + estimateTokens(url) + 4;
        }
        return s;
      }, 0);
      return sum + partTokens + 4;
    }, 0);
  };

  /**
   * 将消息历史裁剪到 context window 内（默认 128K tokens）
   * 从最旧的消息开始丢弃，保留最近的对话上下文
   */
  const trimMessagesForContextWindow = (
    messages: any[],
    maxTokens: number,
    maxOutputTokens: number = 2000
  ): any[] => {
    const availableTokens = maxTokens - maxOutputTokens - 50; // 留 50 buffer
    const currentTokens = estimateMessagesTokens(messages);

    if (currentTokens <= availableTokens) return messages;

    let result = [...messages];
    // 至少保留最后一对 user+assistant（或至少最后一条 user 消息）
    const minKeep = Math.min(2, result.length);

    while (result.length > minKeep && estimateMessagesTokens(result) > availableTokens) {
      // 跳过系统消息（如果有），从用户消息开始删
      const firstNonSystem = result.findIndex((m) => m.role !== "system");
      if (firstNonSystem >= 0 && firstNonSystem < result.length) {
        result.splice(firstNonSystem, 1);
      } else {
        result.shift();
      }
    }
    return result;
  };

  /**
   * 检测消息内容是否含图片（base64 data URL）
   */
  const hasImageAttachment = (content: string): boolean => {
    return /data:image\/[^;]+;base64,/i.test(content);
  };

  /**
   * 上传附件到 DeepSeek 官方文件接口，获取 file_id
   * 上传后自动将 data URL 替换为 file_id 引用
   */
  const uploadDeepSeekAttachments = async (
    attachments: AttachedFile[],
    modelId: number
  ): Promise<AttachedFile[]> => {
    const uploaded: AttachedFile[] = [];
    for (const att of attachments) {
      const result = await window.electron?.ipcRenderer?.invoke(
        "deepseek-upload-file",
        modelId,
        att.dataUrl,
        att.name,
        att.isImage ? "image" : "file"
      );
      uploaded.push({ ...att, fileId: result.fileId });
      console.log(`[DeepSeek] 文件上传成功: ${att.name} → ${result.fileId}`);
    }
    return uploaded;
  };

  /**
   * 根据附件构建 DeepSeek 消息 content（使用 file_id 引用，不含 base64）
   */
  const buildDeepSeekContent = (
    text: string,
    attachments: AttachedFile[]
  ): Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } } | { type: "file"; file: { file_id: string } }> => {
    const parts: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } } | { type: "file"; file: { file_id: string } }> = [];
    let lastIdx = 0;
    const imgRegex = /!\[([^\]]*)\]\((data:image\/[^;)]+)\)/g;
    let m: RegExpExecArray | null;
    while ((m = imgRegex.exec(text)) !== null) {
      if (m.index > lastIdx) parts.push({ type: "text", text: text.slice(lastIdx, m.index) });
      parts.push({ type: "image_url", image_url: { url: m[2] } }); // m[2] = data URL
      lastIdx = m.index + m[0].length;
    }
    if (lastIdx < text.length) parts.push({ type: "text", text: text.slice(lastIdx) });

    // 替换 data URL → file_id
    const resolvedParts: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } } | { type: "file"; file: { file_id: string } }> = parts.map((p) => {
      if (p.type !== "image_url") return p;
      const att = attachments.find((a) => a.dataUrl === p.image_url.url);
      if (att?.fileId) {
        return { type: "image_url", image_url: { url: `file_id:${att.fileId}` } };
      }
      return p; // 没找到对应附件（理论上不会），保留原 data URL
    });

    // 非图片附件 → file 类型
    for (const att of attachments.filter((a) => !a.isImage && a.fileId)) {
      if (att.fileId) {
        resolvedParts.push({ type: "file", file: { file_id: att.fileId } });
      }
    }

    return resolvedParts;
  };

  /**
   * 将含 base64 图片的消息内容转为 OpenAI 多模态格式
   * @example "\n![a.png](data:image/png;base64,xxx)" → { type:"text",... } + { type:"image_url",... }
   */
  const parseImageMessageContent = (
    textContent: string
  ): Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> => {
    const parts: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [];
    // 按 Markdown 图片语法分割
    const imageRegex = /!\[([^\]]*)\]\((data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)\)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = imageRegex.exec(textContent)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: "text", text: textContent.slice(lastIndex, match.index) });
      }
      parts.push({ type: "image_url", image_url: { url: match[2] } });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < textContent.length) {
      parts.push({ type: "text", text: textContent.slice(lastIndex) });
    }
    // 如果没有图片部分，返回纯文本
    if (parts.length === 0) {
      parts.push({ type: "text", text: textContent });
    }
    return parts;
  };

  const sendMessage = async (attachments?: AttachedFile[]) => {
    if (!input.trim() && (!attachments || attachments.length === 0)) return;
    if (!activeConversation || !activeModel) return;

    const isDeepSeek = (activeModel as any).model_type === "deepseek";
    const isKimi = (activeModel as any).model_type === "kimi";

    // ── DeepSeek/Kimi: 先上传文件获取 file_id ──────────────────────
    let processedAttachments: AttachedFile[] | undefined;
    let fullContent = input;
    let fileContents: { fileId: string; content: string }[] = [];

    if (attachments && attachments.length > 0) {
      if (isDeepSeek || isKimi) {
        // 上传到官方接口（失败则回退到 base64）
        try {
          const modelId = activeModel?.id ?? 0;
          processedAttachments = await uploadDeepSeekAttachments(
            attachments,
            modelId
          );
          
          // Kimi: 获取非图片文件的内容，用于后续注入到 system 消息
          if (isKimi && processedAttachments) {
            for (const att of processedAttachments) {
              if (!att.isImage && att.fileId) {
                try {
                  const result = await window.electron?.ipcRenderer?.invoke(
                    "get-file-content",
                    activeModel!.id,
                    att.fileId
                  );
                  if (result?.content) {
                    fileContents.push({ fileId: att.fileId, content: result.content });
                    console.log(`[Kimi] 文件内容获取成功: ${att.name}`);
                  }
                } catch (err: any) {
                  console.warn(`[Kimi] 文件内容获取失败: ${att.name}`, err.message);
                }
              }
            }
          }
        } catch (uploadErr: any) {
          console.warn(`[${isDeepSeek ? "DeepSeek" : "Kimi"}] 文件上传失败，回退 base64 模式:`, uploadErr.message);
          processedAttachments = attachments;
        }
        // 构建含 file_id 引用的多模态 content
        const attTexts = attachments.map((a) =>
          a.isImage
            ? `\n![${a.name}](${a.dataUrl})`
            : `\n[附件: ${a.name} (${(a.size / 1024).toFixed(1)}KB)]`
        );
        fullContent = input + attTexts.join("");
      } else {
        // 其他模型：直接用 base64 data URL（保留原有行为）
        const attTexts = attachments.map((a) =>
          a.isImage
            ? `\n![${a.name}](${a.dataUrl})`
            : `\n[附件: ${a.name} (${(a.size / 1024).toFixed(1)}KB)]`
        );
        fullContent = input + attTexts.join("");
        processedAttachments = attachments;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: fullContent,
      timestamp: new Date(),
      metadata: {
        ...(processedAttachments?.length
          ? {
              attachments: processedAttachments.map((a) => ({
                id: a.id,
                name: a.name,
                type: a.type,
                size: a.size,
                dataUrl: a.dataUrl,
                isImage: a.isImage,
                fileId: a.fileId
              }))
            }
          : {})
      }
    };

    // 添加用户消息
    const updatedConversation = {
      ...activeConversation,
      title:
        activeConversation.messages.length === 0
          ? String(fullContent).substring(0, 30) +
            (fullContent.length > 30 ? "..." : "")
          : activeConversation.title,
      lastMessageAt: new Date(),
      messages: [...activeConversation.messages, userMessage],
      modelId: activeModel.id,
      modelName: activeModel.name
    };

    setActiveConversation(updatedConversation);
    setConversations(
      conversations.map((c) =>
        c.id === activeConversation.id ? updatedConversation : c
      )
    );

    setInput("");
    setIsLoading(true);

    try {
      // 构建消息历史，格式化为 AI 模型需要的格式
      // - DeepSeek：使用 buildDeepSeekContent（含 file_id 引用，图片用 image_url，非图片用 file）
      // - Kimi：将文件内容作为 system 消息注入，图片用 base64
      // - 其他模型：含图片消息转 OpenAI 多模态 content 数组（避免 base64 进纯文本 token）
      // - 超出 context window：从最旧消息开始裁剪
      const rawMessages: any[] = updatedConversation.messages.map((msg) => {
        if (msg.role !== "user") return { role: msg.role, content: msg.content };

        // DeepSeek：使用上传后的 file_id 引用
        if (isDeepSeek && processedAttachments?.length) {
          const parts = buildDeepSeekContent(msg.content, processedAttachments);
          return { role: msg.role, content: parts };
        }
        // Kimi：图片转多模态格式，非图片已通过 system 消息注入
        if (isKimi && processedAttachments?.length) {
          const parts = buildDeepSeekContent(msg.content, processedAttachments);
          return { role: msg.role, content: parts };
        }
        // 其他模型：含图片转多模态格式
        if (hasImageAttachment(msg.content)) {
          const parts = parseImageMessageContent(msg.content);
          return { role: msg.role, content: parts };
        }
        return { role: msg.role, content: msg.content };
      });

      // Kimi: 将文件内容注入为 system 消息
      if (isKimi && fileContents.length > 0) {
        const fileSystemMessages = fileContents.map(fc => ({
          role: "system",
          content: fc.content
        }));
        // 将文件内容 system 消息插入到最前面
        rawMessages.unshift(...fileSystemMessages);
      }

      // 获取模型 context window（从模型参数中读，或用默认值 128K）
      const modelParams = (activeModel as any).parameters || {};
      const contextWindow = modelParams.max_tokens || 128000;

      const aiMessages = trimMessagesForContextWindow(rawMessages, contextWindow, 2000);

      console.log("调用AI模型:", {
        modelId: activeModel.id,
        modelName: activeModel.name,
        messageCount: aiMessages.length,
        lastMessage: (() => {
          const lastMsg = aiMessages[aiMessages.length - 1];
          if (!lastMsg?.content) return '';
          const c = lastMsg.content;
          return typeof c === 'string' ? c.substring(0, 100) : JSON.stringify(c).substring(0, 100);
        })()
      });

      // 调用真实AI模型，传递 skill 信息（支持多选）
      const callOptions: any = { stream: false };
      if (selectedSkills.length > 0) {
        callOptions.skills = selectedSkills.map(skill => ({
          id: skill.id,
          name: skill.name,
          content: skill.content
        }));
      }
      const response = await window.electron?.ipcRenderer?.invoke(
        "call-model",
        activeModel.id,
        aiMessages,
        callOptions
      );

      console.log("AI模型响应:", {
        success: !!response,
        contentLength: response?.content?.length || 0,
        model: response?.model,
        finishReason: response?.finish_reason
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.content || t("chat.noResponse"),
        timestamp: new Date(),
        tokens: response.usage?.total_tokens || 0,
        metadata: {
          finish_reason: response.finish_reason || "unknown",
          model: response.model || activeModel.name,
          error: response.error
        }
      };

      const finalConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, aiMessage],
        lastMessageAt: new Date(),
        modelId: activeModel.id,
        workspaceId: activeWorkspace?.id
      };

      setActiveConversation(finalConversation);
      setConversations(
        conversations.map((c) =>
          c.id === activeConversation.id ? finalConversation : c
        )
      );

      setIsLoading(false);

      // 保存更新后的对话
      autoSaver.queueSave(finalConversation);

      // 记录操作日志 + token 消耗
      const totalTokens = response.usage?.total_tokens || 0;
      opLog.chatSend(activeConversation.title, activeModel.name, totalTokens);
      if (totalTokens > 0) {
        logTokenUsage({
          modelName: response.model || activeModel.name,
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens,
          conversationId: activeConversation.id
        });
      }

      // 记录到历史
      window.electron?.ipcRenderer?.invoke("log-operation", {
        operation_type: "chat_message",
        operation_target: activeConversation.id,
        operation_status: "completed",
        permission_check: "allowed",
        details: `用户发送消息到对话 ${activeConversation.title}，AI模型响应成功，使用模型: ${activeModel.name}`
      });
    } catch (error) {
      console.error("AI模型调用失败:", error);

      // 提供更友好的错误信息
      let errorMessageText = "";
      if (error instanceof Error) {
        const errorMsg = (error.message || "").toLowerCase();
        if (
          errorMsg.includes("api密钥") ||
          errorMsg.includes("api key") ||
          errorMsg.includes("401") ||
          errorMsg.includes("403")
        ) {
          errorMessageText = `API认证失败：${error.message}\n\n请检查API密钥是否正确，并且确保它有足够的权限访问该API端点。`;
        } else if (
          errorMsg.includes("网络") ||
          errorMsg.includes("network") ||
          errorMsg.includes("连接") ||
          errorMsg.includes("timeout")
        ) {
          errorMessageText = `网络连接错误：${error.message}\n\n请检查网络连接，确保API端点可访问。`;
        } else if (
          errorMsg.includes("模型类型") ||
          errorMsg.includes("不支持") ||
          errorMsg.includes("invalid model")
        ) {
          errorMessageText = `模型配置错误：${error.message}\n\n请检查模型配置，确保选择了正确的模型类型和API端点。`;
        } else if (
          errorMsg.includes("额度") ||
          errorMsg.includes("quota") ||
          errorMsg.includes("超出") ||
          errorMsg.includes("balance")
        ) {
          errorMessageText = `API额度或余额不足：${error.message}\n\n请检查API账户余额或使用额度。`;
        } else if (
          errorMsg.includes("maximum context") ||
          errorMsg.includes("context length") ||
          errorMsg.includes("too many tokens") ||
          errorMsg.includes("131072") ||
          errorMsg.includes("max_tokens")
        ) {
          errorMessageText = `对话上下文超出模型限制：${error.message}\n\n可能原因：\n1. 上传的图片文件过大（建议 5MB 以下）\n2. 对话历史过长，请开启新对话继续\n\n系统已尝试自动裁剪历史消息，如仍出现此错误，请开启新对话。`;
        } else {
          errorMessageText = `调用AI模型时出现错误：${error.message}\n\n请检查模型配置是否正确，包括API端点、API密钥等。`;
        }
      } else {
        errorMessageText = `调用AI模型时出现未知错误：${String(error)}`;
      }

      // 添加错误消息
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorMessageText,
        timestamp: new Date()
      };

      const finalConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, errorMessage],
        lastMessageAt: new Date()
      };

      setActiveConversation(finalConversation);
      setConversations(
        conversations.map((c) =>
          c.id === activeConversation.id ? finalConversation : c
        )
      );

      setIsLoading(false);

      // 保存错误对话
      autoSaver.queueSave(finalConversation);
      opLog.chatError(
        activeConversation.title,
        error instanceof Error ? error.message : "未知错误"
      );

      // 记录错误到历史
      window.electron?.ipcRenderer?.invoke("log-operation", {
        operation_type: "chat_message",
        operation_target: activeConversation.id,
        operation_status: "failed",
        permission_check: "allowed",
        details: `AI模型调用失败: ${error instanceof Error ? error.message : "未知错误"}，模型: ${activeModel.name}`
      });
    }

    // 记录用户发送消息
    window.electron?.ipcRenderer?.invoke("log-operation", {
      operation_type: "chat_message",
      operation_target: activeConversation.id,
      operation_status: "pending",
      permission_check: "allowed",
      details: `用户发送消息: ${String(fullContent).substring(0, 100)}${fullContent.length > 100 ? "..." : ""}`
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleAddToInput = (text: string) => {
    setInput(input + text);
  };

  const handleClearInput = () => {
    setInput("");
  };

  // 获取可用的模型列表用于过滤
  const availableModels = Array.from(
    new Set(conversations.map((c) => c.modelName))
  ).sort();

  // 切换对话列表
  const toggleConversationList = () => {
    setIsConversationListCollapsed(!isConversationListCollapsed);
  };

  return (
    <div className="flex h-full overflow-hidden relative">
      {/* 左侧对话列表 - 侧滑弹框 */}
      <div 
        className={`fixed top-12 inset-y-0 left-0 z-30 transform transition-transform duration-200 ease-out ${
          isConversationListCollapsed ? "-translate-x-full" : "translate-x-0"
        }`}
        style={{ width: conversationListWidth }}
      >
        <div className="h-full shadow-2xl bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
          <ConversationList
            conversations={conversations}
            activeConversation={activeConversation}
            isConversationListCollapsed={isConversationListCollapsed}
            searchQuery={searchQuery}
            filterByModel={filterByModel}
            availableModels={availableModels}
            onNewConversation={createNewConversation}
            onToggleCollapse={toggleConversationList}
            onSelectConversation={setActiveConversation}
            onDeleteConversation={deleteConversation}
            onDeleteSelectedConversations={deleteSelectedConversations}
            onSearchChange={setSearchQuery}
            onFilterChange={setFilterByModel}
          />
        </div>
      </div>

      {/* 遮罩层 - 点击关闭 */}
      {!isConversationListCollapsed && (
        <div 
          className="fixed inset-0 z-20"
          onClick={toggleConversationList}
        />
      )}

      {/* 中间聊天区域 */}
      <div className="flex-1 flex flex-col overflow-hidden h-full min-w-0">
        {/* 聊天头部 */}
        <ChatHeader
          activeConversation={activeConversation}
          onToggleConversationList={toggleConversationList}
          isConversationListOpen={!isConversationListCollapsed}
        />

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto">
          <MessageList
            activeConversation={activeConversation}
            messagesEndRef={messagesEndRef}
            isLoading={isLoading}
            activeModel={activeModel}
            onNewConversation={createNewConversation}
            onCopyMessage={handleCopyMessage}
          />
        </div>

        {/* 水平拖拽条 - 调整输入框高度 */}
        <div
          onMouseDown={handleVerticalMouseDown}
          onDoubleClick={() => setChatInputHeight(160)}
          title="拖拽调整输入框高度，双击重置"
          className="h-px bg-gray-200 dark:bg-gray-700 hover:bg-blue-400 dark:hover:bg-blue-500 cursor-row-resize transition-all duration-150 flex-shrink-0"
          style={{ cursor: 'row-resize' }}
        />

        {/* 输入框 */}
        <div style={{ minHeight: chatInputHeight }} className="flex-shrink-0">
        <ChatInput
          input={input}
          activeConversation={activeConversation}
          activeModel={activeModel}
          isLoading={isLoading}
          models={models}
          activeWorkspace={activeWorkspace}
          selectedSkills={selectedSkills}
          inputHeight={chatInputHeight}
          onInputChange={setInput}
          onSendMessage={sendMessage}
          onKeyPress={handleKeyPress}
          onAddToInput={handleAddToInput}
          onClearInput={handleClearInput}
          onSelectModel={handleModelChange}
          onSelectWorkspace={handleWorkspaceSelect}
          onAddWorkspace={handleAddWorkspace}
          onNewConversation={createNewConversation}
          onSelectSkills={setSelectedSkills}
          onNavigateToSkills={() => navigate('/skills')}
          onNavigateToModels={() => navigate('/settings?tab=models')}
        />
        </div>
      </div>
    </div>
  );
};

export default Chat;
