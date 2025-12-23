// CSVデータを読み込んで予測値を計算するユーティリティ

let csvDataCache = null;

// CSVファイルを読み込む
export async function loadCSVData() {
  if (csvDataCache) {
    return csvDataCache;
  }

  try {
    const response = await fetch('/テスト全データ.csv');
    const text = await response.text();

    // CSVをパース
    const lines = text.split('\n').filter((line) => line.trim());
    const headers = lines[0].split(',');

    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length < 47) continue; // データが不完全な行をスキップ

      const row = {
        gender: parseInt(values[0]) || 0, // 0: 男性, 1: 女性
        age: parseFloat(values[1]) || 0,
        bmi: parseFloat(values[2]) || 0,
        careLevel: parseInt(values[3]) || 0, // 0: 無, 1: 有
        daysFromOnset: parseFloat(values[4]) || 0,
        // 入院時FIM運動機能項目（12項目）
        admissionMotion: [
          parseFloat(values[5]) || 0, // 食事
          parseFloat(values[6]) || 0, // 整容
          parseFloat(values[7]) || 0, // 清拭
          parseFloat(values[8]) || 0, // 更衣上半身
          parseFloat(values[9]) || 0, // 更衣下半身
          parseFloat(values[10]) || 0, // トイレ動作
          parseFloat(values[11]) || 0, // 排尿管理
          parseFloat(values[12]) || 0, // 排便管理
          parseFloat(values[13]) || 0, // ベッド移乗
          parseFloat(values[14]) || 0, // トイレ移乗
          parseFloat(values[15]) || 0, // 浴槽移乗
          parseFloat(values[16]) || 0, // 歩行
        ],
        // 入院時FIM認知機能項目（5項目）
        admissionCognitive: [
          parseFloat(values[19]) || 0, // 理解
          parseFloat(values[20]) || 0, // 表出
          parseFloat(values[21]) || 0, // 社会的交流
          parseFloat(values[22]) || 0, // 問題解決
          parseFloat(values[23]) || 0, // 記憶
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
      data.push(row);
    }

    csvDataCache = data;
    return data;
  } catch (error) {
    console.error('CSV読み込みエラー:', error);
    return [];
  }
}

// 入力値から最も近いデータを見つけて予測値を返す
export function calculatePrediction(inputData, csvData) {
  if (!csvData || csvData.length === 0) {
    return null;
  }

  // 入力値を正規化（性別：男性=0、女性=1）
  const inputGender = inputData.gender === 'male' ? 0 : 1;
  const inputAge = parseFloat(inputData.age) || 0;
  const inputBmi = parseFloat(inputData.bmi) || 0;
  const inputCareLevel = inputData.careLevel === 'yes' ? 1 : 0;
  const inputDaysFromOnset = parseFloat(inputData.daysFromOnset) || 0;

  // 入力された運動機能・認知機能の値を配列に変換（項目の順序に注意）
  const motionItems = Object.keys(inputData.motionValues);
  const cognitiveItems = Object.keys(inputData.cognitiveValues);
  const inputMotionValues = motionItems.map(
    (item) => parseFloat(inputData.motionValues[item]) || 0
  );
  const inputCognitiveValues = cognitiveItems.map(
    (item) => parseFloat(inputData.cognitiveValues[item]) || 0
  );

  // まず完全一致を探す
  let exactMatch = null;
  for (const row of csvData) {
    // 個人情報の一致チェック
    if (row.gender !== inputGender) continue;
    if (Math.abs(row.age - inputAge) > 0.5) continue;
    if (Math.abs(row.bmi - inputBmi) > 0.1) continue;
    if (row.careLevel !== inputCareLevel) continue;
    if (Math.abs(row.daysFromOnset - inputDaysFromOnset) > 0.5) continue;

    // 運動機能項目の一致チェック（階段を除く12項目）
    let motionMatch = true;
    for (
      let i = 0;
      i <
      Math.min(
        12,
        inputMotionValues.length - 1,
        row.admissionMotion.length - 1
      );
      i++
    ) {
      if (Math.abs(inputMotionValues[i] - row.admissionMotion[i]) > 0.1) {
        motionMatch = false;
        break;
      }
    }
    if (!motionMatch) continue;

    // 認知機能項目の一致チェック
    let cognitiveMatch = true;
    for (
      let i = 0;
      i < Math.min(inputCognitiveValues.length, row.admissionCognitive.length);
      i++
    ) {
      if (Math.abs(inputCognitiveValues[i] - row.admissionCognitive[i]) > 0.1) {
        cognitiveMatch = false;
        break;
      }
    }
    if (!cognitiveMatch) continue;

    exactMatch = row;
    break;
  }

  // 完全一致が見つかった場合はそれを返す
  if (exactMatch) {
    // 階段の値を追加（CSVにはないので0）
    const dischargeMotionWithStairs = [...exactMatch.dischargeMotion];
    if (dischargeMotionWithStairs.length === 12) {
      dischargeMotionWithStairs.push(0); // 階段は0
    }

    return {
      motion: dischargeMotionWithStairs,
      cognitive: exactMatch.dischargeCognitive,
      motionTotal: exactMatch.dischargeMotionTotal,
      cognitiveTotal: exactMatch.dischargeCognitiveTotal,
      total: exactMatch.dischargeTotal,
    };
  }

  // 完全一致がない場合は最も近いデータを探す
  let minDistance = Infinity;
  let bestMatch = null;

  for (const row of csvData) {
    // 個人情報の距離
    const genderDiff = row.gender === inputGender ? 0 : 1;
    const ageDiff = Math.abs(row.age - inputAge) / 100; // 正規化
    const bmiDiff = Math.abs(row.bmi - inputBmi) / 10; // 正規化
    const careLevelDiff = row.careLevel === inputCareLevel ? 0 : 1;
    const daysDiff = Math.abs(row.daysFromOnset - inputDaysFromOnset) / 100; // 正規化

    // 運動機能項目の距離（階段を除く12項目）
    let motionDistance = 0;
    const motionLength = Math.min(
      12,
      inputMotionValues.length - 1,
      row.admissionMotion.length - 1
    );
    for (let i = 0; i < motionLength; i++) {
      motionDistance += Math.abs(inputMotionValues[i] - row.admissionMotion[i]);
    }
    motionDistance /= motionLength; // 平均

    // 認知機能項目の距離
    let cognitiveDistance = 0;
    for (
      let i = 0;
      i < Math.min(inputCognitiveValues.length, row.admissionCognitive.length);
      i++
    ) {
      cognitiveDistance += Math.abs(
        inputCognitiveValues[i] - row.admissionCognitive[i]
      );
    }
    cognitiveDistance /= inputCognitiveValues.length; // 平均

    // 総合距離（重み付け：運動機能と認知機能を重視）
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
    return null;
  }

  // 階段の値を追加（CSVにはないので0）
  const dischargeMotionWithStairs = [...bestMatch.dischargeMotion];
  if (dischargeMotionWithStairs.length === 12) {
    dischargeMotionWithStairs.push(0); // 階段は0
  }

  return {
    motion: dischargeMotionWithStairs,
    cognitive: bestMatch.dischargeCognitive,
    motionTotal: bestMatch.dischargeMotionTotal,
    cognitiveTotal: bestMatch.dischargeCognitiveTotal,
    total: bestMatch.dischargeTotal,
  };
}
