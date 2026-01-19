# さくらのVPS - GitHub経由デプロイ手順（Rモデル対応）

さくらのVPSを使用してGitHubからデプロイする手順です。Rモデルを使用した予測システムのデプロイに対応しています。

## 前提条件

- さくらのVPSにSSHアクセス可能
- GitHubリポジトリが作成済み
- サーバーにgit、Node.js、Python3、Rがインストール済み

## 初回デプロイ手順

### ステップ1: VPSにSSH接続

```bash
ssh ubuntu@sakuraubuntu
# または
ssh ubuntu@[IPアドレス]
```

### ステップ2: システムの初期セットアップ（初回のみ）

```bash
# システムの更新
sudo apt update && sudo apt upgrade -y

# 基本パッケージのインストール
sudo apt install -y curl wget git build-essential python3 python3-pip python3-venv

# Node.js 18.xのインストール
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Rのインストール
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys E298A3A825C0D65DFD57CBB651716619E084DAB9
sudo add-apt-repository "deb https://cloud.r-project.org/bin/linux/ubuntu $(lsb_release -cs)-cran40/"
sudo apt update
sudo apt install -y r-base r-base-dev

# Rパッケージのインストール
sudo Rscript -e "install.packages(c('caret', 'randomForest', 'rpart'), repos='https://cran.r-project.org/')"

# rpy2の依存関係
sudo apt install -y python3-dev libxml2-dev libcurl4-openssl-dev libssl-dev libfontconfig1-dev

# PM2のインストール
sudo npm install -g pm2

# ファイアウォールの設定
sudo ufw allow 22/tcp
sudo ufw allow 3001/tcp
sudo ufw allow 5000/tcp
sudo ufw enable
```

### ステップ3: プロジェクトディレクトリの準備

```bash
# デプロイディレクトリを作成
mkdir -p ~/www
cd ~/www

# GitHubリポジトリをクローン
git clone https://github.com/[ユーザー名]/[リポジトリ名].git .
```

### ステップ4: Rモデルファイルの配置

**重要**: Rモデルファイル（`.rds`）は通常GitHubに含めません。以下のいずれかの方法で配置してください。

#### 方法A: ローカルから直接アップロード（推奨）

ローカルのターミナルから：

```bash
# モデルファイルをVPSにアップロード
scp r_api/r_models/rf_model_all_FIM.rds ubuntu@sakuraubuntu:~/www/r_api/r_models/
```

#### 方法B: GitHubに含める場合

`.gitignore`に`.rds`が含まれていない場合、GitHubにプッシュされます。この場合は追加の作業は不要です。

#### 方法C: サーバー上でRモデルを生成

サーバー上でRを実行してモデルを生成：

```bash
cd ~/www/r_api
Rscript save_r_models.R
```

### ステップ5: 依存関係のインストール

```bash
cd ~/www

# Node.js依存関係
npm install --production

# Python依存関係（R FastAPI用）
cd r_api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..
```

### ステップ6: フロントエンドのビルド

```bash
npm run build
```

### ステップ7: データベースの初期化

```bash
npm run init-db
```

### ステップ8: ログディレクトリの作成

```bash
mkdir -p logs
```

### ステップ9: Rモデルファイルの確認

```bash
# モデルファイルが存在するか確認
ls -la r_api/r_models/*.rds

# または、確認スクリプトを実行
cd r_api
python3 check_model.py
cd ..
```

### ステップ10: PM2でアプリケーションを起動

```bash
# PM2で起動（R FastAPIとNode.jsサーバーの両方）
pm2 start ecosystem.r.config.js

# 自動起動を設定
pm2 startup
# 表示されたコマンドを実行（sudoが必要な場合があります）

pm2 save

# ステータス確認
pm2 status
```

### ステップ11: 動作確認

```bash
# R FastAPIのヘルスチェック
curl http://localhost:5000/health

# Node.jsサーバーの確認
curl http://localhost:3001/api/stats

# PM2のログ確認
pm2 logs
```

## 更新時のデプロイ手順

コードを更新した場合、以下の手順でデプロイします：

### 方法A: デプロイスクリプトを使用（推奨）

```bash
cd ~/www
./deploy-server.sh
```

このスクリプトは以下を自動実行します：
1. GitHubから最新の変更を取得
2. 依存関係を更新（Node.js、Python）
3. フロントエンドをビルド
4. Rモデルファイルの確認
5. データベースの確認
6. PM2でアプリケーションを再起動

### 方法B: 手動でデプロイ

```bash
cd ~/www

# 1. GitHubから最新の変更を取得
git pull origin main

# 2. 依存関係を更新
npm install --production

# 3. Python依存関係を更新
cd r_api
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..

# 4. フロントエンドをビルド
npm run build

# 5. Rモデルファイルの確認（必要に応じて再アップロード）
# scp r_api/r_models/rf_model_all_FIM.rds ubuntu@sakuraubuntu:~/www/r_api/r_models/

# 6. PM2で再起動
pm2 restart all

# 7. ログ確認
pm2 logs --lines 50
```

## Rモデルファイルの管理

### モデルファイルをGitHubに含めない場合（推奨）

`.gitignore`に以下を追加：

```
# Rモデルファイル
*.rds
r_api/r_models/*.rds
```

この場合、デプロイ時にモデルファイルを手動でアップロードする必要があります。

### モデルファイルをGitHubに含める場合

`.gitignore`に`.rds`が含まれていない場合、GitHubにプッシュされます。この場合は追加の作業は不要ですが、リポジトリのサイズが大きくなる可能性があります。

## トラブルシューティング

### R FastAPIが起動しない

```bash
# ログを確認
pm2 logs r-api-server --lines 50

# 手動で起動してエラーを確認
cd ~/www/r_api
source venv/bin/activate
python3 predict_api_fastapi.py
```

### モデルファイルが見つからない

```bash
# モデルファイルの確認
ls -la r_api/r_models/

# モデル確認スクリプトを実行
cd r_api
python3 check_model.py
```

### PM2のプロセスが起動しない

```bash
# PM2のステータス確認
pm2 status

# 詳細情報を確認
pm2 describe r-api-server
pm2 describe fim-prediction-r

# すべてのプロセスを削除して再起動
pm2 delete all
pm2 start ecosystem.r.config.js
```

### ポートが使用できない

```bash
# ファイアウォールの確認
sudo ufw status

# ポートを開放
sudo ufw allow 3001/tcp
sudo ufw allow 5000/tcp
```

## 便利なコマンド

```bash
# PM2の操作
pm2 status                    # ステータス確認
pm2 logs                      # すべてのログを表示
pm2 logs r-api-server         # R FastAPIのログのみ
pm2 logs fim-prediction-r     # Node.jsサーバーのログのみ
pm2 restart all              # すべて再起動
pm2 stop all                 # すべて停止
pm2 delete all               # すべて削除

# R FastAPIの確認
curl http://localhost:5000/health

# モデルファイルの確認
cd r_api && python3 check_model.py
```

## セキュリティの推奨事項

1. **SSH鍵認証の設定**: パスワード認証よりも安全です
2. **ファイアウォールの設定**: 必要なポートのみ開放
3. **SSL証明書の設定**: Let's Encryptを使用してHTTPSを有効化
4. **定期的な更新**: システムとパッケージを定期的に更新

## 参考リンク

- [GitHub経由デプロイ手順](GitHub経由デプロイ手順.md)
- [さくらのVPSデプロイ手順](さくらのVPSデプロイ手順.md)
- [Rモデル専用デプロイ手順](Rモデル専用デプロイ手順.md)
