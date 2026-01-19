# R モデルデプロイ クイックリファレンス

## 前提条件

- VPS IP: 160.16.92.115
- ユーザー: ubuntu
- GitHub: https://github.com/jasminetea-hub/FIM-system.git

## 1. VPS に接続

```powershell
ssh ubuntu@160.16.92.115
```

## 2. システムセットアップ（初回のみ）

```bash
# システム更新
sudo apt update && sudo apt upgrade -y

# 基本パッケージ
sudo apt install -y curl wget git build-essential python3 python3-pip python3-venv

# Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Rのインストール
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys E298A3A825C0D65DFD57CBB651716619E084DAB9
sudo add-apt-repository "deb https://cloud.r-project.org/bin/linux/ubuntu $(lsb_release -cs)-cran40/"
sudo apt update
sudo apt install -y r-base r-base-dev

# Rパッケージ
sudo Rscript -e "install.packages(c('caret', 'randomForest', 'rpart'), repos='https://cran.r-project.org/')"

# rpy2の依存関係
sudo apt install -y python3-dev libxml2-dev libcurl4-openssl-dev libssl-dev libfontconfig1-dev

# rpy2
sudo pip3 install rpy2

# PM2
sudo npm install -g pm2

# ファイアウォール
sudo ufw allow 22/tcp
sudo ufw allow 3001/tcp
sudo ufw allow 5000/tcp
sudo ufw enable
```

## 3. アプリケーションデプロイ

```bash
# ディレクトリ作成
mkdir -p ~/www
cd ~/www

# クローン
git clone https://github.com/jasminetea-hub/FIM-system.git .

# Node.js依存関係
npm install --production

# Python依存関係
cd r_api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..

# ビルド
npm run build

# データベース初期化
npm run init-db

# ログディレクトリ
mkdir -p logs

# 環境変数
echo "NODE_ENV=production" > .env
echo "PORT=3001" >> .env
echo "R_API_URL=http://localhost:5000" >> .env
chmod 600 .env
```

## 4. R モデルファイルの確認

```bash
# Rモデルファイルが存在するか確認
ls -la r_api/r_models/*.rds

# 存在しない場合は、Rでモデルを学習・保存
# Rコンソールで実行:
# source("r_api/save_r_models.R")
```

## 5. PM2 で起動

```bash
# Rモデル用の設定で起動（両方のサーバーが起動）
pm2 start ecosystem.r.config.js

# 自動起動設定
pm2 startup
# 表示されたコマンドを実行

pm2 save

# ステータス確認
pm2 status
```

## 6. 動作確認

```bash
# R FastAPIのヘルスチェック
curl http://localhost:5000/health

# Node.jsサーバーの確認
curl http://localhost:3001/api/stats

# ブラウザで確認
# http://160.16.92.115:3001
```

## 更新時のデプロイ

```bash
cd ~/www
git pull origin main
npm install --production
cd r_api && source venv/bin/activate && pip install -r requirements.txt && deactivate && cd ..
npm run build
pm2 restart all
pm2 logs --lines 50
```

## トラブルシューティング

```bash
# ログ確認
pm2 logs
pm2 logs fim-prediction-r
pm2 logs r-api-server

# R FastAPIの確認
curl http://localhost:5000/health

# 手動でR FastAPIを起動してテスト
cd r_api
source venv/bin/activate
python3 predict_api_fastapi.py
```

詳細は `docs/Rモデル専用デプロイ手順.md` を参照してください。



