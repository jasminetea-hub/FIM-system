# Web App - FIM 予測システム

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. データベースの初期化

CSV データをデータベースにインポートします：

```bash
npm run init-db
```

### 3. R モデルの準備（推奨）

R で学習したモデルを使用する場合：

```r
# Rコンソールで実行
source("r_api/save_r_models.R")
```

### 4. 開発サーバーの起動

#### R FastAPI サーバー（R モデルを使用する場合）

```bash
cd r_api
python predict_api_fastapi.py
```

R FastAPI サーバーは `http://localhost:5000` で起動します。

#### バックエンド API サーバー（別ターミナル）

```bash
npm run server
```

バックエンドサーバーは `http://localhost:3001` で起動します。

#### フロントエンド開発サーバー

```bash
npm run dev
```

フロントエンドは `http://localhost:5173` で起動します。

## プロジェクト構成

```
web-app/
├── server_r_model.js          # Express APIサーバー（Rモデル使用）
├── r_api/                     # R FastAPI関連
│   ├── predict_api_fastapi.py # FastAPIサーバー
│   └── save_r_models.R       # Rモデル保存スクリプト
├── scripts/
│   ├── initDatabase.js        # データベース初期化スクリプト
│   ├── viewDatabase.js        # データベース確認
│   └── viewPredictions.js     # 予測履歴確認
├── database.db                # SQLiteデータベース（自動生成）
├── src/                       # Reactフロントエンド
│   ├── pages/
│   │   ├── FormPage.jsx       # 入力フォームページ
│   │   └── ResultPage.jsx     # 結果表示ページ
│   └── components/            # Reactコンポーネント
└── docs/                      # ドキュメント
```

## API エンドポイント

### POST /api/predict

予測値を計算するエンドポイント（Rモデルを使用）

**注意**: 予測結果は自動的にデータベースに保存されます。

**リクエストボディ:**

```json
{
  "gender": "male" | "female",
  "age": number,
  "bmi": number,
  "careLevel": "yes" | "no",
  "daysFromOnset": number,
  "motionValues": {
    "食事": number,
    "整容": number,
    ...
  },
  "cognitiveValues": {
    "理解": number,
    "表出": number,
    ...
  }
}
```

**レスポンス:**

```json
{
  "motion": [number, ...],
  "cognitive": [number, ...],
  "motionTotal": number,
  "cognitiveTotal": number,
  "total": number
}
```

## 環境変数

`.env`ファイルを作成して、API の URL を設定できます：

```
REACT_APP_API_URL=http://localhost:3001
```

## ローカルサーバーでの起動

フロントエンドとバックエンドを1つのサーバーで動作させます：

```bash
# 1. R FastAPIサーバーを起動（別ターミナル）
cd r_api
python predict_api_fastapi.py
```

R FastAPIサーバーは `http://localhost:5000` で起動します。

```bash
# 2. Node.jsサーバーを起動（別ターミナル）
npm run server
# または
node server_r_model.js
```

バックエンドサーバーは `http://localhost:3001` で起動します。
**注意**: R FastAPIサーバーが起動している必要があります。

```bash
# 3. フロントエンド開発サーバー（別ターミナル）
npm run dev
```

フロントエンドは `http://localhost:5173` で起動します。

### ワンコマンドで起動：

```bash
# フロントエンドをビルドしてサーバーを起動
npm start
```

サーバーは `http://localhost:3001` で起動し、フロントエンドとAPIの両方が利用できます。

## 本番環境へのデプロイ

### ローカル環境での本番ビルド

1. フロントエンドをビルド：

```bash
npm run build
```

2. R FastAPIサーバーを起動：

```bash
cd r_api
python predict_api_fastapi.py
```

R FastAPIサーバーは `http://localhost:5000` で起動します。

3. バックエンドサーバーを起動：

```bash
npm run server
# または
node server_r_model.js
```

4. 環境変数`PORT`でポート番号を変更可能です。

### さくらのインターネットへのデプロイ

詳細なデプロイ手順は以下のドキュメントを参照してください：

- **[GitHub経由デプロイ手順](docs/GitHub経由デプロイ手順.md)** - GitHubからデプロイ（推奨）
- **[デプロイクイックスタート](docs/デプロイクイックスタート.md)** - 5分でデプロイ完了
- **[さくらのインターネットデプロイ手順](docs/さくらのインターネットデプロイ手順.md)** - 詳細な手順とトラブルシューティング

**GitHub経由でのデプロイ（推奨）:**
1. GitHubリポジトリにコードをプッシュ
2. サーバーで `git clone` を実行
3. `npm install --production` と `npm run build` を実行
4. PM2でアプリケーションを起動
5. 更新時は `git pull` と `npm run build`、`pm2 restart`

詳細は **[GitHub経由デプロイ手順](docs/GitHub経由デプロイ手順.md)** または **[GitHub経由デプロイクイックスタート](docs/GitHub経由デプロイクイックスタート.md)** を参照してください。

**FTP/SFTP経由でのデプロイ:**
1. `npm run build` でフロントエンドをビルド
2. 必要なファイルをサーバーにアップロード
3. サーバーで `npm install --production` を実行
4. PM2でアプリケーションを起動
5. `.htaccess`でリバースプロキシを設定

## R モデルを使用した予測

詳細は `docs/Rモデル使用ガイド.md` を参照してください。

### 予測履歴の確認

```bash
npm run view-predictions [件数]
```

### 予測履歴 API

- `GET /api/predictions` - 予測履歴を取得
- `GET /api/predictions/stats` - 予測履歴の統計情報
