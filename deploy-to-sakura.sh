#!/bin/bash
# さくらのVPSへのデプロイスクリプト（ローカルから実行）
# 使用方法: ./deploy-to-sakura.sh [VPSのIPアドレス]

set -e

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# IPアドレスの確認
if [ $# -lt 1 ]; then
    echo -e "${RED}使用方法: $0 [VPSのIPアドレス]${NC}"
    echo "例: $0 123.45.67.89"
    exit 1
fi

VPS_IP=$1
VPS_USER="ubuntu"
REMOTE_PATH="/home/ubuntu/www"

echo -e "${GREEN}=== さくらのVPSへのデプロイ ===${NC}"
echo "VPS IP: $VPS_IP"
echo "ユーザー: $VPS_USER"
echo ""

# 1. ローカルでビルド
echo -e "${YELLOW}[1/6] フロントエンドをビルド中...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}エラー: distディレクトリが見つかりません${NC}"
    exit 1
fi

# 2. VPSへの接続確認
echo -e "${YELLOW}[2/6] VPSへの接続を確認中...${NC}"
if ! ssh -o ConnectTimeout=5 "$VPS_USER@$VPS_IP" "echo '接続成功'" 2>/dev/null; then
    echo -e "${RED}エラー: VPSに接続できません${NC}"
    echo "SSH接続を確認してください: ssh $VPS_USER@$VPS_IP"
    exit 1
fi

# 3. VPS上でディレクトリを作成
echo -e "${YELLOW}[3/6] VPS上でディレクトリを作成中...${NC}"
ssh "$VPS_USER@$VPS_IP" "mkdir -p $REMOTE_PATH && mkdir -p $REMOTE_PATH/logs"

# 4. 必要なファイルをVPSにコピー
echo -e "${YELLOW}[4/6] ファイルをVPSにコピー中...${NC}"
scp -r server.js package.json package-lock.json ecosystem.config.js "$VPS_USER@$VPS_IP:$REMOTE_PATH/"
scp -r dist public scripts "$VPS_USER@$VPS_IP:$REMOTE_PATH/"
scp .htaccess.example "$VPS_USER@$VPS_IP:$REMOTE_PATH/.htaccess"

# 5. VPS上でセットアップ
echo -e "${YELLOW}[5/6] VPS上でセットアップ中...${NC}"
ssh "$VPS_USER@$VPS_IP" << 'ENDSSH'
cd /home/ubuntu/www

# Node.jsの確認
if ! command -v node &> /dev/null; then
    echo "Node.jsをインストール中..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 依存関係をインストール
npm install --production

# データベースを初期化（存在しない場合）
if [ ! -f "database.db" ]; then
    npm run init-db
fi

# PM2をインストール（存在しない場合）
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi
ENDSSH

# 6. アプリケーションを起動
echo -e "${YELLOW}[6/6] アプリケーションを起動中...${NC}"
ssh "$VPS_USER@$VPS_IP" << 'ENDSSH'
cd /home/ubuntu/www

# PM2でアプリケーションを起動または再起動
if pm2 list | grep -q "fim-prediction"; then
    pm2 restart fim-prediction
else
    pm2 start ecosystem.config.js
    pm2 startup
    pm2 save
fi

# ステータスを表示
pm2 status
ENDSSH

echo ""
echo -e "${GREEN}=== デプロイ完了 ===${NC}"
echo ""
echo "次のステップ:"
echo "1. VPSにSSH接続: ssh $VPS_USER@$VPS_IP"
echo "2. アプリケーションディレクトリに移動: cd $REMOTE_PATH"
echo "3. ログを確認: pm2 logs fim-prediction"
echo ""
echo "Webブラウザで http://$VPS_IP:3001 にアクセスして動作確認してください"

