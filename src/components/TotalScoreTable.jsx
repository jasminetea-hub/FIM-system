import React from 'react';

const TotalScoreTable = ({ admissionScores, predictionScores }) => {
  const motionTotalAdmission = admissionScores.motionTotal || 0;
  const cognitiveTotalAdmission = admissionScores.cognitiveTotal || 0;
  const totalAdmission = motionTotalAdmission + cognitiveTotalAdmission;

  const motionTotalPrediction = predictionScores.motionTotal || 0;
  const cognitiveTotalPrediction = predictionScores.cognitiveTotal || 0;
  const totalPrediction = predictionScores.total || 0;

  return (
    <div className="total-score-table-container">
      <h3 className="total-score-table-title">合計点比較</h3>
      <table className="total-score-table">
        <thead>
          <tr>
            <th>項目</th>
            <th>入院時（実測値）</th>
            <th>退院時（予測値）</th>
            <th>差</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>運動機能合計</td>
            <td>{motionTotalAdmission.toFixed(1)}</td>
            <td>{motionTotalPrediction.toFixed(1)}</td>
            <td className={motionTotalPrediction - motionTotalAdmission >= 0 ? 'positive' : 'negative'}>
              {(motionTotalPrediction - motionTotalAdmission).toFixed(1)}
            </td>
          </tr>
          <tr>
            <td>認知機能合計</td>
            <td>{cognitiveTotalAdmission.toFixed(1)}</td>
            <td>{cognitiveTotalPrediction.toFixed(1)}</td>
            <td className={cognitiveTotalPrediction - cognitiveTotalAdmission >= 0 ? 'positive' : 'negative'}>
              {(cognitiveTotalPrediction - cognitiveTotalAdmission).toFixed(1)}
            </td>
          </tr>
          <tr>
            <td>総得点</td>
            <td>{totalAdmission.toFixed(1)}</td>
            <td>{totalPrediction.toFixed(1)}</td>
            <td className={totalPrediction - totalAdmission >= 0 ? 'positive' : 'negative'}>
              {(totalPrediction - totalAdmission).toFixed(1)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default TotalScoreTable;

