const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('データベースの内容を表示します...\n');

// テーブル一覧を表示
db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
  if (err) {
    console.error('エラー:', err);
    db.close();
    return;
  }
  
  console.log('テーブル一覧:');
  tables.forEach(table => {
    console.log(`  - ${table.name}`);
  });
  console.log('');

  // patient_dataテーブルのレコード数を表示
  db.get('SELECT COUNT(*) as count FROM patient_data', [], (err, row) => {
    if (err) {
      console.error('エラー:', err);
      db.close();
      return;
    }
    console.log(`patient_dataテーブルのレコード数: ${row.count}\n`);

    // 最初の5件を表示
    db.all('SELECT * FROM patient_data LIMIT 5', [], (err, rows) => {
      if (err) {
        console.error('エラー:', err);
        db.close();
        return;
      }

      console.log('最初の5件のデータ:');
      rows.forEach((row, index) => {
        console.log(`\n--- レコード ${index + 1} ---`);
        console.log(`ID: ${row.id}`);
        console.log(`性別: ${row.gender === 0 ? '男性' : '女性'}`);
        console.log(`年齢: ${row.age}`);
        console.log(`BMI: ${row.bmi}`);
        console.log(`要介護度: ${row.care_level === 0 ? 'なし' : 'あり'}`);
        console.log(`発症から入棟までの日数: ${row.days_from_onset}`);
        console.log(`入院時FIM運動機能合計: ${row.admission_motion_total}`);
        console.log(`入院時FIM認知機能合計: ${row.admission_cognitive_total}`);
        console.log(`入院時FIM総得点: ${row.admission_total}`);
        console.log(`退院時FIM運動機能合計: ${row.discharge_motion_total}`);
        console.log(`退院時FIM認知機能合計: ${row.discharge_cognitive_total}`);
        console.log(`退院時FIM総得点: ${row.discharge_total}`);
      });

      db.close();
    });
  });
});

