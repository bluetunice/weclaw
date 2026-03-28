@echo off
REM WeClaw Client 启动脚本 (Windows版本)

setlocal enabledelayedexpansion

echo ========================================
echo   WeClaw Client
echo ========================================
echo.

REM 检查参数
set MODE=%1
set PLATFORM=%2

if "%MODE%"=="" (
    set MODE=dev
)

REM 检查 Node.js 依赖
echo 🔍 检查依赖...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js 未安装，请先安装 Node.js
    pause
    exit /b 1
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm 未安装，请先安装 npm
    pause
    exit /b 1
)

echo ✅ 依赖检查通过
echo.

REM 安装依赖
if "%MODE%"=="dev" (
    echo 📦 安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
    echo.
    
    echo 🚀 启动开发模式...
    echo 应用将在 http://localhost:3000 启动
    echo 按 Ctrl+C 停止
    echo.
    
    call npm run dev
    
) else if "%MODE%"=="build" (
    echo 📦 安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
    echo.
    
    echo 🔨 构建应用...
    call npm run build
    if %errorlevel% neq 0 (
        echo ❌ 构建失败
        pause
        exit /b 1
    )
    echo ✅ 应用构建完成
    echo 输出目录: dist/
    echo.
    
) else if "%MODE%"=="package" (
    if "%PLATFORM%"=="" (
        echo ❌ 请指定打包平台 (mac/win)
        goto show_help
    )
    
    echo 📦 安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
    echo.
    
    echo 🔨 构建应用...
    call npm run build
    if %errorlevel% neq 0 (
        echo ❌ 构建失败
        pause
        exit /b 1
    )
    echo ✅ 应用构建完成
    echo.
    
    if /i "%PLATFORM%"=="win" (
        echo 📦 打包 Windows 应用...
        call npm run package:win
    ) else if /i "%PLATFORM%"=="mac" (
        echo 📦 打包 macOS 应用...
        call npm run package:mac
    ) else (
        echo ❌ 未知平台: %PLATFORM%
        goto show_help
    )
    
    if %errorlevel% neq 0 (
        echo ❌ 打包失败
        pause
        exit /b 1
    )
    
    echo ✅ 应用打包完成
    echo 安装包位于: dist/
    echo.
    
) else if "%MODE%"=="help" (
    goto show_help
) else (
    echo ❌ 未知命令: %MODE%
    goto show_help
)

pause
exit /b 0

:show_help
echo.
echo 使用说明:
echo   run.bat               ^| 安装依赖并启动开发模式
echo   run.bat dev           ^| 启动开发模式
echo   run.bat build         ^| 构建应用
echo   run.bat package ^<平台^> ^| 打包应用 (mac/win)
echo.
echo 环境要求:
echo   - Node.js 16+
echo   - npm 8+
echo   - 2GB+ 内存
echo.
pause