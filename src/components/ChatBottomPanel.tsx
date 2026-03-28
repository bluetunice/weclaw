import React from 'react';
import ModelSelector from './ModelSelector';
import WorkspaceSelector from './WorkspaceSelector';
import { ModelConfig } from '../types';
import { useSettings } from '../contexts/SettingsContext';

interface ChatBottomPanelProps {
  models: ModelConfig[];
  activeModel: ModelConfig | null;
  activeWorkspace: any;
  onSelectModel: (modelId: number) => void;
  onSelectWorkspace: (workspaceId: number) => void;
  onAddWorkspace: () => void;
}

const ChatBottomPanel: React.FC<ChatBottomPanelProps> = ({
  models,
  activeModel,
  activeWorkspace,
  onSelectModel,
  onSelectWorkspace,
  onAddWorkspace,
}) => {
  const { t } = useSettings();

  return (
    <div className="flex flex-col md:flex-row items-center justify-between border-t border-gray-200/60 dark:border-gray-700/60 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-4 py-3 space-y-2 md:space-y-0 flex-shrink-0">
      {/* 左侧：模型和工作区选择器 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center space-x-2 min-w-0">
          <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">{t('chat.modelLabel')}</span>
          <ModelSelector
            models={models}
            activeModel={activeModel}
            onSelectModel={onSelectModel}
          />
        </div>

        <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 hidden md:block"></div>

        <div className="flex items-center space-x-2 min-w-0">
          <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">{t('chat.workspaceLabel')}</span>
          <WorkspaceSelector
            onSelectWorkspace={onSelectWorkspace}
            onAddWorkspace={onAddWorkspace}
          />
        </div>
      </div>

      {/* 右侧：辅助信息 */}
      <div className="flex items-center space-x-3 md:space-x-4 text-xs md:text-sm text-gray-500 dark:text-gray-400">
        {activeModel && (
          <div className="flex items-center space-x-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="hidden sm:inline">{t('chat.online')}</span>
          </div>
        )}
        <div className="px-2 py-1 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-700/80 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-600 text-xs font-medium">
          {activeModel ? activeModel.name.substring(0, 20) + (activeModel.name.length > 20 ? "..." : "") : t('chat.selectModel')}
        </div>
      </div>
    </div>
  );
};

export default ChatBottomPanel;
