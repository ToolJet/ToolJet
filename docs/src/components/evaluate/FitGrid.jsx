import React from 'react';
import './evaluate.css';

export function FitGrid({ good, notGood }) {
  return (
    <div className="eval-fit-grid">
      <div className="eval-fit-col eval-fit-col--yes">
        <div className="eval-fit-header">Good fit</div>
        <ul className="eval-fit-list">
          {good.map((item, i) => (
            <li key={i} className="eval-fit-item eval-fit-item--yes">{item}</li>
          ))}
        </ul>
      </div>
      <div className="eval-fit-col eval-fit-col--no">
        <div className="eval-fit-header">Look elsewhere when</div>
        <ul className="eval-fit-list">
          {notGood.map((item, i) => (
            <li key={i} className="eval-fit-item eval-fit-item--no">{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
