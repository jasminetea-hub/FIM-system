# アプリケーション起動手順

## 🚀 クイックスタート（Rモデル予測）

### 初回のみ必要な設定

1. **依存関係のインストール**

   ```bash
   npm install
   cd r_api
   pip install -r requirements.txt
   cd ..
   ```

2. **データベースの初期化**

   ```bash
   npm run init-db
   ```

3. **R モデルの準備**（R コンソールで実行）

   ```r
   source("r_api/save_r_models.R")
   ```

4. **フロントエンドのビルド**
   ```bash
   npm run build
   ```

### アプリケーションの起動

**ターミナル 1: R FastAPI サーバー**

```bash
cd r_api
python predict_api_fastapi.py
```

R FastAPIサーバーは `http://localhost:5000` で起動します。

**ターミナル 2: Node.js サーバー**

```bash
npm run server
```

Node.jsサーバーは `http://localhost:3001` で起動します。

### アクセス方法

- **PC から**: `http://localhost:3001`
- **スマホから**: `http://192.168.1.22:3001` （PC の IP アドレスは環境によって異なります）

---

## 📝 よく使うコマンド

### データベース関連

```bash
# データベースの内容を確認
npm run view-db

# 予測履歴を確認
npm run view-predictions

# 新規データを追加（既存データを保持）
npm run add-data

# データベースを再初期化（既存データを削除して新規データで初期化）
npm run init-db
```

### 開発関連

```bash
# フロントエンドのみを開発モードで起動（ホットリロード対応）
npm run dev

# フロントエンドをビルド
npm run build

# ビルド済みのフロントエンドをプレビュー
npm run preview
```

### サーバー起動

```bash
# Rモデル使用サーバー（静的ファイル配信あり）
npm run server

# ワンコマンドでビルド+起動
npm start
```

---

## ⚠️ トラブルシューティング

### サーバーが起動しない場合

1. ポート 3001 が既に使用されているか確認
2. データベースファイル（`database.db`）が存在するか確認
3. `npm install`が実行されているか確認

### スマホからアクセスできない場合

1. PC とスマホが同じ Wi-Fi ネットワークに接続されているか確認
2. ファイアウォールでポート 3001 がブロックされていないか確認
3. ターミナルに表示される IP アドレスを確認

### データベースエラーが発生する場合

```bash
# データベースを再初期化
npm run init-db
```

---

## 📱 スマホからアクセスする際の注意点

1. **同じ Wi-Fi ネットワーク**: PC とスマホが同じ Wi-Fi に接続されている必要があります
2. **IP アドレスの確認**: ターミナルに表示される IP アドレスを使用してください
3. **ファイアウォール**: Windows ファイアウォールで Node.js を許可する必要がある場合があります

