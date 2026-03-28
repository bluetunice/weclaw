import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ModelConfig } from '../types';

interface ModelContextType {
  models: ModelConfig[];
  activeModel: ModelConfig | null;
  setActiveModel: (model: ModelConfig | null) => void;
  loadModels: () => Promise<void>;
  saveModel: (model: ModelConfig) => Promise<boolean>;
  deleteModel: (modelId: number) => Promise<boolean>;
  isLoading: boolean;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export const useModel = () => {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error('useModel必须在ModelProvider内使用');
  }
  return context;
};

interface ModelProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'claw_last_active_model_id';

export const ModelProvider: React.FC<ModelProviderProps> = ({ children }) => {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [activeModel, setActiveModel] = useState<ModelConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    if (models.length > 0) {
      // 优先使用上次保存的模型ID
      const lastActiveModelId = localStorage.getItem(STORAGE_KEY);
      if (lastActiveModelId) {
        const lastActiveModel = models.find(m => m.id === Number(lastActiveModelId));
        if (lastActiveModel) {
          setActiveModel(lastActiveModel);
          return;
        }
      }
      
      // 如果没有上次保存的模型，或模型不存在，则使用默认模型
      const defaultModel = models.find(m => m.is_default);
      setActiveModel(defaultModel || models[0] || null);
    }
  }, [models]);

  // 保存活跃模型ID到localStorage
  const handleSetActiveModel = (model: ModelConfig | null) => {
    setActiveModel(model);
    if (model) {
      localStorage.setItem(STORAGE_KEY, model.id.toString());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const loadModels = async () => {
    setIsLoading(true);
    try {
      const loadedModels = await window.electron?.ipcRenderer?.invoke('get-configs');
      setModels(loadedModels || []);
    } catch (error) {
      console.error('加载模型配置失败:', error);
      setModels([]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveModel = async (model: ModelConfig): Promise<boolean> => {
    try {
      console.log('开始保存模型配置:', model.name, model.model_type);
      const success = await window.electron?.ipcRenderer?.invoke('save-config', model);
      console.log('save-config调用结果:', success);
      if (success) {
        await loadModels();
        console.log('模型配置保存成功');
        return true;
      }
      console.log('save-config调用返回false');
      return false;
    } catch (error) {
      console.error('保存模型配置失败:', error);
      return false;
    }
  };

  const deleteModel = async (modelId: number): Promise<boolean> => {
    try {
      const success = await window.electron?.ipcRenderer?.invoke('delete-config', modelId);
      if (success) {
        await loadModels();
        return true;
      }
      return false;
    } catch (error) {
      console.error('删除模型配置失败:', error);
      return false;
    }
  };

  return (
    <ModelContext.Provider
      value={{
        models,
        activeModel,
        setActiveModel: handleSetActiveModel,
        loadModels,
        saveModel,
        deleteModel,
        isLoading,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
};