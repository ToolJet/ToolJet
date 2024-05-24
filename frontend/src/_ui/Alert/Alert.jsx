import React from 'react';

export const Alert = ({
  children,
  svg,
  cls = '',
  imgHeight = null,
  imgWidth = null,
  useDarkMode = true,
  iconCls,
  placeSvgTop = false,
}) => {
  const imgStyles = imgHeight && imgWidth ? { height: imgHeight, width: imgWidth } : {};
  const darkMode = useDarkMode ? localStorage.getItem('darkMode') === 'true' : false;
  return (
    <Alert.Container cls={cls} useDarkMode={darkMode}>
      <div className={`d-flex ${iconCls ? iconCls : 'align-items-center '}`}>
        {svg && (
          <span className={`${placeSvgTop ? 'align-self-start' : ''}`}>
            <img style={imgStyles} src={`assets/images/icons/${svg}.svg`} alt="alert" />
          </span>
        )}
        <Alert.Message>{children}</Alert.Message>
      </div>
    </Alert.Container>
  );
};

const Container = ({ children, cls = '', useDarkMode }) => {
  return <div className={`alert alert-component ${useDarkMode && 'dark'} ${cls}`}>{children}</div>;
};

const Message = ({ children }) => {
  return (
    <div
      data-cy={`alert-info-text`}
      style={{
        fontWeight: 400,
        width: '100%',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
        display: 'block',
      }}
      className="mx-2"
    >
      {children}
    </div>
  );
};

Alert.Container = Container;
Alert.Message = Message;
