import React from "react";
import {
  XMarkIcon,
  MinusIcon,
  ArrowsPointingOutIcon,
  ComputerDesktopIcon
} from "@heroicons/react/24/outline";

const TitleBar: React.FC = () => {
  const handleMinimize = () => {
    window.electron?.ipcRenderer?.send("window-minimize");
  };

  const handleMaximize = () => {
    window.electron?.ipcRenderer?.send("window-maximize");
  };

  const handleClose = () => {
    window.electron?.ipcRenderer?.send("window-close");
  };

  return (
    <div className="window-drag flex items-center justify-between bg-gray-800 text-white px-4 py-2">
      <div className="flex items-center space-x-2 window-no-drag">
        <ComputerDesktopIcon className="h-5 w-5 text-primary-400" />
        <span className="font-semibold">WeClaw Client</span>
      </div>

      <div className="flex items-center space-x-2 window-no-drag">
        <button
          onClick={handleMinimize}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
          title="最小化"
        >
          <MinusIcon className="h-4 w-4" />
        </button>

        <button
          onClick={handleMaximize}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
          title="最大化/还原"
        >
          <ArrowsPointingOutIcon className="h-4 w-4" />
        </button>

        <button
          onClick={handleClose}
          className="p-1 hover:bg-red-500 rounded transition-colors"
          title="关闭"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
