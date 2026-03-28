import React from "react";
import { OperationHistory } from "../../types";
import { useSettings } from "../../contexts/SettingsContext";

interface HistoryFilterBarProps {
  history: OperationHistory[];
  filter: string;
  searchTerm: string;
  onFilterChange: (value: string) => void;
  onSearchChange: (value: string) => void;
}

const HistoryFilterBar: React.FC<HistoryFilterBarProps> = ({
  history,
  filter,
  searchTerm,
  onFilterChange,
  onSearchChange,
}) => {
  const { t } = useSettings();

  const successCount = history.filter(
    (h) => h.operation_status === "success"
  ).length;
  const deniedCount = history.filter((h) =>
    (h.permission_check || "").includes("outside")
  ).length;

  return (
    <div className="card p-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 筛选类型 */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {t("history.filterType")}
          </label>
          <select
            className="input text-xs"
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
          >
            <option value="all">{t("history.filterAll")}</option>
            <option value="permission_denied">
              {t("history.filterDenied")}
            </option>
            <option value="success">{t("history.filterSuccess")}</option>
            <option value="warning">{t("history.filterWarning")}</option>
            <option value="error">{t("history.filterError")}</option>
          </select>
        </div>

        {/* 搜索 */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {t("history.searchLabel")}
          </label>
          <input
            type="text"
            className="input text-xs"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("history.searchPlaceholder")}
          />
        </div>

        {/* 统计数字 */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {t("history.statsLabel")}
          </label>
          <div className="flex gap-3">
            <div className="text-center">
              <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                {history.length}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                {t("history.totalRecords")}
              </p>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-green-600 dark:text-green-400">
                {successCount}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                {t("history.successRecords")}
              </p>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-red-600 dark:text-red-400">
                {deniedCount}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                {t("history.deniedRecords")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryFilterBar;
