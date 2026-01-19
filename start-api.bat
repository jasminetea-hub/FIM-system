@echo off
REM FIM予測システム - APIサーバー起動スクリプト（Windows用）

echo ==========================================
echo FIM予測システム - APIサーバー起動
echo ==========================================
echo.

REM カレントディレクトリを確認
cd /d "%~dp0"

REM R FastAPIサーバーの起動
echo 1. R FastAPIサーバーを起動中...
cd r_api
if not exist "predict_api_fastapi.py" (
    echo ❌ エラー: r_api/predict_api_fastapi.py が見つかりません
    exit /b 1
)

REM Python環境の確認
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ エラー: python が見つかりません
    exit /b 1
)

REM バックグラウンドでR FastAPIサーバーを起動
start "R FastAPI Server" cmd /c "python predict_api_fastapi.py"
echo ✅ R FastAPIサーバーを起動しました
echo    URL: http://localhost:5000
cd ..

REM 少し待機（R FastAPIサーバーの起動を待つ）
timeout /t 3 /nobreak >nul

REM Node.jsサーバーの起動
echo.
echo 2. Node.jsサーバーを起動中...
if not exist "server_r_model.js" (
    echo ❌ エラー: server_r_model.js が見つかりません
    exit /b 1
)

REM Node.js環境の確認
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ エラー: node が見つかりません
    exit /b 1
)

REM Node.jsサーバーを起動（フォアグラウンド）
echo ✅ Node.jsサーバーを起動しました
echo    URL: http://localhost:3001
echo.
echo ==========================================
echo ✅ サーバー起動完了
echo ==========================================
echo.
echo 📱 アクセスURL:
echo    http://localhost:3001
echo.
echo 🔬 R FastAPI:
echo    http://localhost:5000
echo    http://localhost:5000/docs (APIドキュメント)
echo.
echo ⚠️  サーバーを停止するには、Ctrl+C を押してください
echo.

node server_r_model.js
