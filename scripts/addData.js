const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const Encoding = require('encoding-japanese');

const dbPath = path.join(__dirname, '..', 'database.db');
const csvPath = process.argv[2] || path.join(__dirname, '..', 'public', 'テスト全データ.csv');

// データベースに接続
const db = new sqlite3.Database(dbPath);

// テーブルが存在しない場合は作成
db.serialize(() => {
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
  if (!fs.existsSync(csvPath)) {
    console.error(`エラー: CSVファイルが見つかりません: ${csvPath}`);
    db.close();
    process.exit(1);
  }

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

  let processedCount = 0;
  let addedCount = 0;
  let skippedCount = 0;
  const totalRows = lines.length - 1;

  const processRow = (index) => {
    if (index >= lines.length) {
      // 全ての行を処理したら終了
      stmt.finalize((err) => {
        if (err) {
          console.error('ステートメント終了エラー:', err);
          db.close();
          return;
        }
        
        // 最終的なレコード数を確認
        db.get('SELECT COUNT(*) as count FROM patient_data', [], (err, countRow) => {
          if (err) {
            console.error('カウントエラー:', err);
          } else {
            console.log('\n✅ データ追加が完了しました！');
            console.log(`   処理された行数: ${processedCount}`);
            console.log(`   追加されたレコード数: ${addedCount}`);
            console.log(`   スキップされたレコード数: ${skippedCount}`);
            console.log(`   データベース内の総レコード数: ${countRow.count}`);
          }
          db.close();
        });
      });
      return;
    }

    const values = lines[index].split(',');
    if (values.length < 47) {
      skippedCount++;
      processedCount++;
      processRow(index + 1);
      return;
    }

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
      row.dischargeTotal,
      function(err) {
        processedCount++;
        if (err) {
          console.error(`行 ${index + 1} の追加エラー:`, err.message);
          skippedCount++;
        } else {
          addedCount++;
          if (processedCount % 100 === 0) {
            console.log(`処理中... ${processedCount}/${totalRows} 行`);
          }
        }
        // 次の行を処理
        processRow(index + 1);
      }
    );
  };

  // 最初の行から処理開始（ヘッダー行をスキップ）
  console.log(`CSVファイルからデータを追加します: ${csvPath}`);
  console.log(`総行数: ${totalRows}`);
  processRow(1);
});

