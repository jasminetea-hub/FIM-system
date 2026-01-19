#!/usr/bin/env node

/**
 * APIサーバーの状態を確認するスクリプト
 */

const axios = require('axios');
const { exec } = require('child_process');

const R_API_URL = process.env.R_API_URL || 'http://localhost:5000';
const NODE_API_URL = process.env.NODE_API_URL || 'http://localhost:3001';

console.log('========================================');
console.log('APIサーバー状態チェック');
console.log('========================================\n');

// R FastAPIサーバーの状態を確認
async function checkRAPI() {
  try {
    console.log('1. R FastAPIサーバーの状態を確認中...');
    const response = await axios.get(`${R_API_URL}/health`, { timeout: 3000 });
    console.log('✅ R FastAPIサーバー: 正常');
    console.log(`   読み込まれたモデル数: ${response.data.models_loaded}`);
    console.log(`   利用可能なモデル: ${response.data.available_models.join(', ')}`);
    
    if (response.data.models_loaded === 0) {
      console.log('   ⚠️  警告: Rモデルが読み込まれていません');
      console.log('   → Rモデルファイル（.rds）が r_api/r_models/ ディレクトリに存在するか確認してください');
    }
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ R FastAPIサーバー: 起動していません');
      console.log('   → python3 r_api/predict_api_fastapi.py を実行して起動してください');
      console.log('   （Windowsの場合は: python r_api/predict_api_fastapi.py）');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('❌ R FastAPIサーバー: タイムアウト');
      console.log('   → サーバーが応答していません');
    } else {
      console.log('❌ R FastAPIサーバー: エラー');
      console.log(`   → ${error.message}`);
    }
    return false;
  }
}

// Node.jsサーバーの状態を確認
async function checkNodeAPI() {
  try {
    console.log('\n2. Node.jsサーバーの状態を確認中...');
    const response = await axios.get(`${NODE_API_URL}/api/predictions/stats`, { timeout: 3000 });
    console.log('✅ Node.jsサーバー: 正常');
    console.log(`   予測履歴数: ${response.data.total}`);
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Node.jsサーバー: 起動していません');
      console.log('   → npm run server を実行して起動してください');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('❌ Node.jsサーバー: タイムアウト');
      console.log('   → サーバーが応答していません');
    } else {
      console.log('❌ Node.jsサーバー: エラー');
      console.log(`   → ${error.message}`);
    }
    return false;
  }
}

// ポートの使用状況を確認
function checkPorts() {
  return new Promise((resolve) => {
    console.log('\n3. ポートの使用状況を確認中...');
    
    // macOS/Linuxの場合
    exec('lsof -i :5000 -i :3001 2>/dev/null || netstat -an | grep -E ":(5000|3001)" 2>/dev/null || echo ""', (error, stdout) => {
      if (stdout && stdout.trim()) {
        console.log('   ポート使用状況:');
        console.log(stdout);
      } else {
        console.log('   ポート5000, 3001: 使用されていない可能性があります');
      }
      resolve();
    });
  });
}

// メイン処理
async function main() {
  const rApiOk = await checkRAPI();
  const nodeApiOk = await checkNodeAPI();
  await checkPorts();
  
  console.log('\n========================================');
  console.log('診断結果');
  console.log('========================================');
  
  if (rApiOk && nodeApiOk) {
    console.log('✅ すべてのサーバーが正常に動作しています');
  } else {
    console.log('❌ 一部のサーバーに問題があります');
    console.log('\n解決方法:');
    if (!rApiOk) {
      console.log('1. R FastAPIサーバーを起動:');
      console.log('   cd r_api');
      console.log('   python3 predict_api_fastapi.py');
      console.log('   （Windowsの場合は: python predict_api_fastapi.py）');
    }
    if (!nodeApiOk) {
      console.log('2. Node.jsサーバーを起動:');
      console.log('   npm run server');
    }
    console.log('\nまたは、起動スクリプトを使用:');
    console.log('   ./start-api.sh (macOS/Linux)');
    console.log('   start-api.bat (Windows)');
  }
  console.log('========================================\n');
}

main().catch(console.error);
