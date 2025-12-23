import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PersonalInfoSection from '../components/PersonalInfoSection';
import ScaleSection from '../components/ScaleSection';
import { motionItems, cognitiveItems } from '../constants/formItems';

// 開発環境ではプロキシを使用、本番環境では環境変数から取得
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const FormPage = () => {
  const navigate = useNavigate();
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [bmi, setBmi] = useState('');
  const [careLevel, setCareLevel] = useState('');
  const [daysFromOnset, setDaysFromOnset] = useState('');

  const [motionValues, setMotionValues] = useState(
    Object.fromEntries(motionItems.map((item) => [item, '']))
  );
  const [cognitiveValues, setCognitiveValues] = useState(
    Object.fromEntries(cognitiveItems.map((item) => [item, '']))
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectChange = (category, key, value) => {
    if (category === 'motion') {
      setMotionValues((prev) => ({ ...prev, [key]: value }));
    } else {
      setCognitiveValues((prev) => ({ ...prev, [key]: value }));
    }
  };

  const validateInput = () => {
    // 必須項目のチェック
    if (!gender || !age || !bmi || !careLevel || !daysFromOnset) {
      alert('個人情報をすべて入力してください。');
      return false;
    }

    // 数値のチェック
    if (isNaN(age) || age <= 0 || age > 120) {
      alert('年齢は0〜120の範囲で入力してください。');
      return false;
    }

    if (isNaN(bmi) || bmi <= 0 || bmi > 100) {
      alert('BMIは0より大きい値を入力してください。');
      return false;
    }

    if (isNaN(daysFromOnset) || daysFromOnset < 0) {
      alert('発症から入棟までの日数は0以上の値を入力してください。');
      return false;
    }

    // FIM値のチェック
    const allMotionValues = Object.values(motionValues);
    const allCognitiveValues = Object.values(cognitiveValues);

    const hasEmptyMotion = allMotionValues.some((val) => !val || val === '');
    const hasEmptyCognitive = allCognitiveValues.some(
      (val) => !val || val === ''
    );

    if (hasEmptyMotion) {
      alert('運動機能項目をすべて入力してください。');
      return false;
    }

    if (hasEmptyCognitive) {
      alert('認知機能項目をすべて入力してください。');
      return false;
    }

    // FIM値の範囲チェック（1〜7）
    const invalidMotion = allMotionValues.some((val) => {
      const num = parseFloat(val);
      return isNaN(num) || num < 1 || num > 7;
    });

    const invalidCognitive = allCognitiveValues.some((val) => {
      const num = parseFloat(val);
      return isNaN(num) || num < 1 || num > 7;
    });

    if (invalidMotion) {
      alert('運動機能項目は1〜7の範囲で入力してください。');
      return false;
    }

    if (invalidCognitive) {
      alert('認知機能項目は1〜7の範囲で入力してください。');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // バリデーション
    if (!validateInput()) {
      return;
    }

    setIsLoading(true);
    try {
      // 入力データを準備
      const inputData = {
        gender,
        age: parseFloat(age),
        bmi: parseFloat(bmi),
        careLevel,
        daysFromOnset: parseFloat(daysFromOnset),
        motionValues: Object.fromEntries(
          Object.entries(motionValues).map(([key, val]) => [
            key,
            parseFloat(val),
          ])
        ),
        cognitiveValues: Object.fromEntries(
          Object.entries(cognitiveValues).map(([key, val]) => [
            key,
            parseFloat(val),
          ])
        ),
      };

      // APIから予測値を取得
      // API_BASE_URLが相対パス（/api）の場合と完全なURLの場合を考慮
      let apiUrl;
      if (API_BASE_URL.startsWith('/')) {
        // 相対パスの場合（開発環境、Viteプロキシ使用）
        apiUrl = `${API_BASE_URL}/predict`;
      } else {
        // 完全なURLの場合（本番環境）
        // API_BASE_URLに既に/apiが含まれているかチェック
        const baseUrl = API_BASE_URL.endsWith('/api')
          ? API_BASE_URL
          : `${API_BASE_URL}/api`;
        apiUrl = `${baseUrl}/predict`;
      }
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inputData),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const prediction = await response.json();

      if (prediction) {
        // 結果をstateに保存して結果ページに遷移
        const resultData = {
          admissionValues: {
            motionValues,
            cognitiveValues,
          },
          predictionValues: prediction,
        };

        // sessionStorageに保存
        sessionStorage.setItem('resultData', JSON.stringify(resultData));

        // 結果ページに遷移
        navigate('/result');
      } else {
        alert('予測値の計算に失敗しました。データを確認してください。');
      }
    } catch (error) {
      console.error('エラー:', error);
      let errorMessage = 'エラーが発生しました。';

      if (
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError')
      ) {
        errorMessage =
          'サーバーに接続できません。サーバーが起動しているか確認してください。';
      } else if (error.message.includes('API error')) {
        errorMessage =
          'サーバーエラーが発生しました。入力データを確認してください。';
      }

      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='app-root app-root--pc'>
      <div className='app-card'>
        <header className='app-header'>
          <h1>FIM予測システム</h1>
          <p className='app-subtitle'>退院時FIM値を予測します</p>
        </header>

        <form className='app-form' onSubmit={handleSubmit}>
          <PersonalInfoSection
            gender={gender}
            setGender={setGender}
            age={age}
            setAge={setAge}
            bmi={bmi}
            setBmi={setBmi}
            careLevel={careLevel}
            setCareLevel={setCareLevel}
            daysFromOnset={daysFromOnset}
            setDaysFromOnset={setDaysFromOnset}
          />

          <ScaleSection
            title='運動機能項目'
            description='各項目を 1〜7 の数値で評価してください。'
            items={motionItems}
            values={motionValues}
            onChange={(label, value) =>
              handleSelectChange('motion', label, value)
            }
          />

          <ScaleSection
            title='認知機能項目'
            description='各項目を 1〜7 の数値で評価してください。'
            items={cognitiveItems}
            values={cognitiveValues}
            onChange={(label, value) =>
              handleSelectChange('cognitive', label, value)
            }
          />

          <div className='form-footer'>
            <button
              type='submit'
              className='primary-button'
              disabled={isLoading}
            >
              {isLoading ? '計算中...' : '計測する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormPage;
