const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const Encoding = require('encoding-japanese');

const dbPath = path.join(__dirname, '..', 'database.db');
const csvPath = path.join(__dirname, '..', 'public', 'テスト全データ.csv');

// データベースを作成
const db = new sqlite3.Database(dbPath);

// テーブルを作成
db.serialize(() => {
  db.run(`DROP TABLE IF EXISTS patient_data`);

  db.run(`
    CREATE TABLE IF NOT EXISTS patient_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gender INTEGER NOT NULL,
      age REAL NOT NULL,
      bmi REAL NOT NULL,
      care_level INTEGER NOT NULL,
      days_from_onset REAL NOT NULL,
      admission_motion TEXT NOT NULL,
      admission_cognitive TEXT NOT NULL,
      admission_motion_total REAL NOT NULL,
      admission_cognitive_total REAL NOT NULL,
      admission_total REAL NOT NULL,
      discharge_motion TEXT NOT NULL,
      discharge_cognitive TEXT NOT NULL,
      discharge_motion_total REAL NOT NULL,
      discharge_cognitive_total REAL NOT NULL,
      discharge_total REAL NOT NULL
    )
  `);

  // CSVファイルを読み込む
  const buffer = fs.readFileSync(csvPath);
  let text;
  
  // UTF-8かShift-JISかを判定
  try {
    text = buffer.toString('utf8');
    // 文字化けチェック（簡易的）
    if (text.includes('�')) {
      // Shift-JISとして読み込む
      const unicodeArray = Encoding.convert(buffer, {
        to: 'UNICODE',
        from: 'SJIS',
      });
      text = Encoding.codeToString(unicodeArray);
    }
  } catch (error) {
    // Shift-JISとして読み込む
    const unicodeArray = Encoding.convert(buffer, {
      to: 'UNICODE',
      from: 'SJIS',
    });
    text = Encoding.codeToString(unicodeArray);
  }

  const lines = text.split('\n').filter((line) => line.trim());
  
  const stmt = db.prepare(`
    INSERT INTO patient_data (
      gender, age, bmi, care_level, days_from_onset,
      admission_motion, admission_cognitive,
      admission_motion_total, admission_cognitive_total, admission_total,
      discharge_motion, discharge_cognitive,
      discharge_motion_total, discharge_cognitive_total, discharge_total
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length < 47) continue;

    const row = {
      gender: parseInt(values[0]) || 0,
      age: parseFloat(values[1]) || 0,
      bmi: parseFloat(values[2]) || 0,
      careLevel: parseInt(values[3]) || 0,
      daysFromOnset: parseFloat(values[4]) || 0,
      // 入院時FIM運動機能項目（12項目）
      admissionMotion: [
        parseFloat(values[5]) || 0,
        parseFloat(values[6]) || 0,
        parseFloat(values[7]) || 0,
        parseFloat(values[8]) || 0,
        parseFloat(values[9]) || 0,
        parseFloat(values[10]) || 0,
        parseFloat(values[11]) || 0,
        parseFloat(values[12]) || 0,
        parseFloat(values[13]) || 0,
        parseFloat(values[14]) || 0,
        parseFloat(values[15]) || 0,
        parseFloat(values[16]) || 0,
      ],
      // 入院時FIM認知機能項目（5項目）
      admissionCognitive: [
        parseFloat(values[19]) || 0,
        parseFloat(values[20]) || 0,
        parseFloat(values[21]) || 0,
        parseFloat(values[22]) || 0,
        parseFloat(values[23]) || 0,
      ],
      admissionMotionTotal: parseFloat(values[18]) || 0,
      admissionCognitiveTotal: parseFloat(values[24]) || 0,
      admissionTotal: parseFloat(values[25]) || 0,
      // 退院時FIM運動機能項目（12項目）
      dischargeMotion: [
        parseFloat(values[26]) || 0,
        parseFloat(values[27]) || 0,
        parseFloat(values[28]) || 0,
        parseFloat(values[29]) || 0,
        parseFloat(values[30]) || 0,
        parseFloat(values[31]) || 0,
        parseFloat(values[32]) || 0,
        parseFloat(values[33]) || 0,
        parseFloat(values[34]) || 0,
        parseFloat(values[35]) || 0,
        parseFloat(values[36]) || 0,
        parseFloat(values[37]) || 0,
      ],
      // 退院時FIM認知機能項目（5項目）
      dischargeCognitive: [
        parseFloat(values[40]) || 0,
        parseFloat(values[41]) || 0,
        parseFloat(values[42]) || 0,
        parseFloat(values[43]) || 0,
        parseFloat(values[44]) || 0,
      ],
      dischargeMotionTotal: parseFloat(values[39]) || 0,
      dischargeCognitiveTotal: parseFloat(values[45]) || 0,
      dischargeTotal: parseFloat(values[46]) || 0,
    };

    stmt.run(
      row.gender,
      row.age,
      row.bmi,
      row.careLevel,
      row.daysFromOnset,
      JSON.stringify(row.admissionMotion),
      JSON.stringify(row.admissionCognitive),
      row.admissionMotionTotal,
      row.admissionCognitiveTotal,
      row.admissionTotal,
      JSON.stringify(row.dischargeMotion),
      JSON.stringify(row.dischargeCognitive),
      row.dischargeMotionTotal,
      row.dischargeCognitiveTotal,
      row.dischargeTotal
    );
  }

  stmt.finalize((err) => {
    if (err) {
      console.error('Error inserting data:', err);
    } else {
      console.log('Data imported successfully!');
    }
    db.close();
  });
});

