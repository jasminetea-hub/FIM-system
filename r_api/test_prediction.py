"""
Rモデルを使用した予測のテストスクリプト
テストデータの入院時データを入力して、退院時の予測値を確認
"""
import sys
import os
import pandas as pd
import json

# 親ディレクトリをパスに追加
sys.path.insert(0, os.path.dirname(__file__))

from predict_api_fastapi import prepare_r_dataframe, predict_with_r_model, load_r_models
from pydantic import BaseModel
from typing import Dict

# Rモデルを読み込む
print("Rモデルを読み込み中...")
load_r_models()

# テストデータの例（実際のテストデータから取得）
test_input = {
    "gender": "male",
    "age": 65.0,
    "bmi": 23.5,
    "careLevel": "no",
    "daysFromOnset": 30.0,
    "motionValues": {
        "食事": 5,
        "整容": 4,
        "清拭": 3,
        "更衣上半身": 4,
        "更衣下半身": 4,
        "トイレ動作": 5,
        "排尿管理": 6,
        "排便管理": 6,
        "ベッド移乗": 4,
        "トイレ移乗": 4,
        "浴槽移乗": 3,
        "歩行": 3
    },
    "cognitiveValues": {
        "理解": 6,
        "表出": 6,
        "社会的交流": 5,
        "問題解決": 5,
        "記憶": 5
    }
}

print("\n" + "=" * 50)
print("テスト予測の実行")
print("=" * 50 + "\n")

print("入力データ:")
print(json.dumps(test_input, indent=2, ensure_ascii=False))

# データフレームを準備
try:
    input_df = prepare_r_dataframe(test_input)
    print("\n準備されたデータフレーム:")
    print(input_df)
    print("\nデータフレームの列名:")
    print(list(input_df.columns))
except Exception as e:
    print(f"\nエラー: データフレームの準備に失敗しました: {e}")
    sys.exit(1)

# 予測を実行
print("\n" + "=" * 50)
print("予測結果")
print("=" * 50 + "\n")

predictions = {}

# 運動機能項目の予測
motion_items = ['eat', 'groom', 'bath', 'dress_up', 'dress_low', 
               'toile', 'bladder', 'bowel', 'trans_bed', 
               'trans_toile', 'trans_bath', 'gait']
motion_predictions = []
for item in motion_items:
    try:
        pred = predict_with_r_model(item, input_df)
        motion_predictions.append(pred)
        print(f"{item}: {pred:.2f}")
    except Exception as e:
        print(f"{item}: エラー - {e}")
        motion_predictions.append(0.0)

# 認知機能項目の予測
cognitive_items = ['comp', 'express', 'social', 'problem', 'memory']
cognitive_predictions = []
for item in cognitive_items:
    try:
        pred = predict_with_r_model(item, input_df)
        cognitive_predictions.append(pred)
        print(f"{item}: {pred:.2f}")
    except Exception as e:
        print(f"{item}: エラー - {e}")
        cognitive_predictions.append(0.0)

# 合計値の予測
try:
    motion_total = predict_with_r_model('motion_total', input_df)
    print(f"\n運動機能合計: {motion_total:.2f}")
except Exception as e:
    print(f"\n運動機能合計: エラー - {e}")
    motion_total = sum(motion_predictions)

try:
    cognitive_total = predict_with_r_model('cognitive_total', input_df)
    print(f"認知機能合計: {cognitive_total:.2f}")
except Exception as e:
    print(f"認知機能合計: エラー - {e}")
    cognitive_total = sum(cognitive_predictions)

try:
    total = predict_with_r_model('total', input_df)
    print(f"総合得点: {total:.2f}")
except Exception as e:
    print(f"総合得点: エラー - {e}")
    total = motion_total + cognitive_total

print("\n" + "=" * 50)
print("予測結果のサマリー")
print("=" * 50)
print(f"運動機能項目: {motion_predictions}")
print(f"認知機能項目: {cognitive_predictions}")
print(f"運動機能合計: {motion_total:.2f}")
print(f"認知機能合計: {cognitive_total:.2f}")
print(f"総合得点: {total:.2f}")











