# GitHub経由デプロイ クイックスタート

GitHubからさくらのサーバーにデプロイする最短手順です。

## 初回デプロイ（5分）

### ステップ1: GitHubにプッシュ（1分）

ローカルで：

```bash
# まだGitリポジトリでない場合
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/[ユーザー名]/[リポジトリ名].git
git branch -M main
git push -u origin main
```

### ステップ2: サーバーでクローン（1分）

SSHでサーバーに接続：

```bash
cd /home/[ユーザー名]/[ドメイン名]/
git clone https://github.com/[ユーザー名]/[リポジトリ名].git .
```

### ステップ3: セットアップと起動（3分）

```bash
# 依存関係をインストール
npm install --production

# フロントエンドをビルド
npm run build

# データベースを初期化
npm run init-db

# PM2をインストール（初回のみ）
npm install -g pm2

# ログディレクトリを作成
mkdir -p logs

# アプリケーションを起動
pm2 start ecosystem.config.js

# 自動起動を設定
pm2 startup
pm2 save

# .htaccessを設定
cp .htaccess.example .htaccess
```

完了！ブラウザで `http://[あなたのドメイン]/` にアクセスして確認。

---

## 更新時のデプロイ（1分）

コードを更新した場合：

### ローカルで

```bash
git add .
git commit -m "更新内容"
git push origin main
```

### サーバーで

```bash
cd /home/[ユーザー名]/[ドメイン名]/
./deploy-server.sh
```

または手動で：

```bash
git pull origin main
npm install --production
npm run build
pm2 restart fim-prediction
```

---

## デプロイスクリプトのセットアップ

初回のみ、サーバー側でデプロイスクリプトに実行権限を付与：

```bash
chmod +x deploy-server.sh
```

これで、`./deploy-server.sh`で自動デプロイできます。

