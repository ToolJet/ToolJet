import React from 'react';
export const Statistics = function Statistics({ height, properties, styles, darkMode }) {
  const { primaryValueLabel, primaryValue, secondaryValueLabel, secondaryValue, secondarySignDisplay } = properties;
  const { primaryLabelColour, primaryTextColour, secondaryLabelColour, secondaryTextColour } = styles;

  const baseStyle = {
    borderRadius: 4,
    height,
    backgroundColor: darkMode ? '#47505D' : '#ffffff',
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    margin: '0px auto',
    minWidth: '196px',
    border: ' 0.75px solid #A6B6CC',
    fontFamily: 'Inter',
    justifyContent: 'center',
  };

  const letterStyle = {
    fontSize: '14px',
    marginTop: '12px',
    fontWeight: '500',
  };

  const priceStyle = {
    fontSize: '34px',
    color: darkMode ? '#FFFFFC' : primaryTextColour,
    fontWeight: '700',
    marginBottom: '0px',
  };

  const marginStyle = {
    marginBottom: '0px',
  };

  const secondaryContainerStyle = {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: ' center',
    padding: '5px 8px',
    width: '61px',
    height: '24px',
    background:
      secondarySignDisplay !== 'negative' ? (darkMode ? '#206953' : '#EDFFF9') : darkMode ? '#F8ABB8' : '#FDEAED',
    borderRadius: '58px',
    color:
      secondaryTextColour !== '#36AF8B'
        ? secondaryTextColour
        : secondarySignDisplay !== 'negative'
        ? '#36AF8B'
        : '#EE2C4D',
    fontWeight: '700',
  };

  return (
    <div style={baseStyle}>
      <p
        style={{
          ...letterStyle,
          ...marginStyle,
          color: darkMode ? '#FFFFFC' : primaryLabelColour,
        }}
      >
        {primaryValueLabel}
      </p>
      <h2 style={priceStyle}>{primaryValue}</h2>
      <div>
        <div className="d-flex flex-row">
          {secondarySignDisplay !== 'negative' ? (
            <img src="/assets/images/icons/widgets/upstatistics.svg" style={{ ...marginStyle, marginRight: '6.5px' }} />
          ) : (
            <img
              src="/assets/images/icons/widgets/downstatistics.svg"
              style={{ ...marginStyle, marginRight: '6.5px' }}
            />
          )}
          <p style={{ ...marginStyle, ...secondaryContainerStyle }}>{secondaryValue}</p>
        </div>
        <p
          style={{
            ...letterStyle,
            color: darkMode ? '#FFFFFC' : secondaryLabelColour,
            marginBottom: '12px',
          }}
        >
          {secondaryValueLabel}
        </p>
      </div>
    </div>
  );
};
