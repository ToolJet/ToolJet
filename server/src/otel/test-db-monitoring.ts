#!/usr/bin/env node

/**
 * Test script for database monitoring
 * Run this to verify that database observability is working correctly
 * 
 * Usage: npm run test:db-monitoring
 */

import { startOpenTelemetry } from './tracing';
import { databaseMonitoring } from './database-monitoring';
import { DataSource } from 'typeorm';
import { ormconfig } from '../../ormconfig';

async function testDatabaseMonitoring() {
  console.log('🚀 Starting database monitoring test...\n');

  try {
    // Initialize OTEL
    console.log('1. Initializing OpenTelemetry...');
    await startOpenTelemetry();
    console.log('   ✅ OpenTelemetry initialized\n');

    // Initialize database connection
    console.log('2. Connecting to database...');
    const dataSource = new DataSource(ormconfig as any);
    await dataSource.initialize();
    console.log('   ✅ Database connected\n');

    // Initialize monitoring
    console.log('3. Setting up database monitoring...');
    databaseMonitoring.setDataSource(dataSource);
    console.log('   ✅ Database monitoring initialized\n');

    // Test basic health check
    console.log('4. Testing health check...');
    const health = await databaseMonitoring.isHealthy();
    console.log('   Health status:', health.healthy ? '✅ Healthy' : '❌ Unhealthy');
    if (health.stats) {
      console.log('   Connection pool:', health.stats);
    }
    if (health.error) {
      console.log('   Error:', health.error);
    }
    console.log();

    // Test various query types to generate traces
    console.log('5. Executing test queries to generate traces...');
    
    // SELECT query
    console.log('   - Testing SELECT query...');
    await dataSource.query('SELECT 1 as test_number, NOW() as current_time');
    
    // Test a slow query (if you want to test slow query detection)
    if (process.env.TEST_SLOW_QUERIES === 'true') {
      console.log('   - Testing slow query (pg_sleep)...');
      await dataSource.query('SELECT pg_sleep(2)');
    }
    
    // Table existence check
    console.log('   - Testing table query...');
    await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      LIMIT 5
    `);
    
    console.log('   ✅ Test queries executed\n');

    // Display current connection stats
    console.log('6. Current connection pool statistics:');
    const currentStats = databaseMonitoring.getCurrentStats();
    if (currentStats) {
      console.log('   Total connections:', currentStats.totalConnections);
      console.log('   Active connections:', currentStats.activeConnections);
      console.log('   Idle connections:', currentStats.idleConnections);
      console.log('   Waiting clients:', currentStats.waitingClients);
      console.log('   Utilization:', `${((currentStats.activeConnections / currentStats.totalConnections) * 100).toFixed(1)}%`);
    } else {
      console.log('   ⚠️  Connection pool stats not available');
    }
    console.log();

    // Wait a moment for metrics to be collected
    console.log('7. Waiting for metrics collection...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('   ✅ Metrics collected\n');

    console.log('🎉 Database monitoring test completed successfully!');
    console.log('\n📊 Check your OTEL collector/dashboard for:');
    console.log('   - Database query traces with enhanced attributes');
    console.log('   - Query duration histograms');
    console.log('   - Slow query counters');
    console.log('   - Connection pool metrics');
    console.log('   - Custom database attributes (operation, tables, etc.)');

    // Cleanup
    await dataSource.destroy();
    databaseMonitoring.stopMonitoring();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run test if called directly
if (require.main === module) {
  testDatabaseMonitoring()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export { testDatabaseMonitoring };
