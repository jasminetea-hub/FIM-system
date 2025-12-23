# Rモデルを保存するスクリプト
# 予測モデル.txtの内容を基に、学習済みモデルを.rds形式で保存

library(tidyverse)
library(caret)

# モデル保存ディレクトリ
models_dir <- "r_models"
if (!dir.exists(models_dir)) {
  dir.create(models_dir)
}

# ============================================
# FIM総得点のモデルを保存
# ============================================
if (file.exists("train_data_all_FIM.csv")) {
  train_data_all_FIM <- read_csv("train_data_all_FIM.csv", 
                                  locale = locale(encoding = "cp932"))
  
  rf_model_all_FIM <- train(
    退院時FIM総得点 ~ ., 
    data = train_data_all_FIM, 
    method = "rf", 
    trControl = trainControl(
      method = "repeatedcv", 
      number = 10, 
      repeats = 3
    )
  )
  
  saveRDS(rf_model_all_FIM, file.path(models_dir, "rf_model_all_FIM.rds"))
  cat("FIM総得点モデルを保存しました\n")
}

# ============================================
# 運動項目合計のモデルを保存
# ============================================
if (file.exists("train_data_motor_FIM.csv")) {
  train_data_motor_FIM <- read_csv("train_data_motor_FIM.csv",
                                    locale = locale(encoding = "cp932"))
  
  rf_model_motor_FIM <- train(
    退院時FIM運動項目合計 ~ ., 
    data = train_data_motor_FIM, 
    method = "rf", 
    trControl = trainControl(
      method = "repeatedcv", 
      number = 10, 
      repeats = 3
    )
  )
  
  saveRDS(rf_model_motor_FIM, file.path(models_dir, "rf_model_motor_FIM.rds"))
  cat("運動項目合計モデルを保存しました\n")
}

# ============================================
# 認知項目合計のモデルを保存
# ============================================
if (file.exists("train_data_cog_FIM.csv")) {
  train_data_cog_FIM <- read_csv("train_data_cog_FIM.csv",
                                  locale = locale(encoding = "cp932"))
  
  rf_model_cog_FIM <- train(
    退院時FIM認知項目合計 ~ ., 
    data = train_data_cog_FIM, 
    method = "rf", 
    trControl = trainControl(
      method = "repeatedcv", 
      number = 10, 
      repeats = 3
    )
  )
  
  saveRDS(rf_model_cog_FIM, file.path(models_dir, "rf_model_cog_FIM.rds"))
  cat("認知項目合計モデルを保存しました\n")
}

# ============================================
# 個別項目のモデルを保存
# ============================================

# 食事
if (file.exists("train_data_eat_FIM.csv")) {
  train_data_eat_FIM <- read_csv("train_data_eat_FIM.csv",
                                  locale = locale(encoding = "cp932"))
  rf_model_eat_FIM <- train(
    退院時FIM食事 ~ ., 
    data = train_data_eat_FIM, 
    method = "rf", 
    trControl = trainControl(method = "repeatedcv", number = 10, repeats = 3)
  )
  saveRDS(rf_model_eat_FIM, file.path(models_dir, "rf_model_eat_FIM.rds"))
  cat("食事モデルを保存しました\n")
}

# 整容
if (file.exists("train_data_groom_FIM.csv")) {
  train_data_groom_FIM <- read_csv("train_data_groom_FIM.csv",
                                    locale = locale(encoding = "cp932"))
  rf_model_groom_FIM <- train(
    退院時FIM整容 ~ ., 
    data = train_data_groom_FIM, 
    method = "rf", 
    trControl = trainControl(method = "repeatedcv", number = 10, repeats = 3)
  )
  saveRDS(rf_model_groom_FIM, file.path(models_dir, "rf_model_groom_FIM.rds"))
  cat("整容モデルを保存しました\n")
}

# 清拭
if (file.exists("train_data_bath_FIM.csv")) {
  train_data_bath_FIM <- read_csv("train_data_bath_FIM.csv",
                                   locale = locale(encoding = "cp932"))
  rf_model_bath_FIM <- train(
    退院時FIM清拭 ~ ., 
    data = train_data_bath_FIM, 
    method = "rf", 
    trControl = trainControl(method = "repeatedcv", number = 10, repeats = 3)
  )
  saveRDS(rf_model_bath_FIM, file.path(models_dir, "rf_model_bath_FIM.rds"))
  cat("清拭モデルを保存しました\n")
}

# 更衣上半身
if (file.exists("train_data_dress_up_FIM.csv")) {
  train_data_dress_up_FIM <- read_csv("train_data_dress_up_FIM.csv",
                                       locale = locale(encoding = "cp932"))
  rf_model_dress_up_FIM <- train(
    退院時FIM更衣上半身 ~ ., 
    data = train_data_dress_up_FIM, 
    method = "rf", 
    trControl = trainControl(method = "repeatedcv", number = 10, repeats = 3)
  )
  saveRDS(rf_model_dress_up_FIM, file.path(models_dir, "rf_model_dress_up_FIM.rds"))
  cat("更衣上半身モデルを保存しました\n")
}

# 更衣下半身
if (file.exists("train_data_dress_low_FIM.csv")) {
  train_data_dress_low_FIM <- read_csv("train_data_dress_low_FIM.csv",
                                        locale = locale(encoding = "cp932"))
  rf_model_dress_low_FIM <- train(
    退院時FIM更衣下半身 ~ ., 
    data = train_data_dress_low_FIM, 
    method = "rf", 
    trControl = trainControl(method = "repeatedcv", number = 10, repeats = 3)
  )
  saveRDS(rf_model_dress_low_FIM, file.path(models_dir, "rf_model_dress_low_FIM.rds"))
  cat("更衣下半身モデルを保存しました\n")
}

# トイレ動作
if (file.exists("train_data_toile_FIM.csv")) {
  train_data_toile_FIM <- read_csv("train_data_toile_FIM.csv",
                                    locale = locale(encoding = "cp932"))
  rf_model_toile_FIM <- train(
    退院時FIMトイレ動作 ~ ., 
    data = train_data_toile_FIM, 
    method = "rf", 
    trControl = trainControl(method = "repeatedcv", number = 10, repeats = 3)
  )
  saveRDS(rf_model_toile_FIM, file.path(models_dir, "rf_model_toile_FIM.rds"))
  cat("トイレ動作モデルを保存しました\n")
}

# 排尿管理
if (file.exists("train_data_bladder_FIM.csv")) {
  train_data_bladder_FIM <- read_csv("train_data_bladder_FIM.csv",
                                      locale = locale(encoding = "cp932"))
  rf_model_bladder_FIM <- train(
    退院時FIM排尿管理 ~ ., 
    data = train_data_bladder_FIM, 
    method = "rf", 
    trControl = trainControl(method = "repeatedcv", number = 10, repeats = 3)
  )
  saveRDS(rf_model_bladder_FIM, file.path(models_dir, "rf_model_bladder_FIM.rds"))
  cat("排尿管理モデルを保存しました\n")
}

# 排便管理
if (file.exists("train_data_bowel_FIM.csv")) {
  train_data_bowel_FIM <- read_csv("train_data_bowel_FIM.csv",
                                    locale = locale(encoding = "cp932"))
  rf_model_bowel_FIM <- train(
    退院時FIM排便管理 ~ ., 
    data = train_data_bowel_FIM, 
    method = "rf", 
    trControl = trainControl(method = "repeatedcv", number = 10, repeats = 3)
  )
  saveRDS(rf_model_bowel_FIM, file.path(models_dir, "rf_model_bowel_FIM.rds"))
  cat("排便管理モデルを保存しました\n")
}

# ベッド移乗
if (file.exists("train_data_trans_bed_FIM.csv")) {
  train_data_trans_bed_FIM <- read_csv("train_data_trans_bed_FIM.csv",
                                        locale = locale(encoding = "cp932"))
  rf_model_trans_bed_FIM <- train(
    退院時FIMベッド移乗 ~ ., 
    data = train_data_trans_bed_FIM, 
    method = "rf", 
    trControl = trainControl(method = "repeatedcv", number = 10, repeats = 3)
  )
  saveRDS(rf_model_trans_bed_FIM, file.path(models_dir, "rf_model_trans_bed_FIM.rds"))
  cat("ベッド移乗モデルを保存しました\n")
}

# トイレ移乗
if (file.exists("train_data_trans_toile_FIM.csv")) {
  train_data_trans_toile_FIM <- read_csv("train_data_trans_toile_FIM.csv",
                                          locale = locale(encoding = "cp932"))
  rf_model_trans_toile_FIM <- train(
    退院時FIMトイレ移乗 ~ ., 
    data = train_data_trans_toile_FIM, 
    method = "rf", 
    trControl = trainControl(method = "repeatedcv", number = 10, repeats = 3)
  )
  saveRDS(rf_model_trans_toile_FIM, file.path(models_dir, "rf_model_trans_toile_FIM.rds"))
  cat("トイレ移乗モデルを保存しました\n")
}

# 浴槽移乗
if (file.exists("train_data_trans_bath_FIM.csv")) {
  train_data_trans_bath_FIM <- read_csv("train_data_trans_bath_FIM.csv",
                                         locale = locale(encoding = "cp932"))
  rf_model_trans_bath_FIM <- train(
    退院時FIM浴槽移乗 ~ ., 
    data = train_data_trans_bath_FIM, 
    method = "rf", 
    trControl = trainControl(method = "repeatedcv", number = 10, repeats = 3)
  )
  saveRDS(rf_model_trans_bath_FIM, file.path(models_dir, "rf_model_trans_bath_FIM.rds"))
  cat("浴槽移乗モデルを保存しました\n")
}

# 歩行
if (file.exists("train_data_gait_FIM.csv")) {
  train_data_gait_FIM <- read_csv("train_data_gait_FIM.csv",
                                   locale = locale(encoding = "cp932"))
  rf_model_gait_FIM <- train(
    退院時FIM歩行 ~ ., 
    data = train_data_gait_FIM, 
    method = "rf", 
    trControl = trainControl(method = "repeatedcv", number = 10, repeats = 3)
  )
  saveRDS(rf_model_gait_FIM, file.path(models_dir, "rf_model_gait_FIM.rds"))
  cat("歩行モデルを保存しました\n")
}

# 理解
if (file.exists("train_data_comp_FIM.csv")) {
  train_data_comp_FIM <- read_csv("train_data_comp_FIM.csv",
                                   locale = locale(encoding = "cp932"))
  rf_model_comp_FIM <- train(
    退院時FIM理解 ~ ., 
    data = train_data_comp_FIM, 
    method = "rf", 
    trControl = trainControl(method = "repeatedcv", number = 10, repeats = 3)
  )
  saveRDS(rf_model_comp_FIM, file.path(models_dir, "rf_model_comp_FIM.rds"))
  cat("理解モデルを保存しました\n")
}

# 表出
if (file.exists("train_data_express_FIM.csv")) {
  train_data_express_FIM <- read_csv("train_data_express_FIM.csv",
                                      locale = locale(encoding = "cp932"))
  rf_model_express_FIM <- train(
    退院時FIM表出 ~ ., 
    data = train_data_express_FIM, 
    method = "rf", 
    trControl = trainControl(method = "repeatedcv", number = 10, repeats = 3)
  )
  saveRDS(rf_model_express_FIM, file.path(models_dir, "rf_model_express_FIM.rds"))
  cat("表出モデルを保存しました\n")
}

# 社会的交流
if (file.exists("train_data_social_FIM.csv")) {
  train_data_social_FIM <- read_csv("train_data_social_FIM.csv",
                                     locale = locale(encoding = "cp932"))
  rf_model_social_FIM <- train(
    退院時FIM社会的交流 ~ ., 
    data = train_data_social_FIM, 
    method = "rf", 
    trControl = trainControl(method = "repeatedcv", number = 10, repeats = 3)
  )
  saveRDS(rf_model_social_FIM, file.path(models_dir, "rf_model_social_FIM.rds"))
  cat("社会的交流モデルを保存しました\n")
}

# 問題解決
if (file.exists("train_data_problem_FIM.csv")) {
  train_data_problem_FIM <- read_csv("train_data_problem_FIM.csv",
                                      locale = locale(encoding = "cp932"))
  rf_model_problem_FIM <- train(
    退院時FIM問題解決 ~ ., 
    data = train_data_problem_FIM, 
    method = "rf", 
    trControl = trainControl(method = "repeatedcv", number = 10, repeats = 3)
  )
  saveRDS(rf_model_problem_FIM, file.path(models_dir, "rf_model_problem_FIM.rds"))
  cat("問題解決モデルを保存しました\n")
}

# 記憶
if (file.exists("train_data_memory_FIM.csv")) {
  train_data_memory_FIM <- read_csv("train_data_memory_FIM.csv",
                                     locale = locale(encoding = "cp932"))
  rf_model_memory_FIM <- train(
    退院時FIM記憶 ~ ., 
    data = train_data_memory_FIM, 
    method = "rf", 
    trControl = trainControl(method = "repeatedcv", number = 10, repeats = 3)
  )
  saveRDS(rf_model_memory_FIM, file.path(models_dir, "rf_model_memory_FIM.rds"))
  cat("記憶モデルを保存しました\n")
}

cat("\nすべてのRモデルの保存が完了しました。\n")
cat("モデルは", models_dir, "ディレクトリに保存されています。\n")

