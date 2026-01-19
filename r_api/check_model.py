#!/usr/bin/env python3
"""
Rモデルファイルの存在確認スクリプト
"""
import os

MODELS_DIR = os.path.join(os.path.dirname(__file__), 'r_models')

print("=" * 50)
print("Rモデルファイル確認")
print("=" * 50)
print(f"\nモデルディレクトリ: {MODELS_DIR}")
print(f"ディレクトリの存在: {os.path.exists(MODELS_DIR)}")

if os.path.exists(MODELS_DIR):
    print(f"\nディレクトリ内のファイル:")
    files = os.listdir(MODELS_DIR)
    for file in sorted(files):
        file_path = os.path.join(MODELS_DIR, file)
        size = os.path.getsize(file_path) if os.path.isfile(file_path) else 0
        file_type = "ファイル" if os.path.isfile(file_path) else "ディレクトリ"
        print(f"  - {file} ({file_type}, {size:,} bytes)")
    
    # 主要なモデルファイルの確認
    main_model = os.path.join(MODELS_DIR, 'rf_model_all_FIM.rds')
    if os.path.exists(main_model):
        print(f"\n✅ メインモデルファイルが見つかりました: rf_model_all_FIM.rds")
        print(f"   サイズ: {os.path.getsize(main_model):,} bytes")
    else:
        print(f"\n❌ メインモデルファイルが見つかりません: rf_model_all_FIM.rds")
else:
    print(f"\n❌ モデルディレクトリが存在しません: {MODELS_DIR}")

print("\n" + "=" * 50)
