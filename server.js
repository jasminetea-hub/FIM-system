const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// ミドルウェア
app.use(cors());
app.use(express.json());

// データベース接続
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

// データベースの初期化（予測履歴テーブルを作成）
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS prediction_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      -- 入力データ
      input_gender INTEGER NOT NULL,
      input_age REAL NOT NULL,
      input_bmi REAL NOT NULL,
      input_care_level INTEGER NOT NULL,
      input_days_from_onset REAL NOT NULL,
      input_motion_values TEXT NOT NULL,
      input_cognitive_values TEXT NOT NULL,
      -- 予測結果
      predicted_motion TEXT NOT NULL,
      predicted_cognitive TEXT NOT NULL,
      predicted_motion_total REAL NOT NULL,
      predicted_cognitive_total REAL NOT NULL,
      predicted_total REAL NOT NULL
    )
  `, (err) => {
    if (err) {
      console.error('テーブル作成エラー:', err);
    } else {
      console.log('予測履歴テーブルが準備されました');
    }
  });
});

// 予測値計算API
app.post('/api/predict', async (req, res) => {
  try {
    const inputData = req.body;

    // 入力値を正規化
    const inputGender = inputData.gender === 'male' ? 0 : 1;
    const inputAge = parseFloat(inputData.age) || 0;
    const inputBmi = parseFloat(inputData.bmi) || 0;
    const inputCareLevel = inputData.careLevel === 'yes' ? 1 : 0;
    const inputDaysFromOnset = parseFloat(inputData.daysFromOnset) || 0;

    // 運動機能・認知機能の値を配列に変換
    const motionItems = Object.keys(inputData.motionValues);
    const cognitiveItems = Object.keys(inputData.cognitiveValues);
    const inputMotionValues = motionItems.map(
      (item) => parseFloat(inputData.motionValues[item]) || 0
    );
    const inputCognitiveValues = cognitiveItems.map(
      (item) => parseFloat(inputData.cognitiveValues[item]) || 0
    );

    // まず完全一致を探す
    let query = `
      SELECT * FROM patient_data 
      WHERE gender = ? 
        AND ABS(age - ?) < 0.5
        AND ABS(bmi - ?) < 0.1
        AND care_level = ?
        AND ABS(days_from_onset - ?) < 0.5
    `;

    db.all(
      query,
      [inputGender, inputAge, inputBmi, inputCareLevel, inputDaysFromOnset],
      (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        // 完全一致をチェック（運動機能・認知機能項目）
        let exactMatch = null;
        for (const row of rows) {
          const admissionMotion = JSON.parse(row.admission_motion);
          const admissionCognitive = JSON.parse(row.admission_cognitive);

          // 運動機能項目の一致チェック（階段を除く12項目）
          let motionMatch = true;
          const motionLength = Math.min(
            12,
            inputMotionValues.length - 1,
            admissionMotion.length - 1
          );
          for (let i = 0; i < motionLength; i++) {
            if (Math.abs(inputMotionValues[i] - admissionMotion[i]) > 0.1) {
              motionMatch = false;
              break;
            }
          }
          if (!motionMatch) continue;

          // 認知機能項目の一致チェック
          let cognitiveMatch = true;
          for (
            let i = 0;
            i <
            Math.min(inputCognitiveValues.length, admissionCognitive.length);
            i++
          ) {
            if (
              Math.abs(inputCognitiveValues[i] - admissionCognitive[i]) > 0.1
            ) {
              cognitiveMatch = false;
              break;
            }
          }
          if (!cognitiveMatch) continue;

          exactMatch = row;
          break;
        }

        if (exactMatch) {
          // 完全一致が見つかった場合
          const dischargeMotion = JSON.parse(exactMatch.discharge_motion);
          const dischargeMotionWithStairs = [...dischargeMotion];
          if (dischargeMotionWithStairs.length === 12) {
            dischargeMotionWithStairs.push(0); // 階段は0
          }

          const prediction = {
            motion: dischargeMotionWithStairs,
            cognitive: JSON.parse(exactMatch.discharge_cognitive),
            motionTotal: exactMatch.discharge_motion_total,
            cognitiveTotal: exactMatch.discharge_cognitive_total,
            total: exactMatch.discharge_total,
          };

          // データベースに予測履歴を保存
          const insertQuery = `
            INSERT INTO prediction_history (
              input_gender,
              input_age,
              input_bmi,
              input_care_level,
              input_days_from_onset,
              input_motion_values,
              input_cognitive_values,
              predicted_motion,
              predicted_cognitive,
              predicted_motion_total,
              predicted_cognitive_total,
              predicted_total
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          db.run(
            insertQuery,
            [
              inputGender,
              inputAge,
              inputBmi,
              inputCareLevel,
              inputDaysFromOnset,
              JSON.stringify(inputData.motionValues),
              JSON.stringify(inputData.cognitiveValues),
              JSON.stringify(prediction.motion),
              JSON.stringify(prediction.cognitive),
              prediction.motionTotal,
              prediction.cognitiveTotal,
              prediction.total
            ],
            function(err) {
              if (err) {
                console.error('データベース保存エラー:', err);
              } else {
                console.log(`予測結果をデータベースに保存しました (ID: ${this.lastID})`);
              }
            }
          );

          return res.json(prediction);
        }

        // 完全一致がない場合は最も近いデータを探す
        db.all('SELECT * FROM patient_data', [], (err, allRows) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          let minDistance = Infinity;
          let bestMatch = null;

          for (const row of allRows) {
            const admissionMotion = JSON.parse(row.admission_motion);
            const admissionCognitive = JSON.parse(row.admission_cognitive);

            // 個人情報の距離
            const genderDiff = row.gender === inputGender ? 0 : 1;
            const ageDiff = Math.abs(row.age - inputAge) / 100;
            const bmiDiff = Math.abs(row.bmi - inputBmi) / 10;
            const careLevelDiff = row.care_level === inputCareLevel ? 0 : 1;
            const daysDiff =
              Math.abs(row.days_from_onset - inputDaysFromOnset) / 100;

            // 運動機能項目の距離（階段を除く12項目）
            let motionDistance = 0;
            const motionLength = Math.min(
              12,
              inputMotionValues.length - 1,
              admissionMotion.length - 1
            );
            for (let i = 0; i < motionLength; i++) {
              motionDistance += Math.abs(
                inputMotionValues[i] - admissionMotion[i]
              );
            }
            motionDistance /= motionLength;

            // 認知機能項目の距離
            let cognitiveDistance = 0;
            for (
              let i = 0;
              i <
              Math.min(inputCognitiveValues.length, admissionCognitive.length);
              i++
            ) {
              cognitiveDistance += Math.abs(
                inputCognitiveValues[i] - admissionCognitive[i]
              );
            }
            cognitiveDistance /= inputCognitiveValues.length;

            // 総合距離
            const totalDistance =
              genderDiff * 0.05 +
              ageDiff * 0.05 +
              bmiDiff * 0.05 +
              careLevelDiff * 0.05 +
              daysDiff * 0.05 +
              motionDistance * 0.5 +
              cognitiveDistance * 0.25;

            if (totalDistance < minDistance) {
              minDistance = totalDistance;
              bestMatch = row;
            }
          }

          if (!bestMatch) {
            return res.status(404).json({ error: 'No matching data found' });
          }

          const dischargeMotion = JSON.parse(bestMatch.discharge_motion);
          const dischargeMotionWithStairs = [...dischargeMotion];
          if (dischargeMotionWithStairs.length === 12) {
            dischargeMotionWithStairs.push(0); // 階段は0
          }

          const prediction = {
            motion: dischargeMotionWithStairs,
            cognitive: JSON.parse(bestMatch.discharge_cognitive),
            motionTotal: bestMatch.discharge_motion_total,
            cognitiveTotal: bestMatch.discharge_cognitive_total,
            total: bestMatch.discharge_total,
          };

          // データベースに予測履歴を保存
          const insertQuery = `
            INSERT INTO prediction_history (
              input_gender,
              input_age,
              input_bmi,
              input_care_level,
              input_days_from_onset,
              input_motion_values,
              input_cognitive_values,
              predicted_motion,
              predicted_cognitive,
              predicted_motion_total,
              predicted_cognitive_total,
              predicted_total
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          db.run(
            insertQuery,
            [
              inputGender,
              inputAge,
              inputBmi,
              inputCareLevel,
              inputDaysFromOnset,
              JSON.stringify(inputData.motionValues),
              JSON.stringify(inputData.cognitiveValues),
              JSON.stringify(prediction.motion),
              JSON.stringify(prediction.cognitive),
              prediction.motionTotal,
              prediction.cognitiveTotal,
              prediction.total
            ],
            function(err) {
              if (err) {
                console.error('データベース保存エラー:', err);
              } else {
                console.log(`予測結果をデータベースに保存しました (ID: ${this.lastID})`);
              }
            }
          );

          res.json(prediction);
        });
      }
    );
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// データベース確認用API（開発用）
app.get('/api/data', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  db.all(
    `SELECT * FROM patient_data LIMIT ? OFFSET ?`,
    [limit, offset],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // JSONフィールドをパース
      const formattedRows = rows.map((row) => ({
        ...row,
        admission_motion: JSON.parse(row.admission_motion),
        admission_cognitive: JSON.parse(row.admission_cognitive),
        discharge_motion: JSON.parse(row.discharge_motion),
        discharge_cognitive: JSON.parse(row.discharge_cognitive),
      }));

      res.json({
        count: rows.length,
        data: formattedRows,
      });
    }
  );
});

// 予測履歴を取得するAPI
app.get('/api/predictions', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  db.all(
    `SELECT * FROM prediction_history 
     ORDER BY created_at DESC 
     LIMIT ? OFFSET ?`,
    [limit, offset],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // JSONフィールドをパース
      const formattedRows = rows.map((row) => ({
        id: row.id,
        createdAt: row.created_at,
        input: {
          gender: row.input_gender === 0 ? 'male' : 'female',
          age: row.input_age,
          bmi: row.input_bmi,
          careLevel: row.input_care_level === 0 ? 'no' : 'yes',
          daysFromOnset: row.input_days_from_onset,
          motionValues: JSON.parse(row.input_motion_values),
          cognitiveValues: JSON.parse(row.input_cognitive_values),
        },
        prediction: {
          motion: JSON.parse(row.predicted_motion),
          cognitive: JSON.parse(row.predicted_cognitive),
          motionTotal: row.predicted_motion_total,
          cognitiveTotal: row.predicted_cognitive_total,
          total: row.predicted_total,
        }
      }));

      res.json({
        count: rows.length,
        data: formattedRows,
      });
    }
  );
});

// 予測履歴の統計情報を取得するAPI
app.get('/api/predictions/stats', (req, res) => {
  db.get('SELECT COUNT(*) as total FROM prediction_history', [], (err, countRow) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    db.all(
      `SELECT 
        AVG(predicted_motion_total) as avg_motion_total,
        AVG(predicted_cognitive_total) as avg_cognitive_total,
        AVG(predicted_total) as avg_total,
        MIN(predicted_total) as min_total,
        MAX(predicted_total) as max_total
      FROM prediction_history`,
      [],
      (err, stats) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          total: countRow.total,
          statistics: stats[0] || {},
        });
      }
    );
  });
});

// データベース統計情報API
app.get('/api/stats', (req, res) => {
  db.get('SELECT COUNT(*) as total FROM patient_data', [], (err, countRow) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    db.all(
      `SELECT 
        gender,
        COUNT(*) as count,
        AVG(age) as avg_age,
        AVG(bmi) as avg_bmi,
        AVG(admission_total) as avg_admission_total,
        AVG(discharge_total) as avg_discharge_total
      FROM patient_data 
      GROUP BY gender`,
      [],
      (err, stats) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          total: countRow.total,
          byGender: stats,
        });
      }
    );
  });
});

// 静的ファイルの配信（ビルド済みのフロントエンド）
const distPath = path.join(__dirname, 'dist');
const fs = require('fs');

const indexPath = path.join(distPath, 'index.html');
if (fs.existsSync(distPath) && fs.existsSync(indexPath)) {
  // 静的ファイルを配信
  app.use(express.static(distPath));
  
  // SPAのフォールバック: 静的ファイルが存在しない場合、index.htmlを返す
  // Express 5対応: GETリクエストのみをキャッチ（静的ファイルが存在しない場合のみ実行される）
  app.use((req, res, next) => {
    // APIルートは除外
    if (req.path.startsWith('/api')) {
      return next();
    }
    // GETリクエストのみ処理（POST/PUT/DELETEなどは除外）
    if (req.method !== 'GET') {
      return next();
    }
    // 静的ファイルが存在しない場合、index.htmlを返す
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('index.htmlの送信エラー:', err.message);
        res.status(404).send('ページが見つかりません。フロントエンドをビルドしてください: npm run build');
      }
    });
  });
  
  console.log('静的ファイル配信を有効にしました (dist/)');
} else {
  console.log('⚠️  distディレクトリまたはindex.htmlが見つかりません。フロントエンドをビルドしてください: npm run build');
  
  // APIルート以外のGETリクエストに対してエラーメッセージを返す
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    if (req.method === 'GET') {
      res.status(503).send(`
        <html>
          <head><title>ビルドが必要です</title></head>
          <body style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h1>⚠️ フロントエンドがビルドされていません</h1>
            <p>以下のコマンドを実行してフロントエンドをビルドしてください：</p>
            <pre style="background: #f5f5f5; padding: 20px; border-radius: 5px; display: inline-block;">npm run build</pre>
            <p>その後、サーバーを再起動してください。</p>
          </body>
        </html>
      `);
    } else {
      next();
    }
  });
}

// ローカルネットワークIPアドレスを取得
function getLocalIPAddress() {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // IPv4で、内部ループバックアドレスでないものを探す
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// サーバー起動（すべてのネットワークインターフェースでリッスン）
const HOST = '0.0.0.0'; // すべてのネットワークインターフェースでリッスン
try {
  app.listen(PORT, HOST, () => {
    const localIP = getLocalIPAddress();
    console.log('\n========================================');
    console.log('🚀 サーバーが起動しました！');
    console.log('========================================');
    console.log(`\n📱 スマホからアクセス:`);
    console.log(`   http://${localIP}:${PORT}`);
    console.log(`\n💻 PCからアクセス:`);
    console.log(`   http://localhost:${PORT}`);
    if (fs.existsSync(distPath)) {
      console.log(`\n✅ フロントエンドが配信されています`);
    }
    console.log(`\n📊 APIエンドポイント:`);
    console.log(`   http://${localIP}:${PORT}/api/data`);
    console.log(`   http://${localIP}:${PORT}/api/stats`);
    console.log(`\n⚠️  スマホとPCが同じWi-Fiネットワークに接続されている必要があります`);
    console.log('========================================\n');
  });
} catch (error) {
  console.error('❌ サーバー起動エラー:', error.message);
  console.error(error.stack);
  process.exit(1);
}

// エラーハンドリング
process.on('uncaughtException', (error) => {
  console.error('❌ 未処理の例外:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未処理のPromise拒否:', reason);
  process.exit(1);
});

// グレースフルシャットダウン
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed.');
    process.exit(0);
  });
});
