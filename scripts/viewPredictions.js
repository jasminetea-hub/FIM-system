// 予測履歴を表示するスクリプト
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath);

const limit = process.argv[2] ? parseInt(process.argv[2]) : 10;

console.log('========================================');
console.log('予測履歴');
console.log('========================================\n');

db.all(
  `SELECT * FROM prediction_history 
   ORDER BY created_at DESC 
   LIMIT ?`,
  [limit],
  (err, rows) => {
    if (err) {
      console.error('エラー:', err);
      db.close();
      return;
    }

    if (rows.length === 0) {
      console.log('予測履歴がありません。');
      db.close();
      return;
    }

    console.log(`表示件数: ${rows.length}件\n`);

    rows.forEach((row, index) => {
      console.log(`--- 予測履歴 #${row.id} (${row.created_at}) ---`);
      console.log('入力データ:');
      console.log(`  性別: ${row.input_gender === 0 ? '男性' : '女性'}`);
      console.log(`  年齢: ${row.input_age}`);
      console.log(`  BMI: ${row.input_bmi}`);
      console.log(`  要介護度: ${row.input_care_level === 0 ? '無' : '有'}`);
      console.log(`  発症からの日数: ${row.input_days_from_onset}`);
      
      const motionValues = JSON.parse(row.input_motion_values);
      const cognitiveValues = JSON.parse(row.input_cognitive_values);
      console.log(`  入院時FIM運動機能: ${Object.values(motionValues).join(', ')}`);
      console.log(`  入院時FIM認知機能: ${Object.values(cognitiveValues).join(', ')}`);
      
      console.log('\n予測結果:');
      const predictedMotion = JSON.parse(row.predicted_motion);
      const predictedCognitive = JSON.parse(row.predicted_cognitive);
      console.log(`  退院時FIM運動機能: ${predictedMotion.join(', ')}`);
      console.log(`  退院時FIM認知機能: ${predictedCognitive.join(', ')}`);
      console.log(`  運動機能合計: ${row.predicted_motion_total}`);
      console.log(`  認知機能合計: ${row.predicted_cognitive_total}`);
      console.log(`  総合得点: ${row.predicted_total}`);
      console.log('');
    });

    db.close();
  }
);

