import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const RadarChartComponent = ({ title, data, items, admissionValues, predictionValues }) => {
  // レーダーチャート用のデータを準備
  const chartData = items.map((item, index) => ({
    item: item,
    '入院時': admissionValues[index] || 0,
    '退院時予測': predictionValues[index] || 0,
  }));

  return (
    <div className="radar-chart-container">
      <h3 className="radar-chart-title">{title}</h3>
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={chartData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="item" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis angle={90} domain={[0, 7]} tick={{ fontSize: 10 }} />
          <Radar
            name="入院時"
            dataKey="入院時"
            stroke="#2563eb"
            fill="#2563eb"
            fillOpacity={0.3}
          />
          <Radar
            name="退院時予測"
            dataKey="退院時予測"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.3}
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarChartComponent;

