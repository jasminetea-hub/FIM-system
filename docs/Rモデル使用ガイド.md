# Rモデルを使用した予測システム - 使用ガイド

## 概要

Rで学習したランダムフォレストモデルを使用して、退院時FIM値を予測し、入力データと予測結果をデータベースに保存するシステムです。

## システム構成

```
ユーザー入力
    ↓
Reactフロントエンド
    ↓
Node.jsサーバー (server_r_model.js)
    ↓
R FastAPI (predict_api_fastapi.py)
    ↓
Rランダムフォレストモデル
    ↓
予測結果
    ↓
SQLiteデータベース (prediction_historyテーブル)
```

## セットアップ手順

### 1. Rモデルの準備

Rでモデルを学習・保存します：

```r
# Rコンソールで実行
source("r_api/save_r_models.R")
```

これにより、`r_models/`ディレクトリに`.rds`形式のモデルファイルが保存されます。

### 2. R FastAPIサーバーの起動

```bash
cd r_api
python predict_api_fastapi.py
```

または

```bash
uvicorn r_api.predict_api_fastapi:app --host 0.0.0.0 --port 5000
```

サーバーは `http://localhost:5000` で起動します。

### 3. Node.jsサーバーの起動

```bash
# axiosをインストール（初回のみ）
npm install

# Rモデルを使用するサーバーを起動
npm run server:r
```

または開発モード（自動リロード）：

```bash
npm run server:r:dev
```

### 4. フロントエンドの起動

```bash
npm run dev
```

## 動作の流れ

### 1. ユーザーがフォームに入力

- 個人情報（性別、年齢、BMI、要介護度、発症からの日数）
- 入院時FIM運動機能項目（12項目）
- 入院時FIM認知機能項目（5項目）

### 2. 予測APIの呼び出し

**フロントエンド** → `POST /api/predict`

**Node.jsサーバー** (`server_r_model.js`):
1. R FastAPIに予測リクエストを送信
2. Rモデルから予測結果を取得
3. 入力データと予測結果をデータベースに保存
4. 予測結果をフロントエンドに返す

### 3. データベースへの保存

`prediction_history`テーブルに以下が保存されます：

- **入力データ**
  - 個人情報（性別、年齢、BMI、要介護度、発症からの日数）
  - 入院時FIM運動機能項目（JSON形式）
  - 入院時FIM認知機能項目（JSON形式）

- **予測結果**
  - 退院時FIM運動機能項目の予測値（JSON配列）
  - 退院時FIM認知機能項目の予測値（JSON配列）
  - 運動機能合計、認知機能合計、総合得点
  - 作成日時

### 4. 結果の表示

フロントエンドで予測結果が表示されます：
- レーダーチャート（入院時値 vs 予測値）
- 合計点テーブル

## APIエンドポイント

### POST /api/predict

予測を実行し、データベースに保存します。

**リクエスト：**
```json
{
  "gender": "male",
  "age": 65,
  "bmi": 23.5,
  "careLevel": "no",
  "daysFromOnset": 30,
  "motionValues": {
    "食事": 5,
    "整容": 4,
    ...
  },
  "cognitiveValues": {
    "理解": 6,
    "表出": 6,
    ...
  }
}
```

**レスポンス：**
```json
{
  "motion": [5, 4, 3, ...],
  "cognitive": [6, 6, 5, ...],
  "motionTotal": 45,
  "cognitiveTotal": 28,
  "total": 73
}
```

### GET /api/predictions

予測履歴を取得します。

**クエリパラメータ：**
- `limit`: 取得件数（デフォルト: 50）
- `offset`: オフセット（デフォルト: 0）

**レスポンス：**
```json
{
  "count": 10,
  "data": [
    {
      "id": 1,
      "createdAt": "2024-01-01 12:00:00",
      "input": { ... },
      "prediction": { ... }
    },
    ...
  ]
}
```

### GET /api/predictions/stats

予測履歴の統計情報を取得します。

**レスポンス：**
```json
{
  "total": 100,
  "statistics": {
    "avg_motion_total": 45.5,
    "avg_cognitive_total": 28.3,
    "avg_total": 73.8,
    "min_total": 50,
    "max_total": 100
  }
}
```

## データベース構造

### prediction_historyテーブル

```sql
CREATE TABLE prediction_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- 入力データ
  input_gender INTEGER NOT NULL,
  input_age REAL NOT NULL,
  input_bmi REAL NOT NULL,
  input_care_level INTEGER NOT NULL,
  input_days_from_onset REAL NOT NULL,
  input_motion_values TEXT NOT NULL,        -- JSON形式
  input_cognitive_values TEXT NOT NULL,     -- JSON形式
  -- 予測結果
  predicted_motion TEXT NOT NULL,           -- JSON配列
  predicted_cognitive TEXT NOT NULL,        -- JSON配列
  predicted_motion_total REAL NOT NULL,
  predicted_cognitive_total REAL NOT NULL,
  predicted_total REAL NOT NULL
)
```

## コマンドラインツール

### 予測履歴の表示

```bash
npm run view-predictions [件数]
```

例：
```bash
npm run view-predictions 10  # 最新10件を表示
```

## トラブルシューティング

### R FastAPIに接続できない

1. R FastAPIサーバーが起動しているか確認
   ```bash
   curl http://localhost:5000/health
   ```

2. ポート5000が使用中でないか確認

3. Rモデルが正しく読み込まれているか確認
   - `r_models/`ディレクトリに`.rds`ファイルが存在するか
   - R FastAPIのログを確認

### 予測結果がおかしい

1. Rモデルが正しく学習されているか確認
2. 入力データの形式が正しいか確認
3. Rの学習データの列名と一致しているか確認
   - `r_api/predict_api_fastapi.py`の`prepare_r_dataframe`関数を確認

### データベースエラー

1. データベースファイルが存在するか確認
2. テーブルが正しく作成されているか確認
   ```bash
   npm run view-predictions
   ```

## 注意事項

1. **列名の一致**: Rの学習データの列名と、FastAPIの`prepare_r_dataframe`関数で使用する列名が一致している必要があります。実際のRデータに合わせて調整してください。

2. **モデルの読み込み**: Rモデル（`.rds`ファイル）が`r_models/`ディレクトリに存在する必要があります。

3. **パフォーマンス**: R FastAPIの起動には時間がかかる場合があります。モデルの読み込みは起動時に1回だけ実行されます。

## 次のステップ

1. ✅ Rモデルの学習・保存
2. ✅ R FastAPIサーバーの実装
3. ✅ Node.jsサーバーとの統合
4. ✅ データベースへの保存機能
5. 🔄 予測履歴の可視化（管理画面など）
6. 🔄 予測精度の評価機能

