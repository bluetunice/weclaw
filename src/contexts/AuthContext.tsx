import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  verifyCredentials,
  registerUser,
  changePassword,
  setCurrentUser,
  getCurrentUser,
  usernameExists,
} from '../utils/authStorage';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  username: string | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  register: (username: string, password: string) => boolean;
  changeUserPassword: (oldPassword: string, newPassword: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // 使用函数式初始化同步检查本地存储，避免闪烁
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const savedUser = getCurrentUser();
    return !!savedUser;
  });
  const [username, setUsername] = useState<string | null>(() => {
    return getCurrentUser();
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 保持 useEffect 以便后续扩展
  useEffect(() => {
    // 初始化完成后设置为非加载状态
    setIsLoading(false);
  }, []);

  const login = (name: string, password: string): boolean => {
    if (verifyCredentials(name, password)) {
      setCurrentUser(name);
      setUsername(name);
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    setUsername(null);
    setIsAuthenticated(false);
  };

  const register = (name: string, password: string): boolean => {
    return registerUser(name, password);
  };

  const changeUserPassword = (oldPassword: string, newPassword: string): boolean => {
    if (!username) return false;
    // 验证旧密码
    if (!verifyCredentials(username, oldPassword)) {
      return false;
    }
    return changePassword(username, newPassword);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        username,
        login,
        logout,
        register,
        changeUserPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
