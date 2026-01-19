#!/bin/bash
# サーバー側デプロイスクリプト
# このファイルをサーバー上に配置して使用します
# 使用方法: ./deploy-server.sh

set -e

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== FIM予測システム デプロイスクリプト ===${NC}"
echo ""

# 現在のディレクトリを確認
CURRENT_DIR=$(pwd)
echo "現在のディレクトリ: $CURRENT_DIR"
echo ""

# Gitリポジトリかどうか確認
if [ ! -d ".git" ]; then
    echo -e "${RED}エラー: このディレクトリはGitリポジトリではありません${NC}"
    echo "GitHubからクローンするか、git initを実行してください"
    exit 1
fi

# 1. 最新の変更を取得
echo -e "${YELLOW}[1/5] GitHubから最新の変更を取得中...${NC}"
git pull origin main || git pull origin master

# 2. 依存関係を更新
echo -e "${YELLOW}[2/5] 依存関係を更新中...${NC}"
npm install --production

# Python依存関係の更新（R FastAPI用）
if [ -d "r_api" ]; then
    echo -e "${YELLOW}Python依存関係を更新中...${NC}"
    cd r_api
    if [ ! -d "venv" ]; then
        echo "Python仮想環境を作成中..."
        python3 -m venv venv
    fi
    source venv/bin/activate
    pip install -r requirements.txt
    deactivate
    cd ..
fi

# 3. フロントエンドをビルド
echo -e "${YELLOW}[3/5] フロントエンドをビルド中...${NC}"
npm run build

# 4. Rモデルファイルの確認
if [ -d "r_api/r_models" ]; then
    MODEL_COUNT=$(find r_api/r_models -name "*.rds" 2>/dev/null | wc -l)
    if [ "$MODEL_COUNT" -eq 0 ]; then
        echo -e "${YELLOW}[4/6] 警告: Rモデルファイル（.rds）が見つかりません${NC}"
        echo "Rモデルファイルを r_api/r_models/ に配置してください"
    else
        echo -e "${YELLOW}[4/6] Rモデルファイルを確認: ${MODEL_COUNT}個のモデルが見つかりました${NC}"
    fi
else
    echo -e "${YELLOW}[4/6] r_api/r_models/ ディレクトリを作成中...${NC}"
    mkdir -p r_api/r_models
fi

# 5. データベースの確認（初回のみ）
if [ ! -f "database.db" ]; then
    echo -e "${YELLOW}[5/6] データベースを初期化中...${NC}"
    npm run init-db
else
    echo -e "${YELLOW}[5/6] データベースは既に存在します（スキップ）${NC}"
fi

# 6. PM2で再起動
echo -e "${YELLOW}[6/6] アプリケーションを再起動中...${NC}"

# PM2がインストールされているか確認
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2が見つかりません。インストールします...${NC}"
    npm install -g pm2
fi

# PM2でアプリケーションを起動または再起動
if pm2 list | grep -q "fim-prediction-r"; then
    echo "既存のアプリケーションを再起動します"
    pm2 restart all
else
    echo "新しいアプリケーションを起動します"
    mkdir -p logs
    pm2 start ecosystem.r.config.js
    pm2 startup
    pm2 save
fi

echo ""
echo -e "${GREEN}=== デプロイ完了 ===${NC}"
echo ""
echo "ステータス確認:"
pm2 status
echo ""
echo "ログ確認: pm2 logs fim-prediction-r"

