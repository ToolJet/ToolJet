/** Retry flaky tests once — handles transient GC-induced socket hang ups. */
jest.retryTimes(1, { logErrorsBeforeRetry: true });
