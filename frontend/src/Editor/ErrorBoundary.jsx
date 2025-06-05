import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import * as Sentry from '@sentry/react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  // eslint-disable-next-line no-unused-vars
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    alert(
      `An error occurred: ${JSON.stringify(error)} and the error info is ${JSON.stringify(JSON.stringify(errorInfo))}`
    );
    console.log('error--- 2---  ', error, errorInfo);
  }

  render() {
    return (
      <Sentry.ErrorBoundary fallback={<h2>{this.props.t('errorBoundary', 'Something went wrong.')}</h2>}>
        {this.props.children}
      </Sentry.ErrorBoundary>
    );
  }
}

export default withTranslation()(ErrorBoundary);
