import { metrics } from '@opentelemetry/api';

// Simple test to ensure connection pool metrics are working
export const testConnectionPoolMetrics = () => {
  console.log('Testing connection pool metrics...');
  
  const meter = metrics.getMeter('tooljet-database', '1.0.0');
  
  // Create a simple counter to test if metrics are being sent
  const testCounter = meter.createCounter('test_connection_pool_metric', {
    description: 'Test metric to verify connection pool metrics are working',
  });
  
  // Create a simple gauge to test observable metrics
  const testGauge = meter.createObservableGauge('test_connection_pool_gauge', {
    description: 'Test gauge to verify observable metrics are working',
  });
  
  testGauge.addCallback((observableResult: any) => {
    console.log('Test gauge callback called');
    observableResult.observe(42, { test: 'value' });
  });
  
  // Increment counter
  testCounter.add(1, { test: 'metric' });
  
  console.log('Test metrics created and incremented');
};