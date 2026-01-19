import React from 'react';
import RadarChartComponent from './RadarChart';
import TotalScoreTable from './TotalScoreTable';
import { motionItems, cognitiveItems } from '../constants/formItems';

const ResultSection = ({ admissionValues, predictionValues, onClose }) => {
  // 入院時の実測値を配列に変換
  const admissionMotionValues = motionItems.map(item => 
    parseFloat(admissionValues.motionValues[item]) || 0
  );
  const admissionCognitiveValues = cognitiveItems.map(item => 
    parseFloat(admissionValues.cognitiveValues[item]) || 0
  );

  // 合計点を計算
  const admissionMotionTotal = admissionMotionValues.reduce((sum, val) => sum + val, 0);
  const admissionCognitiveTotal = admissionCognitiveValues.reduce((sum, val) => sum + val, 0);

  const admissionScores = {
    motionTotal: admissionMotionTotal,
    cognitiveTotal: admissionCognitiveTotal,
  };

  return (
    <section className="result-section">
      <div className="result-header">
        <h2 className="result-title">計測結果</h2>
        <button type="button" className="back-button" onClick={onClose}>
          戻る
        </button>
      </div>

      <div className="result-content">
        <RadarChartComponent
          title="運動機能項目"
          items={motionItems}
          admissionValues={admissionMotionValues}
          predictionValues={predictionValues.motion || []}
        />

        <RadarChartComponent
          title="認知機能項目"
          items={cognitiveItems}
          admissionValues={admissionCognitiveValues}
          predictionValues={predictionValues.cognitive || []}
        />

        <TotalScoreTable
          admissionScores={admissionScores}
          predictionScores={predictionValues}
        />
      </div>
    </section>
  );
};

export default ResultSection;

