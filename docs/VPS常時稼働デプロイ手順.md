# VPS常時稼働デプロイ手順

この手順に従うことで、FIM予測システムをVPSで常時稼働させることができます。

## 前提条件

- VPSサーバー（Ubuntu 22.04推奨）
- SSHアクセス権限
- 管理者権限（sudo）

## ステップ1: VPSに接続

```bash
ssh ubuntu@[VPSのIPアドレス]
# または
ssh ubuntu@160.16.92.115
```

## ステップ2: システムの初期セットアップ（初回のみ）

### 2-1. システムの更新

```bash
sudo apt update
sudo apt upgrade -y
```

### 2-2. 必要なパッケージのインストール

```bash
# 基本パッケージ
sudo apt install -y curl wget git build-essential

# Python 3とpip
sudo apt install -y python3 python3-pip python3-venv

# Rの依存関係
sudo apt install -y python3-dev libxml2-dev libcurl4-openssl-dev libssl-dev libfontconfig1-dev
```

### 2-3. Node.js 18.xのインストール

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# バージョン確認
node --version
npm --version
```

### 2-4. Rのインストール

```bash
# Rのリポジトリを追加
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys E298A3A825C0D65DFD57CBB651716619E084DAB9
sudo add-apt-repository "deb https://cloud.r-project.org/bin/linux/ubuntu $(lsb_release -cs)-cran40/"
sudo apt update
sudo apt install -y r-base r-base-dev

# Rパッケージのインストール
sudo Rscript -e "install.packages(c('caret', 'randomForest', 'rpart'), repos='https://cran.r-project.org/')"
```

### 2-5. rpy2のインストール

```bash
sudo pip3 install rpy2
```

### 2-6. PM2のインストール

```bash
sudo npm install -g pm2
pm2 --version
```

### 2-7. ファイアウォールの設定

```bash
# SSHポート
sudo ufw allow 22/tcp

# アプリケーション用ポート
sudo ufw allow 3001/tcp

# R FastAPI用ポート
sudo ufw allow 5000/tcp

# HTTP/HTTPS（Nginxを使用する場合）
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# ファイアウォールを有効化
sudo ufw enable

# 状態確認
sudo ufw status
```

## ステップ3: アプリケーションのデプロイ

### 3-1. プロジェクトディレクトリの準備

```bash
# デプロイディレクトリに移動（既にFIM-systemがある場合）
cd ~/FIM-system

# または、新規にクローンする場合
mkdir -p ~/www
cd ~/www
git clone https://github.com/jasminetea-hub/FIM-system.git .
```

### 3-2. Node.js依存関係のインストール

```bash
cd ~/FIM-system
# または
cd ~/www/FIM-system

npm install --production
```

### 3-3. Python依存関係のインストール

```bash
cd r_api

# 仮想環境を作成
python3 -m venv venv

# 仮想環境をアクティベート
source venv/bin/activate

# 依存関係をインストール
pip install -r requirements.txt

# 仮想環境をデアクティベート
deactivate

cd ..
```

### 3-4. フロントエンドのビルド

```bash
npm run build
```

### 3-5. データベースの初期化

```bash
npm run init-db
```

### 3-6. ログディレクトリの作成

```bash
mkdir -p logs
```

### 3-7. ecosystem.r.config.jsのパス確認

`ecosystem.r.config.js`の`cwd`パスが正しいか確認：

```bash
cat ecosystem.r.config.js
```

必要に応じて修正：

```bash
nano ecosystem.r.config.js
```

`cwd`を実際のプロジェクトパスに変更（例：`/home/ubuntu/FIM-system`）

## ステップ4: PM2でアプリケーションを起動

### 4-1. PM2で起動

```bash
# プロジェクトディレクトリにいることを確認
pwd

# PM2でアプリケーションを起動（R FastAPIとNode.jsサーバーの両方）
pm2 start ecosystem.r.config.js

# ステータス確認
pm2 status
```

### 4-2. PM2の自動起動設定

```bash
# PM2の自動起動スクリプトを生成
pm2 startup

# 表示されたコマンドを実行（例：sudo env PATH=...）
# コマンドが表示されるので、それをコピーして実行

# 現在のプロセスリストを保存
pm2 save
```

### 4-3. ログの確認

```bash
# すべてのログを確認
pm2 logs

# 特定のアプリケーションのログ
pm2 logs fim-prediction-r
pm2 logs r-api-server

# 最新50行のログ
pm2 logs --lines 50
```

## ステップ5: 動作確認

### 5-1. PM2のステータス確認

```bash
pm2 status
```

以下のように表示されれば正常：

```
┌─────┬─────────────────────┬─────────┬─────────┬──────────┐
│ id  │ name                │ status  │ restart │ uptime   │
├─────┼─────────────────────┼─────────┼─────────┼──────────┤
│ 0   │ fim-prediction-r    │ online  │ 0       │ 1m       │
│ 1   │ r-api-server        │ online  │ 0       │ 1m       │
└─────┴─────────────────────┴─────────┴─────────┴──────────┘
```

### 5-2. アプリケーションへのアクセステスト

```bash
# ローカルからテスト
curl http://localhost:3001

# R FastAPIのヘルスチェック
curl http://localhost:5000/health
```

### 5-3. ブラウザからアクセス

- `http://[VPSのIPアドレス]:3001` でアクセス可能

## ステップ6: Nginxリバースプロキシの設定（オプション）

ポート3001を直接公開せず、Nginx経由でアクセスする場合：

### 6-1. Nginxのインストール

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 6-2. Nginx設定ファイルの作成

```bash
sudo nano /etc/nginx/sites-available/fim-prediction
```

以下の内容を追加：

```nginx
server {
    listen 80;
    server_name [あなたのドメイン] [IPアドレス];

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
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 6-3. 設定を有効化

```bash
# シンボリックリンクを作成
sudo ln -s /etc/nginx/sites-available/fim-prediction /etc/nginx/sites-enabled/

# デフォルト設定を無効化（オプション）
sudo rm /etc/nginx/sites-enabled/default

# 設定をテスト
sudo nginx -t

# Nginxを再起動
sudo systemctl restart nginx
```

## ステップ7: 更新時のデプロイ

### GitHub経由の場合

```bash
cd ~/FIM-system
# または
cd ~/www/FIM-system

# 最新のコードを取得
git pull origin main

# 依存関係を更新
npm install --production

# フロントエンドを再ビルド
npm run build

# PM2で再起動
pm2 restart all
```

## よくある問題と解決方法

### PM2が起動しない

```bash
# ログを確認
pm2 logs --lines 100

# 詳細情報を確認
pm2 describe fim-prediction-r
pm2 describe r-api-server

# 手動で起動してエラーを確認
cd ~/FIM-system
node server_r_model.js
```

### R FastAPIが起動しない

```bash
# Python仮想環境をアクティベートして手動起動
cd ~/FIM-system/r_api
source venv/bin/activate
python3 predict_api_fastapi.py
```

### ポートが使用できない

```bash
# ポートの使用状況を確認
sudo netstat -tlnp | grep 3001
sudo netstat -tlnp | grep 5000

# プロセスを確認
ps aux | grep node
ps aux | grep python
```

### PM2のプロセスを削除して再起動

```bash
# すべてのプロセスを停止
pm2 stop all

# すべてのプロセスを削除
pm2 delete all

# 再起動
pm2 start ecosystem.r.config.js
pm2 save
```

## PM2の便利なコマンド

```bash
# ステータス確認
pm2 status

# ログ確認
pm2 logs

# 再起動
pm2 restart all
pm2 restart fim-prediction-r
pm2 restart r-api-server

# 停止
pm2 stop all

# 起動
pm2 start all

# 削除
pm2 delete all

# モニタリング
pm2 monit

# プロセス情報
pm2 info fim-prediction-r
pm2 info r-api-server
```

## セキュリティの推奨事項

1. **SSH鍵認証の設定**: パスワード認証よりも安全
2. **ファイアウォールの設定**: 必要なポートのみ開放
3. **SSL証明書の設定**: Let's Encryptを使用してHTTPSを有効化
4. **定期的な更新**: システムとパッケージを定期的に更新

## 参考リンク

- [PM2公式ドキュメント](https://pm2.keymetrics.io/)
- [Node.js公式サイト](https://nodejs.org/)
- [Nginx公式ドキュメント](https://nginx.org/en/docs/)

