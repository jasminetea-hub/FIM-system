# rootユーザーでのデプロイ手順（簡単版）

rootユーザーでログインしている場合、そのまま作業を進められます。

## 実行コマンド（順番に実行）

### 1. システムを更新

```bash
apt update && apt upgrade -y
```

### 2. Node.js 18.xをインストール

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
node --version
npm --version
```

### 3. Gitをインストール

```bash
apt install git -y
git --version
```

### 4. PM2をインストール

```bash
npm install -g pm2
pm2 --version
```

### 5. デプロイディレクトリを作成

```bash
mkdir -p /home/ubuntu/www
cd /home/ubuntu/www
```

### 6. GitHubからクローン

```bash
git clone https://github.com/jasminetea-hub/FIM-system.git .
```

### 7. 依存関係をインストール

```bash
npm install --production
```

### 8. フロントエンドをビルド

```bash
npm run build
```

### 9. データベースを初期化

```bash
npm run init-db
```

### 10. ログディレクトリと.htaccessを設定

```bash
mkdir -p logs
cp .htaccess.example .htaccess
```

### 11. PM2でアプリケーションを起動

```bash
pm2 start ecosystem.r.config.js
pm2 startup
# 表示されたコマンドを実行（sudoは不要、rootなので）
pm2 save
pm2 status
```

### 12. ファイアウォール設定

```bash
ufw allow 3001/tcp
ufw enable
ufw status
```

## 動作確認

ブラウザで以下のURLにアクセス：

```
http://160.16.92.115:3001
```

## ログ確認

```bash
pm2 logs fim-prediction
```

## トラブルシューティング

### Node.jsのインストールに失敗する場合

```bash
apt remove nodejs npm -y
apt autoremove -y
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
```

### PM2が起動しない場合

```bash
pm2 logs fim-prediction --lines 50
pm2 describe fim-prediction
cd /home/ubuntu/www
node server_r_model.js
```

### ポート3001にアクセスできない場合

```bash
pm2 status
curl http://localhost:3001
ufw status
ufw allow 3001/tcp
```

