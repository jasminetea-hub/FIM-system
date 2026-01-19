# VPS接続後の作業手順

VPSにSSH接続した後の作業手順です。

## 現在の状況確認

VPSに接続後、まず現在の状況を確認します：

```bash
# 現在のディレクトリを確認
pwd

# 現在のユーザーを確認
whoami

# ホームディレクトリの内容を確認
ls -la ~
```

## プロジェクトディレクトリの確認

### ステップ1: プロジェクトディレクトリを探す

```bash
# 一般的な場所を確認
ls -la ~/www
ls -la ~/FIM-system
ls -la ~/web-app

# または、すべてのディレクトリを検索
find ~ -name "package.json" -type f 2>/dev/null
```

### ステップ2A: プロジェクトディレクトリが存在する場合

```bash
# プロジェクトディレクトリに移動
cd ~/www
# または
cd ~/FIM-system
# または、見つかったディレクトリに移動

# Gitリポジトリか確認
git status

# 最新のコードを取得
git pull origin main

# 依存関係を更新
npm install --production

# フロントエンドを再ビルド
npm run build

# PM2で再起動
pm2 restart all
```

### ステップ2B: プロジェクトディレクトリが存在しない場合（初回セットアップ）

```bash
# デプロイディレクトリを作成
mkdir -p ~/www
cd ~/www

# GitHubからクローン
git clone https://github.com/jasminetea-hub/FIM-system.git .

# 依存関係をインストール
npm install --production

# Python依存関係のインストール（r_api用）
cd r_api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..

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
# 表示されたコマンドを実行（sudoが必要な場合があります）

pm2 save

# ステータス確認
pm2 status
```

## 更新時のデプロイ手順

コードを更新した場合：

```bash
# プロジェクトディレクトリに移動
cd ~/www
# または、実際のプロジェクトディレクトリに移動

# 最新のコードを取得
git pull origin main

# 依存関係を更新（必要に応じて）
npm install --production

# フロントエンドを再ビルド
npm run build

# PM2で再起動
pm2 restart all

# または、個別に再起動
pm2 restart fim-prediction-r
pm2 restart r-api-server
```

## PM2の状態確認

```bash
# すべてのプロセスの状態を確認
pm2 status

# ログを確認
pm2 logs --lines 50

# 特定のプロセスのログ
pm2 logs fim-prediction-r
pm2 logs r-api-server
```

## トラブルシューティング

### PM2プロセスが見つからない場合

```bash
# すべてのPM2プロセスを確認
pm2 list

# プロセスが存在しない場合は、新規に起動
cd ~/www  # プロジェクトディレクトリに移動
pm2 start ecosystem.r.config.js
pm2 save
```

### Gitリポジトリが見つからない場合

```bash
# 現在のディレクトリを確認
pwd

# プロジェクトディレクトリに移動
cd ~/www
# または、実際のプロジェクトディレクトリに移動

# Gitリポジトリか確認
git status
```

### package.jsonが見つからない場合

```bash
# プロジェクトディレクトリに移動しているか確認
pwd
ls -la package.json

# 存在しない場合は、プロジェクトディレクトリに移動
cd ~/www
# または、GitHubからクローン
```

## よく使うコマンド

```bash
# プロジェクトディレクトリに移動
cd ~/www

# Gitの状態を確認
git status

# 最新のコードを取得
git pull origin main

# 依存関係を更新
npm install --production

# フロントエンドをビルド
npm run build

# PM2の状態確認
pm2 status

# PM2で再起動
pm2 restart all

# PM2のログ確認
pm2 logs --lines 50
```
