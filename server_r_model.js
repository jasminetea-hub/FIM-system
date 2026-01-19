// FIM予測システム - Rモデルを使用した予測サーバー
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const Encoding = require('encoding-japanese');

const app = express();
const PORT = process.env.PORT || 3001;
const R_API_URL = process.env.R_API_URL || 'http://localhost:5000';

// CSVファイルを使用するかどうか（環境変数で制御、デフォルトはtrue）
const USE_CSV_MODE = process.env.USE_CSV_MODE !== 'false';

// CSVデータを読み込む
let csvData = [];
const csvFilePath = path.join(__dirname, 'r_api', 'r_models', '学習全データ.csv');

// CSVファイルの列名マッピング
const CSV_COLUMN_MAPPING = {
  // 個人情報
  gender: '性別01',
  age: '年齢',
  bmi: '入院時BMI',
  careLevel: '入院時要介護度の有無',
  daysFromOnset: '発症から入棟までの日数',
  // 入院時FIM運動機能項目（12項目）
  admissionMotion: {
    eat: '入棟時FIM食事',
    groom: '入棟時FIM整容',
    bath: '入棟時FIM清拭',
    dress_up: '入棟時FIM更衣上半身',
    dress_low: '入棟時FIM更衣下半身',
    toile: '入棟時FIMトイレ動作',
    bladder: '入棟時FIM排尿管理',
    bowel: '入棟時FIM排便管理',
    trans_bed: '入棟時FIMベッド移乗',
    trans_toile: '入棟時FIMトイレ移乗',
    trans_bath: '入棟時FIM浴槽移乗',
    gait: '入棟時FIM歩行',
  },
  // 入院時FIM認知機能項目（5項目）
  admissionCognitive: {
    comp: '入棟時FIM理解',
    express: '入棟時FIM表出',
    social: '入棟時FIM社会的交流',
    problem: '入棟時FIM問題解決',
    memory: '入棟時FIM記憶',
  },
  // 退院時FIM運動機能項目（12項目）
  dischargeMotion: {
    eat: '退院時FIM食事',
    groom: '退院時FIM整容',
    bath: '退院時FIM清拭',
    dress_up: '退院時FIM更衣上半身',
    dress_low: '退院時FIM更衣下半身',
    toile: '退院時FIMトイレ動作',
    bladder: '退院時FIM排尿管理',
    bowel: '退院時FIM排便管理',
    trans_bed: '退院時FIMベッド移乗',
    trans_toile: '退院時FIMトイレ移乗',
    trans_bath: '退院時FIM浴槽移乗',
    gait: '退院時FIM歩行',
  },
  // 退院時FIM認知機能項目（5項目）
  dischargeCognitive: {
    comp: '退院時FIM理解',
    express: '退院時FIM表出',
    social: '退院時FIM社会的交流',
    problem: '退院時FIM問題解決',
    memory: '退院時FIM記憶',
  },
};

// CSVファイルを読み込む関数
function loadCSVData() {
  try {
    if (!fs.existsSync(csvFilePath)) {
      console.warn(`⚠️  CSVファイルが見つかりません: ${csvFilePath}`);
      return;
    }

    // ファイルをバイナリとして読み込む
    const buffer = fs.readFileSync(csvFilePath);
    // Shift-JISからUTF-8に変換
    const unicodeArray = Encoding.convert(buffer, {
      to: 'UNICODE',
      from: 'SJIS',
    });
    const content = Encoding.codeToString(unicodeArray);

    // CSVを手動でパース
    const lines = content.split('\n').filter((line) => line.trim() !== '');
    if (lines.length === 0) {
      console.warn('CSVファイルが空です');
      return;
    }

    // ヘッダー行を取得
    const headers = lines[0].split(',').map((h) => h.trim());

    // データ行をパース
    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      if (values.length !== headers.length) continue;

      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index];
      });
      records.push(record);
    }

    csvData = records.map((row) => {
      const record = {};
      // 数値に変換
      record.gender = parseInt(row[CSV_COLUMN_MAPPING.gender]) || 0;
      record.age = parseFloat(row[CSV_COLUMN_MAPPING.age]) || 0;
      record.bmi = parseFloat(row[CSV_COLUMN_MAPPING.bmi]) || 0;
      record.careLevel = parseInt(row[CSV_COLUMN_MAPPING.careLevel]) || 0;
      record.daysFromOnset = parseFloat(row[CSV_COLUMN_MAPPING.daysFromOnset]) || 0;

      // 入院時FIM値
      record.admissionMotion = {};
      record.admissionCognitive = {};
      Object.keys(CSV_COLUMN_MAPPING.admissionMotion).forEach((key) => {
        const colName = CSV_COLUMN_MAPPING.admissionMotion[key];
        record.admissionMotion[key] = parseFloat(row[colName]) || 0;
      });
      Object.keys(CSV_COLUMN_MAPPING.admissionCognitive).forEach((key) => {
        const colName = CSV_COLUMN_MAPPING.admissionCognitive[key];
        record.admissionCognitive[key] = parseFloat(row[colName]) || 0;
      });

      // 退院時FIM値
      record.dischargeMotion = {};
      record.dischargeCognitive = {};
      Object.keys(CSV_COLUMN_MAPPING.dischargeMotion).forEach((key) => {
        const colName = CSV_COLUMN_MAPPING.dischargeMotion[key];
        record.dischargeMotion[key] = parseFloat(row[colName]) || 0;
      });
      Object.keys(CSV_COLUMN_MAPPING.dischargeCognitive).forEach((key) => {
        const colName = CSV_COLUMN_MAPPING.dischargeCognitive[key];
        record.dischargeCognitive[key] = parseFloat(row[colName]) || 0;
      });

      return record;
    });

    console.log(`✅ CSVデータを読み込みました: ${csvData.length}件`);
  } catch (error) {
    console.error('CSVファイルの読み込みエラー:', error);
    csvData = [];
  }
}

// CSVモードが有効な場合は、起動時にCSVデータを読み込む
if (USE_CSV_MODE) {
  loadCSVData();
}

// 入力データに最も近いCSVデータを見つける関数
function findClosestCSVRecord(inputData) {
  if (csvData.length === 0) {
    return null;
  }

  let minDistance = Infinity;
  let closestRecord = null;

  // 入力データを正規化
  const inputGender = inputData.gender === 'male' ? 0 : 1;
  const inputCareLevel = inputData.careLevel === 'yes' ? 1 : 0;

  csvData.forEach((record) => {
    // 距離を計算（ユークリッド距離の重み付き版）
    let distance = 0;

    // 個人情報の距離
    distance += Math.pow((record.gender - inputGender) * 10, 2);
    distance += Math.pow((record.age - inputData.age) / 10, 2);
    distance += Math.pow((record.bmi - inputData.bmi) / 5, 2);
    distance += Math.pow((record.careLevel - inputCareLevel) * 10, 2);
    distance += Math.pow((record.daysFromOnset - inputData.daysFromOnset) / 10, 2);

    // 入院時FIM値の距離
    Object.keys(inputData.motionValues).forEach((key) => {
      const diff = (record.admissionMotion[key] || 0) - (inputData.motionValues[key] || 0);
      distance += Math.pow(diff, 2);
    });
    Object.keys(inputData.cognitiveValues).forEach((key) => {
      const diff = (record.admissionCognitive[key] || 0) - (inputData.cognitiveValues[key] || 0);
      distance += Math.pow(diff, 2);
    });

    if (distance < minDistance) {
      minDistance = distance;
      closestRecord = record;
    }
  });

  return closestRecord;
}

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
        console.warn('R FastAPIサーバーを起動してください: python3 r_api/predict_api_fastapi.py');
        console.warn('（Windowsの場合は: python r_api/predict_api_fastapi.py）');
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

// 予測値計算API（R FastAPIまたはCSVデータを使用）
app.post('/api/predict', async (req, res) => {
  try {
    const inputData = req.body;

    // 入力データの検証
    if (!inputData.gender || !inputData.age || !inputData.motionValues || !inputData.cognitiveValues) {
      return res.status(400).json({ error: '必要な入力データが不足しています' });
    }

    let prediction = null;

    // CSVモードが有効な場合
    if (USE_CSV_MODE) {
      const closestRecord = findClosestCSVRecord(inputData);
      if (closestRecord) {
        // 退院時FIM値を予測結果として返す
        const motionArray = Object.keys(CSV_COLUMN_MAPPING.dischargeMotion).map(
          (key) => closestRecord.dischargeMotion[key] || 0
        );
        const cognitiveArray = Object.keys(CSV_COLUMN_MAPPING.dischargeCognitive).map(
          (key) => closestRecord.dischargeCognitive[key] || 0
        );

        const motionTotal = motionArray.reduce((sum, val) => sum + val, 0);
        const cognitiveTotal = cognitiveArray.reduce((sum, val) => sum + val, 0);
        const total = motionTotal + cognitiveTotal;

        prediction = {
          motion: Object.keys(CSV_COLUMN_MAPPING.dischargeMotion).reduce((obj, key, index) => {
            obj[key] = motionArray[index];
            return obj;
          }, {}),
          cognitive: Object.keys(CSV_COLUMN_MAPPING.dischargeCognitive).reduce((obj, key, index) => {
            obj[key] = cognitiveArray[index];
            return obj;
          }, {}),
          motionTotal,
          cognitiveTotal,
          total,
        };

        console.log('CSVデータから予測結果を取得しました');
      } else {
        return res.status(503).json({
          error: 'CSVデータが見つかりません。CSVファイルを確認してください。',
        });
      }
    }
    // R FastAPIが利用可能な場合
    else if (rAPIAvailable) {
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
          console.error('レスポンスエラー:', error.response.status, error.response.data);
          // HTTP 500エラーの場合は、詳細なエラーメッセージを返す
          if (error.response.status === 500) {
            return res.status(500).json({ 
              error: 'R FastAPIで内部サーバーエラーが発生しました',
              detail: error.response.data?.detail || error.message,
              status: error.response.status,
              hint: 'R FastAPIサーバーのログを確認してください。Rモデルが正しく読み込まれているか確認してください。'
            });
          }
          return res.status(error.response.status).json({ 
            error: 'R FastAPIからの予測に失敗しました',
            detail: error.response.data?.detail || error.message,
            status: error.response.status
          });
        } else if (error.code === 'ECONNREFUSED') {
          return res.status(503).json({ 
            error: 'R FastAPIサーバーに接続できません',
            detail: 'R FastAPIサーバーが起動していない可能性があります',
            hint: 'python3 r_api/predict_api_fastapi.py を実行してR FastAPIサーバーを起動してください（Windowsの場合は python）'
          });
        } else if (error.code === 'ETIMEDOUT') {
          return res.status(504).json({ 
            error: 'R FastAPIサーバーへのリクエストがタイムアウトしました',
            detail: error.message
          });
        }
        return res.status(503).json({ 
          error: 'R FastAPIからの予測に失敗しました',
          detail: error.message,
          code: error.code
        });
      }
    } else {
      // CSVモードでもR FastAPIでもない場合
      if (!USE_CSV_MODE) {
        return res.status(503).json({ 
          error: 'R FastAPIが利用できません。R FastAPIサーバーを起動してください。',
          hint: 'python r_api/predict_api_fastapi.py\nまたは、環境変数 USE_CSV_MODE=true を設定してCSVモードを使用してください。'
        });
      }
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
  console.log(`\n🔬 予測モード:`);
  if (USE_CSV_MODE) {
    console.log(`   ✅ CSVモード: 有効`);
    console.log(`   CSVファイル: ${csvFilePath}`);
    console.log(`   読み込み済みデータ: ${csvData.length}件`);
    if (csvData.length === 0) {
      console.log(`   ⚠️  CSVデータが読み込まれていません。ファイルを確認してください。`);
    }
  } else {
    console.log(`   🔬 R FastAPIモード: 有効`);
    console.log(`   URL: ${R_API_URL}`);
    console.log(`   ステータス: ${rAPIAvailable ? '✅ 接続済み' : '❌ 未接続'}`);
    if (rAPIAvailable) {
      console.log(`   APIドキュメント: ${R_API_URL}/docs`);
    } else {
      console.log(`   ⚠️  R FastAPIを起動してください: python3 r_api/predict_api_fastapi.py`);
      console.log(`   （Windowsの場合は: python r_api/predict_api_fastapi.py）`);
    }
  }
  console.log(`   💡 CSVモードを無効にする場合: USE_CSV_MODE=false npm run server`);
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

