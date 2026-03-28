import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";
import { exec } from "child_process";

let mainWindow: BrowserWindow | null = null;
let dataDir: string = "";
let isSaving = false;

// 数据存储接口
interface OperationHistory {
  id: number;
  timestamp: string;
  operation_type: string;
  operation_target: string;
  operation_status: string;
  permission_check: string;
  details: string;
}

interface ModelConfig {
  id: number;
  name: string;
  api_endpoint: string;
  api_key?: string;
  model_type: string;
  parameters: Record<string, any>;
  is_default: boolean;
  /** 文件上传接口地址（如 DeepSeek 的 /v1/files） */
  file_upload_endpoint?: string;
  /** 文件上传接口的 API Key（如果与主 API Key 不同） */
  file_upload_api_key?: string;
}

interface Workspace {
  id: number;
  path: string;
  name: string;
  created_at: string;
  is_active: boolean;
}

interface AppData {
  history: OperationHistory[];
  modelConfigs: ModelConfig[];
  workspaces: Workspace[];
  nextHistoryId: number;
  nextModelId: number;
  nextWorkspaceId: number;
}

// 获取默认应用数据
function getDefaultAppData(): AppData {
  console.log("创建默认应用数据");
  return {
    history: [],
    modelConfigs: [
      {
        id: 1,
        name: "deepseek-chat",
        api_endpoint: "https://api.deepseek.com",
        api_key: "",
        model_type: "deepseek",
        parameters: {},
        is_default: true
      }
    ],
    workspaces: [],
    nextHistoryId: 1,
    nextModelId: 2,
    nextWorkspaceId: 1
  };
}

// 初始化数据目录
async function initializeDataDirectory() {
  dataDir = path.join(app.getPath("userData"), "claw-data");

  if (!fsSync.existsSync(dataDir)) {
    await fs.mkdir(dataDir, { recursive: true });
  }

  // 初始化数据文件
  const dataPath = path.join(dataDir, "app-data.json");
  if (!fsSync.existsSync(dataPath)) {
    const initialData: AppData = {
      history: [],
      modelConfigs: [],
      workspaces: [],
      nextHistoryId: 1,
      nextModelId: 1,
      nextWorkspaceId: 1
    };
    await fs.writeFile(dataPath, JSON.stringify(initialData, null, 2));
  }
}

// 读取数据
async function readData(): Promise<AppData> {
  try {
    const dataPath = path.join(dataDir, "app-data.json");
    console.log("读取数据文件:", dataPath);

    // 检查文件是否存在
    if (!fsSync.existsSync(dataPath)) {
      console.log("数据文件不存在，创建默认数据");
      return getDefaultAppData();
    }

    const data = await fs.readFile(dataPath, "utf-8");

    // 检查是否为空文件
    if (!data || data.trim() === "") {
      console.log("数据文件为空，创建默认数据");
      return getDefaultAppData();
    }

    // 尝试解析JSON
    const parsedData = JSON.parse(data);
    console.log("成功解析JSON数据，数据大小:", data.length, "字符");
    return parsedData;
  } catch (error) {
    console.error("读取数据失败:", error);

    // 备份损坏的文件
    try {
      const dataPath = path.join(dataDir, "app-data.json");
      const backupPath = path.join(
        dataDir,
        `app-data-backup-${Date.now()}.json`
      );
      if (fsSync.existsSync(dataPath)) {
        await fs.copyFile(dataPath, backupPath);
        console.log("已备份损坏的文件到:", backupPath);
      }
    } catch (backupError) {
      console.error("备份损坏文件失败:", backupError);
    }

    // 返回默认数据
    console.log("返回默认应用数据");
    return getDefaultAppData();
  }
}

// 保存数据
async function saveData(data: AppData): Promise<void> {
  // 防止并发写入
  while (isSaving) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  isSaving = true;
  try {
    const dataPath = path.join(dataDir, "app-data.json");
    await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
  } finally {
    isSaving = false;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: "hiddenInset",
    frame: false
  });

  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/renderer/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await initializeDataDirectory();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// 通用AI模型调用函数
async function callModelAPI(
  modelConfig: ModelConfig,
  messages: any[],
  options: any = {}
) {
  try {
    const { api_endpoint, api_key, model_type, parameters } = modelConfig;

    // 检查API密钥
    if (!api_key) {
      throw new Error("API密钥未配置");
    }

    // 根据模型类型选择API调用方式
    switch (model_type.toLowerCase()) {
      case "openai":
        return callOpenAICompatible(
          resolveChatEndpoint(api_endpoint, "openai", parameters.model),
          api_key,
          messages,
          parameters,
          options,
          "openai",
          modelConfig
        );
      case "claude":
        return callOpenAICompatible(
          resolveChatEndpoint(api_endpoint, "claude"),
          api_key,
          messages,
          parameters,
          options,
          "claude",
          modelConfig
        );
      case "gemini":
        return callOpenAICompatible(
          resolveChatEndpoint(api_endpoint, "gemini", parameters.model),
          api_key,
          messages,
          parameters,
          options,
          "gemini",
          modelConfig
        );
      case "deepseek":
        return await callDeepSeek(api_endpoint, api_key, messages, parameters, options, modelConfig);
      case "kimi":
        return await callKimi(api_endpoint, api_key, messages, parameters, options, modelConfig);
      case "qwen":
        return await callQwen(api_endpoint, api_key, messages, parameters, modelConfig);
      case "ernie":
        return await callErnie(api_endpoint, api_key, messages, parameters, options, modelConfig);
      case "spark":
        return await callSpark(api_endpoint, api_key, messages, parameters, modelConfig);
      case "zhipu":
        return await callZhipu(api_endpoint, api_key, messages, parameters, options, modelConfig);
      default:
        throw new Error(`不支持的模型类型: ${model_type}`);
    }
  } catch (error) {
    console.error("调用模型API失败:", error);
    throw error;
  }
}

// 带超时的 fetch 封装（默认 120 秒，Claw 多步骤任务可能耗时较长）
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = 120000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    return response;
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error(
        `请求超时（超过 ${timeoutMs / 1000} 秒），请检查网络或稍后重试`
      );
    }
    // terminated / ECONNRESET 等网络层错误统一提示
    if (
      err.message?.toLowerCase().includes("terminated") ||
      err.message?.toLowerCase().includes("econnreset") ||
      err.message?.toLowerCase().includes("network")
    ) {
      throw new Error(`网络连接中断，请检查网络后重试（原因：${err.message}）`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ─── 各模型官方默认端点常量 ─────────────────────────────────────────────────

/** 对话补全（Chat）接口默认后缀 */
const CHAT_ENDPOINTS: Record<string, string> = {
  openai: "https://api.openai.com/v1/chat/completions",
  claude: "https://api.anthropic.com/v1/messages",
  gemini: "https://generativelanguage.googleapis.com/v1beta/models/",
  deepseek: "https://api.deepseek.com/v1/chat/completions",
  kimi: "https://api.moonshot.cn/v1/chat/completions",
  qwen: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
  ernie: "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/",
  spark: "https://spark-api.xf-yun.com/v3.1/chat",
  zhipu: "https://open.bigmodel.cn/api/paas/v4/chat/completions"
};

/** 文件上传（File Upload）接口默认后缀 */
const FILE_UPLOAD_ENDPOINTS: Record<string, string> = {
  openai: "https://api.openai.com/v1/files",
  claude: "https://api.anthropic.com/v1/files",
  gemini: "https://generativelanguage.googleapis.com/upload/v1beta/files",
  deepseek: "https://api.deepseek.com/v1/files",
  kimi: "https://api.moonshot.cn/v1/files",
  zhipu: "https://open.bigmodel.cn/api/paas/v4/files"
  // qwen / ernie / spark 暂不支持直接文件上传接口，使用平台特定方式
};

// ─── 端点补全工具函数 ─────────────────────────────────────────────────────────

/**
 * 补全对话接口端点
 * - 若用户已配置完整地址（包含 /v1/ 或特定后缀），直接返回
 * - 否则根据 model_type 拼接正确的官方默认端点
 */
function resolveChatEndpoint(
  userEndpoint: string,
  modelType: string,
  modelId?: string
): string {
  const type = modelType.toLowerCase();

  // 用户已配置完整地址（检查是否包含常见后缀模式）
  if (userEndpoint) {
    const hasSuffix =
      userEndpoint.includes("/v1/") ||
      userEndpoint.includes("/v1beta/") ||
      userEndpoint.includes("/v3.") ||
      userEndpoint.includes("/v4/") ||
      userEndpoint.includes("/chat") ||
      userEndpoint.includes("/messages") ||
      userEndpoint.includes(":generateContent");

    if (hasSuffix) {
      // 文心一言需要动态拼接模型名
      if (type === "ernie" && userEndpoint.endsWith("/")) {
        return userEndpoint.slice(0, -1);
      }
      return userEndpoint;
    }
  }

  // 根据模型类型补全默认端点
  const defaultEndpoint = CHAT_ENDPOINTS[type] || CHAT_ENDPOINTS.openai;

  // Gemini 需要拼接模型名
  if (type === "gemini") {
    const modelName = modelId || "gemini-pro";
    return `${defaultEndpoint}${modelName}:generateContent`;
  }

  // 文心一言需要拼接模型名
  if (type === "ernie") {
    const modelName = modelId || "ernie-bot";
    return `${defaultEndpoint}${modelName}`;
  }

  // 通义千问兼容模式：确保路径正确
  if (type === "qwen") {
    if (userEndpoint) {
      // 使用 URL 对象智能拼接
      try {
        const urlObj = new URL(userEndpoint);
        const protocol = urlObj.protocol; // https:
        const hostname = urlObj.hostname; // dashscope.aliyuncs.com
        const port = urlObj.port ? `:${urlObj.port}` : "";
        const base = `${protocol}//${hostname}${port}`;
        return `${base}/compatible-mode/v1/chat/completions`;
      } catch (error) {
        console.warn(`[resolveChatEndpoint] 解析用户端点失败: ${userEndpoint}, 使用默认端点`);
        return defaultEndpoint;
      }
    }
  }

  return defaultEndpoint;
}

/**
 * 补全文件上传接口端点
 * - 若模型配置了 file_upload_endpoint，直接使用
 * - 否则根据 model_type 补全默认端点
 */
function resolveFileUploadEndpoint(
  userEndpoint: string | undefined,
  fileUploadEndpoint: string | undefined,
  modelType: string
): string | null {
  const type = modelType.toLowerCase();

  // 优先使用用户配置的自定义端点
  if (fileUploadEndpoint) {
    // 如果用户配置的端点以 /upload 结尾，可能需要移除（某些旧配置可能有误）
    if (fileUploadEndpoint.endsWith("/upload")) {
      console.warn(`[resolveFileUploadEndpoint] 检测到 /upload 后缀，自动移除: ${fileUploadEndpoint}`);
      return fileUploadEndpoint.slice(0, -7);
    }
    return fileUploadEndpoint;
  }

  // 检查是否支持直接文件上传
  if (FILE_UPLOAD_ENDPOINTS[type]) {
    // 如果用户没有配置自定义端点，直接使用默认端点
    if (!userEndpoint || userEndpoint === "") {
      return FILE_UPLOAD_ENDPOINTS[type];
    }

    // 用户配置了端点，需要智能拼接文件上传路径
    // 移除用户端点中的路径部分，只保留协议和域名
    try {
      const urlObj = new URL(userEndpoint);
      const protocol = urlObj.protocol; // https:
      const hostname = urlObj.hostname; // api.deepseek.com
      const port = urlObj.port ? `:${urlObj.port}` : "";
      const base = `${protocol}//${hostname}${port}`;

      // 从默认端点中提取路径后缀
      const defaultUrl = new URL(FILE_UPLOAD_ENDPOINTS[type]);
      const pathSuffix = defaultUrl.pathname; // /v1/files

      return `${base}${pathSuffix}`;
    } catch (error) {
      console.warn(`[resolveFileUploadEndpoint] 解析用户端点失败: ${userEndpoint}, 使用默认端点`);
      return FILE_UPLOAD_ENDPOINTS[type];
    }
  }

  // 该模型不支持直接文件上传
  return null;
}

// ─── OpenAI 兼容接口调用 ─────────────────────────────────────────────────────

/**
 * OpenAI 兼容格式的 API 调用
 * 支持: OpenAI, DeepSeek, Kimi, 智谱AI 等
 */
async function callOpenAICompatible(
  endpoint: string,
  apiKey: string,
  messages: any[],
  parameters: any,
  options: any,
  modelType: string,
  modelConfig: ModelConfig
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`
  };

  // Anthropic Claude 需要特殊 Header
  if (modelType.toLowerCase() === "claude") {
    headers["anthropic-version"] = "2023-06-01";
    headers["anthropic-beta"] = "files-api-2025-04-14"; // 文件 Beta 功能
  }

  // 支持自定义请求头
  if (parameters.headers) {
    Object.assign(headers, parameters.headers);
  }

  // 构建 payload 时过滤掉非 API 字段
  const { headers: _h, ...restParams } = parameters;
  
  // 优先使用 parameters.model（配置的模型名），如果没有则使用配置的 name 作为模型名，
  // 最后才使用默认模型名
  const modelName = restParams.model || modelConfig.name || getDefaultModel(modelType);
  
  // 某些模型有特殊的参数限制
  // Kimi 某些版本（如 kimi-preview-20240517）只支持 temperature=1
  // 智谱某些模型（如 glm-4v）不支持 temperature 参数
  const type = modelType.toLowerCase();
  const isKimi = type === "kimi";
  const isZhipu = type === "zhipu";
  
  // Kimi 模型默认使用 1.0
  const defaultTemp = isKimi ? 1.0 : 0.7;
  
  const payload: any = {
    model: modelName,
    messages,
    stream: options.stream || false,
    ...restParams
  };
  
  // 只有当模型支持时才添加 temperature 参数
  if (!isZhipu) {
    payload.temperature = restParams.temperature ?? defaultTemp;
  }
  
  // 只有当显式指定时才添加 max_tokens
  if (restParams.max_tokens !== undefined) {
    payload.max_tokens = restParams.max_tokens;
  }

  const makeRequest = async (payloadOverride?: any) => {
    const bodyPayload = payloadOverride || payload;
    console.log(`[API Request] 模型=${modelName}, 参数:`, {
      temperature: bodyPayload.temperature,
      max_tokens: bodyPayload.max_tokens
    });

    const response = await fetchWithTimeout(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(bodyPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API Error] 状态=${response.status}, 响应=${errorText}`);
      throw new Error(
        `API请求失败: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return await response.json();
  };

  let data: any;
  try {
    data = await makeRequest();
  } catch (error: any) {
    // 检测参数错误，尝试不带有问题的参数重试
    const errorMsg = error.message || "";
    
    // temperature 参数错误
    if (errorMsg.includes("invalid temperature") || errorMsg.includes("temperature")) {
      console.log("[Retry] 检测到 temperature 参数错误，尝试重试不带 temperature");
      const { temperature, ...payloadWithoutTemp } = payload;
      try {
        data = await makeRequest(payloadWithoutTemp);
      } catch (retryError: any) {
        console.error("[Retry] 去除 temperature 后仍失败:", retryError.message);
        throw error; // 抛出原始错误
      }
    }
    // max_tokens 参数错误
    else if (errorMsg.includes("invalid max_tokens") || errorMsg.includes("max_tokens")) {
      console.log("[Retry] 检测到 max_tokens 参数错误，尝试重试不带 max_tokens");
      const { max_tokens, ...payloadWithoutMaxTokens } = payload;
      try {
        data = await makeRequest(payloadWithoutMaxTokens);
      } catch (retryError: any) {
        console.error("[Retry] 去除 max_tokens 后仍失败:", retryError.message);
        throw error;
      }
    }
    else {
      throw error;
    }
  }

  // Claude 返回格式不同
  if (modelType.toLowerCase() === "claude") {
    return {
      content: data.content?.[0]?.text || "",
      model: data.model || "claude",
      usage: data.usage || {},
      finish_reason: data.stop_reason || "stop"
    };
  }

  // Gemini 返回格式
  if (modelType.toLowerCase() === "gemini") {
    return {
      content: data.candidates?.[0]?.content?.parts?.[0]?.text || "",
      model: data.modelVersion || "gemini",
      usage: data.usageMetadata || {},
      finish_reason: "stop"
    };
  }

  // 通用 OpenAI 兼容格式
  return {
    content: data.choices?.[0]?.message?.content || "",
    model: data.model || "unknown",
    usage: data.usage || {},
    finish_reason: data.choices?.[0]?.finish_reason || "stop"
  };
}

/** 获取各模型默认模型名 */
function getDefaultModel(modelType: string): string {
  const defaults: Record<string, string> = {
    openai: "gpt-3.5-turbo",
    claude: "claude-3-5-sonnet-20241022",
    gemini: "gemini-pro",
    deepseek: "deepseek-chat",
    kimi: "kimi-k2.5",
    qwen: "qwen-max",
    zhipu: "glm-4"
  };
  return defaults[modelType.toLowerCase()] || "gpt-3.5-turbo";
}

// ─── 各模型 API 调用函数 ─────────────────────────────────────────────────────

// DeepSeek API调用
async function callDeepSeek(
  endpoint: string,
  apiKey: string,
  messages: any[],
  parameters: any,
  options: any,
  modelConfig: ModelConfig
) {
  const fullEndpoint = resolveChatEndpoint(endpoint, "deepseek");
  console.log(`DeepSeek API调用: 端点=${fullEndpoint}`);

  return callOpenAICompatible(fullEndpoint, apiKey, messages, parameters, options, "deepseek", modelConfig);
}

// Kimi (Moonshot) API调用
async function callKimi(
  endpoint: string,
  apiKey: string,
  messages: any[],
  parameters: any,
  options: any,
  modelConfig: ModelConfig
) {
  const fullEndpoint = resolveChatEndpoint(endpoint, "kimi");
  console.log(`Kimi API调用: 端点=${fullEndpoint}`);

  return callOpenAICompatible(fullEndpoint, apiKey, messages, parameters, options, "kimi", modelConfig);
}

// 通义千问API调用
async function callQwen(
  endpoint: string,
  apiKey: string,
  messages: any[],
  parameters: any,
  modelConfig: ModelConfig
) {
  const fullEndpoint = resolveChatEndpoint(endpoint, "qwen");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`
  };

  const payload = {
    model: parameters.model || modelConfig.name || "qwen-max",
    messages,
    temperature: parameters.temperature || 0.7,
    max_tokens: parameters.max_tokens || 2000,
    ...parameters
  };

  const response = await fetchWithTimeout(fullEndpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API请求失败: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data: any = await response.json();
  return {
    content: data.output?.text || data.choices?.[0]?.message?.content || "",
    model: data.model || "qwen",
    usage: data.usage || {},
    finish_reason: data.output?.finish_reason || data.choices?.[0]?.finish_reason || "stop"
  };
}

// 文心一言API调用
async function callErnie(
  endpoint: string,
  apiKey: string,
  messages: any[],
  parameters: any,
  options: any,
  modelConfig: ModelConfig
) {
  // Ernie 使用 access_token 认证
  const accessToken = await getBaiduAccessToken(apiKey);

  // 获取模型名（优先使用 parameters.model，然后是配置的 name，最后是默认模型名）
  const modelName = parameters.model || modelConfig.name || "ernie-bot";

  // 拼接完整 URL（用户配置的 endpoint 可能是基础地址）
  let baseUrl = endpoint;
  if (!baseUrl || baseUrl === "https://aip.baidubce.com") {
    baseUrl = "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat";
  }

  // 如果用户填的 endpoint 不完整，补充完整
  if (!baseUrl.includes("/wenxinworkshop/chat")) {
    baseUrl = "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat";
  }

  // 移除末尾斜杠，拼接模型名
  const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const fullUrl = `${base}/${modelName}?access_token=${accessToken}`;

  console.log(`文心一言 API调用: 端点=${fullUrl}`);

  const payload = {
    messages,
    temperature: parameters.temperature || 0.7,
    max_tokens: parameters.max_tokens || 2000,
    stream: options.stream || false,
    ...parameters
  };

  const response = await fetchWithTimeout(fullUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API请求失败: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data: any = await response.json();
  return {
    content: data.result || "",
    model: data.model || modelName,
    usage: data.usage || {},
    finish_reason: data.finish_reason || "stop"
  };
}

// 获取百度access_token
async function getBaiduAccessToken(apiKey: string): Promise<string> {
  if (apiKey.includes(":")) {
    const [clientId, clientSecret] = apiKey.split(":");
    const response = await fetch(
      `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
      { method: "POST" }
    );

    if (!response.ok) {
      throw new Error("获取百度access_token失败");
    }

    const data: any = await response.json();
    return data.access_token;
  }
  return apiKey; // 如果直接是 access_token
}

// 讯飞星火API调用
async function callSpark(
  endpoint: string,
  apiKey: string,
  messages: any[],
  parameters: any,
  modelConfig: ModelConfig
) {
  // 讯飞使用 v3.1 版本
  const baseUrl = endpoint || "https://spark-api.xf-yun.com/v3.1/chat";

  // 拼接完整端点
  let fullUrl = baseUrl;
  if (!fullUrl.includes("/chat")) {
    fullUrl = `${baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl}/chat`;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`
  };

  const payload = {
    model: parameters.model || modelConfig.name || "spark-general",
    messages,
    temperature: parameters.temperature || 0.7,
    max_tokens: parameters.max_tokens || 2000,
    ...parameters
  };

  console.log(`讯飞星火 API调用: 端点=${fullUrl}`);

  const response = await fetchWithTimeout(fullUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API请求失败: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data: any = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || data.text || "",
    model: data.model || "spark",
    usage: data.usage || {},
    finish_reason: data.choices?.[0]?.finish_reason || "stop"
  };
}

// 智谱AI API调用
async function callZhipu(
  endpoint: string,
  apiKey: string,
  messages: any[],
  parameters: any,
  options: any,
  modelConfig: ModelConfig
) {
  const fullEndpoint = resolveChatEndpoint(endpoint, "zhipu");
  console.log(`智谱AI API调用: 端点=${fullEndpoint}`);

  return callOpenAICompatible(fullEndpoint, apiKey, messages, parameters, options, "zhipu", modelConfig);
}

// IPC处理器
ipcMain.handle("select-directory", async () => {
  if (!mainWindow) return null;

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"]
  });

  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle("check-path-permission", async (_, pathToCheck: string) => {
  try {
    const data = await readData();
    const activeWorkspace = data.workspaces.find((w) => w.is_active);

    if (!activeWorkspace) {
      return { allowed: false, reason: "No active workspace" };
    }

    const isAllowed = pathToCheck.startsWith(activeWorkspace.path);

    return {
      allowed: isAllowed,
      workspace: activeWorkspace.path,
      reason: isAllowed ? "Within workspace" : "Outside workspace"
    };
  } catch (error) {
    return { allowed: false, reason: "Error reading data" };
  }
});

ipcMain.handle("log-operation", async (_, operation: any) => {
  try {
    const data = await readData();

    const historyItem: OperationHistory = {
      id: data.nextHistoryId++,
      timestamp: new Date().toISOString(),
      operation_type: operation.operation_type || operation.type || "unknown",
      operation_target:
        operation.operation_target || operation.target || "unknown",
      operation_status:
        operation.operation_status || operation.status || "unknown",
      permission_check:
        operation.permission_check || operation.permissionCheck || "",
      details: JSON.stringify(operation.details || {})
    };

    data.history.unshift(historyItem);

    // 保持历史记录不超过500条
    if (data.history.length > 500) {
      data.history = data.history.slice(0, 500);
    }

    await saveData(data);
    return true;
  } catch (error) {
    console.error("Error logging operation:", error);
    return false;
  }
});

ipcMain.handle("get-history", async (_, limit = 100) => {
  try {
    const data = await readData();
    // 为历史记录提供默认值，确保所有字段都存在
    const normalizedHistory = data.history.map((item: any) => ({
      id: item.id || 0,
      timestamp: item.timestamp || new Date().toISOString(),
      operation_type: item.operation_type || "unknown",
      operation_target: item.operation_target || "unknown",
      operation_status: item.operation_status || "unknown",
      permission_check: item.permission_check || "",
      details: item.details || "{}"
    }));
    return normalizedHistory.slice(0, limit);
  } catch (error) {
    console.error("Error getting history:", error);
    return [];
  }
});

ipcMain.handle("get-configs", async () => {
  try {
    const data = await readData();
    return data.modelConfigs.sort((a, b) => {
      if (a.is_default && !b.is_default) return -1;
      if (!a.is_default && b.is_default) return 1;
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error("Error getting configs:", error);
    return [];
  }
});

ipcMain.handle("save-config", async (_, config: any) => {
  try {
    console.log("保存模型配置:", config.name, "类型:", config.model_type);

    const data = await readData();
    console.log("读取数据成功，当前模型数:", data.modelConfigs.length);

    if (config.is_default) {
      // 清除其他配置的默认标记
      data.modelConfigs.forEach((m) => {
        m.is_default = false;
      });
      console.log("已清除其他模型的默认标记");
    }

    if (config.id) {
      // 更新现有配置
      const index = data.modelConfigs.findIndex((m) => m.id === config.id);
      if (index !== -1) {
        data.modelConfigs[index] = {
          ...config,
          id: config.id
        };
        console.log("更新现有配置:", config.id);
      } else {
        console.log("未找到配置ID:", config.id, "将创建新配置");
        // 如果未找到，创建新配置
        const newConfig: ModelConfig = {
          ...config,
          id: data.nextModelId++
        };
        data.modelConfigs.push(newConfig);
      }
    } else {
      // 插入新配置
      const newConfig: ModelConfig = {
        ...config,
        id: data.nextModelId++
      };
      data.modelConfigs.push(newConfig);
      console.log("创建新配置，ID:", newConfig.id);
    }

    await saveData(data);
    console.log("数据保存成功");
    return true;
  } catch (error) {
    console.error("Error saving config:", error);
    return false;
  }
});

ipcMain.handle("delete-config", async (_, configId: number) => {
  try {
    const data = await readData();
    const index = data.modelConfigs.findIndex((m) => m.id === configId);

    if (index === -1) {
      return false;
    }

    // 如果要删除的是默认配置，且还有其它配置，则设置第一个配置为默认
    const isDeletingDefault = data.modelConfigs[index].is_default;
    const hasOtherConfigs = data.modelConfigs.length > 1;

    data.modelConfigs.splice(index, 1);

    if (isDeletingDefault && hasOtherConfigs && data.modelConfigs.length > 0) {
      data.modelConfigs[0].is_default = true;
    }

    await saveData(data);
    return true;
  } catch (error) {
    console.error("Error deleting config:", error);
    return false;
  }
});

// AI模型调用处理器
ipcMain.handle(
  "call-model",
  async (_, configId: number, messages: any[], options: any = {}) => {
    try {
      const data = await readData();
      const modelConfig = data.modelConfigs.find((m) => m.id === configId);

      if (!modelConfig) {
        throw new Error(`模型配置不存在: ${configId}`);
      }

      // 调用对应的模型API
      const result = await callModelAPI(modelConfig, messages, options);

      // 记录操作记录
      const historyItem: OperationHistory = {
        id: data.nextHistoryId++,
        timestamp: new Date().toISOString(),
        operation_type: "model_call",
        operation_target: modelConfig.name,
        operation_status: "completed",
        permission_check: "allowed",
        details: JSON.stringify({
          model: modelConfig.name,
          type: modelConfig.model_type,
          messages_count: messages.length,
          options
        })
      };

      data.history.unshift(historyItem);
      if (data.history.length > 500) {
        data.history = data.history.slice(0, 500);
      }

      await saveData(data);
      return result;
    } catch (error) {
      console.error("AI模型调用失败:", error);

      // 记录失败历史
      const data = await readData();
      const modelConfig = data.modelConfigs.find((m) => m.id === configId);

      const historyItem: OperationHistory = {
        id: data.nextHistoryId++,
        timestamp: new Date().toISOString(),
        operation_type: "model_call",
        operation_target: modelConfig?.name || `config-${configId}`,
        operation_status: "failed",
        permission_check: "allowed",
        details: JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
          configId,
          messages_count: messages.length
        })
      };

      data.history.unshift(historyItem);
      if (data.history.length > 500) {
        data.history = data.history.slice(0, 500);
      }

      await saveData(data);
      throw error;
    }
  }
);

// ─── 通用文件上传 ─────────────────────────────────────────────────────────────
// 根据模型类型使用正确的文件上传接口
// 官方文档:
// - OpenAI: https://api.openai.com/v1/files
// - DeepSeek: https://api-docs.deepseek.com/zh-CN/guides/function_call#文件输入
// - Kimi: https://platform.moonshot.cn/docs/guide/file-upload
// - 智谱AI: https://open.bigmodel.cn/doc/api#文件上传
// - Claude: https://docs.anthropic.com/en/docs/build-with-claude/files
// - Gemini: https://ai.google.dev/gemini-api/docs/file-api
ipcMain.handle(
  "upload-file",
  async (
    _,
    configId: number,
    fileDataUrl: string,
    fileName: string,
    purpose?: string
  ) => {
    try {
      const data = await readData();
      const modelConfig = data.modelConfigs.find((m) => m.id === configId);
      if (!modelConfig) throw new Error(`模型配置不存在: ${configId}`);

      const { api_endpoint, api_key, model_type, file_upload_endpoint, file_upload_api_key } = modelConfig;

      // 从 data URL 解析 MIME type 和 base64 数据
      const match = fileDataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) throw new Error("无效的文件数据格式");
      const mimeType = match[1];
      const base64Data = match[2];
      const binaryData = Buffer.from(base64Data, "base64");

      // 确定上传接口地址
      const uploadUrl = resolveFileUploadEndpoint(api_endpoint, file_upload_endpoint, model_type);

      if (!uploadUrl) {
        throw new Error(`模型 ${model_type} 不支持直接文件上传接口，请查阅官方文档使用平台特定方式`);
      }

      console.log(`[FileUpload] 模型=${model_type}, 接口=${uploadUrl}`);

      // 构建 multipart/form-data
      const { Readable } = await import("stream");
      const FormData = (await import("form-data")).default;
      const form = new FormData();

      // 根据模型类型设置 purpose 参数
      const modelPurpose = getModelFilePurpose(model_type, purpose);
      form.append("file", Readable.from(binaryData), {
        filename: fileName,
        contentType: mimeType
      });
      if (modelPurpose) {
        form.append("purpose", modelPurpose);
      }

      // 确定 API Key
      const uploadApiKey = file_upload_api_key || api_key;

      // 根据模型类型设置请求头
      const headers: Record<string, string> = {
        Authorization: `Bearer ${uploadApiKey}`
      };

      // Claude 文件上传需要特殊 Header
      if (model_type.toLowerCase() === "claude") {
        headers["anthropic-beta"] = "files-api-2025-04-14";
      }

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers,
        body: form as any
      });

      if (!uploadResponse.ok) {
        const errText = await uploadResponse.text();

        // 针对 404 错误提供更友好的提示
        let errorMsg = `文件上传失败: ${uploadResponse.status} ${uploadResponse.statusText}`;
        if (uploadResponse.status === 404) {
          errorMsg += `\n\n上传接口地址: ${uploadUrl}`;
          errorMsg += `\n\n可能原因：`;
          errorMsg += `\n1. 文件上传接口地址不正确，请检查模型配置中的 API 端点`;
          errorMsg += `\n2. 该模型版本可能不支持文件上传，请查阅官方文档`;
          errorMsg += `\n\n建议：`;
          errorMsg += `\n- 在模型设置中，清空"自定义文件上传端点"配置`;
          errorMsg += `\n- 确保"API 端点"填写正确（如 DeepSeek: https://api.deepseek.com）`;
        } else {
          errorMsg += ` - ${errText}`;
        }

        throw new Error(errorMsg);
      }

      const result = await uploadResponse.json() as {
        id?: string;
        name?: string;
        object?: string;
        bytes?: number;
        size?: number;
        filename?: string;
        display_name?: string;
        uri?: string;
      };
      console.log(`[FileUpload] 成功: id=${result.id || result.name}, size=${result.bytes || result.size}`);

      // 统一返回格式
      return {
        fileId: result.id || result.name || "",
        object: result.object || "file",
        bytes: result.bytes || result.size || 0,
        filename: result.filename || result.display_name || fileName,
        uri: result.uri || "",
        raw: result
      };
    } catch (error) {
      console.error("[FileUpload] 文件上传失败:", error);
      throw error;
    }
  }
);

/**
 * 获取各模型文件上传的 purpose 参数
 */
function getModelFilePurpose(modelType: string, userPurpose?: string): string {
  if (userPurpose) return userPurpose;

  const purposes: Record<string, string> = {
    openai: "assistants",
    claude: "upload",
    deepseek: "file-extract",
    kimi: "file-extract",
    zhipu: "file-extract",
    gemini: "", // Gemini 不需要 purpose
  };

  return purposes[modelType.toLowerCase()] || "file";
}

// 兼容旧接口 - DeepSeek 文件上传
ipcMain.handle(
  "deepseek-upload-file",
  async (_, configId: number, fileDataUrl: string, fileName: string, purpose?: string) => {
    try {
      const data = await readData();
      const modelConfig = data.modelConfigs.find((m) => m.id === configId);
      if (!modelConfig) throw new Error(`模型配置不存在: ${configId}`);

      const { api_endpoint, api_key, model_type, file_upload_endpoint, file_upload_api_key } = modelConfig;

      // 从 data URL 解析 MIME type 和 base64 数据
      const match = fileDataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) throw new Error("无效的文件数据格式");
      const mimeType = match[1];
      const base64Data = match[2];
      const binaryData = Buffer.from(base64Data, "base64");

      // 确定上传接口地址
      const uploadUrl = resolveFileUploadEndpoint(api_endpoint, file_upload_endpoint, model_type);

      if (!uploadUrl) {
        throw new Error(`模型 ${model_type} 不支持直接文件上传接口，请查阅官方文档使用平台特定方式`);
      }

      console.log(`[DeepSeek FileUpload] 模型=${model_type}, 接口=${uploadUrl}, 文件=${fileName}`);

      // 构建 multipart/form-data
      const { Readable } = await import("stream");
      const FormData = (await import("form-data")).default;
      const form = new FormData();

      // 根据模型类型设置 purpose 参数
      const modelPurpose = getModelFilePurpose(model_type, purpose);
      form.append("file", Readable.from(binaryData), {
        filename: fileName,
        contentType: mimeType
      });
      if (modelPurpose) {
        form.append("purpose", modelPurpose);
      }

      const uploadApiKey = file_upload_api_key || api_key;

      // 设置请求头
      const headers: Record<string, string> = {
        Authorization: `Bearer ${uploadApiKey}`
      };

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers,
        body: form as any
      });

      if (!uploadResponse.ok) {
        const errText = await uploadResponse.text();
        throw new Error(`DeepSeek 文件上传失败 (${uploadResponse.status}): ${errText}`);
      }

      const uploadResult: any = await uploadResponse.json();
      console.log("[DeepSeek FileUpload] 上传成功:", uploadResult);

      // DeepSeek 返回格式: { id: "file-xxx", object: "file", ... }
      const fileId = uploadResult.id;
      if (!fileId) {
        throw new Error(`DeepSeek 返回的响应中缺少 file_id: ${JSON.stringify(uploadResult)}`);
      }

      return { fileId };
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      console.error("[DeepSeek FileUpload] 错误:", errMsg);
      throw e;
    }
  }
);

// 获取上传文件的内容（用于Kimi等需要将文件内容注入到消息中的模型）
ipcMain.handle(
  "get-file-content",
  async (_, configId: number, fileId: string) => {
    try {
      const data = await readData();
      const modelConfig = data.modelConfigs.find((m) => m.id === configId);
      if (!modelConfig) throw new Error(`模型配置不存在: ${configId}`);

      const { api_endpoint, api_key, model_type, file_upload_endpoint, file_upload_api_key } = modelConfig;

      // 确定上传接口地址
      const uploadUrl = resolveFileUploadEndpoint(api_endpoint, file_upload_endpoint, model_type);

      if (!uploadUrl) {
        throw new Error(`模型 ${model_type} 不支持文件内容获取`);
      }

      console.log(`[GetFileContent] 模型=${model_type}, 接口=${uploadUrl}, fileId=${fileId}`);

      const uploadApiKey = file_upload_api_key || api_key;

      // 构建文件内容获取URL
      const fileContentUrl = `${uploadUrl}/${fileId}/content`;

      // 设置请求头
      const headers: Record<string, string> = {
        Authorization: `Bearer ${uploadApiKey}`
      };

      const response = await fetch(fileContentUrl, {
        method: "GET",
        headers
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`获取文件内容失败 (${response.status}): ${errText}`);
      }

      // Kimi 返回纯文本内容，其他模型可能返回JSON
      const contentType = response.headers.get("content-type") || "";
      let fileContent: string;

      if (contentType.includes("text/plain") || contentType.includes("text/markdown")) {
        fileContent = await response.text();
      } else {
        fileContent = await response.text();
      }

      console.log("[GetFileContent] 获取成功:", fileContent.substring(0, 200));

      return { content: fileContent };
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      console.error("[GetFileContent] 错误:", errMsg);
      throw e;
    }
  }
);

// 获取所有工作区
ipcMain.handle("get-workspaces", async () => {
  try {
    const data = await readData();
    return data.workspaces.sort((a, b) => {
      if (a.is_active && !b.is_active) return -1;
      if (!a.is_active && b.is_active) return 1;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  } catch (error) {
    console.error("Error getting workspaces:", error);
    return [];
  }
});

// 切换工作区
ipcMain.handle("switch-workspace", async (_, workspaceId: number) => {
  try {
    const data = await readData();

    // 清除所有工作区的激活状态
    data.workspaces.forEach((w) => {
      w.is_active = false;
    });

    // 激活指定工作区
    const workspace = data.workspaces.find((w) => w.id === workspaceId);
    if (workspace) {
      workspace.is_active = true;
    }

    await saveData(data);
    return true;
  } catch (error) {
    console.error("Error switching workspace:", error);
    return false;
  }
});

ipcMain.handle(
  "set-workspace",
  async (_, workspacePath: string, workspaceName: string) => {
    try {
      console.log("设置工作区:", workspaceName, "路径:", workspacePath);

      const data = await readData();
      console.log("读取数据成功，当前工作区数:", data.workspaces.length);

      // 清除其他工作区激活状态
      data.workspaces.forEach((w) => {
        w.is_active = false;
      });

      // 检查工作区是否已存在
      const existingIndex = data.workspaces.findIndex(
        (w) => w.path === workspacePath
      );

      if (existingIndex !== -1) {
        // 更新现有工作区
        data.workspaces[existingIndex].name = workspaceName;
        data.workspaces[existingIndex].is_active = true;
        console.log("更新现有工作区，ID:", data.workspaces[existingIndex].id);
      } else {
        // 插入新工作区
        const newWorkspace: Workspace = {
          id: data.nextWorkspaceId++,
          path: workspacePath,
          name: workspaceName,
          created_at: new Date().toISOString(),
          is_active: true
        };
        data.workspaces.push(newWorkspace);
        console.log("创建新工作区，ID:", newWorkspace.id);
      }

      await saveData(data);
      console.log("工作区数据保存成功");
      return true;
    } catch (error) {
      console.error("Error setting workspace:", error);
      return false;
    }
  }
);

ipcMain.handle("get-active-workspace", async () => {
  try {
    const data = await readData();
    const activeWorkspace = data.workspaces.find((w) => w.is_active);
    return activeWorkspace || null;
  } catch (error) {
    console.error("Error getting active workspace:", error);
    return null;
  }
});

ipcMain.handle("open-external", async (_, url: string) => {
  await shell.openExternal(url);
  return true;
});

// ── 打开文件夹 ─────────────────────────────────────────────────────────────
ipcMain.handle("open-folder", async (_, folderPath: string) => {
  try {
    console.log("尝试打开文件夹:", folderPath);
    await shell.openPath(folderPath);
    console.log("文件夹打开成功");
    return { success: true };
  } catch (e) {
    console.error("打开文件夹失败:", e);
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
});

// ── 在文件管理器中显示文件 ────────────────────────────────────────────────
ipcMain.handle("show-item-in-folder", async (_, filePath: string) => {
  try {
    shell.showItemInFolder(filePath);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
});

// ── 获取/创建 Claw 工作目录 ─────────────────────────────────────────────────
ipcMain.handle("get-claw-workspace", async () => {
  const clawWorkspace = path.join(app.getPath("userData"), "claw-workspace");
  if (!fsSync.existsSync(clawWorkspace)) {
    await fs.mkdir(clawWorkspace, { recursive: true });
  }
  return clawWorkspace;
});

// ── 创建 Claw 会话目录 ─────────────────────────────────────────────────────
ipcMain.handle("create-claw-session-dir", async (_, taskData: { taskId: string; sessionDirName?: string }, customWorkspace?: string) => {
  const clawWorkspace = customWorkspace || path.join(app.getPath("userData"), "claw-workspace");
  const { taskId, sessionDirName } = taskData;
  console.log("创建会话目录，工作区:", clawWorkspace, "任务ID:", taskId, "目录名:", sessionDirName);

  // 使用 YYYYMMDDhhmmss 格式作为目录名
  let sessionDir: string;
  if (sessionDirName) {
    // 如果已提供目录名，直接使用（切换任务时）
    sessionDir = sessionDirName;
  } else {
    // 否则生成新的时间戳目录名（创建新任务时）
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    sessionDir = `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  const sessionPath = path.join(clawWorkspace, sessionDir);
  console.log("会话目录:", sessionDir, "完整路径:", sessionPath);
  try {
    if (!fsSync.existsSync(clawWorkspace)) {
      await fs.mkdir(clawWorkspace, { recursive: true });
      console.log("创建工作区目录成功");
    }
    if (!fsSync.existsSync(sessionPath)) {
      await fs.mkdir(sessionPath, { recursive: true });
      console.log("创建会话目录成功");
    } else {
      console.log("会话目录已存在，直接使用");
    }
    console.log("会话目录准备完成:", sessionPath);
    return { success: true, path: sessionPath, baseDir: clawWorkspace, sessionDir };
  } catch (e) {
    console.error("创建会话目录失败:", e);
    return { success: false, error: e instanceof Error ? e.message : String(e), path: "", baseDir: "", sessionDir: "" };
  }
});

// ── 保存 Claw 会话内容到 .md 文件 ─────────────────────────────────────────────────────
ipcMain.handle("save-claw-session-md", async (_, data: { 
  sessionDirName: string; 
  content: string;
  workspacePath?: string;
}) => {
  const { sessionDirName, content, workspacePath } = data;
  const clawWorkspace = workspacePath || path.join(app.getPath("userData"), "claw-workspace");
  const sessionPath = path.join(clawWorkspace, sessionDirName);
  const mdFilePath = path.join(sessionPath, "session.md");

  console.log("保存会话内容到:", mdFilePath);

  try {
    // 确保会话目录存在
    if (!fsSync.existsSync(sessionPath)) {
      await fs.mkdir(sessionPath, { recursive: true });
    }

    // 写入 .md 文件
    await fs.writeFile(mdFilePath, content, 'utf-8');
    console.log("会话内容保存成功");

    return { success: true, path: mdFilePath };
  } catch (e) {
    console.error("保存会话内容失败:", e);
    return { success: false, error: e instanceof Error ? e.message : String(e), path: "" };
  }
});

// ── 读取 Claw 会话内容从 .md 文件 ─────────────────────────────────────────────────────
ipcMain.handle("load-claw-session-md", async (_, data: { 
  sessionDirName: string;
  workspacePath?: string;
}) => {
  const { sessionDirName, workspacePath } = data;
  const clawWorkspace = workspacePath || path.join(app.getPath("userData"), "claw-workspace");
  const sessionPath = path.join(clawWorkspace, sessionDirName);
  const mdFilePath = path.join(sessionPath, "session.md");

  console.log("读取会话内容从:", mdFilePath);

  try {
    if (!fsSync.existsSync(mdFilePath)) {
      return { success: true, content: "" }; // 文件不存在，返回空内容
    }

    const content = await fs.readFile(mdFilePath, 'utf-8');
    console.log("会话内容读取成功");

    return { success: true, content };
  } catch (e) {
    console.error("读取会话内容失败:", e);
    return { success: false, error: e instanceof Error ? e.message : String(e), content: "" };
  }
});

// ── Claw 编程自动化：写文件 ───────────────────────────────────────────────────
ipcMain.handle(
  "claw-write-file",
  async (
    _,
    filePath: string,
    content: string
  ): Promise<{ success: boolean; path: string; error?: string }> => {
    try {
      // 路径安全检查：禁止绝对路径跨越到系统敏感目录
      const resolved = path.resolve(filePath);
      const forbidden = [
        "/System",
        "/usr",
        "/bin",
        "/sbin",
        "/etc",
        "C:\\Windows",
        "C:\\Program Files"
      ];
      if (forbidden.some((f) => resolved.startsWith(f))) {
        return { success: false, path: resolved, error: "禁止写入系统目录" };
      }
      // 自动创建父目录
      await fs.mkdir(path.dirname(resolved), { recursive: true });
      await fs.writeFile(resolved, content, "utf-8");
      return { success: true, path: resolved };
    } catch (e) {
      return {
        success: false,
        path: filePath,
        error: e instanceof Error ? e.message : String(e)
      };
    }
  }
);

// ── Claw 编程自动化：读文件 ───────────────────────────────────────────────────
ipcMain.handle(
  "claw-read-file",
  async (
    _,
    filePath: string
  ): Promise<{ success: boolean; path: string; content?: string; error?: string }> => {
    try {
      // 路径安全检查：禁止读取系统敏感目录
      const resolved = path.resolve(filePath);
      const forbidden = [
        "/System",
        "/usr",
        "/bin",
        "/sbin",
        "/etc",
        "C:\\Windows",
        "C:\\Program Files"
      ];
      if (forbidden.some((f) => resolved.startsWith(f))) {
        return { success: false, path: resolved, error: "禁止读取系统目录" };
      }
      // 检查文件是否存在
      if (!fsSync.existsSync(resolved)) {
        return { success: false, path: resolved, error: "文件不存在" };
      }
      // 读取文件内容
      const content = await fs.readFile(resolved, "utf-8");
      // 限制读取大小（最多100KB）
      if (content.length > 100 * 1024) {
        return {
          success: false,
          path: resolved,
          error: "文件过大，限制读取100KB以内"
        };
      }
      return { success: true, path: resolved, content };
    } catch (e) {
      return {
        success: false,
        path: filePath,
        error: e instanceof Error ? e.message : String(e)
      };
    }
  }
);

// ── Claw 编程自动化：扫描目录获取文件列表 ─────────────────────────────────
ipcMain.handle(
  "claw-scan-directory",
  async (
    _,
    dirPath: string
  ): Promise<{ success: boolean; files?: Array<{ name: string; path: string; type: string; size: number; createdAt: string }>; error?: string }> => {
    try {
      // 路径安全检查：禁止扫描系统敏感目录
      const resolved = path.resolve(dirPath);
      const forbidden = [
        "/System",
        "/usr",
        "/bin",
        "/sbin",
        "/etc",
        "C:\\Windows",
        "C:\\Program Files"
      ];
      if (forbidden.some((f) => resolved.startsWith(f))) {
        return { success: false, error: "禁止扫描系统目录" };
      }
      // 检查目录是否存在
      if (!fsSync.existsSync(resolved)) {
        return { success: false, error: "目录不存在" };
      }
      // 递归扫描目录获取所有文件
      const files: Array<{ name: string; path: string; type: string; size: number; createdAt: string }> = [];
      
      const scanDir = (dir: string) => {
        const items = fsSync.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fsSync.statSync(fullPath);
          if (stat.isDirectory()) {
            // 递归扫描子目录
            scanDir(fullPath);
          } else {
            // 添加文件信息
            const ext = path.extname(item).toLowerCase();
            files.push({
              name: item,
              path: fullPath,
              type: ext.slice(1) || "text",
              size: stat.size,
              createdAt: stat.birthtime.toISOString()
            });
          }
        }
      };
      
      scanDir(resolved);
      return { success: true, files };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : String(e)
      };
    }
  }
);

// ── 在编辑器中打开文件 ─────────────────────────────────────────────────────
ipcMain.handle(
  "open-file-in-editor",
  async (_, filePath: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const resolved = path.resolve(filePath);
      // 检查文件是否存在
      if (!fsSync.existsSync(resolved)) {
        return { success: false, error: "文件不存在" };
      }
      // 使用默认应用打开文件
      const { shell } = require("electron");
      await shell.openPath(resolved);
      return { success: true };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : String(e)
      };
    }
  }
);

// ── Claw 编程自动化：执行命令 ─────────────────────────────────────────────────
ipcMain.handle(
  "claw-exec-command",
  async (
    _,
    command: string,
    cwd?: string,
    timeoutMs = 30000
  ): Promise<{
    success: boolean;
    stdout: string;
    stderr: string;
    exitCode: number;
    error?: string;
  }> => {
    return new Promise((resolve) => {
      // 安全黑名单：禁止危险命令
      const blocked = [
        "rm -rf /",
        "format",
        "del /f /s /q",
        "mkfs",
        "dd if=",
        ":(){:|:&};:"
      ];
      const lower = command.toLowerCase();
      if (blocked.some((b) => lower.includes(b))) {
        return resolve({
          success: false,
          stdout: "",
          stderr: "命令被安全策略拒绝",
          exitCode: -1
        });
      }

      const timer = setTimeout(() => {
        child.kill();
        resolve({
          success: false,
          stdout: "",
          stderr: `命令执行超时（${timeoutMs / 1000}s）`,
          exitCode: -1
        });
      }, timeoutMs);

      const child = exec(
        command,
        {
          cwd: cwd || app.getPath("home"),
          maxBuffer: 5 * 1024 * 1024 // 5MB
        },
        (error, stdout, stderr) => {
          clearTimeout(timer);
          resolve({
            success: !error || error.code === 0,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            exitCode: (error?.code as number) ?? 0,
            error: error ? error.message : undefined
          });
        }
      );
    });
  }
);

// 窗口控制
ipcMain.on("window-minimize", () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on("window-maximize", () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on("window-close", () => {
  if (mainWindow) mainWindow.close();
});

// 开发工具
ipcMain.on("open-devtools", () => {
  if (mainWindow) {
    mainWindow.webContents.openDevTools();
  }
});
