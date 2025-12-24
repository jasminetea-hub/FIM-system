@echo off
REM さくらのインターネットへのデプロイスクリプト（Windows用）
REM 使用方法: deploy.bat

setlocal enabledelayedexpansion

echo === FIM予測システム デプロイスクリプト（Windows） ===
echo.

REM 1. ビルド
echo [1/4] フロントエンドをビルド中...
call npm run build

if not exist "dist" (
    echo エラー: distディレクトリが見つかりません
    exit /b 1
)

echo.
echo [2/4] デプロイ用ファイルを準備中...
echo.
echo 以下のファイルをFTP/SFTPクライアントでサーバーにアップロードしてください:
echo.
echo 必須ファイル:
echo   - server_r_model.js
echo   - package.json
echo   - package-lock.json
echo   - ecosystem.r.config.js
echo   - dist/ （ディレクトリごと）
echo   - public/ （ディレクトリごと）
echo   - scripts/ （ディレクトリごと）
echo   - r_api/ （ディレクトリごと）
echo.

if exist "database.db" (
    echo   - database.db
) else (
    echo   警告: database.dbが見つかりません。サーバーで初期化が必要です。
)

if exist ".htaccess.example" (
    echo   - .htaccess.example （.htaccessとしてアップロード）
)

echo.
echo [3/4] アップロード後の手順:
echo.
echo 1. SSHでサーバーに接続
echo 2. アップロードしたディレクトリに移動
echo 3. 依存関係をインストール: npm install --production
echo 4. データベースを初期化（必要に応じて）: npm run init-db
echo 5. R FastAPIサーバーとNode.jsサーバーを起動:
echo    npm install -g pm2
echo    pm2 start ecosystem.r.config.js
echo    pm2 startup
echo    pm2 save
echo.
echo [4/4] 詳細な手順は docs/さくらのインターネットデプロイ手順.md を参照してください。
echo.
pause

