#!/bin/bash

# WeClaw Client 启动脚本
# 使用方法: ./run.sh [dev|build|package]

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

function print_header() {
  echo "========================================"
  echo "  WeClaw Client"
  echo "========================================"
  echo ""
}

function check_dependencies() {
  echo "🔍 检查依赖..."
  
  # 检查 Node.js
  if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
  fi
  
  # 检查 npm
  if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
  fi
  
  NODE_VERSION=$(node -v | cut -d'v' -f2)
  NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)
  
  if [ "$NODE_MAJOR" -lt 16 ]; then
    echo "⚠️  推荐使用 Node.js 16 或更高版本 (当前: $NODE_VERSION)"
  fi
  
  echo "✅ 依赖检查通过"
  echo ""
}

function install_dependencies() {
  echo "📦 安装依赖..."
  npm install
  echo "✅ 依赖安装完成"
  echo ""
}

function start_dev() {
  echo "🚀 启动开发模式..."
  echo "应用将在 http://localhost:3000 启动"
  echo "按 Ctrl+C 停止"
  echo ""
  
  # 启动开发服务器
  npm run dev
}

function build_app() {
  echo "🔨 构建应用..."
  npm run build
  echo "✅ 应用构建完成"
  echo "输出目录: dist/"
  echo ""
}

function package_app() {
  local platform=$1
  
  echo "📦 打包应用 ($platform)..."
  
  case $platform in
    mac)
      npm run package:mac
      ;;
    win)
      npm run package:win
      ;;
    *)
      echo "⚠️  未知平台: $platform"
      echo "可用平台: mac, win"
      exit 1
      ;;
  esac
  
  echo "✅ 应用打包完成"
  echo "安装包位于: dist/"
  echo ""
}

function show_help() {
  echo "使用说明:"
  echo "  ./run.sh                 # 安装依赖并启动开发模式"
  echo "  ./run.sh dev            # 启动开发模式"
  echo "  ./run.sh build          # 构建应用"
  echo "  ./run.sh package <平台> # 打包应用 (mac/win)"
  echo ""
  echo "环境要求:"
  echo "  - Node.js 16+"
  echo "  - npm 8+"
  echo "  - 2GB+ 内存"
  echo ""
}

# 主函数
main() {
  print_header
  
  case $1 in
    "")
      check_dependencies
      install_dependencies
      start_dev
      ;;
    dev)
      check_dependencies
      start_dev
      ;;
    build)
      check_dependencies
      install_dependencies
      build_app
      ;;
    package)
      if [ -z "$2" ]; then
        echo "❌ 请指定打包平台 (mac/win)"
        show_help
        exit 1
      fi
      check_dependencies
      install_dependencies
      build_app
      package_app "$2"
      ;;
    help|--help|-h)
      show_help
      ;;
    *)
      echo "❌ 未知命令: $1"
      show_help
      exit 1
      ;;
  esac
}

# 执行主函数
main "$@"