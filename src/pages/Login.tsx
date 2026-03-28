import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSettings } from "../contexts/SettingsContext";
import { 
  ArrowRightOnRectangleIcon, 
  UserPlusIcon,
  CpuChipIcon
} from "@heroicons/react/24/outline";
import { WeClawLogo } from "../components/WeClawLogo";

const Login: React.FC = () => {
  const { login, register, isAuthenticated } = useAuth();
  const { t, settings } = useSettings();
  const navigate = useNavigate();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 如果已登录，直接跳转
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!username.trim() || !password.trim()) {
      setError(t("login.errorEmpty"));
      return;
    }

    if (!isLoginMode) {
      if (password !== confirmPassword) {
        setError(t("login.errorMismatch"));
        return;
      }
      if (password.length < 4) {
        setError(t("login.errorShort"));
        return;
      }
      setLoading(true);
      const success = register(username.trim(), password);
      setLoading(false);
      if (success) {
        login(username.trim(), password);
        navigate("/dashboard");
      } else {
        setError(t("login.errorExists"));
      }
      return;
    }

    setLoading(true);
    const success = login(username.trim(), password);
    setLoading(false);
    
    if (success) {
      navigate("/dashboard");
    } else {
      setError(t("login.errorFailed"));
    }
  };

  const isDark = settings.theme === "dark" || (settings.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden ${
      isDark ? "dark" : ""
    }`}>
      {/* 科技感背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-primary-950 to-gray-900">
        {/* 网格线条 */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
        
        {/* 动态光晕 */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* 扫描线效果 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent animate-scan" />
        </div>
      </div>

      {/* 背景装饰 - 代码符号 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 text-primary-500/10 text-6xl font-mono">{'{ }'}</div>
        <div className="absolute top-40 right-20 text-primary-500/10 text-4xl font-mono">&lt;/&gt;</div>
        <div className="absolute bottom-40 left-20 text-primary-500/10 text-5xl font-mono">AI</div>
        <div className="absolute bottom-20 right-10 text-primary-500/10 text-3xl font-mono">[]</div>
        <div className="absolute top-1/2 left-1/3 text-primary-500/10 text-4xl font-mono">_</div>
      </div>

      {/* 登录卡片 */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo 区域 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-5">
            <WeClawLogo size={80} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-wide">
            {t("app.name")}
          </h1>
          <p className="text-primary-300/80 mt-2 text-sm font-medium tracking-wider uppercase">
            {isLoginMode ? t("login.title") : t("register.title")}
          </p>
        </div>

        {/* 登录/注册表单 */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 用户名 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("login.username")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <div className="w-5 h-5 rounded-full bg-primary-500/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary-400" />
                  </div>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
                  placeholder={t("login.usernamePlaceholder")}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("login.password")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <CpuChipIcon className="h-5 w-5 text-primary-400/60" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
                  placeholder={t("login.passwordPlaceholder")}
                  autoComplete={isLoginMode ? "current-password" : "new-password"}
                />
              </div>
            </div>

            {/* 确认密码（注册模式） */}
            {!isLoginMode && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t("login.confirmPassword")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <CpuChipIcon className="h-5 w-5 text-primary-400/60" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
                    placeholder={t("login.confirmPasswordPlaceholder")}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}

            {/* 错误提示 */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-medium rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all duration-300 flex items-center justify-center space-x-2 group"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  {isLoginMode ? (
                    <>
                      <ArrowRightOnRectangleIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      <span>{t("login.submit")}</span>
                    </>
                  ) : (
                    <>
                      <UserPlusIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                      <span>{t("register.submit")}</span>
                    </>
                  )}
                </>
              )}
            </button>
          </form>

          {/* 切换登录/注册 */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <button
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setError("");
                setPassword("");
                setConfirmPassword("");
              }}
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              {isLoginMode ? t("login.switchRegister") : t("register.switchLogin")}
            </button>
          </div>
        </div>

        {/* 默认账号提示 */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p className="text-gray-400/60">{t("login.defaultHint")}</p>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: -10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 110%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Login;
