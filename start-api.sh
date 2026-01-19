#!/bin/bash

# FIM予測システム - APIサーバー起動スクリプト

echo "=========================================="
echo "FIM予測システム - APIサーバー起動"
echo "=========================================="
echo ""

# カレントディレクトリを確認
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# R FastAPIサーバーの起動
echo "1. R FastAPIサーバーを起動中..."
cd r_api
if [ ! -f "predict_api_fastapi.py" ]; then
    echo "❌ エラー: r_api/predict_api_fastapi.py が見つかりません"
    exit 1
fi

# Python環境の確認
if ! command -v python3 &> /dev/null; then
    echo "❌ エラー: python3 が見つかりません"
    exit 1
fi

# バックグラウンドでR FastAPIサーバーを起動
python3 predict_api_fastapi.py &
R_API_PID=$!
echo "✅ R FastAPIサーバーを起動しました (PID: $R_API_PID)"
echo "   URL: http://localhost:5000"
cd ..

# 少し待機（R FastAPIサーバーの起動を待つ）
sleep 3

# Node.jsサーバーの起動
echo ""
echo "2. Node.jsサーバーを起動中..."
if [ ! -f "server_r_model.js" ]; then
    echo "❌ エラー: server_r_model.js が見つかりません"
    kill $R_API_PID 2>/dev/null
    exit 1
fi

# Node.js環境の確認
if ! command -v node &> /dev/null; then
    echo "❌ エラー: node が見つかりません"
    kill $R_API_PID 2>/dev/null
    exit 1
fi

# バックグラウンドでNode.jsサーバーを起動
node server_r_model.js &
NODE_PID=$!
echo "✅ Node.jsサーバーを起動しました (PID: $NODE_PID)"
echo "   URL: http://localhost:3001"

echo ""
echo "=========================================="
echo "✅ サーバー起動完了"
echo "=========================================="
echo ""
echo "📱 アクセスURL:"
echo "   http://localhost:3001"
echo ""
echo "🔬 R FastAPI:"
echo "   http://localhost:5000"
echo "   http://localhost:5000/docs (APIドキュメント)"
echo ""
echo "⚠️  サーバーを停止するには、Ctrl+C を押してください"
echo ""

# シグナルハンドリング
trap "echo ''; echo 'サーバーを停止しています...'; kill $R_API_PID $NODE_PID 2>/dev/null; exit" INT TERM

# プロセスを待機
wait
