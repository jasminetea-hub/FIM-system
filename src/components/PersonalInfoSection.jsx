import React from "react";

const PersonalInfoSection = ({ 
  gender, 
  setGender, 
  age, 
  setAge, 
  bmi, 
  setBmi,
  careLevel,
  setCareLevel,
  daysFromOnset,
  setDaysFromOnset
}) => {
  return (
    <section className="form-section">
      <h2 className="section-title">個人情報入力</h2>

      <div className="form-row">
        <label className="form-label">性別</label>
        <div className="input-wrapper select-wrapper">
          <select 
            value={gender} 
            onChange={(e) => setGender(e.target.value)} 
            required
            className={!gender ? 'is-empty' : ''}
          >
            <option value="">選択</option>
            <option value="male">男性</option>
            <option value="female">女性</option>
          </select>
          <span className="select-icon">▼</span>
        </div>
      </div>

      <div className="form-row">
        <label className="form-label">年齢</label>
        <div className="input-wrapper">
          <input
            type="number"
            min="0"
            max="120"
            inputMode="numeric"
            placeholder="数値を入力"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <label className="form-label">入院時BMI</label>
        <div className="input-wrapper">
          <input
            type="number"
            step="0.1"
            min="0"
            inputMode="decimal"
            placeholder="数値を入力"
            value={bmi}
            onChange={(e) => setBmi(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <label className="form-label">入院時要介護度の有無</label>
        <div className="input-wrapper select-wrapper">
          <select 
            value={careLevel} 
            onChange={(e) => setCareLevel(e.target.value)} 
            required
            className={!careLevel ? 'is-empty' : ''}
          >
            <option value="">選択</option>
            <option value="yes">有</option>
            <option value="no">無</option>
          </select>
          <span className="select-icon">▼</span>
        </div>
      </div>

      <div className="form-row">
        <label className="form-label">発症から入棟までの日</label>
        <div className="input-wrapper">
          <input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="数値を入力"
            value={daysFromOnset}
            onChange={(e) => setDaysFromOnset(e.target.value)}
            required
          />
        </div>
      </div>
    </section>
  );
};

export default PersonalInfoSection;


