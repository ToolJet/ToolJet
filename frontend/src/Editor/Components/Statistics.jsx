import React from 'react';
export const Statistics = function Statistics({ width, height, properties, styles, darkMode, dataCy }) {
  const {
    primaryValueLabel,
    primaryValue,
    secondaryValueLabel,
    secondaryValue,
    secondarySignDisplay,
    hideSecondary,
    loadingState,
  } = properties;
  const { primaryLabelColour, primaryTextColour, secondaryLabelColour, secondaryTextColour, visibility } = styles;

  const baseStyle = {
    borderRadius: 4,
    backgroundColor: darkMode ? '#47505D' : '#ffffff',
    alignItems: 'center',
    flexDirection: 'column',
    margin: '0px auto',
    border: darkMode ? ' 0.75px solid #232A35' : ' 0.75px solid #A6B6CC',
    fontFamily: 'Inter',
    justifyContent: 'center',
    display: visibility ? 'flex' : 'none',
    wordBreak: 'break-all',
    textAlign: 'center',
    overflow: 'hidden',
    height,
  };

  const letterStyle = {
    fontSize: '14px',
    fontWeight: '500',
    wordBreak: 'break-all',
    padding: '12px 20px 0px 20px ',
  };

  const primaryStyle = {
    fontSize: '34px',
    color: primaryTextColour !== '#000000' ? primaryTextColour : darkMode && '#FFFFFC',
    fontWeight: '700',
    marginBottom: '0px',
    wordBreak: 'break-all',
    padding: '0 10px',
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
    margin: '14px 20px 0px 0px ',
    minWidth: '61px',
    wordBreak: 'break-all',
    minHeight: '24px',
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
    <div style={baseStyle} data-cy={dataCy}>
      {loadingState === true ? (
        <div style={{ width }} className="p-2">
          <center>
            <div className="spinner-border" role="status"></div>
          </center>
        </div>
      ) : (
        <>
          <p
            style={{
              ...letterStyle,
              ...marginStyle,
              color: primaryLabelColour !== '#8092AB' ? primaryLabelColour : darkMode && '#FFFFFC',
            }}
          >
            {primaryValueLabel}
          </p>
          <h2 style={primaryStyle}>{primaryValue}</h2>
          {hideSecondary ? (
            ''
          ) : (
            <div>
              <div className="d-flex flex-row justify-content-center align-items-baseline">
                {secondarySignDisplay !== 'negative' ? (
                  <img
                    src="assets/images/icons/widgets/upstatistics.svg"
                    style={{ ...marginStyle, marginRight: '6.5px' }}
                  />
                ) : (
                  <img
                    src="assets/images/icons/widgets/downstatistics.svg"
                    style={{ ...marginStyle, marginRight: '6.5px' }}
                  />
                )}
                <p style={{ ...secondaryContainerStyle }}>{secondaryValue}</p>
              </div>
              <p
                style={{
                  ...letterStyle,
                  color: secondaryLabelColour !== '#8092AB' ? secondaryLabelColour : darkMode && '#FFFFFC',
                  padding: '6px 20px 12px 20px ',
                  marginBottom: '0px',
                }}
              >
                {secondaryValueLabel}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
