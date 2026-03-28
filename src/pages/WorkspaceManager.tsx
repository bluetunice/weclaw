import React, { useState } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useSettings } from '../contexts/SettingsContext';
import {
  FolderIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const WorkspaceManager: React.FC = () => {
  const { activeWorkspace, selectWorkspace, checkPermission } = useWorkspace();
  const { t } = useSettings();
  const [testPath, setTestPath] = useState('');
  const [permissionResult, setPermissionResult] = useState<{
    allowed: boolean;
    reason: string;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleTestPermission = async () => {
    if (!testPath.trim()) {
      alert(t('workspace.inputPath'));
      return;
    }

    setIsTesting(true);
    try {
      const result = await checkPermission(testPath);
      setPermissionResult({
        allowed: result,
        reason: result ? t('workspace.pathInside') : t('workspace.pathOutside'),
      });
    } catch (error) {
      console.error('测试权限失败:', error);
      setPermissionResult({
        allowed: false,
        reason: t('workspace.testFailed'),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearWorkspace = () => {
    if (confirm(t('workspace.clearConfirm'))) {
      // 清除工作区间的逻辑可以在这里实现
      alert(t('workspace.clearDone'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('workspace.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{t('workspace.subtitle')}</p>
      </div>

      {/* 当前工作区间信息 */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('workspace.current')}</h2>
        {activeWorkspace ? (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 p-4">
              <div className="flex">
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">{t('workspace.setTitle')}</p>
                  <p className="text-sm text-green-700 dark:text-green-400 mt-1">{t('workspace.setDesc')}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('workspace.name')}</p>
                <p className="font-medium dark:text-gray-200">{activeWorkspace.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('workspace.path')}</p>
                <p className="font-medium dark:text-gray-200 truncate">{activeWorkspace.path}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('workspace.createdAt')}</p>
                <p className="font-medium dark:text-gray-200">
                  {new Date(activeWorkspace.created_at).toLocaleString('zh-CN')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('workspace.status')}</p>
                <p className="font-medium text-green-600">{t('workspace.active')}</p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={selectWorkspace}
                className="btn-primary flex items-center space-x-2"
              >
                <FolderIcon className="h-5 w-5" />
                <span>{t('workspace.change')}</span>
              </button>
              <button
                onClick={handleClearWorkspace}
                className="btn-secondary text-red-600 border-red-200 hover:bg-red-50"
              >
                {t('workspace.clear')}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 inline-flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">{t('workspace.noSet')}</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">{t('workspace.noSetDesc')}</p>
              </div>
            </div>
            
            <button
              onClick={selectWorkspace}
              className="mt-6 btn-primary flex items-center space-x-2 mx-auto"
            >
              <FolderIcon className="h-5 w-5" />
              <span>{t('workspace.setBtn')}</span>
            </button>
          </div>
        )}
      </div>

      {/* 权限测试工具 */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('workspace.testTool')}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {t('workspace.testPathHint')}
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('workspace.testPath')}
            </label>
            <input
              type="text"
              className="input"
              value={testPath}
              onChange={(e) => setTestPath(e.target.value)}
              placeholder={t('workspace.testPathPlaceholder')}
            />
          </div>

          <button
            onClick={handleTestPermission}
            disabled={!activeWorkspace || isTesting}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTesting ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin inline mr-2" />
                {t('workspace.testing')}
              </>
            ) : (
              t('workspace.testBtn')
            )}
          </button>

          {permissionResult && (
            <div className={`p-4 rounded-lg border ${
              permissionResult.allowed
                ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-700'
                : 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-700'
            }`}>
              <div className="flex items-center">
                {permissionResult.allowed ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-400" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-400" />
                )}
                <div className="ml-3">
                  <p className={`font-medium ${
                    permissionResult.allowed ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                  }`}>
                    {permissionResult.allowed ? t('workspace.allowed') : t('workspace.denied')}
                  </p>
                  <p className={`text-sm ${
                    permissionResult.allowed ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                  }`}>
                    {permissionResult.reason}
                  </p>
                  {activeWorkspace && !permissionResult.allowed && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {t('workspace.pathMustBe')}{activeWorkspace.path}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 安全说明 */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('workspace.securityTitle')}</h2>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <ShieldCheckIcon className="h-5 w-5 text-primary-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-200">{t('workspace.permControl')}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {t('workspace.permControlDesc')}
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-200">{t('workspace.opRecord')}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {t('workspace.opRecordDesc')}
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-200">{t('workspace.securityAdvice')}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1" style={{ whiteSpace: 'pre-line' }}>
                {t('workspace.securityAdviceDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceManager;