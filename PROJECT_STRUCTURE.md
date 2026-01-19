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
├── server_r_model.js              # Node.jsサーバー（Rモデル使用）
├── database.db                    # SQLiteデータベース
├── package.json                   # Node.js依存関係
└── README.md                      # プロジェクトのREADME
```

## 主要ファイルの説明

### サーバー

- **server_r_model.js** - Node.js サーバー（R FastAPI と連携して R モデルを使用）

### API

- **r_api/predict_api_fastapi.py** - FastAPI サーバー（R モデルを使用）

### データ

- **database.db** - SQLite データベース（患者データ）
- **public/テスト全データ.csv** - CSV データファイル

## 使用方法

1. **環境構築**: `r_api/setup.bat`（Windows）または `r_api/setup.sh`（macOS/Linux）を実行
2. **R モデルの準備**: R で `r_api/save_r_models.R` を実行
3. **FastAPI サーバーの起動**: `python r_api/predict_api_fastapi.py`
4. **Node.js サーバーの起動**: `npm run server`（server_r_model.js を使用）

詳細は各ディレクトリの README を参照してください。
