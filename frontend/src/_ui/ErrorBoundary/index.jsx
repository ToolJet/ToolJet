import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import * as Sentry from '@sentry/react';
import { recordWidgetError, recordJsError } from '@/_services/frontend-metrics.service';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this._handleError = this._handleError.bind(this);
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  // Sentry.ErrorBoundary is the nearest error boundary to children, so React's
  // componentDidCatch on this outer class never fires — Sentry catches it first.
  // Use Sentry's onError prop instead, which is called after Sentry records the event.
  _handleError(error, componentStack) {
    if (this.props.widgetType) {
      recordWidgetError(this.props.widgetType, error?.message);
    } else {
      recordJsError(error?.message, componentStack);
    }
  }

  render() {
    return (
      <Sentry.ErrorBoundary
        fallback={<h2>{this.props.t('errorBoundary', 'Something went wrong.')}</h2>}
        onError={this._handleError}
      >
        {this.props.children}
      </Sentry.ErrorBoundary>
    );
  }
}

export default withTranslation()(ErrorBoundary);
