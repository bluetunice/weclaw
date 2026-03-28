import React, { useState } from "react";
import { CalendarIcon } from "@heroicons/react/24/outline";

interface CronConfigProps {
  cronExpression: string;
  onChange: (cron: string) => void;
  t: (key: string) => string;
}

export const CronConfig: React.FC<CronConfigProps> = ({ cronExpression, onChange, t }) => {
  const parts = (cronExpression || "0 0 * * *").split(" ");
  const [fields, setFields] = useState({
    minute: parts[0] || "0",
    hour:   parts[1] || "0",
    day:    parts[2] || "*",
    month:  parts[3] || "*",
    week:   parts[4] || "*",
  });

  const update = (key: string, val: string) => {
    const next = { ...fields, [key]: val };
    setFields(next);
    onChange(`${next.minute} ${next.hour} ${next.day} ${next.month} ${next.week}`);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-2">
        {(["minute", "hour", "day", "month", "week"] as const).map((k) => (
          <div key={k}>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              {t(`workflow.cron.${k}`)}
            </label>
            <input
              type="text"
              value={fields[k]}
              onChange={(e) => update(k, e.target.value)}
              className="input text-sm"
              placeholder={
                k === "minute" ? "0-59" : k === "hour" ? "0-23" :
                k === "day" ? "1-31" : k === "month" ? "1-12" : "0-7"
              }
            />
          </div>
        ))}
      </div>
      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg flex items-center gap-3">
        <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <span className="text-xs text-gray-500">{t("workflow.cron.exprLabel")}</span>
        <code className="text-xs bg-white dark:bg-gray-700 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600 font-mono">
          {cronExpression}
        </code>
      </div>
    </div>
  );
};

export default CronConfig;
