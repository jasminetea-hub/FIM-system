#!/usr/bin/env python3
"""
Rモデルの読み込み状況をデバッグするスクリプト
サーバー上で実行して、モデルファイルの状態を確認します
"""
import os
import sys

# スクリプトのディレクトリを取得
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(SCRIPT_DIR, 'r_models')

print("=" * 60)
print("Rモデルデバッグスクリプト")
print("=" * 60)
print(f"\nスクリプトのディレクトリ: {SCRIPT_DIR}")
print(f"モデルディレクトリ: {MODELS_DIR}")
print(f"モデルディレクトリの存在: {os.path.exists(MODELS_DIR)}")

if os.path.exists(MODELS_DIR):
    print(f"\nモデルディレクトリの内容:")
    try:
        files = os.listdir(MODELS_DIR)
        if files:
            for file in sorted(files):
                file_path = os.path.join(MODELS_DIR, file)
                if os.path.isfile(file_path):
                    size = os.path.getsize(file_path)
                    readable = os.access(file_path, os.R_OK)
                    print(f"  ✅ {file}")
                    print(f"     サイズ: {size:,} bytes")
                    print(f"     読み取り可能: {'はい' if readable else '❌ いいえ'}")
                else:
                    print(f"  📁 {file} (ディレクトリ)")
        else:
            print("  (空)")
    except Exception as e:
        print(f"  ❌ エラー: {e}")
else:
    print(f"\n❌ モデルディレクトリが存在しません: {MODELS_DIR}")

# 期待されるモデルファイルのリスト
expected_models = {
    'total': 'rf_model_all_FIM.rds',
    'motion_total': 'rf_model_motor_FIM.rds',
    'cognitive_total': 'rf_model_cog_FIM.rds',
    'eat': 'rf_model_eat_FIM.rds',
    'groom': 'rf_model_groom_FIM.rds',
    'bath': 'rf_model_bath_FIM.rds',
    'dress_up': 'rf_model_dress_up_FIM.rds',
    'dress_low': 'rf_model_dress_low_FIM.rds',
    'toile': 'rf_model_toile_FIM.rds',
    'bladder': 'rf_model_bladder_FIM.rds',
    'bowel': 'rf_model_bowel_FIM.rds',
    'trans_bed': 'rf_model_trans_bed_FIM.rds',
    'trans_toile': 'rf_model_trans_toile_FIM.rds',
    'trans_bath': 'rf_model_trans_bath_FIM.rds',
    'gait': 'rf_model_gait_FIM.rds',
    'comp': 'rf_model_comp_FIM.rds',
    'express': 'rf_model_express_FIM.rds',
    'social': 'rf_model_social_FIM.rds',
    'problem': 'rf_model_problem_FIM.rds',
    'memory': 'rf_model_memory_FIM.rds',
}

print(f"\n期待されるモデルファイル ({len(expected_models)}個):")
found_count = 0
missing_count = 0
for key, filename in expected_models.items():
    model_path = os.path.join(MODELS_DIR, filename)
    if os.path.exists(model_path):
        found_count += 1
        print(f"  ✅ {filename} (存在)")
    else:
        missing_count += 1
        print(f"  ❌ {filename} (見つかりません)")

print(f"\n統計:")
print(f"  見つかったモデル: {found_count}個")
print(f"  見つからないモデル: {missing_count}個")

# R環境の確認
print(f"\nR環境の確認:")
try:
    import rpy2.robjects as ro
    from rpy2.robjects.packages import importr
    base = importr('base')
    print("  ✅ rpy2が正常にインポートできました")
    print(f"  Rバージョン: {base.version.string()[0]}")
    
    # モデルファイルを実際に読み込んでみる
    if found_count > 0:
        print(f"\nモデルファイルの読み込みテスト:")
        for key, filename in expected_models.items():
            model_path = os.path.join(MODELS_DIR, filename)
            if os.path.exists(model_path):
                try:
                    model = base.readRDS(model_path)
                    print(f"  ✅ {filename}: 読み込み成功")
                except Exception as e:
                    print(f"  ❌ {filename}: 読み込み失敗 - {e}")
except ImportError as e:
    print(f"  ❌ rpy2のインポートに失敗: {e}")
    print("  → rpy2がインストールされているか確認してください")
except Exception as e:
    print(f"  ❌ R環境の確認中にエラー: {e}")

print("\n" + "=" * 60)
print("デバッグ完了")
print("=" * 60)
