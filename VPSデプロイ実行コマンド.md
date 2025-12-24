# VPSデプロイ実行コマンド

## 接続情報
- **IPアドレス**: 160.16.92.115
- **ユーザー名**: ubuntu
- **パスワード**: sakura.ubuntu1127
- **GitHubリポジトリ**: https://github.com/jasminetea-hub/FIM-system.git

## ステップ1: VPSにSSH接続

PowerShellで以下のコマンドを実行：

```powershell
ssh ubuntu@160.16.92.115
```

初回接続時は `yes` を入力し、パスワード `sakura.ubuntu1127` を入力します。

## ステップ2: VPS上でセットアップ（接続後）

VPSに接続後、以下のコマンドを順番に実行してください：

```bash
# 1. システムを更新
sudo apt update && sudo apt upgrade -y

# 2. Node.js 18.xをインストール
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# バージョンを確認
node --version
npm --version

# 3. Gitをインストール（まだの場合）
sudo apt install git -y
git --version

# 4. PM2をインストール
sudo npm install -g pm2
pm2 --version

# 5. デプロイディレクトリを作成
mkdir -p ~/www
cd ~/www
```

## ステップ3: GitHubからクローン

```bash
# GitHubリポジトリをクローン
git clone https://github.com/jasminetea-hub/FIM-system.git .

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
```

## ステップ4: PM2でアプリケーションを起動

```bash
# PM2でアプリケーションを起動
pm2 start ecosystem.r.config.js

# 自動起動を設定
pm2 startup
# 表示されたコマンドを実行（sudoが必要な場合があります）

pm2 save

# ステータス確認
pm2 status

# ログ確認（別ウィンドウで）
pm2 logs fim-prediction
```

## ステップ5: ファイアウォールの設定

```bash
# ポート3001を開放
sudo ufw allow 3001/tcp

# ファイアウォールの状態を確認
sudo ufw status

# ファイアウォールを有効化（まだの場合）
sudo ufw enable
```

## ステップ6: 動作確認

ブラウザで以下のURLにアクセス：

```
http://160.16.92.115:3001
```

## トラブルシューティング

### SSH接続できない場合

1. IPアドレスが正しいか確認: `160.16.92.115`
2. ファイアウォールでSSHポート（22）が開放されているか確認
3. さくらのコントロールパネルでVPSの状態を確認

### Node.jsのインストールに失敗する場合

```bash
# 古いNode.jsを削除
sudo apt remove nodejs npm -y
sudo apt autoremove -y

# 再度インストール
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### PM2が起動しない場合

```bash
# ログを確認
pm2 logs fim-prediction --lines 50

# エラーの詳細を確認
pm2 describe fim-prediction

# 手動で起動してエラーを確認
cd ~/www
node server_r_model.js
```

### ポート3001にアクセスできない場合

```bash
# アプリケーションが起動しているか確認
pm2 status

# ローカルでアクセスできるか確認
curl http://localhost:3001

# ファイアウォールの設定を確認
sudo ufw status
sudo ufw allow 3001/tcp
```

## 更新時のデプロイ

コードを更新した場合：

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

