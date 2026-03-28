import React from "react";
import { useSettings } from "../../contexts/SettingsContext";

interface HistoryPaginationProps {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const HistoryPagination: React.FC<HistoryPaginationProps> = ({
  totalCount,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  const { t } = useSettings();

  // 生成带省略号的页码列表
  const pageItems = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => {
      if (totalPages <= 5) return true;
      if (p === 1 || p === totalPages) return true;
      return Math.abs(p - currentPage) <= 1;
    })
    .reduce<(number | "...")[]>((acc, p, idx, arr) => {
      if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) {
        acc.push("...");
      }
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
      {/* 左侧：总数 + 每页条数 */}
      <div className="flex items-center gap-3">
        <span>
          {t("history.showCount").replace("{count}", String(totalCount))}
        </span>
        <div className="flex items-center gap-1.5">
          <span>{t("history.pageSizeLabel")}</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="border border-gray-200 dark:border-gray-600 rounded-md px-2 py-1 text-sm
                       text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700
                       focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            {PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
                {t("history.pageUnit")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 右侧：页码导航 */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded-md border border-gray-200 dark:border-gray-600
                     hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300
                     disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {t("history.prevPage")}
        </button>

        {pageItems.map((item, idx) =>
          item === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-1">
              …
            </span>
          ) : (
            <button
              key={item}
              onClick={() => onPageChange(item as number)}
              className={`min-w-[2rem] px-2 py-1 rounded-md border transition-colors ${
                currentPage === item
                  ? "bg-primary-600 text-white border-primary-600"
                  : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {item}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded-md border border-gray-200 dark:border-gray-600
                     hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300
                     disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {t("history.nextPage")}
        </button>
      </div>
    </div>
  );
};

export default HistoryPagination;
