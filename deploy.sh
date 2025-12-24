#!/bin/bash
# さくらのインターネットへのデプロイスクリプト
# 使用方法: ./deploy.sh [サーバーユーザー名] [サーバーアドレス] [リモートパス]

set -e

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 引数の確認
if [ $# -lt 3 ]; then
    echo -e "${RED}使用方法: $0 [ユーザー名] [サーバーアドレス] [リモートパス]${NC}"
    echo "例: $0 username example.com /home/username/www"
    exit 1
fi

USER=$1
SERVER=$2
REMOTE_PATH=$3

echo -e "${GREEN}=== FIM予測システム デプロイスクリプト ===${NC}"
echo ""

# 1. ビルド
echo -e "${YELLOW}[1/5] フロントエンドをビルド中...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}エラー: distディレクトリが見つかりません${NC}"
    exit 1
fi

# 2. アップロードするファイルのリストを作成
echo -e "${YELLOW}[2/5] アップロードするファイルを準備中...${NC}"

# 一時ディレクトリを作成
TEMP_DIR=$(mktemp -d)
echo "一時ディレクトリ: $TEMP_DIR"

# 必要なファイルをコピー
cp server_r_model.js "$TEMP_DIR/"
cp package.json "$TEMP_DIR/"
cp package-lock.json "$TEMP_DIR/"
cp ecosystem.r.config.js "$TEMP_DIR/"
cp -r dist "$TEMP_DIR/"
cp -r public "$TEMP_DIR/"
cp -r scripts "$TEMP_DIR/"
cp -r r_api "$TEMP_DIR/"

# データベースファイルが存在する場合はコピー
if [ -f "database.db" ]; then
    echo "データベースファイルをコピーします"
    cp database.db "$TEMP_DIR/"
else
    echo "警告: database.dbが見つかりません。サーバーで初期化が必要です。"
fi

# .htaccessの例をコピー
if [ -f ".htaccess.example" ]; then
    cp .htaccess.example "$TEMP_DIR/.htaccess"
fi

# 3. サーバーにアップロード
echo -e "${YELLOW}[3/5] サーバーにアップロード中...${NC}"
echo "サーバー: $USER@$SERVER"
echo "パス: $REMOTE_PATH"

# rsyncを使用（推奨）
if command -v rsync &> /dev/null; then
    rsync -avz --progress \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude '*.log' \
        "$TEMP_DIR/" "$USER@$SERVER:$REMOTE_PATH/"
else
    echo -e "${YELLOW}rsyncが見つかりません。scpを使用します。${NC}"
    scp -r "$TEMP_DIR"/* "$USER@$SERVER:$REMOTE_PATH/"
fi

# 4. サーバーで依存関係をインストール
echo -e "${YELLOW}[4/5] サーバーで依存関係をインストール中...${NC}"
ssh "$USER@$SERVER" "cd $REMOTE_PATH && npm install --production"

# 5. データベースの初期化（必要に応じて）
echo -e "${YELLOW}[5/5] データベースの確認...${NC}"
ssh "$USER@$SERVER" "cd $REMOTE_PATH && if [ ! -f database.db ]; then npm run init-db; fi"

# クリーンアップ
rm -rf "$TEMP_DIR"

echo ""
echo -e "${GREEN}=== デプロイ完了 ===${NC}"
echo ""
echo "次のステップ:"
echo "1. SSHでサーバーに接続: ssh $USER@$SERVER"
echo "2. アプリケーションディレクトリに移動: cd $REMOTE_PATH"
echo "3. R FastAPIサーバーとNode.jsサーバーを起動:"
echo "   npm install -g pm2"
echo "   pm2 start ecosystem.r.config.js"
echo "   pm2 startup"
echo "   pm2 save"
echo ""
echo "または、systemdサービスとして設定してください。"
echo "詳細は docs/さくらのインターネットデプロイ手順.md を参照してください。"

