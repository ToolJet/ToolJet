import React from 'react';
import Card from '@mui/material/Card';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import Typography from '@mui/material/Typography';
import { Box } from '@mui/system';
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
  const { primaryLabelColour, primaryTextColour, secondaryLabelColour, secondaryTextColour, visibility, boxShadow } =
    styles;

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
    boxShadow,
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
    margin: '0',
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
    <React.Fragment>
      <Card
        style={baseStyle}
        data-cy={dataCy}
      >
        {loadingState === true ? (
          <Card style={{ width }}>
            <center>
              <div
                style={baseStyle}
                role="status"
              ></div>
            </center>
          </Card>
        ) : (
          <Box>
            <Typography
              style={{
                ...letterStyle,
                ...marginStyle,
                color: primaryLabelColour !== '#8092AB' ? primaryLabelColour : darkMode && '#FFFFFC',
              }}
            >
              {primaryValueLabel}
            </Typography>
            <Typography
              component="h2"
              style={primaryStyle}
            >
              {primaryValue}
            </Typography>
            {hideSecondary ? (
              ''
            ) : (
              <Box>
                <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {secondarySignDisplay !== 'negative' ? (
                    <TrendingUpIcon
                      color="success"
                      style={{ ...marginStyle }}
                    />
                  ) : (
                    <TrendingDownIcon
                      color="error"
                      style={{ ...marginStyle }}
                    />
                  )}
                  <Typography style={{ ...secondaryContainerStyle, marging: '0px' }}>{secondaryValue}</Typography>
                </Box>
                <Typography
                  style={{
                    ...letterStyle,
                    color: secondaryLabelColour !== '#8092AB' ? secondaryLabelColour : darkMode && '#FFFFFC',
                    padding: '6px 20px 12px 20px ',
                    marginBottom: '0px',
                  }}
                >
                  {secondaryValueLabel}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Card>
    </React.Fragment>
  );
};
