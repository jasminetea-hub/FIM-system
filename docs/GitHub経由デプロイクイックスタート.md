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

### ステップ3: Rモデルファイルの配置（初回のみ）

**重要**: Rモデルファイル（`.rds`）がGitHubに含まれていない場合、手動で配置する必要があります。

ローカルのターミナルから：

```bash
# モデルファイルをVPSにアップロード
scp r_api/r_models/rf_model_all_FIM.rds [ユーザー名]@[サーバーアドレス]:~/www/r_api/r_models/
```

または、サーバー上で確認：

```bash
# サーバー上で
ls -la r_api/r_models/*.rds
# ファイルが存在しない場合は、上記のscpコマンドでアップロード
```

### ステップ4: セットアップと起動（3分）

```bash
# Python依存関係をインストール（R FastAPI用）
cd r_api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..

# Node.js依存関係をインストール
npm install --production

# フロントエンドをビルド
npm run build

# データベースを初期化
npm run init-db

# PM2をインストール（初回のみ）
npm install -g pm2

# ログディレクトリを作成
mkdir -p logs

# Rモデルファイルの確認
cd r_api
python3 check_model.py
cd ..

# アプリケーションを起動（R FastAPIとNode.jsサーバーの両方）
pm2 start ecosystem.r.config.js

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
cd r_api && source venv/bin/activate && pip install -r requirements.txt && deactivate && cd ..
npm run build
pm2 restart all
```

---

## デプロイスクリプトのセットアップ

初回のみ、サーバー側でデプロイスクリプトに実行権限を付与：

```bash
chmod +x deploy-server.sh
```

これで、`./deploy-server.sh`で自動デプロイできます。

