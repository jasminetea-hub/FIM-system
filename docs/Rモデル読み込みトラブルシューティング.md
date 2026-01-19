# Rモデル読み込みトラブルシューティング

Rモデルが読み込まれない問題を解決する手順です。

## 問題の確認

### 1. ヘルスチェックで確認

```bash
curl http://localhost:5000/health
```

レスポンス例：
```json
{
  "status": "ok",
  "models_loaded": 0,
  "available_models": []
}
```

`models_loaded`が0の場合、モデルが読み込まれていません。

### 2. PM2のログを確認

```bash
pm2 logs r-api-server --lines 50
```

以下のようなメッセージが表示される場合：
- `警告: [パス] が見つかりません` → モデルファイルが存在しない
- `警告: [パス] の読み込みに失敗` → ファイルは存在するが読み込みに失敗

## 解決手順

### ステップ1: モデルファイルの存在確認

VPSにSSH接続して実行：

```bash
cd ~/www/r_api

# モデルディレクトリの確認
ls -la r_models/

# 期待されるファイル: rf_model_all_FIM.rds
ls -la r_models/*.rds
```

### ステップ2: デバッグスクリプトを実行

```bash
cd ~/www/r_api
python3 debug_models.py
```

このスクリプトは以下を確認します：
- モデルディレクトリの存在
- モデルファイルの存在とサイズ
- ファイルの読み取り権限
- R環境の状態
- モデルファイルの実際の読み込みテスト

### ステップ3: モデルファイルが存在しない場合

#### 方法A: ローカルからアップロード（推奨）

ローカルのターミナルから：

```bash
# モデルファイルをVPSにアップロード
scp r_api/r_models/rf_model_all_FIM.rds ubuntu@sakuraubuntu:~/www/r_api/r_models/
```

#### 方法B: GitHubから取得

モデルファイルがGitHubに含まれている場合：

```bash
cd ~/www
git pull origin main
```

#### 方法C: サーバー上でRモデルを生成

```bash
cd ~/www/r_api
Rscript save_r_models.R
```

### ステップ4: ファイルの権限を確認・修正

```bash
cd ~/www/r_api/r_models

# ファイルの権限を確認
ls -la *.rds

# 読み取り権限がない場合、権限を付与
chmod 644 *.rds

# ディレクトリの権限も確認
chmod 755 r_models
```

### ステップ5: R環境の確認

```bash
# Rがインストールされているか確認
R --version

# Rパッケージがインストールされているか確認
Rscript -e "library(caret); library(randomForest)"

# rpy2がインストールされているか確認
cd ~/www/r_api
source venv/bin/activate
python3 -c "import rpy2; print('rpy2 OK')"
deactivate
```

### ステップ6: FastAPIサーバーを再起動

```bash
# PM2で再起動
pm2 restart r-api-server

# ログを確認
pm2 logs r-api-server --lines 50

# ヘルスチェック
curl http://localhost:5000/health
```

## よくある問題と解決方法

### 問題1: モデルファイルが見つからない

**症状**: `警告: [パス] が見つかりません`

**解決方法**:
1. モデルファイルが正しい場所にあるか確認
2. ファイル名が正確か確認（大文字小文字に注意）
3. ファイルをアップロード

```bash
# ファイルの存在確認
ls -la ~/www/r_api/r_models/rf_model_all_FIM.rds

# ファイルが存在しない場合、アップロード
scp r_api/r_models/rf_model_all_FIM.rds ubuntu@sakuraubuntu:~/www/r_api/r_models/
```

### 問題2: ファイルの読み取り権限がない

**症状**: `❌ エラー: [パス] に読み取り権限がありません`

**解決方法**:
```bash
cd ~/www/r_api/r_models
chmod 644 *.rds
chmod 755 .
```

### 問題3: R環境が正しく設定されていない

**症状**: `rpy2のインポートに失敗` または `Rモデルの読み込みに失敗`

**解決方法**:
```bash
# Python仮想環境を再作成
cd ~/www/r_api
rm -rf venv
python3 -m venv venv
source venv/bin/activate

# 依存関係を再インストール
pip install -r requirements.txt

# rpy2の依存関係をインストール
sudo apt install -y python3-dev libxml2-dev libcurl4-openssl-dev libssl-dev libfontconfig1-dev

# rpy2を再インストール
pip install --force-reinstall rpy2

deactivate

# PM2で再起動
pm2 restart r-api-server
```

### 問題4: モデルファイルが破損している

**症状**: `モデルの読み込みに失敗: [エラーメッセージ]`

**解決方法**:
1. モデルファイルのサイズを確認（0バイトでないか）
2. ローカルでモデルファイルが正常に読み込めるか確認
3. 必要に応じてモデルを再生成

```bash
# ファイルサイズの確認
ls -lh ~/www/r_api/r_models/*.rds

# ローカルで確認（ローカルのRで）
# Rコンソールで:
# model <- readRDS("r_api/r_models/rf_model_all_FIM.rds")
# print(model)
```

## 確認コマンド一覧

```bash
# 1. モデルファイルの確認
ls -la ~/www/r_api/r_models/*.rds

# 2. デバッグスクリプトの実行
cd ~/www/r_api && python3 debug_models.py

# 3. PM2のログ確認
pm2 logs r-api-server --lines 50

# 4. ヘルスチェック
curl http://localhost:5000/health

# 5. R環境の確認
R --version
cd ~/www/r_api && source venv/bin/activate && python3 -c "import rpy2; print('OK')" && deactivate
```

## 完全な再セットアップ手順

問題が解決しない場合、以下を実行：

```bash
# 1. PM2を停止
pm2 stop r-api-server
pm2 delete r-api-server

# 2. Python環境を再作成
cd ~/www/r_api
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate

# 3. モデルファイルを確認・再アップロード
ls -la r_models/*.rds
# ファイルが存在しない場合:
# scp r_api/r_models/rf_model_all_FIM.rds ubuntu@sakuraubuntu:~/www/r_api/r_models/

# 4. ファイル権限を設定
chmod 644 r_models/*.rds
chmod 755 r_models

# 5. デバッグスクリプトで確認
python3 debug_models.py

# 6. PM2で再起動
cd ~/www
pm2 start ecosystem.r.config.js

# 7. ログとヘルスチェック
pm2 logs r-api-server --lines 50
curl http://localhost:5000/health
```

## 参考

- [Rモデル専用デプロイ手順](Rモデル専用デプロイ手順.md)
- [さくらのVPS_GitHub経由デプロイ手順](さくらのVPS_GitHub経由デプロイ手順.md)
