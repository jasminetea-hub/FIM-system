# さくらのVPSへのデプロイ手順

## 接続情報

- **ユーザー名**: ubuntu
- **パスワード**: sakura.ubuntu1127
- **サーバー**: Ubuntu 22.04 server
- **ホスト名**: sakuraubuntu

## ステップ1: IPアドレスの確認

さくらのコントロールパネルでVPSのIPアドレスを確認してください。

または、以下のコマンドでホスト名からIPアドレスを取得できます：

```powershell
# PowerShellで
Resolve-DnsName sakuraubuntu

# または、pingで確認
ping sakuraubuntu
```

## ステップ2: SSH接続の確認

WindowsのPowerShellから接続を試します：

```powershell
ssh ubuntu@sakuraubuntu
```

または、IPアドレスが分かっている場合：

```powershell
ssh ubuntu@[IPアドレス]
```

初回接続時は、以下のようなメッセージが表示されます：

```
The authenticity of host 'sakuraubuntu (xxx.xxx.xxx.xxx)' can't be established.
ECDSA key fingerprint is SHA256:xxxxxxxxxxxxx.
Are you sure you want to continue connecting (yes/no/[fingerprint])? 
```

`yes`と入力してEnterキーを押してください。

パスワードを求められたら、`sakura.ubuntu1127`を入力します。

## ステップ3: VPS上での初期セットアップ

SSH接続後、以下のコマンドを実行します：

### 3-1. システムの更新

```bash
sudo apt update
sudo apt upgrade -y
```

### 3-2. Node.jsのインストール

```bash
# Node.js 18.xをインストール
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# バージョンを確認
node --version
npm --version
```

### 3-3. Gitのインストール（まだの場合）

```bash
sudo apt install git -y
git --version
```

### 3-4. PM2のインストール

```bash
sudo npm install -g pm2
pm2 --version
```

### 3-5. デプロイディレクトリの作成

```bash
mkdir -p ~/www
cd ~/www
```

## ステップ4: GitHubからデプロイ

### 方法A: GitHubからクローン（推奨）

```bash
# GitHubリポジトリをクローン
git clone https://github.com/[ユーザー名]/[リポジトリ名].git .

# 依存関係をインストール
npm install --production

# フロントエンドをビルド
npm run build

# データベースを初期化
npm run init-db

# ログディレクトリを作成
mkdir -p logs

# .htaccessを設定
cp .htaccess.example .htaccess

# PM2でアプリケーションを起動
pm2 start ecosystem.r.config.js

# 自動起動を設定
pm2 startup
pm2 save

# ステータス確認
pm2 status
```

### 方法B: ローカルからファイルをコピー

WindowsのPowerShellから：

```powershell
# 1. ローカルでビルド
npm run build

# 2. VPSにファイルをコピー
scp -r server_r_model.js package.json package-lock.json ubuntu@sakuraubuntu:~/www/
scp -r dist public scripts r_api ubuntu@sakuraubuntu:~/www/
scp ecosystem.r.config.js .htaccess.example ubuntu@sakuraubuntu:~/www/

# 3. VPSに接続してセットアップ
ssh ubuntu@sakuraubuntu
```

VPS上で：

```bash
cd ~/www
npm install --production
npm run init-db
cp .htaccess.example .htaccess
pm2 start ecosystem.r.config.js
pm2 startup
pm2 save
```

## ステップ5: ファイアウォールの設定

Ubuntuのファイアウォール（ufw）でポート3001を開放：

```bash
# ファイアウォールの状態を確認
sudo ufw status

# ポート3001を開放
sudo ufw allow 3001/tcp

# ファイアウォールを有効化（まだの場合）
sudo ufw enable
```

## ステップ6: リバースプロキシの設定（Nginx）

さくらのVPSでは、Nginxを使用してリバースプロキシを設定することを推奨します。

### Nginxのインストール

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Nginx設定ファイルの作成

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

### 設定を有効化

```bash
# シンボリックリンクを作成
sudo ln -s /etc/nginx/sites-available/fim-prediction /etc/nginx/sites-enabled/

# 設定をテスト
sudo nginx -t

# Nginxを再起動
sudo systemctl restart nginx
```

## ステップ7: 動作確認

1. **PM2のステータス確認**

```bash
pm2 status
pm2 logs fim-prediction
```

2. **アプリケーションにアクセス**

ブラウザで以下のURLにアクセス：
- `http://[IPアドレス]:3001` （直接アクセス）
- `http://[IPアドレス]` （Nginx経由）

## 更新時のデプロイ

### GitHub経由の場合

```bash
cd ~/www
git pull origin main
npm install --production
npm run build
pm2 restart fim-prediction
```

または、デプロイスクリプトを使用：

```bash
cd ~/www
./deploy-server.sh
```

## トラブルシューティング

### ポート3001にアクセスできない

1. ファイアウォールの設定を確認：
```bash
sudo ufw status
sudo ufw allow 3001/tcp
```

2. PM2のステータスを確認：
```bash
pm2 status
pm2 logs fim-prediction
```

3. アプリケーションが正しく起動しているか確認：
```bash
curl http://localhost:3001
```

### PM2が起動しない

```bash
# ログを確認
pm2 logs fim-prediction --lines 50

# エラーの詳細を確認
pm2 describe fim-prediction
```

### Node.jsのバージョンが古い

```bash
# Node.jsを再インストール
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
```

## セキュリティの推奨事項

1. **SSH鍵認証の設定**: パスワード認証よりも安全です
2. **ファイアウォールの設定**: 必要なポートのみ開放
3. **SSL証明書の設定**: Let's Encryptを使用してHTTPSを有効化
4. **定期的な更新**: システムとパッケージを定期的に更新

## 参考リンク

- [さくらのVPS マニュアル](https://manual.sakura.ad.jp/vps/)
- [Ubuntu公式ドキュメント](https://ubuntu.com/documentation)
- [Node.js公式サイト](https://nodejs.org/)
- [PM2公式ドキュメント](https://pm2.keymetrics.io/)

