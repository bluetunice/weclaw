import React, { useState, useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate
} from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ModelConfigPage from "./pages/ModelConfig";
import WorkspaceManager from "./pages/WorkspaceManager";
import HistoryViewer from "./pages/HistoryViewer";
import Settings from "./pages/Settings";
import Chat from "./pages/Chat";
import Tasks from "./pages/Tasks";
import WorkflowEnhanced from "./pages/WorkflowEnhanced";
import SkillManager from "./pages/SkillManager";
import ToolManager from "./pages/ToolManager";
import ClawAgent from "./pages/ClawAgent";
import Login from "./pages/Login";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";
import { ModelProvider } from "./contexts/ModelContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { TaskProvider } from "./contexts/TaskContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// 路由保护组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 初始化检查
    const checkInitialization = async () => {
      // 这里可以添加初始化检查逻辑
      setIsLoading(false);
    };

    checkInitialization();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">正在加载 WeClaw Client...</p>
        </div>
      </div>
    );
  }

  return (
    <SettingsProvider>
      <AuthProvider>
        <TaskProvider>
          <WorkspaceProvider>
            <ModelProvider>
              <Router>
                <Routes>
                  {/* 登录页 - 无需保护 */}
                  <Route path="/login" element={<Login />} />

                  {/* 受保护的路由：Layout 作为外层容器 */}
                  <Route
                    element={
                      <ProtectedRoute>
                        <Layout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="models" element={<ModelConfigPage />} />
                    <Route path="workspace" element={<WorkspaceManager />} />
                    <Route path="history" element={<HistoryViewer />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="chat" element={<Chat />} />
                    <Route path="tasks" element={<Tasks />} />
                    <Route path="workflow" element={<WorkflowEnhanced />} />
                    <Route path="skills" element={<SkillManager />} />
                    <Route path="tools" element={<ToolManager />} />
                    <Route path="claw" element={<ClawAgent />} />
                  </Route>
                </Routes>
              </Router>
            </ModelProvider>
          </WorkspaceProvider>
        </TaskProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;
