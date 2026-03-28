// 本地 skills 存储工具

export interface LocalSkill {
  id: string;
  name: string;
  description: string;
  prompt: string;
  enabled: boolean;
  createdAt: Date;
}

// 默认的示例 skills
const DEFAULT_SKILLS: LocalSkill[] = [
  {
    id: 'code-review',
    name: '代码审查',
    description: '对代码进行审查并提出改进建议',
    prompt: '请作为代码审查专家，审查以下代码并提供详细的改进建议。',
    enabled: true,
    createdAt: new Date()
  },
  {
    id: 'code-explain',
    name: '代码解释',
    description: '详细解释代码的功能和工作原理',
    prompt: '请详细解释以下代码的功能、工作原理和关键点。',
    enabled: true,
    createdAt: new Date()
  },
  {
    id: 'bug-fix',
    name: 'Bug 修复',
    description: '分析并修复代码中的 bug',
    prompt: '请分析以下代码中的问题并提供修复方案。',
    enabled: true,
    createdAt: new Date()
  },
  {
    id: 'refactor',
    name: '代码重构',
    description: '重构代码以提高可读性和性能',
    prompt: '请重构以下代码，提高其可读性和性能。',
    enabled: true,
    createdAt: new Date()
  }
];

const STORAGE_KEY = 'workbuddy_local_skills';

// 获取所有 skills
export function getLocalSkills(): LocalSkill[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // 首次使用，保存默认 skills
    saveLocalSkills(DEFAULT_SKILLS);
    return DEFAULT_SKILLS;
  } catch (error) {
    console.error('Failed to load skills:', error);
    return DEFAULT_SKILLS;
  }
}

// 保存 skills
export function saveLocalSkills(skills: LocalSkill[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(skills));
  } catch (error) {
    console.error('Failed to save skills:', error);
  }
}

// 添加 skill
export function addLocalSkill(skill: Omit<LocalSkill, 'id' | 'createdAt'>): LocalSkill {
  const skills = getLocalSkills();
  const newSkill: LocalSkill = {
    ...skill,
    id: `skill-${Date.now()}`,
    createdAt: new Date()
  };
  skills.push(newSkill);
  saveLocalSkills(skills);
  return newSkill;
}

// 更新 skill
export function updateLocalSkill(id: string, updates: Partial<LocalSkill>): void {
  const skills = getLocalSkills();
  const index = skills.findIndex(s => s.id === id);
  if (index !== -1) {
    skills[index] = { ...skills[index], ...updates };
    saveLocalSkills(skills);
  }
}

// 删除 skill
export function deleteLocalSkill(id: string): void {
  const skills = getLocalSkills();
  const filtered = skills.filter(s => s.id !== id);
  saveLocalSkills(filtered);
}

// 切换 skill 启用状态
export function toggleLocalSkill(id: string): void {
  const skills = getLocalSkills();
  const skill = skills.find(s => s.id === id);
  if (skill) {
    skill.enabled = !skill.enabled;
    saveLocalSkills(skills);
  }
}
