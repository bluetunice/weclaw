import { Skill, SkillCategory, SkillPackage } from "../../types";

export const CATEGORY_LABELS: Record<SkillCategory, string> = {
  productivity: "效率",
  coding: "编程",
  writing: "写作",
  analysis: "分析",
  communication: "沟通",
  custom: "自定义",
};

export const CATEGORY_COLORS: Record<SkillCategory, string> = {
  productivity: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700",
  coding:       "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-700",
  writing:      "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700",
  analysis:     "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-700",
  communication:"bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-700",
  custom:       "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600",
};

export const STORAGE_KEY = "claw_skills";

export function loadSkills(): Skill[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Skill[];
  } catch {}
  return getBuiltinSkills();
}

export function saveSkills(skills: Skill[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(skills));
}

export function exportSkillPackage(skills: Skill[]): void {
  const pkg: SkillPackage = {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    skills,
  };
  const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `claw-skills-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseSkillPackage(json: string): SkillPackage | null {
  try {
    const pkg = JSON.parse(json) as SkillPackage;
    if (!Array.isArray(pkg.skills)) return null;
    return pkg;
  } catch {
    return null;
  }
}

export function newSkill(): Skill {
  return {
    id: `skill_${Date.now()}`,
    name: "",
    description: "",
    category: "custom",
    version: "1.0.0",
    author: "User",
    tags: [],
    content: "",
    enabled: true,
    builtin: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function getBuiltinSkills(): Skill[] {
  const now = new Date().toISOString();
  return [
    {
      id: "builtin_weekly_report",
      name: "生成周报",
      description: "根据本周工作记录自动生成结构化周报，包括完成事项、进行中任务和下周计划。",
      category: "productivity",
      version: "1.0.0",
      author: "Claw Team",
      tags: ["周报", "汇报", "效率"],
      content: `你是一个专业的工作汇报助手。请根据用户提供的工作记录，生成一份结构清晰的周报。

周报格式：
## 本周工作总结
### 已完成事项
- ...

### 进行中事项
- ...

### 遇到的问题
- ...

## 下周工作计划
- ...

请用简洁专业的语言描述，突出重点成果。`,
      enabled: true,
      builtin: true,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    },
    {
      id: "builtin_code_review",
      name: "代码审查",
      description: "对提交的代码进行全面审查，包括逻辑、性能、安全和最佳实践。",
      category: "coding",
      version: "1.0.0",
      author: "Claw Team",
      tags: ["代码审查", "Code Review", "质量"],
      content: `你是一个资深代码审查工程师。请对以下代码进行全面审查，包括：

1. **逻辑正确性**：检查业务逻辑是否正确
2. **性能**：识别潜在的性能瓶颈
3. **安全性**：发现安全漏洞（注入、越权等）
4. **可维护性**：代码可读性和结构
5. **最佳实践**：是否符合语言/框架惯例

请给出具体改进建议，并标注严重程度（🔴 严重 / 🟡 建议 / 🟢 优化）。`,
      enabled: true,
      builtin: true,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    },
    {
      id: "builtin_translate",
      name: "智能翻译",
      description: "高质量双向翻译，自动识别源语言，保留原文格式和语气。",
      category: "writing",
      version: "1.0.0",
      author: "Claw Team",
      tags: ["翻译", "中英互译", "多语言"],
      content: `你是一位专业翻译。请自动识别输入语言并翻译：
- 中文 → 英文
- 其他语言 → 中文

翻译要求：
1. 保持原文语气和格式
2. 专业术语使用行业标准译法
3. 若有多种译法，提供最地道的版本
4. 对于歧义内容，简要说明不同理解`,
      enabled: true,
      builtin: true,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    },
    {
      id: "builtin_data_analysis",
      name: "数据分析",
      description: "分析用户提供的数据，提取关键指标、趋势和洞察，生成分析报告。",
      category: "analysis",
      version: "1.0.0",
      author: "Claw Team",
      tags: ["数据分析", "统计", "报告"],
      content: `你是一位数据分析专家。请对提供的数据进行分析：

1. **数据概览**：描述数据集的基本特征
2. **关键指标**：计算和解释核心统计指标
3. **趋势分析**：识别时间序列或类别趋势
4. **异常检测**：标注异常值和离群点
5. **结论与建议**：基于数据提出可行建议

请用图表描述（表格、列表）配合文字说明。`,
      enabled: true,
      builtin: true,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    },
    {
      id: "builtin_email_writer",
      name: "邮件助手",
      description: "根据场景和要点，生成专业、得体的商务邮件。",
      category: "communication",
      version: "1.0.0",
      author: "Claw Team",
      tags: ["邮件", "商务写作", "沟通"],
      content: `你是一位专业的商务写作助手。请根据用户提供的场景和要点，生成一封完整的商务邮件。

邮件应包含：
- 主题行（简洁有力）
- 称呼
- 正文（开门见山、逻辑清晰）
- 结尾语
- 签名

语气要求：专业、礼貌、清晰。如用户未指定语言，默认使用中文。`,
      enabled: true,
      builtin: true,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    },
    {
      id: "builtin_desktop_organizer",
      name: "整理桌面",
      description: "分析桌面文件，给出智能分类整理方案。",
      category: "productivity",
      version: "1.0.0",
      author: "Claw Team",
      tags: ["文件整理", "桌面", "组织"],
      content: `你是一个文件整理专家。根据用户描述的桌面文件情况，给出具体的整理方案：

1. 按类型分类（文档、图片、视频、安装包等）
2. 按项目或时间归档
3. 建议文件夹命名规范
4. 提供快速清理建议（可删除的临时文件）

请给出具体可执行的步骤。`,
      enabled: true,
      builtin: true,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    },
  ];
}
