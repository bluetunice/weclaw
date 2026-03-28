import React, { useState, useEffect, useRef } from 'react';
import { Workspace } from '../types';
import {
  FolderOpenIcon,
  ChevronDownIcon,
  CheckIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface WorkspaceSelectorProps {
  onSelectWorkspace: (workspaceId: number) => void;
  onAddWorkspace: () => void;
}

const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
  onSelectWorkspace,
  onAddWorkspace,
}) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  // 关闭下拉时重置
  useEffect(() => {
    if (!isOpen) return;
    const close = () => setIsOpen(false);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [isOpen]);

  const loadWorkspaces = async () => {
    try {
      const data = await window.electron?.ipcRenderer?.invoke('get-workspaces');
      setWorkspaces(data || []);
      const active = data?.find((w: Workspace) => w.is_active) || null;
      setActiveWorkspace(active);
    } catch (error) {
      console.error('加载工作区失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.top,
        left: rect.left,
        width: Math.max(rect.width, 280),
      });
    }
    setIsOpen(v => !v);
  };

  const handleSwitchWorkspace = async (workspaceId: number) => {
    try {
      const success = await window.electron?.ipcRenderer?.invoke('switch-workspace', workspaceId);
      if (success) {
        await loadWorkspaces();
        onSelectWorkspace(workspaceId);
        setIsOpen(false);
        const workspace = workspaces.find(w => w.id === workspaceId);
        window.electron?.ipcRenderer?.invoke('log-operation', {
          operation_type: 'workspace_switch',
          operation_target: workspace?.name || '未知工作区',
          operation_status: 'completed',
          permission_check: 'allowed',
          details: `切换到工作区: ${workspace?.name}`
        });
      }
    } catch (error) {
      console.error('切换工作区失败:', error);
    }
  };

  const handleRemoveWorkspace = async (workspaceId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要移除这个工作区吗？此操作不会删除实际文件，只会从工作区列表中移除。')) return;
    try {
      const updatedWorkspaces = workspaces.filter(w => w.id !== workspaceId);
      setWorkspaces(updatedWorkspaces);
      if (activeWorkspace?.id === workspaceId) {
        const newActive = updatedWorkspaces[0] || null;
        setActiveWorkspace(newActive);
        if (newActive) await handleSwitchWorkspace(newActive.id!);
      }
    } catch (error) {
      console.error('移除工作区失败:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-xs">
        <FolderOpenIcon className="h-3.5 w-3.5 mr-1.5 animate-pulse" />
        加载中...
      </div>
    );
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
          isOpen
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <FolderOpenIcon className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="max-w-[120px] truncate">
          {activeWorkspace ? activeWorkspace.name : '未设置工作区'}
        </span>
        <ChevronDownIcon className={`h-3 w-3 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
          <div
            className="fixed z-[9999] bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
            style={{
              bottom: window.innerHeight - dropdownPos.top + 4,
              left: dropdownPos.left,
              minWidth: dropdownPos.width,
            }}
          >
            <div className="max-h-56 overflow-y-auto">
              {workspaces.length === 0 ? (
                <div className="px-4 py-6 text-center text-gray-500">
                  <FolderOpenIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-xs">暂无工作区，请先添加</p>
                </div>
              ) : (
                workspaces.map((workspace) => (
                  <div
                    key={workspace.id}
                    onClick={() => handleSwitchWorkspace(workspace.id!)}
                    className={`px-3 py-2 flex items-center justify-between cursor-pointer transition-colors duration-150 hover:bg-gray-50 ${
                      activeWorkspace?.id === workspace.id ? 'bg-violet-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                        activeWorkspace?.id === workspace.id ? 'bg-violet-500' : 'bg-gray-300'
                      }`} />
                      <div className="min-w-0">
                        <div className={`text-xs font-medium truncate ${
                          activeWorkspace?.id === workspace.id ? 'text-violet-700' : 'text-gray-800'
                        }`}>
                          {workspace.name}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate max-w-[220px]">
                          {workspace.path}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      {activeWorkspace?.id === workspace.id && (
                        <CheckIcon className="h-3.5 w-3.5 text-violet-500" />
                      )}
                      <button
                        onClick={(e) => handleRemoveWorkspace(workspace.id!, e)}
                        className="p-1 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded transition-colors"
                        title="移除工作区"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-2">
              <button
                onClick={() => { setIsOpen(false); onAddWorkspace(); }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                添加新工作区
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default WorkspaceSelector;
