"""
FIM予測APIサーバー（FastAPI）
Rで学習したランダムフォレストモデルを直接使用
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import rpy2.robjects as ro
from rpy2.robjects import pandas2ri
from rpy2.robjects.packages import importr
import pandas as pd
import os
import sys

# Rのパッケージをインポート
try:
    base = importr('base')
    caret = importr('caret')
    pandas2ri.activate()
    print("Rパッケージの読み込みが完了しました")
except Exception as e:
    print(f"警告: Rパッケージの読み込みに失敗しました: {e}")
    print("Rとrpy2が正しくインストールされているか確認してください")

app = FastAPI(
    title="FIM予測API",
    description="Rで学習したランダムフォレストモデルを使用したFIM予測API",
    version="1.0.0"
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では適切なオリジンを指定
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rモデルのパス（r_api/r_models/ディレクトリ）
MODELS_DIR = os.path.join(os.path.dirname(__file__), 'r_models')
r_models = {}

# リクエストモデル
class PredictionRequest(BaseModel):
    gender: str  # "male" or "female"
    age: float
    bmi: float
    careLevel: str  # "yes" or "no"
    daysFromOnset: float
    motionValues: Dict[str, float]
    cognitiveValues: Dict[str, float]

# レスポンスモデル
class PredictionResponse(BaseModel):
    motion: List[float]
    cognitive: List[float]
    motionTotal: float
    cognitiveTotal: float
    total: float

def load_r_models():
    """Rで学習したモデルを読み込む"""
    global r_models
    
    # モデルファイルのリスト（Rで保存した.rdsファイル）
    model_files = {
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
    
    # 各モデルを読み込む
    for key, filename in model_files.items():
        model_path = os.path.join(MODELS_DIR, filename)
        if os.path.exists(model_path):
            try:
                r_models[key] = base.readRDS(model_path)
                print(f"Rモデル読み込み完了: {key}")
            except Exception as e:
                print(f"警告: {model_path} の読み込みに失敗: {e}")
        else:
            print(f"警告: {model_path} が見つかりません")
    
    print(f"読み込み完了: {len(r_models)}個のRモデル")

def prepare_r_dataframe(input_data: PredictionRequest) -> pd.DataFrame:
    """入力データをRのデータフレーム形式に変換
    
    注意: Rの学習データの列名に合わせる必要があります。
    実際のRの学習データの列名を確認して調整してください。
    """
    # 基本情報
    gender = 0 if input_data.gender == 'male' else 1
    age = input_data.age
    bmi = input_data.bmi
    care_level = 1 if input_data.careLevel == 'yes' else 0
    days_from_onset = input_data.daysFromOnset
    
    # 運動機能項目（12項目）の順序（Rの学習データの順序に合わせる）
    motion_order = ['食事', '整容', '清拭', '更衣上半身', '更衣下半身', 
                    'トイレ動作', '排尿管理', '排便管理', 'ベッド移乗', 
                    'トイレ移乗', '浴槽移乗', '歩行']
    motion_values = [input_data.motionValues.get(item, 0.0) for item in motion_order]
    
    # 認知機能項目（5項目）の順序（Rの学習データの順序に合わせる）
    cognitive_order = ['理解', '表出', '社会的交流', '問題解決', '記憶']
    cognitive_values = [input_data.cognitiveValues.get(item, 0.0) for item in cognitive_order]
    
    # データフレームを作成
    # 注意: 列名はRの学習データの列名と一致させる必要があります
    # 一般的な形式を想定していますが、実際のRデータに合わせて調整してください
    data = {
        'gender': [gender],
        'age': [age],
        'bmi': [bmi],
        'care_level': [care_level],
        'days_from_onset': [days_from_onset],
    }
    
    # 運動機能項目を追加
    # 注意: 列名はRの学習データの列名と一致させる必要があります
    # Rの学習データの列名を確認して、必要に応じて調整してください
    motion_col_names = ['食事', '整容', '清拭', '更衣上半身', '更衣下半身',
                        'トイレ動作', '排尿管理', '排便管理', 'ベッド移乗',
                        'トイレ移乗', '浴槽移乗', '歩行']
    for i, col_name in enumerate(motion_col_names):
        data[col_name] = [motion_values[i]]
    
    # 認知機能項目を追加
    # 注意: 列名はRの学習データの列名と一致させる必要があります
    cognitive_col_names = ['理解', '表出', '社会的交流', '問題解決', '記憶']
    for i, col_name in enumerate(cognitive_col_names):
        data[col_name] = [cognitive_values[i]]
    
    df = pd.DataFrame(data)
    return df

def predict_with_r_model(model_key: str, input_df: pd.DataFrame) -> float:
    """Rモデルを使用して予測を実行"""
    if model_key not in r_models:
        raise ValueError(f"モデル {model_key} が読み込まれていません")
    
    try:
        # pandas DataFrameをRのデータフレームに変換
        r_df = pandas2ri.py2rpy(input_df)
        
        # Rのpredict関数を呼び出す
        prediction = caret.predict(r_models[model_key], r_df)
        
        # RのベクトルをPythonのfloatに変換
        return float(prediction[0])
    except Exception as e:
        # エラーの詳細を出力（列名の不一致などを確認）
        print(f"予測エラー ({model_key}): {e}")
        print(f"入力データフレームの列名: {list(input_df.columns)}")
        raise

@app.on_event("startup")
async def startup_event():
    """アプリケーション起動時にRモデルを読み込む"""
    print("Rモデルを読み込み中...")
    load_r_models()
    
    if len(r_models) == 0:
        print("警告: Rモデルが読み込まれていません。")
        print(f"モデルディレクトリ: {MODELS_DIR}")
        print("先にRスクリプトでモデルを学習・保存してください。")

@app.get("/health")
async def health_check():
    """ヘルスチェックエンドポイント"""
    return {
        "status": "ok",
        "models_loaded": len(r_models),
        "available_models": list(r_models.keys())
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """予測APIエンドポイント"""
    try:
        if len(r_models) == 0:
            raise HTTPException(
                status_code=503,
                detail="Rモデルが読み込まれていません。モデルを学習・保存してください。"
            )
        
        # 入力データをRのデータフレーム形式に変換
        input_df = prepare_r_dataframe(request)
        
        # 予測を実行
        predictions = {}
        
        # 運動機能項目の予測（12項目）
        motion_items = ['eat', 'groom', 'bath', 'dress_up', 'dress_low', 
                       'toile', 'bladder', 'bowel', 'trans_bed', 
                       'trans_toile', 'trans_bath', 'gait']
        motion_predictions = []
        for item in motion_items:
            if item in r_models:
                try:
                    pred = predict_with_r_model(item, input_df)
                    motion_predictions.append(max(0.0, min(7.0, pred)))  # FIMスコアは0-7の範囲
                except Exception as e:
                    print(f"予測エラー ({item}): {e}")
                    motion_predictions.append(0.0)
            else:
                motion_predictions.append(0.0)
        
        # 認知機能項目の予測（5項目）
        cognitive_items = ['comp', 'express', 'social', 'problem', 'memory']
        cognitive_predictions = []
        for item in cognitive_items:
            if item in r_models:
                try:
                    pred = predict_with_r_model(item, input_df)
                    cognitive_predictions.append(max(0.0, min(7.0, pred)))  # FIMスコアは0-7の範囲
                except Exception as e:
                    print(f"予測エラー ({item}): {e}")
                    cognitive_predictions.append(0.0)
            else:
                cognitive_predictions.append(0.0)
        
        # 合計値の予測
        motion_total = 0.0
        cognitive_total = 0.0
        total = 0.0
        
        if 'motion_total' in r_models:
            try:
                motion_total = predict_with_r_model('motion_total', input_df)
            except Exception as e:
                motion_total = sum(motion_predictions)
        else:
            motion_total = sum(motion_predictions)
        
        if 'cognitive_total' in r_models:
            try:
                cognitive_total = predict_with_r_model('cognitive_total', input_df)
            except Exception as e:
                cognitive_total = sum(cognitive_predictions)
        else:
            cognitive_total = sum(cognitive_predictions)
        
        if 'total' in r_models:
            try:
                total = predict_with_r_model('total', input_df)
            except Exception as e:
                total = motion_total + cognitive_total
        else:
            total = motion_total + cognitive_total
        
        # 階段の値を追加（モデルがない場合は0）
        motion_predictions.append(0.0)
        
        return PredictionResponse(
            motion=motion_predictions,
            cognitive=cognitive_predictions,
            motionTotal=float(motion_total),
            cognitiveTotal=float(cognitive_total),
            total=float(total)
        )
        
    except Exception as e:
        print(f"予測エラー: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)

