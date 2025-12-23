#!/bin/bash
# R FastAPI環境構築スクリプト（macOS/Linux用）

set -e

echo "========================================"
echo "R FastAPI環境構築スクリプト"
echo "========================================"
echo ""

# Pythonのバージョン確認
if ! command -v python3 &> /dev/null; then
    echo "[エラー] Python3がインストールされていません。"
    echo "Python 3.8以上をインストールしてください。"
    exit 1
fi

echo "[1/5] Python仮想環境を作成中..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "仮想環境を作成しました。"
else
    echo "仮想環境は既に存在します。"
fi

echo ""
echo "[2/5] 仮想環境を有効化中..."
source venv/bin/activate

echo ""
echo "[3/5] pipをアップグレード中..."
python -m pip install --upgrade pip

echo ""
echo "[4/5] Python依存関係をインストール中..."
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo ""
    echo "[警告] 依存関係のインストールに失敗しました。"
    echo "rpy2のインストールにはRの開発環境が必要です。"
    echo ""
    echo "Rのインストール確認:"
    if command -v R &> /dev/null; then
        echo "Rはインストールされています。"
        R --version
    else
        echo "[エラー] Rがインストールされていません。"
        echo "Rをインストールしてください: https://cran.r-project.org/"
    fi
    echo ""
    exit 1
fi

echo ""
echo "[5/5] モデルディレクトリを作成中..."
if [ ! -d "../r_models" ]; then
    mkdir -p "../r_models"
    echo "r_modelsディレクトリを作成しました。"
else
    echo "r_modelsディレクトリは既に存在します。"
fi

echo ""
echo "========================================"
echo "環境構築が完了しました！"
echo "========================================"
echo ""
echo "次のステップ:"
echo "1. Rでモデルを学習・保存してください"
echo "   Rコンソールで: source('r_api/save_r_models.R')"
echo ""
echo "2. FastAPIサーバーを起動してください"
echo "   python predict_api_fastapi.py"
echo ""
echo "3. ブラウザでAPIドキュメントを確認"
echo "   http://localhost:5000/docs"
echo ""

