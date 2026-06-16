/**
 * Component tests for ErrorBoundary/index.jsx
 *
 * Key design: Sentry.ErrorBoundary is the nearest error boundary to children,
 * so our metric recording is wired via Sentry's `onError` prop (not componentDidCatch).
 * The Sentry mock below mimics that behavior — it IS a real error boundary that
 * calls `onError` when a descendant throws.
 *
 * Run: npm test -- ErrorBoundary.test
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render } from '@testing-library/react';

// ── Mocks ──────────────────────────────────────────────────────────────────────

jest.mock('@/_services/frontend-metrics.service', () => ({
  recordWidgetError: jest.fn(),
  recordJsError: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  withTranslation: () => (WrappedComponent) => {
    const WithT = (props) => <WrappedComponent {...props} t={(key, fallback) => fallback || key} />;
    WithT.displayName = `withTranslation(${WrappedComponent.displayName || WrappedComponent.name})`;
    return WithT;
  },
}));

/**
 * Sentry mock that IS a real error boundary and calls `onError` when children throw.
 * This mirrors Sentry.ErrorBoundary's actual behavior so our onError wiring is tested.
 */
jest.mock('@sentry/react', () => {
  const React = require('react');

  class MockSentryBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
      return { hasError: true };
    }

    componentDidCatch(error, { componentStack }) {
      if (typeof this.props.onError === 'function') {
        this.props.onError(error, componentStack);
      }
    }

    render() {
      if (this.state.hasError) {
        return this.props.fallback || null;
      }
      return this.props.children;
    }
  }

  return { ErrorBoundary: MockSentryBoundary };
});

// ── Imports (after mocks) ─────────────────────────────────────────────────────

import ErrorBoundary from '../index.jsx';
import { recordWidgetError, recordJsError } from '@/_services/frontend-metrics.service';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Component that throws during render */
const Bomb = ({ message = 'render explosion' }) => {
  throw new Error(message);
};

/** Suppress React's console.error noise for expected error boundary tests */
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.clearAllMocks();
  console.error.mockRestore();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ErrorBoundary — metric wiring', () => {
  test('widget crash calls recordWidgetError with correct type and message', () => {
    render(
      <ErrorBoundary widgetType="Table">
        <Bomb message="cannot read property data of undefined" />
      </ErrorBoundary>
    );

    expect(recordWidgetError).toHaveBeenCalledTimes(1);
    expect(recordWidgetError).toHaveBeenCalledWith('Table', 'cannot read property data of undefined');
    expect(recordJsError).not.toHaveBeenCalled();
  });

  test('non-widget crash calls recordJsError with message and component stack', () => {
    render(
      <ErrorBoundary>
        <Bomb message="unexpected null reference" />
      </ErrorBoundary>
    );

    expect(recordJsError).toHaveBeenCalledTimes(1);
    const [msg, stack] = recordJsError.mock.calls[0];
    expect(msg).toBe('unexpected null reference');
    expect(typeof stack).toBe('string'); // componentStack is a string
    expect(recordWidgetError).not.toHaveBeenCalled();
  });

  test('normal render (no error) does not call any metric function', () => {
    render(
      <ErrorBoundary widgetType="Button">
        <span>all good</span>
      </ErrorBoundary>
    );

    expect(recordWidgetError).not.toHaveBeenCalled();
    expect(recordJsError).not.toHaveBeenCalled();
  });

  test('different widget types produce separate recordWidgetError calls', () => {
    render(
      <ErrorBoundary widgetType="Chart">
        <Bomb message="chart data format invalid" />
      </ErrorBoundary>
    );

    render(
      <ErrorBoundary widgetType="DropdownV2">
        <Bomb message="option list undefined" />
      </ErrorBoundary>
    );

    expect(recordWidgetError).toHaveBeenCalledTimes(2);
    expect(recordWidgetError).toHaveBeenNthCalledWith(1, 'Chart', 'chart data format invalid');
    expect(recordWidgetError).toHaveBeenNthCalledWith(2, 'DropdownV2', 'option list undefined');
  });

  test('shows fallback UI when a child throws', () => {
    const { getByText } = render(
      <ErrorBoundary widgetType="Table">
        <Bomb />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong.')).toBeInTheDocument();
  });
});
