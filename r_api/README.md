# Rモデルを使用するFastAPI実装

## 概要

Rで学習したランダムフォレストモデルを、FastAPIから直接使用する実装です。
`rpy2`を使用してRのモデルをPythonから呼び出します。

## セットアップ

### 1. Rのインストール

Rをインストールし、必要なパッケージをインストールしてください：

```r
install.packages(c("tidyverse", "caret", "randomForest"))
```

### 2. Python環境のセットアップ

```bash
# Python仮想環境を作成
python -m venv venv

# 仮想環境を有効化
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 依存関係をインストール
cd r_api
pip install -r requirements.txt
```

**注意**: `rpy2`のインストールにはRの開発環境が必要です。

- Windows: Rtoolsが必要
- macOS: Xcode Command Line Toolsが必要
- Linux: R-devパッケージが必要

### 3. Rモデルの保存

Rでモデルを学習し、`.rds`形式で保存します：

```r
# RコンソールまたはRStudioで実行
source("r_api/save_r_models.R")
```

または、既存のRスクリプトを修正してモデルを保存：

```r
# モデルを学習後
saveRDS(rf_model_all_FIM, "r_models/rf_model_all_FIM.rds")
```

## 使用方法

### 1. FastAPIサーバーの起動

```bash
cd r_api
python predict_api_fastapi.py
```

または、uvicornを使用：

```bash
uvicorn predict_api_fastapi:app --host 0.0.0.0 --port 5000
```

APIサーバーは `http://localhost:5000` で起動します。

### 2. APIドキュメントの確認

FastAPIの自動生成ドキュメントにアクセス：

- Swagger UI: http://localhost:5000/docs
- ReDoc: http://localhost:5000/redoc

### 3. ヘルスチェック

```bash
curl http://localhost:5000/health
```

### 4. 予測APIの呼び出し

```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "gender": "male",
    "age": 65,
    "bmi": 23.5,
    "careLevel": "no",
    "daysFromOnset": 30,
    "motionValues": {
      "食事": 5,
      "整容": 4,
      "清拭": 3,
      "更衣上半身": 4,
      "更衣下半身": 4,
      "トイレ動作": 5,
      "排尿管理": 6,
      "排便管理": 6,
      "ベッド移乗": 4,
      "トイレ移乗": 4,
      "浴槽移乗": 3,
      "歩行": 3
    },
    "cognitiveValues": {
      "理解": 6,
      "表出": 6,
      "社会的交流": 5,
      "問題解決": 5,
      "記憶": 5
    }
  }'
```

## Node.jsからの統合

`server_with_python.js`を参考に、FastAPIエンドポイントを呼び出すように修正：

```javascript
const axios = require('axios');
const R_API_URL = process.env.R_API_URL || 'http://localhost:5000';

app.post('/api/predict', async (req, res) => {
  try {
    const response = await axios.post(`${R_API_URL}/predict`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('R API呼び出しエラー:', error);
    res.status(500).json({ error: '予測エラー' });
  }
});
```

## トラブルシューティング

### rpy2のインストールエラー

```bash
# Rのパスを確認
which R  # macOS/Linux
where R  # Windows

# 環境変数を設定
export R_HOME=/usr/lib/R  # 実際のパスに置き換え
```

### Rモデルが読み込まれない

1. `r_models/`ディレクトリに`.rds`ファイルが存在するか確認
2. Rでモデルを正しく保存したか確認
3. ファイルパスが正しいか確認

### 予測結果がおかしい

1. 入力データの形式が正しいか確認
2. Rのモデルが正しく学習されているか確認
3. 特徴量の順序が一致しているか確認

## メリット・デメリット

### ✅ メリット

- Rで学習したモデルをそのまま使用できる
- モデルの再学習が不要
- FastAPIの自動ドキュメント生成
- 型安全性（Pydantic）
- 非同期処理対応

### ❌ デメリット

- Rのインストールが必要
- rpy2のセットアップが複雑な場合がある
- パフォーマンスがPythonネイティブよりやや劣る可能性

## プロジェクト構成

```
web-app/
├── r_api/
│   ├── predict_api_fastapi.py  # FastAPIサーバー
│   ├── save_r_models.R         # Rモデル保存スクリプト
│   ├── requirements.txt        # Python依存関係
│   └── README.md               # このファイル
├── r_models/                   # Rモデル保存ディレクトリ
│   ├── rf_model_all_FIM.rds
│   ├── rf_model_motor_FIM.rds
│   └── ...
└── server.js                   # Node.jsサーバー
```

