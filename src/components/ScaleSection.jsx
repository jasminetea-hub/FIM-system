import React from 'react';

const ScaleSection = ({ title, description, items, values, onChange }) => {
  const handleSliderChange = (label, value) => {
    onChange(label, value.toString());
  };

  return (
    <section className='form-section'>
      <h2 className='section-title'>{title}</h2>
      {description && <p className='section-description'>{description}</p>}

      {items.map((label) => {
        const currentValue = values[label] ? parseInt(values[label], 10) : 1;
        return (
          <div className='form-row slider-row' key={label}>
            <label className='form-label'>{label}</label>
            <div className='slider-container'>
              <div className='slider-wrapper'>
                <input
                  type='range'
                  min='1'
                  max='7'
                  step='1'
                  value={currentValue}
                  onChange={(e) => handleSliderChange(label, e.target.value)}
                  className='range-slider'
                />
                <span className='slider-value'>{currentValue}</span>
              </div>
              <div className='slider-marks'>
                {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                  // 値1から値7まで均等に配置
                  // スライダーのthumbの中心位置に合わせる
                  // どの端末でも正確に一致するように、固定値を使用
                  const positionPercent = ((num - 1) / 6) * 100;
                  // スライダーの左端から12px（thumb半径 + 微調整）の位置から始まり、
                  // 右端から12pxの位置で終わる領域で均等に配置
                  // 実際のトラック幅: 100% - 24px (左右12pxずつ)
                  // 固定値を使用して、どの端末でも正確に一致
                  return (
                    <span
                      key={num}
                      className='slider-mark'
                      style={{
                        left: `calc(12px + (100% - 24px) * ${positionPercent} / 100)`,
                      }}
                    >
                      {num}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
};

export default ScaleSection;
