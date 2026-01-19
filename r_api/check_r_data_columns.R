# Rの学習データの列名を確認するスクリプト
# このスクリプトを実行して、Rの学習データの列名を確認してください

library(tidyverse)

cat("========================================\n")
cat("R学習データの列名確認\n")
cat("========================================\n\n")

# 学習データファイルのリスト
data_files <- c(
  "train_data_all_FIM.csv",
  "train_data_motor_FIM.csv",
  "train_data_cog_FIM.csv"
)

for (file in data_files) {
  if (file.exists(file)) {
    cat(sprintf("ファイル: %s\n", file))
    cat("----------------------------------------\n")
    
    df <- read_csv(file, locale = locale(encoding = "cp932"))
    
    cat("列名:\n")
    print(colnames(df))
    cat("\n")
    
    cat("データの構造:\n")
    print(str(df))
    cat("\n")
    
    cat("最初の数行:\n")
    print(head(df))
    cat("\n")
    
    cat("========================================\n\n")
  } else {
    cat(sprintf("ファイルが見つかりません: %s\n\n", file))
  }
}

# 実際に使用する列名を確認
if (file.exists("train_data_all_FIM.csv")) {
  df <- read_csv("train_data_all_FIM.csv", locale = locale(encoding = "cp932"))
  
  cat("予測モデルで使用される列名（退院時FIM総得点を予測する場合）:\n")
  cat("説明変数（目的変数を除く）:\n")
  target_col <- "退院時FIM総得点"
  if (target_col %in% colnames(df)) {
    feature_cols <- setdiff(colnames(df), target_col)
    print(feature_cols)
    
    cat("\n列名のリスト（Python用）:\n")
    cat("feature_columns = [\n")
    for (col in feature_cols) {
      cat(sprintf("  '%s',\n", col))
    }
    cat("]\n")
  } else {
    cat("警告: '退院時FIM総得点'列が見つかりません\n")
    cat("利用可能な列名:\n")
    print(colnames(df))
  }
}











