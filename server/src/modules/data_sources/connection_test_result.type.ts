export type ConnectionTestResult = {
  status: 'ok' | 'failed';
  message?: string;
  data?: object;
};
