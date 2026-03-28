/**
 * 用户认证存储工具
 * 使用 localStorage 进行持久化存储，支持用户注册、登录、密码修改
 */

const STORAGE_KEYS = {
  USERS: 'claw_users',
  CURRENT_USER: 'claw_current_user',
} as const;

export interface User {
  username: string;
  passwordHash: string;
  createdAt: string;
  lastLogin?: string;
}

// 简单哈希函数（生产环境应使用更安全的加密方式）
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0') + password.length.toString(16);
}

/**
 * 初始化默认用户（首次使用时创建）
 */
export function initDefaultUser(): void {
  const users = getUsers();
  if (users.length === 0) {
    // 创建默认管理员账号
    const defaultUser: User = {
      username: 'admin',
      passwordHash: simpleHash('admin123'),
      createdAt: new Date().toISOString(),
    };
    saveUsers([defaultUser]);
    console.log('默认用户已创建: admin / admin123');
  }
}

/**
 * 获取所有用户
 */
export function getUsers(): User[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * 保存用户列表
 */
function saveUsers(users: User[]): void {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

/**
 * 验证用户名密码
 */
export function verifyCredentials(username: string, password: string): boolean {
  const users = getUsers();
  const user = users.find(u => u.username === username);
  if (!user) return false;
  return user.passwordHash === simpleHash(password);
}

/**
 * 检查用户名是否存在
 */
export function usernameExists(username: string): boolean {
  const users = getUsers();
  return users.some(u => u.username === username);
}

/**
 * 注册新用户
 */
export function registerUser(username: string, password: string): boolean {
  if (usernameExists(username)) {
    return false;
  }
  const users = getUsers();
  const newUser: User = {
    username,
    passwordHash: simpleHash(password),
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);
  return true;
}

/**
 * 修改密码
 */
export function changePassword(username: string, newPassword: string): boolean {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.username === username);
  if (userIndex === -1) return false;
  
  users[userIndex].passwordHash = simpleHash(newPassword);
  saveUsers(users);
  return true;
}

/**
 * 设置当前登录用户
 */
export function setCurrentUser(username: string | null): void {
  if (username) {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex !== -1) {
      users[userIndex].lastLogin = new Date().toISOString();
      saveUsers(users);
    }
  }
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, username || '');
}

/**
 * 获取当前登录用户
 */
export function getCurrentUser(): string | null {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
}

/**
 * 检查是否已登录
 */
export function isLoggedIn(): boolean {
  return !!getCurrentUser();
}

// 初始化默认用户
initDefaultUser();
