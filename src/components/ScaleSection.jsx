import React from 'react';

const ScaleSection = ({ title, description, items, values, onChange }) => {
  const scaleOptions = [1, 2, 3, 4, 5, 6, 7];

  return (
    <section className='form-section'>
      <h2 className='section-title'>{title}</h2>
      {description && <p className='section-description'>{description}</p>}

      {items.map((label) => (
        <div className='form-row' key={label}>
          <label className='form-label'>{label}</label>
          <div className='input-wrapper select-wrapper'>
            <select
              value={values[label]}
              onChange={(e) => onChange(label, e.target.value)}
              required
              className={!values[label] ? 'is-empty' : ''}
            >
              <option value=''>選択</option>
              {scaleOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span className='select-icon'>▼</span>
          </div>
        </div>
      ))}
    </section>
  );
};

export default ScaleSection;
