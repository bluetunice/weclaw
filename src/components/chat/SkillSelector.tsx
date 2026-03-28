import React, { useState, useEffect, useRef } from 'react';
import { 
  PuzzlePieceIcon, 
  ChevronDownIcon, 
  CheckIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { Skill, loadSkills } from '../skills/skillUtils';
import { useSettings } from '../../contexts/SettingsContext';

interface SkillSelectorProps {
  selectedSkills: Skill[];
  onSelectSkills: (skills: Skill[]) => void;
  onNavigateToSkills?: () => void;
}

const SkillSelector: React.FC<SkillSelectorProps> = ({
  selectedSkills,
  onSelectSkills,
  onNavigateToSkills
}) => {
  const { t } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSkills(loadSkills());
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleSkill = (e: React.MouseEvent, skill: Skill) => {
    e.stopPropagation();
    const isSelected = selectedSkills.some(s => s.id === skill.id);
    if (isSelected) {
      onSelectSkills(selectedSkills.filter(s => s.id !== skill.id));
    } else {
      onSelectSkills([...selectedSkills, skill]);
    }
    // 刷新技能列表
    setSkills(loadSkills());
  };

  const enabledSkills = skills.filter(s => s.enabled);
  const selectedCount = selectedSkills.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 触发按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={enabledSkills.length === 0}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
          selectedCount > 0
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
        } disabled:opacity-40 disabled:cursor-not-allowed`}
        title={t("chat.selectSkill")}
      >
        <PuzzlePieceIcon className="h-3.5 w-3.5" />
        <span>
          {selectedCount > 0 
            ? `${t("chat.skillBtn")} (${selectedCount})` 
            : t("chat.skillBtn")}
        </span>
        <ChevronDownIcon className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg z-[100]">
          {/* 标题 */}
          <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {t("chat.skillSelectorTitle")}
            </span>
          </div>

          {/* Skills 列表 */}
          <div className="max-h-48 overflow-y-auto py-1">
            {enabledSkills.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-400">
                {t("chat.noSkillsAvailable")}
              </div>
            ) : (
              enabledSkills.map((skill) => {
                const isSelected = selectedSkills.some(s => s.id === skill.id);
                return (
                  <div
                    key={skill.id}
                    onClick={(e) => handleToggleSkill(e, skill)}
                    className={`px-3 py-2 cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/30'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {/* 复选框 */}
                      <div className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        isSelected 
                          ? 'bg-blue-500 border-blue-500' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {isSelected && <CheckIcon className="h-3 w-3 text-white" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                          {skill.name}
                        </div>
                        {skill.description && (
                          <div className="text-xs text-gray-400 truncate">
                            {skill.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 跳转技能界面 */}
          {onNavigateToSkills && (
            <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigateToSkills();
                }}
                className="w-full px-2 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors flex items-center justify-center gap-1"
              >
                <PlusIcon className="h-3 w-3" />
                {t("chat.goToSkillsPage")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SkillSelector;
