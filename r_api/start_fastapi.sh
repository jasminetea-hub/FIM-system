#!/bin/bash
# FastAPI起動スクリプト（PM2用）
# 仮想環境があればそれを使用、なければシステムのPythonを使用

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 仮想環境の確認
if [ -f "venv/bin/python3" ]; then
    echo "仮想環境を使用します"
    exec venv/bin/python3 -m uvicorn predict_api_fastapi:app --host 0.0.0.0 --port 5000
elif [ -f "venv/bin/python" ]; then
    echo "仮想環境を使用します（python）"
    exec venv/bin/python -m uvicorn predict_api_fastapi:app --host 0.0.0.0 --port 5000
else
    echo "システムのPythonを使用します"
    exec python3 -m uvicorn predict_api_fastapi:app --host 0.0.0.0 --port 5000
fi
