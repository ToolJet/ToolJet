import React from 'react';

function OnBordingCard({ cardData }) {
  return (
    <div className="onboarding-card-wrapper">
      <div className="onboarding-icon-wrapper">
        <img src={`/assets/images/${cardData.icon}.svg`} alt="" />
      </div>
      <div className="onboarding-card-details">
        <p>{cardData?.description}</p>
        <a href={`${cardData.link}`} target="_blank" rel="noreferrer">
          <div className="onboarding-navigation-wrapper">
            <h3>{cardData?.title}</h3>
            <img src="/assets/images/navigate.svg" alt="" />
          </div>
        </a>
      </div>
    </div>
  );
}

export default OnBordingCard;
