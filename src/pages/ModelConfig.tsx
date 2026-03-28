import React, { useState } from "react";
import { useModel } from "../contexts/ModelContext";
import { ModelConfig } from "../types";
import { useSettings } from "../contexts/SettingsContext";
import { opLog } from "../utils/operationLogger";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  ArrowRightIcon,
  BeakerIcon
} from "@heroicons/react/24/outline";

const ModelConfigPage: React.FC = () => {
  const {
    models,
    activeModel,
    setActiveModel,
    saveModel,
    deleteModel,
    loadModels
  } = useModel();
  const { t } = useSettings();
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newModel, setNewModel] = useState<Partial<ModelConfig>>({
    name: "",
    api_endpoint: "",
    api_key: "",
    model_type: "openai",
    parameters: {},
    is_default: false
  });

  const modelTypes = [
    { id: "openai", name: "OpenAI GPT" },
    { id: "claude", name: "Anthropic Claude" },
    { id: "gemini", name: "Google Gemini" },
    { id: "deepseek", name: "DeepSeek" },
    { id: "kimi", name: "Kimi (Moonshot)" },
    { id: "qwen", name: "通义千问" },
    { id: "ernie", name: "文心一言" },
    { id: "spark", name: "讯飞星火" },
    { id: "zhipu", name: "智谱AI" },
    { id: "custom", name: t("models.type.custom") }
  ];

  const handleEdit = (model: ModelConfig) => {
    setEditingModel({ ...model });
    setIsCreating(false);
  };

  const handleDelete = async (modelId: number) => {
    if (confirm(t("models.deleteConfirm"))) {
      try {
        const model = models.find((m) => m.id === modelId);
        const success = await deleteModel(modelId);
        if (success) {
          if (model) opLog.modelDelete(model.name);
          alert(t("models.deleteSuccess"));
        } else {
          alert(t("models.deleteFail"));
        }
      } catch (error) {
        console.error("删除模型失败:", error);
        alert(t("models.deleteError"));
      }
    }
  };

  const handleSave = async () => {
    if (!editingModel?.name || !editingModel?.api_endpoint) {
      alert(t("models.saveRequired"));
      return;
    }

    const success = await saveModel(editingModel as ModelConfig);
    if (success) {
      opLog.modelSave(editingModel.name);
      setEditingModel(null);
      alert(t("models.saveSuccess"));
    } else {
      alert(t("models.saveFail"));
    }
  };

  const handleCreate = async () => {
    if (!newModel.name || !newModel.api_endpoint) {
      alert(t("models.saveRequired"));
      return;
    }

    const success = await saveModel(newModel as ModelConfig);
    if (success) {
      opLog.modelCreate(newModel.name!);
      setNewModel({
        name: "",
        api_endpoint: "",
        api_key: "",
        model_type: "openai",
        parameters: {},
        is_default: false
      });
      setIsCreating(false);
      alert(t("models.createSuccess"));
    } else {
      alert(t("models.createFail"));
    }
  };

  const handleSetDefault = async (model: ModelConfig) => {
    const updatedModel = { ...model, is_default: true };
    const success = await saveModel(updatedModel);
    if (success) {
      opLog.modelSetDefault(model.name);
      setActiveModel(updatedModel);
      alert(t("models.setDefaultSuccess"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {t("models.title")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t("models.subtitle")}
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="btn-primary flex items-center gap-1.5 text-xs"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          <span>{t("models.add")}</span>
        </button>
      </div>

      {/* 创建新模型表单 */}
      {isCreating && (
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            {t("models.addNew")}
          </h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t("models.nameLabel")}
                </label>
                <input
                  type="text"
                  className="input text-xs"
                  value={newModel.name}
                  onChange={(e) =>
                    setNewModel({ ...newModel, name: e.target.value })
                  }
                  placeholder={t("models.namePlaceholder")}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t("models.typeLabel")}
                </label>
                <select
                  className="input text-xs"
                  value={newModel.model_type}
                  onChange={(e) =>
                    setNewModel({ ...newModel, model_type: e.target.value })
                  }
                >
                  {modelTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t("models.endpointLabel")}
              </label>
              <input
                type="text"
                className="input text-xs"
                value={newModel.api_endpoint}
                onChange={(e) =>
                  setNewModel({ ...newModel, api_endpoint: e.target.value })
                }
                placeholder={t("models.endpointPlaceholder")}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t("models.keyLabel")}
              </label>
              <input
                type="password"
                className="input text-xs"
                value={newModel.api_key}
                onChange={(e) =>
                  setNewModel({ ...newModel, api_key: e.target.value })
                }
                placeholder={t("models.keyPlaceholder")}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t("models.fileUploadEndpointLabel")}
              </label>
              <input
                type="text"
                className="input text-xs"
                value={newModel.file_upload_endpoint || ""}
                onChange={(e) =>
                  setNewModel({ ...newModel, file_upload_endpoint: e.target.value })
                }
                placeholder={t("models.fileUploadEndpointPlaceholder")}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t("models.fileUploadKeyLabel")}
              </label>
              <input
                type="password"
                className="input text-xs"
                value={newModel.file_upload_api_key || ""}
                onChange={(e) =>
                  setNewModel({ ...newModel, file_upload_api_key: e.target.value })
                }
                placeholder={t("models.fileUploadKeyPlaceholder")}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={newModel.is_default}
                onChange={(e) =>
                  setNewModel({ ...newModel, is_default: e.target.checked })
                }
                className="h-3.5 w-3.5 text-primary-600"
              />
              <label
                htmlFor="isDefault"
                className="text-xs text-gray-600 dark:text-gray-400"
              >
                {t("models.setDefault")}
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsCreating(false)}
                className="btn-secondary text-xs"
              >
                {t("models.cancel")}
              </button>
              <button onClick={handleCreate} className="btn-primary text-xs">
                {t("models.createBtn")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑模型表单 */}
      {editingModel && !isCreating && (
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            {t("models.editTitle")}
          </h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t("models.editNameLabel")}
                </label>
                <input
                  type="text"
                  className="input text-xs"
                  value={editingModel.name}
                  onChange={(e) =>
                    setEditingModel({ ...editingModel, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t("models.editTypeLabel")}
                </label>
                <select
                  className="input text-xs"
                  value={editingModel.model_type}
                  onChange={(e) =>
                    setEditingModel({
                      ...editingModel,
                      model_type: e.target.value
                    })
                  }
                >
                  {modelTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t("models.editEndpointLabel")}
              </label>
              <input
                type="text"
                className="input text-xs"
                value={editingModel.api_endpoint}
                onChange={(e) =>
                  setEditingModel({
                    ...editingModel,
                    api_endpoint: e.target.value
                  })
                }
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t("models.editKeyLabel")}
              </label>
              <input
                type="password"
                className="input text-xs"
                value={editingModel.api_key || ""}
                onChange={(e) =>
                  setEditingModel({ ...editingModel, api_key: e.target.value })
                }
                placeholder={t("models.keyEditPlaceholder")}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t("models.fileUploadEndpointLabel")}
              </label>
              <input
                type="text"
                className="input text-xs"
                value={editingModel.file_upload_endpoint || ""}
                onChange={(e) =>
                  setEditingModel({
                    ...editingModel,
                    file_upload_endpoint: e.target.value
                  })
                }
                placeholder={t("models.fileUploadEndpointPlaceholder")}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t("models.fileUploadKeyLabel")}
              </label>
              <input
                type="password"
                className="input text-xs"
                value={editingModel.file_upload_api_key || ""}
                onChange={(e) =>
                  setEditingModel({
                    ...editingModel,
                    file_upload_api_key: e.target.value
                  })
                }
                placeholder={t("models.fileUploadKeyPlaceholder")}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editIsDefault"
                checked={editingModel.is_default}
                onChange={(e) =>
                  setEditingModel({
                    ...editingModel,
                    is_default: e.target.checked
                  })
                }
                className="h-3.5 w-3.5 text-primary-600"
              />
              <label
                htmlFor="editIsDefault"
                className="text-xs text-gray-600 dark:text-gray-400"
              >
                {t("models.editSetDefault")}
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingModel(null)}
                className="btn-secondary text-xs"
              >
                {t("models.cancel")}
              </button>
              <button onClick={handleSave} className="btn-primary text-xs">
                {t("models.saveBtn")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 模型列表 */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          {t("models.listTitle")}
        </h2>
        <div className="space-y-2">
          {models.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <p className="text-xs">{t("models.empty")}</p>
            </div>
          ) : (
            models.map((model) => (
              <div
                key={model.id}
                className={`p-3 rounded-lg border ${
                  activeModel?.id === model.id
                    ? "border-primary-300 bg-primary-50 dark:border-primary-700 dark:bg-primary-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="bg-primary-100 dark:bg-primary-900/40 p-1.5 rounded">
                      <BeakerIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                          {model.name}
                        </h3>
                        {model.is_default && (
                          <span className="px-1.5 py-0.5 text-[10px] bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 rounded-full">
                            {t("models.tagDefault")}
                          </span>
                        )}
                        {activeModel?.id === model.id && (
                          <span className="px-1.5 py-0.5 text-[10px] bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300 rounded-full">
                            {t("models.tagCurrent")}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                        {model.model_type} · {model.api_endpoint}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    {!model.is_default && (
                      <button
                        onClick={() => handleSetDefault(model)}
                        className="p-1.5 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30 rounded transition-colors"
                        title={t("models.titleSetDefault")}
                      >
                        <CheckIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(model)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded transition-colors"
                      title={t("models.titleEdit")}
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                    </button>
                    {!model.is_default && (
                      <button
                        onClick={() => model.id && handleDelete(model.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded transition-colors"
                        title={t("models.titleDelete")}
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => setActiveModel(model)}
                      className="p-1.5 text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/30 rounded transition-colors"
                      title={t("models.titleUse")}
                    >
                      <ArrowRightIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelConfigPage;
