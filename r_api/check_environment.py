"""
環境構築の確認スクリプト
必要な環境が正しくセットアップされているか確認します
"""
import sys
import os
import subprocess

def check_python():
    """Pythonのバージョンを確認"""
    print("=" * 50)
    print("Python環境の確認")
    print("=" * 50)
    version = sys.version_info
    print(f"Pythonバージョン: {version.major}.{version.minor}.{version.micro}")
    
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8以上が必要です")
        return False
    else:
        print("✅ Pythonバージョンは問題ありません")
        return True

def check_r():
    """Rのインストールを確認"""
    print("\n" + "=" * 50)
    print("R環境の確認")
    print("=" * 50)
    
    try:
        result = subprocess.run(['R', '--version'], 
                              capture_output=True, 
                              text=True, 
                              timeout=5)
        if result.returncode == 0:
            print("✅ Rがインストールされています")
            print(result.stdout.split('\n')[0])
            return True
        else:
            print("❌ Rのバージョン確認に失敗しました")
            return False
    except FileNotFoundError:
        print("❌ Rがインストールされていません")
        print("   Rをインストールしてください: https://cran.r-project.org/")
        return False
    except Exception as e:
        print(f"❌ Rの確認中にエラーが発生しました: {e}")
        return False

def check_rpy2():
    """rpy2のインストールを確認"""
    print("\n" + "=" * 50)
    print("rpy2の確認")
    print("=" * 50)
    
    try:
        import rpy2.robjects as ro
        print("✅ rpy2がインストールされています")
        
        # Rのバージョンを取得
        try:
            r_version = ro.r('R.version.string')[0]
            print(f"   Rバージョン: {r_version}")
        except Exception as e:
            print(f"   ⚠️  Rのバージョン取得に失敗: {e}")
        
        # Rパッケージの確認
        try:
            from rpy2.robjects.packages import importr
            base = importr('base')
            print("✅ Rパッケージ（base）の読み込み成功")
            
            # caretパッケージの確認
            try:
                caret = importr('caret')
                print("✅ Rパッケージ（caret）の読み込み成功")
            except Exception as e:
                print(f"⚠️  caretパッケージの読み込みに失敗: {e}")
                print("   Rで以下を実行してください: install.packages('caret')")
            
        except Exception as e:
            print(f"⚠️  Rパッケージの読み込みに失敗: {e}")
        
        return True
    except ImportError:
        print("❌ rpy2がインストールされていません")
        print("   以下を実行してください: pip install rpy2")
        return False
    except Exception as e:
        print(f"❌ rpy2の確認中にエラーが発生しました: {e}")
        return False

def check_fastapi():
    """FastAPIのインストールを確認"""
    print("\n" + "=" * 50)
    print("FastAPIの確認")
    print("=" * 50)
    
    try:
        import fastapi
        print(f"✅ FastAPIがインストールされています (version: {fastapi.__version__})")
        return True
    except ImportError:
        print("❌ FastAPIがインストールされていません")
        print("   以下を実行してください: pip install fastapi uvicorn")
        return False

def check_models_directory():
    """モデルディレクトリの確認"""
    print("\n" + "=" * 50)
    print("モデルディレクトリの確認")
    print("=" * 50)
    
    models_dir = os.path.join(os.path.dirname(__file__), '..', 'r_models')
    
    if not os.path.exists(models_dir):
        print(f"⚠️  モデルディレクトリが存在しません: {models_dir}")
        print("   ディレクトリを作成しますか？ (y/n): ", end='')
        response = input().strip().lower()
        if response == 'y':
            os.makedirs(models_dir, exist_ok=True)
            print(f"✅ ディレクトリを作成しました: {models_dir}")
        return False
    
    print(f"✅ モデルディレクトリが存在します: {models_dir}")
    
    # .rdsファイルの確認
    rds_files = [f for f in os.listdir(models_dir) if f.endswith('.rds')]
    if rds_files:
        print(f"✅ {len(rds_files)}個のRモデルファイルが見つかりました:")
        for f in rds_files[:5]:  # 最初の5個を表示
            print(f"   - {f}")
        if len(rds_files) > 5:
            print(f"   ... 他 {len(rds_files) - 5} 個")
    else:
        print("⚠️  Rモデルファイル（.rds）が見つかりません")
        print("   Rでモデルを学習・保存してください: source('r_api/save_r_models.R')")
    
    return True

def main():
    """メイン関数"""
    print("\n" + "=" * 50)
    print("R FastAPI環境構築確認")
    print("=" * 50 + "\n")
    
    results = {
        'Python': check_python(),
        'R': check_r(),
        'rpy2': check_rpy2(),
        'FastAPI': check_fastapi(),
        'Models Directory': check_models_directory(),
    }
    
    print("\n" + "=" * 50)
    print("確認結果のサマリー")
    print("=" * 50)
    
    all_ok = True
    for name, result in results.items():
        status = "✅ OK" if result else "❌ NG"
        print(f"{name}: {status}")
        if not result:
            all_ok = False
    
    print("\n" + "=" * 50)
    if all_ok:
        print("✅ すべての環境が正しくセットアップされています！")
        print("\n次のステップ:")
        print("1. FastAPIサーバーを起動: python predict_api_fastapi.py")
        print("2. APIドキュメントを確認: http://localhost:5000/docs")
    else:
        print("⚠️  いくつかの環境が正しくセットアップされていません")
        print("   環境構築ガイド（環境構築ガイド.md）を参照してください")
    print("=" * 50 + "\n")

if __name__ == '__main__':
    main()

