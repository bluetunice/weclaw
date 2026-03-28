import React, { useState, useRef, useEffect } from "react";
import { ModelConfig } from "../types";
import {
  CpuChipIcon,
  ChevronDownIcon,
  CheckIcon,
  PlusIcon
} from "@heroicons/react/24/outline";
import { useSettings } from "../contexts/SettingsContext";

interface ModelSelectorProps {
  models: ModelConfig[];
  activeModel: ModelConfig | null;
  onSelectModel: (modelId: number) => void;
  onNavigateToModels?: () => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  activeModel,
  onSelectModel,
  onNavigateToModels
}) => {
  const { t } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const updatePos = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.top,
        left: rect.left,
        width: Math.max(rect.width, 220),
      });
    }
  };

  const handleToggle = () => {
    updatePos();
    setIsOpen(v => !v);
  };

  // 窗口滚动/缩放时关闭
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

  if (models.length === 0) {
    return (
      <div className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-xs">
        <CpuChipIcon className="h-3.5 w-3.5 mr-1.5" />
        暂无模型
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
        <CpuChipIcon className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="max-w-[140px] truncate">
          {activeModel ? activeModel.name : "选择模型"}
        </span>
        <ChevronDownIcon className={`h-3 w-3 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* 遮罩 */}
          <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
          {/* 下拉菜单 fixed 定位，不受 overflow 影响 */}
          <div
            className="fixed z-[9999] bg-white dark:bg-gray-800 rounded-xl shadow-lg py-1.5 overflow-hidden"
            style={{
              bottom: window.innerHeight - dropdownPos.top + 4,
              left: dropdownPos.left,
              minWidth: dropdownPos.width,
            }}
          >
            <div className="max-h-60 overflow-y-auto">
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    onSelectModel(model.id!);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 transition-colors duration-150 ${
                    activeModel?.id === model.id
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                      activeModel?.id === model.id ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                    <span className="truncate font-medium">{model.name}</span>
                  </div>
                  {activeModel?.id === model.id && (
                    <CheckIcon className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
            
            {/* 跳转模型设置页面 */}
            {onNavigateToModels && (
              <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onNavigateToModels();
                  }}
                  className="w-full px-2 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors flex items-center justify-center gap-1"
                >
                  <PlusIcon className="h-3 w-3" />
                  {t("chat.goToModelsPage")}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default ModelSelector;
