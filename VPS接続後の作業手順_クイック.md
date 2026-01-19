# VPS接続後の作業手順（クイックリファレンス）

## 問題の原因

エラーメッセージから、現在 `/home/ubuntu` にいますが、プロジェクトディレクトリに移動する必要があります。

## 解決方法

### ステップ1: プロジェクトディレクトリを確認・移動

```bash
# プロジェクトディレクトリを探す
ls -la ~/www
ls -la ~/FIM-system

# プロジェクトディレクトリに移動（存在する場合）
cd ~/www
# または
cd ~/FIM-system
```

### ステップ2A: プロジェクトディレクトリが存在する場合

```bash
# プロジェクトディレクトリに移動
cd ~/www

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

# Python依存関係のインストール
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

# PM2で起動
pm2 start ecosystem.r.config.js
pm2 save
```

## 現在のエラーの解決

エラーメッセージから、以下の手順で解決できます：

```bash
# 1. プロジェクトディレクトリに移動
cd ~/www

# 2. Gitリポジトリか確認
git status

# 3. 最新のコードを取得
git pull origin main

# 4. 依存関係を更新
npm install --production

# 5. フロントエンドを再ビルド
npm run build

# 6. PM2で再起動（プロセスが存在する場合）
pm2 restart all

# または、新規に起動（プロセスが存在しない場合）
pm2 start ecosystem.r.config.js
pm2 save
```

## PM2プロセスが見つからない場合

```bash
# PM2の状態を確認
pm2 list

# プロセスが存在しない場合は、新規に起動
cd ~/www
pm2 start ecosystem.r.config.js
pm2 save

# ステータス確認
pm2 status
```
