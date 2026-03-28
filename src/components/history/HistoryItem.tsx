import React from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { Locale } from "date-fns";
import { OperationHistory } from "../../types";
import { useSettings } from "../../contexts/SettingsContext";
import {
  getStatusIcon,
  getStatusColor,
  getPermissionColor,
} from "./historyUtils";

interface HistoryItemProps {
  item: OperationHistory;
  isExpanded: boolean;
  dateLocale: Locale;
  onToggleDetails: (id: number) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({
  item,
  isExpanded,
  dateLocale,
  onToggleDetails,
}) => {
  const { t } = useSettings();

  const getOperationTypeLabel = (type: string) => {
    if (!type) return t("history.opType.unknown");
    const key = `history.opType.${type}`;
    const translated = t(key);
    return translated !== key ? translated : type;
  };

  return (
    <div className={`border rounded ${getPermissionColor(item.permission_check)}`}>
      <div className="p-2">
        {/* 顶部行：展开图标 + 状态图标 + 类型 + 目标 + 状态标签 + 时间 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {/* 展开/收起按钮 */}
            <button
              onClick={() => onToggleDetails(item.id)}
              className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400" />
              ) : (
                <ChevronRightIcon className="h-3.5 w-3.5 text-gray-400" />
              )}
            </button>

            {/* 状态图标 */}
            <div className="flex-shrink-0">{getStatusIcon(item.operation_status)}</div>

            {/* 类型 */}
            <div className="min-w-0 flex-1">
              <h3 className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                {getOperationTypeLabel(item.operation_type)}
              </h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                {item.operation_target}
              </p>
            </div>
          </div>

          {/* 右侧：状态标签 + 时间 */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <span
              className={`px-1.5 py-0.5 text-[10px] rounded ${getStatusColor(
                item.operation_status
              )}`}
            >
              {item.operation_status}
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {format(new Date(item.timestamp), "MM-dd HH:mm", {
                locale: dateLocale,
              })}
            </span>
          </div>
        </div>

        {/* 展开详情 */}
        {isExpanded && (
          <div className="mt-2 pl-6 pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">
                  {t("history.opTarget")}
                </p>
                <p className="text-xs font-medium truncate text-gray-800 dark:text-gray-200">
                  {item.operation_target}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">
                  {t("history.permCheck")}
                </p>
                <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                  {item.permission_check || "-"}
                </p>
              </div>
            </div>

            <div className="mt-2">
              <h4 className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                {t("history.details")}
              </h4>
              <pre className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-xs text-gray-700 dark:text-gray-300 overflow-auto max-h-32">
                {(() => {
                  try {
                    const parsed = JSON.parse(item.details || "{}");
                    return JSON.stringify(parsed, null, 2);
                  } catch {
                    return item.details || t("history.noDetails");
                  }
                })()}
              </pre>
              <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                ID: {item.id} · {t("history.fullTimestamp")}: {item.timestamp}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryItem;
