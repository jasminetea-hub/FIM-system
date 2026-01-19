# Rパッケージのインストールスクリプト
# FastAPIでRモデルを使用するために必要なパッケージをインストール

cat("========================================\n")
cat("Rパッケージのインストール\n")
cat("========================================\n\n")

# 必要なパッケージのリスト
required_packages <- c(
  "tidyverse",    # データ操作
  "caret",        # 機械学習
  "randomForest"  # ランダムフォレスト
)

# CRANミラーを設定（日本のミラーを使用）
options(repos = c(CRAN = "https://cran.rstudio.com/"))

# パッケージのインストール
for (pkg in required_packages) {
  if (!require(pkg, character.only = TRUE, quietly = TRUE)) {
    cat(sprintf("[インストール中] %s\n", pkg))
    install.packages(pkg, dependencies = TRUE)
    if (require(pkg, character.only = TRUE, quietly = TRUE)) {
      cat(sprintf("[完了] %s のインストールが完了しました\n", pkg))
    } else {
      cat(sprintf("[エラー] %s のインストールに失敗しました\n", pkg))
    }
  } else {
    cat(sprintf("[スキップ] %s は既にインストールされています\n", pkg))
  }
}

cat("\n========================================\n")
cat("インストール完了\n")
cat("========================================\n\n")

# インストール済みパッケージの確認
cat("インストール済みパッケージ:\n")
for (pkg in required_packages) {
  if (require(pkg, character.only = TRUE, quietly = TRUE)) {
    cat(sprintf("  ✓ %s (version: %s)\n", pkg, packageVersion(pkg)))
  } else {
    cat(sprintf("  ✗ %s (インストールされていません)\n", pkg))
  }
}

cat("\n")

