import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Workspace } from '../types';

interface WorkspaceContextType {
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (workspace: Workspace | null) => void;
  checkPermission: (path: string) => Promise<boolean>;
  selectWorkspace: () => Promise<boolean>;
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace必须在WorkspaceProvider内使用');
  }
  return context;
};

interface WorkspaceProviderProps {
  children: ReactNode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActiveWorkspace();
  }, []);

  const loadActiveWorkspace = async () => {
    try {
      const workspace = await window.electron?.ipcRenderer?.invoke('get-active-workspace');
      setActiveWorkspace(workspace || null);
    } catch (error) {
      console.error('加载工作区间失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkPermission = async (path: string): Promise<boolean> => {
    if (!activeWorkspace) return false;
    
    try {
      const result = await window.electron?.ipcRenderer?.invoke('check-path-permission', path);
      return result.allowed || false;
    } catch (error) {
      console.error('检查权限失败:', error);
      return false;
    }
  };

  const selectWorkspace = async (): Promise<boolean> => {
    try {
      console.log('开始选择工作区间...');
      const path = await window.electron?.ipcRenderer?.invoke('select-directory');
      console.log('选择的目录路径:', path);
      if (!path) {
        console.log('用户取消了选择');
        return false;
      }

      const workspaceName = path.split('/').pop() || '未命名工作区';
      console.log('工作区名称:', workspaceName);
      
      const success = await window.electron?.ipcRenderer?.invoke('set-workspace', path, workspaceName);
      console.log('set-workspace调用结果:', success);
      
      if (success) {
        await loadActiveWorkspace();
        console.log('工作区间选择成功');
        return true;
      }
      console.log('set-workspace调用返回false');
      return false;
    } catch (error) {
      console.error('选择工作区间失败:', error);
      return false;
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        activeWorkspace,
        setActiveWorkspace,
        checkPermission,
        selectWorkspace,
        isLoading,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};