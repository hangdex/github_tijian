#!/bin/bash
# GitHub Repo Health Check — Startup Script
# Start both backend and frontend servers

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

PYTHON="/Users/xiaomademac/.workbuddy/binaries/python/envs/github-check/bin/python"
NODE="/Users/xiaomademac/.workbuddy/binaries/node/versions/22.22.2/bin/node"
NPM="/Users/xiaomademac/.workbuddy/binaries/node/versions/22.22.2/bin/npm"

echo "========================================="
echo "  GitHub 仓库体检工具 — 启动中..."
echo "========================================="
echo ""

# Start backend
echo "[1/2] 启动后端服务 (port 8000)..."
cd "$BACKEND_DIR"
$PYTHON main.py &
BACKEND_PID=$!
echo "  后端 PID: $BACKEND_PID"

# Wait for backend to be ready
sleep 2

# Start frontend
echo "[2/2] 启动前端服务 (port 5173)..."
cd "$FRONTEND_DIR"
$NODE node_modules/.bin/vite --host 0.0.0.0 &
FRONTEND_PID=$!
echo "  前端 PID: $FRONTEND_PID"

echo ""
echo "========================================="
echo "  服务已启动！"
echo "  前端: http://localhost:5173"
echo "  后端: http://localhost:8000"
echo "  API文档: http://localhost:8000/docs"
echo "========================================="
echo ""
echo "按 Ctrl+C 停止所有服务"

# Cleanup on exit
cleanup() {
    echo ""
    echo "正在停止服务..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "服务已停止"
}

trap cleanup EXIT INT TERM

# Wait for either process
wait
