# プロジェクト構造

## ディレクトリ構成

```
web-app/
├── docs/                          # 参考資料・ドキュメント
│   ├── 予測モデル.docx           # 元のRコード（Word形式）
│   ├── 予測モデル.txt            # 元のRコード（テキスト形式）
│   ├── 予測モデルの動作説明.txt  # 予測モデルの動作説明
│   ├── モデル組み込み方法の比較.md # 実装方法の比較
│   └── 環境構築完了チェックリスト.md
│
├── r_api/                         # R FastAPI関連
│   ├── predict_api_fastapi.py    # FastAPIサーバー
│   ├── save_r_models.R           # Rモデル保存スクリプト
│   ├── install_r_packages.R      # Rパッケージインストール
│   ├── check_environment.py     # 環境確認スクリプト
│   ├── setup.bat / setup.sh      # セットアップスクリプト
│   ├── requirements.txt           # Python依存関係
│   ├── r_models/                  # Rモデル保存ディレクトリ
│   └── README.md                  # R APIの使用方法
│
├── scripts/                       # データベース関連スクリプト
│   ├── initDatabase.js            # データベース初期化
│   └── viewDatabase.js            # データベース確認
│
├── src/                           # Reactフロントエンド
│   ├── pages/                     # ページコンポーネント
│   ├── components/                # UIコンポーネント
│   ├── constants/                 # 定数定義
│   └── utils/                     # ユーティリティ
│
├── sqlite-tools/                  # SQLiteツール
│   └── sqlite3.exe など
│
├── public/                        # 静的ファイル
│   └── テスト全データ.csv
│
├── server.js                      # 既存のNode.jsサーバー
├── server_with_r_fastapi.js       # R FastAPIを使用するサーバー
├── database.db                    # SQLiteデータベース
├── package.json                   # Node.js依存関係
└── README.md                      # プロジェクトのREADME
```

## 主要ファイルの説明

### サーバー

- **server.js** - 既存のNode.jsサーバー（距離ベースの予測を使用）
- **server_with_r_fastapi.js** - R FastAPIを使用するNode.jsサーバー（推奨）

### API

- **r_api/predict_api_fastapi.py** - FastAPIサーバー（Rモデルを使用）

### データ

- **database.db** - SQLiteデータベース（患者データ）
- **public/テスト全データ.csv** - CSVデータファイル

## 使用方法

1. **環境構築**: `r_api/setup.bat`（Windows）または `r_api/setup.sh`（macOS/Linux）を実行
2. **Rモデルの準備**: Rで `r_api/save_r_models.R` を実行
3. **FastAPIサーバーの起動**: `python r_api/predict_api_fastapi.py`
4. **Node.jsサーバーの起動**: `npm run server`（server_with_r_fastapi.jsを使用する場合）

詳細は各ディレクトリのREADMEを参照してください。

