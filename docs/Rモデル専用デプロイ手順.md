# R モデル専用デプロイ手順

R で学習した機械学習モデルを使用した予測システムのデプロイ手順です。

## 前提条件

- **VPS IP アドレス**: 160.16.92.115
- **ユーザー名**: ubuntu
- **GitHub リポジトリ**: https://github.com/jasminetea-hub/FIM-system.git
- **OS**: Ubuntu 22.04

## アーキテクチャ

```
フロントエンド (React)
    ↓
Node.jsサーバー (server_r_model.js) - ポート3001
    ↓
R FastAPIサーバー (predict_api_fastapi.py) - ポート5000
    ↓
Rモデル (.rdsファイル)
```

## ステップ 1: VPS への接続

```powershell
ssh ubuntu@160.16.92.115
```

または、VNC コンソールを使用。

## ステップ 2: システムの初期セットアップ

### 2-1. システムを更新

```bash
sudo apt update
sudo apt upgrade -y
```

### 2-2. 必要なパッケージをインストール

```bash
sudo apt install -y curl wget git build-essential
```

### 2-3. ファイアウォールの設定

```bash
sudo ufw allow 22/tcp
sudo ufw allow 3001/tcp
sudo ufw allow 5000/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

## ステップ 3: Node.js のインストール

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version
```

## ステップ 4: Python 3 のインストール

```bash
# Python 3とpipをインストール
sudo apt install -y python3 python3-pip python3-venv

# バージョンを確認
python3 --version
pip3 --version
```

## ステップ 5: R のインストール

### 5-1. R のリポジトリを追加

```bash
# Rのリポジトリを追加
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys E298A3A825C0D65DFD57CBB651716619E084DAB9
sudo add-apt-repository "deb https://cloud.r-project.org/bin/linux/ubuntu $(lsb_release -cs)-cran40/"
sudo apt update
```

### 5-2. R をインストール

```bash
sudo apt install -y r-base r-base-dev

# バージョンを確認
R --version
```

### 5-3. R パッケージをインストール

```bash
# Rパッケージをインストール（Rコンソールで実行）
sudo Rscript -e "install.packages(c('caret', 'randomForest', 'rpart'), repos='https://cran.r-project.org/')"
```

## ステップ 6: rpy2 のインストール

```bash
# システムの依存関係をインストール
sudo apt install -y python3-dev libxml2-dev libcurl4-openssl-dev libssl-dev libfontconfig1-dev

# rpy2をインストール
sudo pip3 install rpy2

# 動作確認
python3 -c "import rpy2; print('rpy2 installed successfully')"
```

## ステップ 7: PM2 のインストール

```bash
sudo npm install -g pm2
pm2 --version
```

## ステップ 8: アプリケーションのデプロイ

### 8-1. デプロイディレクトリを作成

```bash
mkdir -p ~/www
cd ~/www
```

### 8-2. GitHub リポジトリをクローン

```bash
git clone https://github.com/jasminetea-hub/FIM-system.git .
```

### 8-3. Node.js 依存関係をインストール

```bash
npm install --production
```

### 8-4. Python 依存関係をインストール

```bash
cd r_api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..
```

### 8-5. フロントエンドをビルド

```bash
npm run build
```

### 8-6. データベースを初期化

```bash
npm run init-db
```

### 8-7. R モデルファイルの確認

```bash
# Rモデルファイルが存在するか確認
ls -la r_api/r_models/

# 必要なモデルファイル:
# - rf_model_all_FIM.rds (総合計)
# - rf_model_motor_FIM.rds (運動機能合計)
# - rf_model_cog_FIM.rds (認知機能合計)
# - 各項目のモデルファイル（食事、整容、清拭など）
```

**注意**: R モデルファイル（`.rds`）が存在しない場合、R でモデルを学習・保存する必要があります。

### 8-8. ログディレクトリと設定ファイルの準備

```bash
mkdir -p logs
cp .htaccess.example .htaccess
```

### 8-9. 環境変数の設定

```bash
nano .env
```

以下の内容を追加：

```env
NODE_ENV=production
PORT=3001
R_API_URL=http://localhost:5000
```

保存: `Ctrl + O`, `Enter`, `Ctrl + X`

```bash
chmod 600 .env
```

## ステップ 9: PM2 でアプリケーションを起動

### 9-1. R FastAPI サーバーを起動

```bash
# ecosystem.r.config.jsを使用して起動
pm2 start ecosystem.r.config.js

# または、個別に起動
cd r_api
pm2 start python3 --name r-api-server --interpreter python3 -- predict_api_fastapi.py
cd ..
```

### 9-2. Node.js サーバーを起動

```bash
# server_r_model.jsを使用
pm2 start server_r_model.js --name fim-prediction-r

# または、ecosystem.r.config.jsを使用（両方起動）
pm2 start ecosystem.r.config.js
```

### 9-3. PM2 の自動起動を設定

```bash
pm2 startup systemd
# 表示されたコマンドを実行（sudoが必要）

pm2 save

# ステータス確認
pm2 status

# ログ確認
pm2 logs
```

## ステップ 10: 動作確認

### 10-1. R FastAPI サーバーの確認

```bash
# ヘルスチェック
curl http://localhost:5000/health

# 期待されるレスポンス:
# {"status":"ok","models_loaded":20,"available_models":[...]}
```

### 10-2. Node.js サーバーの確認

```bash
# APIエンドポイントの確認
curl http://localhost:3001/api/stats

# ローカルで予測APIをテスト
curl -X POST http://localhost:3001/api/predict \
  -H "Content-Type: application/json" \
  -d '{"gender":"male","age":65,"bmi":22.5,"careLevel":"no","daysFromOnset":30,"motionValues":{"食事":5,"整容":4},"cognitiveValues":{"理解":5,"表出":4}}'
```

### 10-3. ブラウザでアクセス

```
http://160.16.92.115:3001
```

## ステップ 11: Nginx の設定（オプション）

### 11-1. Nginx のインストール

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 11-2. Nginx 設定ファイルの作成

```bash
sudo nano /etc/nginx/sites-available/fim-prediction
```

以下の内容を追加：

```nginx
server {
    listen 80;
    server_name 160.16.92.115;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:3001/api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 11-3. 設定を有効化

```bash
sudo ln -s /etc/nginx/sites-available/fim-prediction /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## トラブルシューティング

### R FastAPI サーバーが起動しない

```bash
# Python環境を確認
cd r_api
source venv/bin/activate
python3 -c "import rpy2; print('rpy2 OK')"
python3 -c "import fastapi; print('fastapi OK')"

# Rが正しくインストールされているか確認
R --version

# 手動で起動してエラーを確認
python3 predict_api_fastapi.py
```

### R モデルが読み込まれない

```bash
# モデルファイルの存在確認
ls -la r_api/r_models/*.rds

# Rモデルを学習・保存する必要がある場合
# Rコンソールで実行:
# source("r_api/save_r_models.R")
```

### Node.js サーバーが R FastAPI に接続できない

```bash
# R FastAPIサーバーが起動しているか確認
pm2 status
curl http://localhost:5000/health

# 環境変数を確認
cat .env

# ログを確認
pm2 logs fim-prediction-r
pm2 logs r-api-server
```

### 予測が失敗する

```bash
# 詳細なログを確認
pm2 logs r-api-server --lines 100
pm2 logs fim-prediction-r --lines 100

# R FastAPIのログを確認
tail -f logs/r-api-out.log
tail -f logs/r-api-error.log
```

## 更新時のデプロイ

```bash
cd ~/www

# 最新のコードを取得
git pull origin main

# Node.js依存関係を更新
npm install --production

# Python依存関係を更新（必要に応じて）
cd r_api
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..

# フロントエンドを再ビルド
npm run build

# PM2で再起動
pm2 restart all

# ログを確認
pm2 logs --lines 50
```

## PM2 コマンドリファレンス

```bash
# ステータス確認
pm2 status

# ログ確認
pm2 logs
pm2 logs fim-prediction-r
pm2 logs r-api-server

# 再起動
pm2 restart all
pm2 restart fim-prediction-r
pm2 restart r-api-server

# 停止
pm2 stop all

# 削除
pm2 delete all
```

## セキュリティチェックリスト

- [ ] ファイアウォールが有効になっている
- [ ] 必要なポートのみ開放されている
- [ ] 環境変数ファイル（.env）の権限が適切（600）
- [ ] R モデルファイルの権限が適切
- [ ] ログローテーションが設定されている
- [ ] 定期的なバックアップが設定されている

## 参考リンク

- [R 公式サイト](https://www.r-project.org/)
- [rpy2 公式ドキュメント](https://rpy2.github.io/)
- [FastAPI 公式ドキュメント](https://fastapi.tiangolo.com/)
- [PM2 公式ドキュメント](https://pm2.keymetrics.io/)
