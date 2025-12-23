# GitHub経由でのデプロイ手順

GitHubリポジトリからさくらのインターネットのサーバーにデプロイする方法を説明します。

## 前提条件

- GitHubリポジトリが作成済み
- さくらのサーバーにSSHアクセス可能
- サーバーにgitがインストールされている
- Node.jsが利用可能

## 方法1: git cloneを使用する方法（推奨）

### ステップ1: GitHubリポジトリの準備

ローカルでGitHubリポジトリにプッシュします：

```bash
# リポジトリがまだ初期化されていない場合
git init
git add .
git commit -m "Initial commit"

# GitHubリポジトリをリモートとして追加
git remote add origin https://github.com/[ユーザー名]/[リポジトリ名].git

# プッシュ
git branch -M main
git push -u origin main
```

### ステップ2: サーバーでリポジトリをクローン

SSHでサーバーに接続し、デプロイ先ディレクトリに移動：

```bash
# デプロイ先ディレクトリに移動
cd /home/[ユーザー名]/[ドメイン名]/

# GitHubリポジトリをクローン
git clone https://github.com/[ユーザー名]/[リポジトリ名].git .

# または、既存のディレクトリにクローンする場合
git clone https://github.com/[ユーザー名]/[リポジトリ名].git temp
mv temp/* .
mv temp/.git .
rmdir temp
```

### ステップ3: 依存関係のインストールとビルド

```bash
# 依存関係をインストール
npm install --production

# フロントエンドをビルド
npm run build

# データベースを初期化（初回のみ）
npm run init-db
```

### ステップ4: サーバーの起動

PM2を使用する場合：

```bash
# PM2をインストール（まだの場合）
npm install -g pm2

# ログディレクトリを作成
mkdir -p logs

# アプリケーションを起動
pm2 start ecosystem.config.js

# 自動起動を設定
pm2 startup
pm2 save
```

### ステップ5: .htaccessの設定

`.htaccess.example`を`.htaccess`としてコピー：

```bash
cp .htaccess.example .htaccess
```

### ステップ6: 環境変数の設定（オプション）

必要に応じて`.env`ファイルを作成：

```bash
echo "PORT=3001" > .env
echo "NODE_ENV=production" >> .env
```

---

## 方法2: 更新時のデプロイ手順

コードを更新した場合、以下の手順でデプロイします：

### ローカルで変更をコミット・プッシュ

```bash
# 変更をコミット
git add .
git commit -m "更新内容の説明"

# GitHubにプッシュ
git push origin main
```

### サーバーで更新を取得

SSHでサーバーに接続：

```bash
# デプロイ先ディレクトリに移動
cd /home/[ユーザー名]/[ドメイン名]/

# 最新の変更を取得
git pull origin main

# 依存関係を更新（必要に応じて）
npm install --production

# フロントエンドを再ビルド
npm run build

# サーバーを再起動
pm2 restart fim-prediction
```

---

## 方法3: デプロイスクリプトを使用する方法

更新を自動化するために、サーバー側にデプロイスクリプトを作成します。

### デプロイスクリプトの使用

プロジェクトに含まれている`deploy-server.sh`を使用できます。

**サーバー側でのセットアップ:**

```bash
# deploy-server.shをサーバーにアップロード（GitHubからクローンした場合は既に含まれています）
# 実行権限を付与
chmod +x deploy-server.sh
```

**使用方法:**

```bash
# サーバーにSSH接続して実行
./deploy-server.sh
```

このスクリプトは以下を自動的に実行します：
1. GitHubから最新の変更を取得（`git pull`）
2. 依存関係を更新（`npm install --production`）
3. フロントエンドをビルド（`npm run build`）
4. データベースの確認（存在しない場合は初期化）
5. PM2でアプリケーションを再起動

---

## 方法4: GitHub Actionsを使用した自動デプロイ（高度）

GitHub Actionsを使用して、プッシュ時に自動的にデプロイする方法です。

### ワークフローファイルの作成

`.github/workflows/deploy.yml`を作成：

```yaml
name: Deploy to Sakura Server

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Deploy to server
      uses: appleboy/scp-action@master
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USER }}
        key: ${{ secrets.SSH_PRIVATE_KEY }}
        source: "dist/,server.js,package.json,package-lock.json,scripts/,public/,ecosystem.config.js,.htaccess.example"
        target: "/home/${{ secrets.SERVER_USER }}/[ドメイン名]/"
    
    - name: Run deployment script
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USER }}
        key: ${{ secrets.SSH_PRIVATE_KEY }}
        script: |
          cd /home/${{ secrets.SERVER_USER }}/[ドメイン名]/
          npm install --production
          pm2 restart fim-prediction
```

### GitHub Secretsの設定

GitHubリポジトリのSettings > Secrets and variables > Actionsで以下を設定：

- `SERVER_HOST`: サーバーのホスト名またはIPアドレス
- `SERVER_USER`: SSHユーザー名
- `SSH_PRIVATE_KEY`: SSH秘密鍵

---

## トラブルシューティング

### git pullでコンフリクトが発生した場合

```bash
# 変更を一時保存
git stash

# 最新を取得
git pull origin main

# 変更を適用
git stash pop

# コンフリクトを解決後、コミット
git add .
git commit -m "コンフリクト解決"
git push origin main
```

### データベースファイルが上書きされるのを防ぐ

`.gitignore`に`database.db`が含まれていることを確認してください。
サーバー上のデータベースはGitで管理しないようにします。

### ビルドファイルがGitに含まれている場合

`dist/`ディレクトリは`.gitignore`に含まれていますが、
サーバー側で毎回ビルドすることを推奨します。

### 環境変数ファイルの管理

`.env`ファイルは`.gitignore`に含まれているため、GitHubにはアップロードされません。
サーバー側で手動で作成する必要があります。

---

## 推奨されるワークフロー

1. **開発**: ローカルで開発・テスト
2. **コミット**: 変更をコミット
3. **プッシュ**: GitHubにプッシュ
4. **デプロイ**: サーバーで`git pull`して`npm run build`と`pm2 restart`

または、デプロイスクリプトを使用して自動化：

```bash
# ローカルで
git push origin main

# サーバーで（SSH接続後）
./deploy.sh
```

---

## セキュリティの注意事項

1. **SSH鍵の管理**: GitHub Actionsを使用する場合、SSH鍵を適切に管理してください
2. **Secretsの保護**: GitHub Secretsに機密情報を保存し、リポジトリに直接書かないでください
3. **データベースのバックアップ**: デプロイ前にデータベースをバックアップすることを推奨します
4. **.envファイル**: 環境変数は`.env`ファイルで管理し、Gitにコミットしないでください

---

## 参考リンク

- [Git公式ドキュメント](https://git-scm.com/doc)
- [GitHub Actions公式ドキュメント](https://docs.github.com/ja/actions)
- [PM2公式ドキュメント](https://pm2.keymetrics.io/docs/usage/quick-start/)

