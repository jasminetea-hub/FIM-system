// R FastAPIを使用して予測を行い、データベースに保存するサーバー
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const R_API_URL = process.env.R_API_URL || 'http://localhost:5000';

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

// R FastAPIのヘルスチェック
async function checkRAPI() {
  try {
    const response = await axios.get(`${R_API_URL}/health`, { timeout: 2000 });
    console.log('R FastAPI接続成功:', response.data);
    return true;
  } catch (error) {
    console.warn('R FastAPIに接続できません。');
    console.warn('R FastAPIサーバーを起動してください: python r_api/predict_api_fastapi.py');
    return false;
  }
}

// 起動時にR APIの状態を確認
let rAPIAvailable = false;
checkRAPI().then(available => {
  rAPIAvailable = available;
  if (!available) {
    console.warn('⚠️  R FastAPIが利用できません。予測機能が動作しません。');
  }
});

// 定期的にR APIの状態を確認（30秒ごと）
setInterval(async () => {
  rAPIAvailable = await checkRAPI();
}, 30000);

// 予測値計算API（R FastAPIを使用）
app.post('/api/predict', async (req, res) => {
  try {
    const inputData = req.body;

    // 入力データの検証
    if (!inputData.gender || !inputData.age || !inputData.motionValues || !inputData.cognitiveValues) {
      return res.status(400).json({ error: '必要な入力データが不足しています' });
    }

    let prediction = null;

    // R FastAPIが利用可能な場合
    if (rAPIAvailable) {
      try {
        const response = await axios.post(
          `${R_API_URL}/predict`,
          inputData,
          { 
            timeout: 10000,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        prediction = response.data;
        console.log('R FastAPIから予測結果を取得しました');
      } catch (error) {
        console.error('R FastAPI呼び出しエラー:', error.message);
        if (error.response) {
          console.error('レスポンスエラー:', error.response.data);
        }
        return res.status(503).json({ 
          error: 'R FastAPIからの予測に失敗しました',
          detail: error.message
        });
      }
    } else {
      return res.status(503).json({ 
        error: 'R FastAPIが利用できません。R FastAPIサーバーを起動してください。',
        hint: 'python r_api/predict_api_fastapi.py'
      });
    }

    // データベースに保存
    if (prediction) {
      const inputGender = inputData.gender === 'male' ? 0 : 1;
      const inputCareLevel = inputData.careLevel === 'yes' ? 1 : 0;
      
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
          parseFloat(inputData.age) || 0,
          parseFloat(inputData.bmi) || 0,
          inputCareLevel,
          parseFloat(inputData.daysFromOnset) || 0,
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
    }

    return res.json(prediction);
    
  } catch (error) {
    console.error('予測エラー:', error);
    res.status(500).json({ error: 'Internal server error', detail: error.message });
  }
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
  console.log(`\n🔬 R FastAPI:`);
  console.log(`   URL: ${R_API_URL}`);
  console.log(`   ステータス: ${rAPIAvailable ? '✅ 接続済み' : '❌ 未接続'}`);
  if (rAPIAvailable) {
    console.log(`   APIドキュメント: ${R_API_URL}/docs`);
  } else {
    console.log(`   ⚠️  R FastAPIを起動してください: python r_api/predict_api_fastapi.py`);
  }
  console.log(`\n⚠️  スマホとPCが同じWi-Fiネットワークに接続されている必要があります`);
  console.log('========================================\n');
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

