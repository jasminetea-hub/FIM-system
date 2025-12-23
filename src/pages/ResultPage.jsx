import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ResultSection from '../components/ResultSection';

const ResultPage = () => {
  const navigate = useNavigate();
  const [resultData, setResultData] = useState(null);

  useEffect(() => {
    // sessionStorageから結果データを取得
    const savedData = sessionStorage.getItem('resultData');
    if (savedData) {
      try {
        setResultData(JSON.parse(savedData));
      } catch (error) {
        console.error('データの読み込みエラー:', error);
        navigate('/');
      }
    } else {
      // データがない場合はフォームページに戻る
      navigate('/');
    }
  }, [navigate]);

  const handleBack = () => {
    navigate('/');
  };

  if (!resultData) {
    return (
      <div className="app-root">
        <div className="app-card">
          <div style={{ padding: '20px', textAlign: 'center' }}>
            データを読み込み中...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-root app-root--pc">
      <div className="app-card">
        <ResultSection
          admissionValues={resultData.admissionValues}
          predictionValues={resultData.predictionValues}
          onClose={handleBack}
        />
      </div>
    </div>
  );
};

export default ResultPage;

