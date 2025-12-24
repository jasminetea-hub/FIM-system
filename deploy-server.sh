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

# 3. フロントエンドをビルド
echo -e "${YELLOW}[3/5] フロントエンドをビルド中...${NC}"
npm run build

# 4. データベースの確認（初回のみ）
if [ ! -f "database.db" ]; then
    echo -e "${YELLOW}[4/5] データベースを初期化中...${NC}"
    npm run init-db
else
    echo -e "${YELLOW}[4/5] データベースは既に存在します（スキップ）${NC}"
fi

# 5. PM2で再起動
echo -e "${YELLOW}[5/5] アプリケーションを再起動中...${NC}"

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

