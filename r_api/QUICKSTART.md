# クイックスタートガイド

## 最短セットアップ手順

### Windows環境

1. **Rのインストール**
   - https://cran.r-project.org/ からRをダウンロード・インストール

2. **Rtoolsのインストール**（rpy2に必要）
   - https://cran.r-project.org/bin/windows/Rtools/ からRtoolsをダウンロード・インストール

3. **Rパッケージのインストール**
   ```r
   # Rコンソールで実行
   source("r_api/install_r_packages.R")
   ```

4. **Python環境のセットアップ**
   ```cmd
   cd r_api
   setup.bat
   ```

5. **環境の確認**
   ```cmd
   python check_environment.py
   ```

6. **Rモデルの学習・保存**（既に学習済みの場合はスキップ）
   ```r
   # Rコンソールで実行
   source("r_api/save_r_models.R")
   ```

7. **FastAPIサーバーの起動**
   ```cmd
   python predict_api_fastapi.py
   ```

8. **動作確認**
   - ブラウザで http://localhost:5000/docs にアクセス
   - APIドキュメントが表示されれば成功

### macOS/Linux環境

1. **Rのインストール**
   ```bash
   # macOS (Homebrew)
   brew install r
   
   # Linux (Ubuntu/Debian)
   sudo apt-get install r-base r-base-dev
   ```

2. **Xcode Command Line Toolsのインストール**（macOSのみ）
   ```bash
   xcode-select --install
   ```

3. **Rパッケージのインストール**
   ```r
   # Rコンソールで実行
   source("r_api/install_r_packages.R")
   ```

4. **Python環境のセットアップ**
   ```bash
   cd r_api
   chmod +x setup.sh
   ./setup.sh
   ```

5. **環境の確認**
   ```bash
   python check_environment.py
   ```

6. **Rモデルの学習・保存**（既に学習済みの場合はスキップ）
   ```r
   # Rコンソールで実行
   source("r_api/save_r_models.R")
   ```

7. **FastAPIサーバーの起動**
   ```bash
   python predict_api_fastapi.py
   ```

8. **動作確認**
   - ブラウザで http://localhost:5000/docs にアクセス
   - APIドキュメントが表示されれば成功

## トラブルシューティング

### rpy2のインストールエラー

**Windows:**
```cmd
# R_HOME環境変数を設定
setx R_HOME "C:\Program Files\R\R-4.3.2"
# 新しいコマンドプロンプトを開いて再試行
```

**macOS/Linux:**
```bash
export R_HOME=$(R RHOME)
pip install rpy2
```

### Rパッケージのインストールエラー

```r
# CRANミラーを変更
options(repos = c(CRAN = "https://cran.rstudio.com/"))
install.packages(c("tidyverse", "caret", "randomForest"))
```

詳細は `環境構築ガイド.md` を参照してください。

