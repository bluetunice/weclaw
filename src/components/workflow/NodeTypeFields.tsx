import React, { useMemo } from "react";
import { WorkflowNodeType, Tool } from "../../types";
import { loadTools } from "../../components/tools/toolUtils";

interface FieldsProps {
  type:     WorkflowNodeType;
  config:   Record<string, any>;
  onChange: (key: string, val: any) => void;
  t:        (k: string) => string;
}

// 通用字段渲染器
const Field: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
    {children}
  </div>
);

const useField = (config: Record<string, any>, onChange: (k: string, v: any) => void) => ({
  text: (key: string, label: string, placeholder?: string) => (
    <Field key={key} label={label}>
      <input type="text" className="input text-sm w-full" value={config[key] ?? ""}
        onChange={(e) => onChange(key, e.target.value)} placeholder={placeholder} />
    </Field>
  ),
  textarea: (key: string, label: string, placeholder?: string) => (
    <Field key={key} label={label}>
      <textarea className="input text-sm w-full min-h-[80px] resize-none font-mono"
        value={config[key] ?? ""} onChange={(e) => onChange(key, e.target.value)} placeholder={placeholder} />
    </Field>
  ),
  select: (key: string, label: string, options: string[]) => (
    <Field key={key} label={label}>
      <select className="input text-sm w-full" value={config[key] ?? ""}
        onChange={(e) => onChange(key, e.target.value)}>
        <option value="">-- 请选择 --</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </Field>
  ),
  number: (key: string, label: string, placeholder?: string) => (
    <Field key={key} label={label}>
      <input type="number" className="input text-sm w-full" value={config[key] ?? ""}
        onChange={(e) => onChange(key, Number(e.target.value))} placeholder={placeholder} />
    </Field>
  ),
});

// ─── 工具调用节点专属配置组件 ─────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  string: "文本",
  number: "数字",
  boolean: "布尔",
  array: "数组",
  object: "对象",
};

const ToolCallFields: React.FC<{
  config: Record<string, any>;
  onChange: (key: string, val: any) => void;
  t: (k: string) => string;
}> = ({ config, onChange, t }) => {
  // 读取本地工具列表（仅启用的工具）
  const tools: Tool[] = useMemo(
    () => loadTools().filter((tool) => tool.enabled),
    [],
  );

  const selectedTool = useMemo(
    () => tools.find((tool) => tool.id === config.toolId) ?? null,
    [tools, config.toolId],
  );

  // 按分类分组
  const grouped = useMemo(() => {
    const map: Record<string, Tool[]> = {};
    tools.forEach((tool) => {
      const cat = tool.category || t("workflow.node.toolUncategorized");
      (map[cat] = map[cat] || []).push(tool);
    });
    return map;
  }, [tools, t]);

  const handleToolChange = (toolId: string) => {
    const tool = tools.find((to) => to.id === toolId);
    if (!tool) { onChange("toolId", ""); return; }
    // 切换工具时清空参数
    onChange("toolId", toolId);
    onChange("toolParams", {});
  };

  const handleParamChange = (paramName: string, val: string) => {
    onChange("toolParams", { ...(config.toolParams ?? {}), [paramName]: val });
  };

  return (
    <div className="space-y-4">
      {/* 工具选择 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          {t("workflow.node.selectTool")}
        </label>
        {tools.length === 0 ? (
          <p className="text-xs text-amber-500 italic">
            {t("workflow.node.noEnabledTools")}
          </p>
        ) : (
          <select
            className="input text-sm w-full"
            value={config.toolId ?? ""}
            onChange={(e) => handleToolChange(e.target.value)}
          >
            <option value="">-- {t("workflow.node.selectTool")} --</option>
            {Object.entries(grouped).map(([cat, catTools]) => (
              <optgroup key={cat} label={cat}>
                {catTools.map((tool) => (
                  <option key={tool.id} value={tool.id}>
                    {tool.icon} {tool.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        )}
      </div>

      {/* 已选工具信息预览 */}
      {selectedTool && (
        <div className="rounded-lg border border-rose-100 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-base leading-none">{selectedTool.icon}</span>
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">
              {selectedTool.name}
            </span>
            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-800 text-rose-600 dark:text-rose-300">
              {selectedTool.type}
            </span>
          </div>
          {selectedTool.description && (
            <p className="text-[11px] text-rose-500 dark:text-rose-400">
              {selectedTool.description}
            </p>
          )}
        </div>
      )}

      {/* 动态参数填写 */}
      {selectedTool && selectedTool.params.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {t("workflow.node.toolParams")}
          </p>
          {selectedTool.params.map((param) => (
            <div key={param.name}>
              <label className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {param.name}
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal">
                  ({TYPE_LABEL[param.type] ?? param.type})
                </span>
                {param.required && (
                  <span className="text-red-400 text-[10px]">*</span>
                )}
              </label>
              {param.type === "boolean" ? (
                <select
                  className="input text-sm w-full"
                  value={config.toolParams?.[param.name] ?? (param.default ?? "")}
                  onChange={(e) => handleParamChange(param.name, e.target.value)}
                >
                  <option value="">-- 请选择 --</option>
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              ) : param.type === "object" || param.type === "array" ? (
                <textarea
                  className="input text-sm w-full min-h-[70px] resize-none font-mono"
                  value={config.toolParams?.[param.name] ?? (param.default ? JSON.stringify(param.default, null, 2) : "")}
                  onChange={(e) => handleParamChange(param.name, e.target.value)}
                  placeholder={`JSON ${TYPE_LABEL[param.type]}，可用 {{变量名}} 引用`}
                />
              ) : (
                <input
                  type={param.type === "number" ? "text" : "text"}
                  className="input text-sm w-full"
                  value={config.toolParams?.[param.name] ?? (param.default ?? "")}
                  onChange={(e) => handleParamChange(param.name, e.target.value)}
                  placeholder={
                    param.description
                      ? `${param.description}（可用 {{变量名}} 引用）`
                      : `可用 {{变量名}} 引用上下文`
                  }
                />
              )}
              {param.description && (
                <p className="mt-0.5 text-[10px] text-gray-400">{param.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 无参数提示 */}
      {selectedTool && selectedTool.params.length === 0 && (
        <p className="text-xs text-gray-400 italic">
          {t("workflow.node.toolNoParams")}
        </p>
      )}

      {/* 输出变量 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          {t("workflow.node.outputVar")}
        </label>
        <input
          type="text"
          className="input text-sm w-full"
          value={config.outputVar ?? ""}
          onChange={(e) => onChange("outputVar", e.target.value)}
          placeholder="tool_result"
        />
      </div>
    </div>
  );
};

export const NodeTypeFields: React.FC<FieldsProps> = ({ type, config, onChange, t }) => {
  const f = useField(config, onChange);
  const wrap = (...els: React.ReactNode[]) => <div className="space-y-3">{els}</div>;

  switch (type) {
    case "start":
      return <p className="text-xs text-gray-400 italic">{t("workflow.node.startTip")}</p>;
    case "end":
      return wrap(
        f.text("outputVar", t("workflow.node.outputVar"), "result"),
        f.textarea("message", t("workflow.node.endMessage"), "工作流执行完成"),
      );
    case "ai_query":
      return wrap(
        f.select("model", t("workflow.node.model"), ["gpt-4", "gpt-3.5-turbo", "claude-3", "deepseek", "自定义"]),
        f.textarea("prompt", t("workflow.node.prompt"), "请输入提示词，可用 {{变量名}} 引用上下文变量"),
        f.number("temperature", t("workflow.node.temperature"), "0.7"),
        f.text("outputVar", t("workflow.node.outputVar"), "ai_result"),
      );
    case "condition":
      return wrap(
        f.textarea("condition", t("workflow.node.condition"), "{{score}} > 80"),
        <p key="tip" className="text-[11px] text-gray-400">{t("workflow.node.conditionTip")}</p>,
      );
    case "file_operation":
      return wrap(
        f.select("operation", t("workflow.node.operation"), ["read", "write", "append", "delete", "copy", "move"]),
        f.text("path", t("workflow.node.filePath"), "/workspace/output.txt"),
        f.textarea("content", t("workflow.node.fileContent"), "{{content}}"),
        f.text("outputVar", t("workflow.node.outputVar"), "file_content"),
      );
    case "code_generation":
      return wrap(
        f.select("language", t("workflow.node.language"), ["javascript", "typescript", "python", "bash", "sql"]),
        f.textarea("code", t("workflow.node.code"), "// 在此编写代码\n// 使用 return 返回结果"),
        f.text("outputVar", t("workflow.node.outputVar"), "code_result"),
      );
    case "task_creation":
      return wrap(
        f.text("title", t("workflow.node.taskTitle"), "{{task_name}}"),
        f.textarea("description", t("workflow.node.taskDesc"), "{{task_desc}}"),
        f.select("priority", t("workflow.node.priority"), ["low", "medium", "high", "critical"]),
      );
    case "notification":
      return wrap(
        f.select("channel", t("workflow.node.channel"), ["email", "slack", "webhook", "system"]),
        f.textarea("message", t("workflow.node.message"), "{{notification_content}}"),
        f.text("recipients", t("workflow.node.recipients"), "user@example.com"),
      );
    case "web_scraping":
      return wrap(
        f.text("url", t("workflow.node.url"), "https://example.com"),
        f.text("selector", t("workflow.node.selector"), ".content"),
        f.text("outputVar", t("workflow.node.outputVar"), "scraped_data"),
      );
    case "data_processing":
      return wrap(
        f.select("operation", t("workflow.node.dataOp"), ["filter", "map", "sort", "group", "merge", "split", "format"]),
        f.text("input", t("workflow.node.inputVar"), "{{data}}"),
        f.textarea("script", t("workflow.node.script"), "// data => processed_data"),
        f.text("outputVar", t("workflow.node.outputVar"), "processed"),
      );
    case "command_execution":
      return wrap(
        f.textarea("command", t("workflow.node.command"), "echo {{input}}"),
        f.text("workingDir", t("workflow.node.workingDir"), "/workspace"),
        f.number("timeout", t("workflow.node.timeout"), "30"),
        f.text("outputVar", t("workflow.node.outputVar"), "cmd_output"),
      );
    case "skill":
      return wrap(
        f.text("skillId", t("workflow.node.skillId"), "skill-id"),
        f.textarea("inputs", t("workflow.node.inputs"), '{"key": "{{value}}"}'),
        f.text("outputVar", t("workflow.node.outputVar"), "skill_result"),
      );
    case "parallel":
      return wrap(
        f.number("branches", t("workflow.node.branches"), "2"),
        f.select("waitStrategy", t("workflow.node.waitStrategy"), ["all", "any"]),
      );
    case "loop":
      return wrap(
        f.text("iterateVar", t("workflow.node.iterateVar"), "{{items}}"),
        f.text("itemVar", t("workflow.node.itemVar"), "item"),
        f.number("maxIterations", t("workflow.node.maxIterations"), "100"),
      );
    case "tool_call":
      return <ToolCallFields config={config} onChange={onChange} t={t} />;
    default:
      return null;
  }
};
