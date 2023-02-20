import React from 'react';

export const Alert = ({ children, svg, cls = '' }) => {
  return (
    <Alert.Container cls={cls}>
      <div className="d-flex">
        {svg && (
          <span>
            <img src={`assets/images/icons/${svg}.svg`} alt="alert" />
          </span>
        )}
        <Alert.Message>{children}</Alert.Message>
      </div>
    </Alert.Container>
  );
};

const Container = ({ children, cls = '' }) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  return <div className={`alert alert-component ${darkMode && 'dark'} ${cls}`}>{children}</div>;
};

const Message = ({ children }) => {
  return (
    <div data-cy={`alert-info-text`} style={{ fontWeight: 400 }} className="mx-2">
      {children}
    </div>
  );
};

Alert.Container = Container;
Alert.Message = Message;
