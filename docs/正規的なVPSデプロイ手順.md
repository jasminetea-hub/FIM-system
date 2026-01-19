# 正規的な VPS デプロイ手順

さくらの VPS への本番環境デプロイの正規的な手順です。

## 前提条件

- **VPS IP アドレス**: 160.16.92.115
- **ユーザー名**: ubuntu
- **GitHub リポジトリ**: https://github.com/jasminetea-hub/FIM-system.git
- **OS**: Ubuntu 22.04

## ステップ 1: VPS への接続

### Windows から SSH 接続

```powershell
ssh ubuntu@160.16.92.115
```

パスワード: `sakura.ubuntu1127`

または、SSH 鍵を使用：

```powershell
ssh -i $env:USERPROFILE\.ssh\sakura_vps_key ubuntu@160.16.92.115
```

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
# ファイアウォールの状態を確認
sudo ufw status

# SSHポート（22）を許可（既に許可されている場合が多い）
sudo ufw allow 22/tcp

# アプリケーション用ポート（3001）を許可
sudo ufw allow 3001/tcp

# HTTP/HTTPSポートを許可（Nginxを使用する場合）
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# ファイアウォールを有効化
sudo ufw enable

# 状態を確認
sudo ufw status
```

## ステップ 3: Node.js のインストール

### 3-1. Node.js 18.x LTS をインストール

```bash
# NodeSourceリポジトリを追加
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Node.jsをインストール
sudo apt-get install -y nodejs

# バージョンを確認
node --version
npm --version
```

### 3-2. npm のグローバルパッケージディレクトリを設定（オプション）

```bash
# グローバルパッケージのディレクトリを作成
mkdir -p ~/.npm-global

# npmの設定を更新
npm config set prefix '~/.npm-global'

# パスを追加（~/.bashrcに追加）
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

## ステップ 4: PM2 のインストールと設定

### 4-1. PM2 をインストール

```bash
sudo npm install -g pm2
pm2 --version
```

### 4-2. PM2 の自動起動を設定

```bash
# 自動起動スクリプトを生成
pm2 startup systemd

# 表示されたコマンドを実行（sudoが必要）
# 例: sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

## ステップ 5: アプリケーションのデプロイ

### 5-1. デプロイディレクトリを作成

```bash
# アプリケーションディレクトリを作成
mkdir -p ~/www
cd ~/www
```

### 5-2. GitHub リポジトリをクローン

```bash
# リポジトリをクローン
git clone https://github.com/jasminetea-hub/FIM-system.git .

# ディレクトリの確認
ls -la
```

### 5-3. 依存関係のインストール

```bash
# 本番環境用の依存関係をインストール
npm install --production

# インストールされたパッケージを確認
npm list --depth=0
```

### 5-4. フロントエンドのビルド

```bash
# フロントエンドをビルド
npm run build

# distディレクトリが作成されたか確認
ls -la dist/
```

### 5-5. データベースの初期化

```bash
# データベースを初期化
npm run init-db

# データベースファイルが作成されたか確認
ls -la database.db
```

### 5-6. ログディレクトリと設定ファイルの準備

```bash
# ログディレクトリを作成
mkdir -p logs

# .htaccessを設定（Apacheを使用する場合）
cp .htaccess.example .htaccess

# ファイルの権限を確認
ls -la
```

## ステップ 6: 環境変数の設定

### 6-1. .env ファイルの作成

```bash
# .envファイルを作成
nano .env
```

以下の内容を追加：

```env
NODE_ENV=production
PORT=3001
```

保存: `Ctrl + O`, `Enter`, `Ctrl + X`

### 6-2. .env ファイルの権限設定

```bash
# .envファイルの権限を制限
chmod 600 .env
```

## ステップ 7: PM2 でアプリケーションを起動

### 7-1. PM2 でアプリケーションを起動

```bash
# ecosystem.r.config.jsを使用して起動
pm2 start ecosystem.r.config.js

# または、直接起動
# pm2 start server_r_model.js --name fim-prediction-r
```

### 7-2. PM2 の設定を保存

```bash
# 現在のPM2プロセスを保存
pm2 save

# ステータスを確認
pm2 status

# 詳細情報を確認
pm2 describe fim-prediction
```

### 7-3. ログの確認

```bash
# リアルタイムログを確認
pm2 logs fim-prediction

# または、ログファイルを確認
tail -f logs/pm2-out.log
tail -f logs/pm2-error.log
```

## ステップ 8: Nginx の設定（推奨）

### 8-1. Nginx のインストール

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 8-2. Nginx 設定ファイルの作成

```bash
# 設定ファイルを作成
sudo nano /etc/nginx/sites-available/fim-prediction
```

以下の内容を追加：

```nginx
server {
    listen 80;
    server_name 160.16.92.115;

    # ログ設定
    access_log /var/log/nginx/fim-prediction-access.log;
    error_log /var/log/nginx/fim-prediction-error.log;

    # クライアントの最大ボディサイズ
    client_max_body_size 10M;

    # プロキシ設定
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

        # タイムアウト設定
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # APIエンドポイント
    location /api {
        proxy_pass http://localhost:3001/api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静的ファイルのキャッシュ設定
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3001;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

保存: `Ctrl + O`, `Enter`, `Ctrl + X`

### 8-3. シンボリックリンクの作成

```bash
# シンボリックリンクを作成
sudo ln -s /etc/nginx/sites-available/fim-prediction /etc/nginx/sites-enabled/

# デフォルトの設定を無効化（オプション）
sudo rm /etc/nginx/sites-enabled/default

# 設定をテスト
sudo nginx -t

# Nginxを再起動
sudo systemctl restart nginx

# ステータスを確認
sudo systemctl status nginx
```

## ステップ 9: SSL 証明書の設定（Let's Encrypt）

### 9-1. Certbot のインストール

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 9-2. SSL 証明書の取得

```bash
# ドメイン名がある場合
sudo certbot --nginx -d yourdomain.com

# IPアドレスのみの場合、Let's Encryptは使用できません
# 自己署名証明書を使用するか、ドメイン名を設定してください
```

## ステップ 10: セキュリティ設定

### 10-1. ファイルの権限設定

```bash
cd ~/www

# ディレクトリの権限を設定
chmod 755 .
chmod 755 logs

# データベースファイルの権限
chmod 664 database.db

# 設定ファイルの権限
chmod 600 .env

# .gitディレクトリの権限（本番環境では削除することも検討）
chmod -R 755 .git
```

### 10-2. 不要なファイルの削除

```bash
# 開発用ファイルを削除（オプション）
# rm -rf node_modules/.cache
# rm -rf .git/hooks
```

### 10-3. ログローテーションの設定

```bash
# PM2のログローテーションを設定
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

## ステップ 11: 動作確認

### 11-1. アプリケーションの動作確認

```bash
# PM2のステータスを確認
pm2 status

# ログを確認
pm2 logs fim-prediction --lines 50

# ローカルでアクセステスト
curl http://localhost:3001
curl http://localhost:3001/api/stats
```

### 11-2. ブラウザでアクセス

- **直接アクセス**: http://160.16.92.115:3001
- **Nginx 経由**: http://160.16.92.115

## ステップ 12: 監視とメンテナンス

### 12-1. システムリソースの監視

```bash
# PM2のモニタリング
pm2 monit

# システムリソースの確認
htop
# または
top
```

### 12-2. ログの確認

```bash
# PM2のログ
pm2 logs fim-prediction

# Nginxのログ
sudo tail -f /var/log/nginx/fim-prediction-access.log
sudo tail -f /var/log/nginx/fim-prediction-error.log

# システムログ
sudo journalctl -u nginx -f
```

## 更新時のデプロイ手順

### 方法 1: 手動デプロイ

```bash
cd ~/www

# 最新のコードを取得
git pull origin main

# 依存関係を更新
npm install --production

# フロントエンドを再ビルド
npm run build

# PM2で再起動
pm2 restart fim-prediction

# ログを確認
pm2 logs fim-prediction --lines 20
```

### 方法 2: デプロイスクリプトを使用

```bash
cd ~/www
./deploy-server.sh
```

## トラブルシューティング

### アプリケーションが起動しない

```bash
# PM2のログを確認
pm2 logs fim-prediction --lines 100

# 手動で起動してエラーを確認
cd ~/www
node server_r_model.js

# ポートが使用されているか確認
sudo netstat -tlnp | grep 3001
sudo lsof -i :3001
```

### ポート 3001 にアクセスできない

```bash
# ファイアウォールの設定を確認
sudo ufw status
sudo ufw allow 3001/tcp

# アプリケーションが起動しているか確認
pm2 status
curl http://localhost:3001
```

### Nginx が動作しない

```bash
# Nginxの設定をテスト
sudo nginx -t

# Nginxのログを確認
sudo tail -f /var/log/nginx/error.log

# Nginxのステータスを確認
sudo systemctl status nginx
```

## セキュリティチェックリスト

- [ ] ファイアウォールが有効になっている
- [ ] 不要なポートが閉じられている
- [ ] SSH 鍵認証が設定されている（パスワード認証を無効化）
- [ ] 定期的なシステム更新が設定されている
- [ ] ログローテーションが設定されている
- [ ] バックアップが設定されている
- [ ] SSL 証明書が設定されている（可能な場合）

## 参考リンク

- [Node.js 公式ドキュメント](https://nodejs.org/)
- [PM2 公式ドキュメント](https://pm2.keymetrics.io/)
- [Nginx 公式ドキュメント](https://nginx.org/)
- [Ubuntu 公式ドキュメント](https://ubuntu.com/documentation)
