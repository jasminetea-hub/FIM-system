@echo off
chcp 65001 >nul
echo ========================================
echo R FastAPI環境構築スクリプト
echo ========================================
echo.

REM Pythonのバージョン確認
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [エラー] Pythonがインストールされていません。
    echo Python 3.8以上をインストールしてください。
    pause
    exit /b 1
)

echo [1/5] Python仮想環境を作成中...
if not exist "venv" (
    python -m venv venv
    echo 仮想環境を作成しました。
) else (
    echo 仮想環境は既に存在します。
)

echo.
echo [2/5] 仮想環境を有効化中...
call venv\Scripts\activate.bat

echo.
echo [3/5] pipをアップグレード中...
python -m pip install --upgrade pip

echo.
echo [4/5] Python依存関係をインストール中...
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo.
    echo [警告] 依存関係のインストールに失敗しました。
    echo rpy2のインストールにはRの開発環境が必要です。
    echo.
    echo Rのインストール確認:
    where R >nul 2>&1
    if %errorlevel% neq 0 (
        echo [エラー] Rがインストールされていません。
        echo Rをインストールしてください: https://cran.r-project.org/
    ) else (
        echo Rはインストールされています。
    )
    echo.
    pause
    exit /b 1
)

echo.
echo [5/5] モデルディレクトリを作成中...
if not exist "..\r_models" (
    mkdir "..\r_models"
    echo r_modelsディレクトリを作成しました。
) else (
    echo r_modelsディレクトリは既に存在します。
)

echo.
echo ========================================
echo 環境構築が完了しました！
echo ========================================
echo.
echo 次のステップ:
echo 1. Rでモデルを学習・保存してください
echo    Rコンソールで: source("r_api/save_r_models.R")
echo.
echo 2. FastAPIサーバーを起動してください
echo    python predict_api_fastapi.py
echo.
echo 3. ブラウザでAPIドキュメントを確認
echo    http://localhost:5000/docs
echo.
pause

