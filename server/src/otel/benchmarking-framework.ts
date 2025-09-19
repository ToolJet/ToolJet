import { metrics, trace, context } from '@opentelemetry/api';
import { performance } from 'perf_hooks';

/**
 * Benchmarking Framework for ToolJet Release Performance Comparison
 *
 * Comprehensive benchmarking system to track API performance across releases:
 * - Release-to-release performance comparison
 * - App builder/viewer specific performance tracking
 * - Performance regression detection
 * - Statistical analysis of performance changes
 * - Automated performance alerts
 *
 * Team lead requirement: "each release we have to compare API performances - mainly app builder/viewer APIs"
 */

// === BENCHMARKING METRICS ===
let benchmarkDurationHistogram: any;
let benchmarkComparisonCounter: any;
let benchmarkRegressionCounter: any;
let benchmarkPerformanceGauge: any;
let benchmarkTrendAnalysis: any;

// === BENCHMARK DATA STRUCTURES ===
interface BenchmarkMeasurement {
  measurementId: string;
  timestamp: number;
  releaseVersion: string;
  endpoint: string;
  method: string;
  organizationId: string;
  appId?: string;
  userId?: string;
  performanceMetrics: {
    totalDuration: number;
    dbDuration: number;
    externalDuration: number;
    businessLogicDuration: number;
    memoryUsage: number;
    cpuUsage: number;
    dbQueryCount: number;
    statusCode: number;
    responseSize: number;
  };
  contextMetrics: {
    isAppBuilderViewer: boolean;
    operationType: string;
    dataComplexity: number;
    userLoad: number;
    concurrentRequests: number;
  };
}

interface BenchmarkSuite {
  suiteId: string;
  name: string;
  releaseVersion: string;
  createdAt: number;
  measurements: BenchmarkMeasurement[];
  metadata: {
    environment: string;
    testDataSize: number;
    loadProfile: string;
    configuration: Record<string, any>;
  };
}

interface PerformanceComparison {
  currentRelease: string;
  previousRelease: string;
  endpoint: string;
  method: string;
  comparison: {
    avgDurationChange: number;
    p95DurationChange: number;
    p99DurationChange: number;
    throughputChange: number;
    errorRateChange: number;
    memoryUsageChange: number;
  };
  significance: 'improvement' | 'regression' | 'neutral';
  confidenceLevel: number;
}

// === DATA STORAGE ===
const benchmarkSuites = new Map<string, BenchmarkSuite>();
const performanceBaselines = new Map<string, BenchmarkMeasurement[]>();
const regressionThresholds = new Map<string, { duration: number; throughput: number; errorRate: number }>();
const recentComparisons = new Map<string, PerformanceComparison[]>();

export const initializeBenchmarkingFramework = () => {
  const meter = metrics.getMeter('tooljet-benchmarking', '1.0.0');

  benchmarkDurationHistogram = meter.createHistogram('tooljet.benchmark.duration', {
    description: 'Duration measurements for benchmark comparisons',
    unit: 's',
  });

  benchmarkComparisonCounter = meter.createCounter('tooljet.benchmark.comparison.total', {
    description: 'Number of benchmark comparisons performed',
  });

  benchmarkRegressionCounter = meter.createCounter('tooljet.benchmark.regression.detected', {
    description: 'Number of performance regressions detected',
  });

  benchmarkPerformanceGauge = meter.createObservableGauge('tooljet.benchmark.performance.score', {
    description: 'Overall performance score for current release',
  });

  benchmarkTrendAnalysis = meter.createHistogram('tooljet.benchmark.trend.coefficient', {
    description: 'Performance trend analysis coefficient',
  });

  // Setup observable gauge callback
  setupBenchmarkGaugeCallbacks();

  console.log('[ToolJet Benchmarking] Framework initialized');
};

// === BENCHMARK MEASUREMENT RECORDING ===

export const recordBenchmarkMeasurement = (
  releaseVersion: string,
  endpoint: string,
  method: string,
  organizationId: string,
  performanceMetrics: BenchmarkMeasurement['performanceMetrics'],
  contextMetrics: BenchmarkMeasurement['contextMetrics'],
  appId?: string,
  userId?: string
): string => {
  const measurementId = generateMeasurementId();
  const timestamp = Date.now();

  const measurement: BenchmarkMeasurement = {
    measurementId,
    timestamp,
    releaseVersion,
    endpoint,
    method,
    organizationId,
    appId,
    userId,
    performanceMetrics,
    contextMetrics,
  };

  // Store in appropriate benchmark suite
  const suiteKey = `${releaseVersion}:${endpoint}:${method}`;
  let suite = benchmarkSuites.get(suiteKey);

  if (!suite) {
    suite = {
      suiteId: generateSuiteId(),
      name: `${endpoint} ${method} - ${releaseVersion}`,
      releaseVersion,
      createdAt: timestamp,
      measurements: [],
      metadata: {
        environment: process.env.NODE_ENV || 'development',
        testDataSize: 0,
        loadProfile: 'production',
        configuration: {},
      },
    };
    benchmarkSuites.set(suiteKey, suite);
  }

  suite.measurements.push(measurement);

  // Keep only last 10000 measurements per suite to prevent memory issues
  if (suite.measurements.length > 10000) {
    suite.measurements = suite.measurements.slice(-10000);
  }

  // Record metrics
  if (benchmarkDurationHistogram) {
    benchmarkDurationHistogram.record(performanceMetrics.totalDuration, {
      'tooljet.release.version': releaseVersion,
      'http.route': endpoint,
      'http.method': method,
      'tooljet.benchmark.type': contextMetrics.isAppBuilderViewer ? 'app_builder_viewer' : 'general_api',
      'tooljet.organization.id': organizationId,
    });
  }

  console.log(`[ToolJet Benchmarking] Recorded measurement:`, {
    measurementId,
    releaseVersion,
    endpoint,
    method,
    duration: `${performanceMetrics.totalDuration.toFixed(3)}s`,
    isAppBuilderViewer: contextMetrics.isAppBuilderViewer,
    organizationId
  });

  return measurementId;
};

// === PERFORMANCE COMPARISON ===

export const compareReleasePerformance = (
  currentRelease: string,
  previousRelease: string,
  endpoint?: string,
  method?: string
): PerformanceComparison[] => {
  const comparisons: PerformanceComparison[] = [];
  const comparisonKey = `${currentRelease}:${previousRelease}`;

  // Get measurements for both releases
  const currentMeasurements = getMeasurementsForRelease(currentRelease, endpoint, method);
  const previousMeasurements = getMeasurementsForRelease(previousRelease, endpoint, method);

  // Group by endpoint/method combination
  const endpointGroups = new Map<string, { current: BenchmarkMeasurement[]; previous: BenchmarkMeasurement[] }>();

  currentMeasurements.forEach(m => {
    const key = `${m.endpoint}:${m.method}`;
    if (!endpointGroups.has(key)) {
      endpointGroups.set(key, { current: [], previous: [] });
    }
    endpointGroups.get(key)!.current.push(m);
  });

  previousMeasurements.forEach(m => {
    const key = `${m.endpoint}:${m.method}`;
    if (!endpointGroups.has(key)) {
      endpointGroups.set(key, { current: [], previous: [] });
    }
    endpointGroups.get(key)!.previous.push(m);
  });

  // Perform statistical comparison for each endpoint group
  for (const [endpointKey, measurements] of Array.from(endpointGroups.entries())) {
    if (measurements.current.length === 0 || measurements.previous.length === 0) continue;

    const [endpointPath, httpMethod] = endpointKey.split(':');
    const comparison = performStatisticalComparison(
      measurements.current,
      measurements.previous,
      currentRelease,
      previousRelease,
      endpointPath,
      httpMethod
    );

    comparisons.push(comparison);

    // Record comparison metric
    if (benchmarkComparisonCounter) {
      benchmarkComparisonCounter.add(1, {
        'tooljet.release.current': currentRelease,
        'tooljet.release.previous': previousRelease,
        'http.route': endpointPath,
        'http.method': httpMethod,
        'tooljet.comparison.significance': comparison.significance,
      });
    }

    // Record regression if detected
    if (comparison.significance === 'regression' && benchmarkRegressionCounter) {
      benchmarkRegressionCounter.add(1, {
        'tooljet.release.current': currentRelease,
        'http.route': endpointPath,
        'http.method': httpMethod,
        'tooljet.regression.type': Math.abs(comparison.comparison.avgDurationChange) > 20 ? 'severe' : 'moderate',
      });
    }
  }

  // Store comparison results
  recentComparisons.set(comparisonKey, comparisons);

  console.log(`[ToolJet Benchmarking] Completed comparison:`, {
    currentRelease,
    previousRelease,
    comparisons: comparisons.length,
    regressions: comparisons.filter(c => c.significance === 'regression').length,
    improvements: comparisons.filter(c => c.significance === 'improvement').length,
  });

  return comparisons;
};

// === APP BUILDER/VIEWER SPECIFIC ANALYSIS ===

export const analyzeAppBuilderViewerPerformance = (
  releaseVersion: string,
  timeWindow: number = 24 * 60 * 60 * 1000 // 24 hours
) => {
  const cutoffTime = Date.now() - timeWindow;
  const appBuilderViewerMeasurements = [];

  for (const suite of Array.from(benchmarkSuites.values())) {
    if (suite.releaseVersion !== releaseVersion) continue;

    const recentMeasurements = suite.measurements.filter(m =>
      m.timestamp >= cutoffTime && m.contextMetrics.isAppBuilderViewer
    );

    appBuilderViewerMeasurements.push(...recentMeasurements);
  }

  // Analyze by operation type
  const operationAnalysis = new Map<string, {
    count: number;
    avgDuration: number;
    p95Duration: number;
    p99Duration: number;
    errorRate: number;
  }>();

  const operationGroups = new Map<string, BenchmarkMeasurement[]>();
  appBuilderViewerMeasurements.forEach(m => {
    const opType = m.contextMetrics.operationType;
    if (!operationGroups.has(opType)) {
      operationGroups.set(opType, []);
    }
    operationGroups.get(opType)!.push(m);
  });

  for (const [opType, measurements] of Array.from(operationGroups.entries())) {
    const durations = measurements.map(m => m.performanceMetrics.totalDuration).sort((a, b) => a - b);
    const errorCount = measurements.filter(m => m.performanceMetrics.statusCode >= 400).length;

    operationAnalysis.set(opType, {
      count: measurements.length,
      avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      p95Duration: durations[Math.floor(durations.length * 0.95)] || 0,
      p99Duration: durations[Math.floor(durations.length * 0.99)] || 0,
      errorRate: (errorCount / measurements.length) * 100,
    });
  }

  return {
    releaseVersion,
    timeWindow: timeWindow / (60 * 60 * 1000), // Convert to hours
    totalMeasurements: appBuilderViewerMeasurements.length,
    operationAnalysis: Object.fromEntries(operationAnalysis),
    summary: {
      avgDuration: appBuilderViewerMeasurements.reduce((sum, m) => sum + m.performanceMetrics.totalDuration, 0) / appBuilderViewerMeasurements.length,
      totalDbQueries: appBuilderViewerMeasurements.reduce((sum, m) => sum + m.performanceMetrics.dbQueryCount, 0),
      avgDbDuration: appBuilderViewerMeasurements.reduce((sum, m) => sum + m.performanceMetrics.dbDuration, 0) / appBuilderViewerMeasurements.length,
    },
  };
};

// === STATISTICAL ANALYSIS FUNCTIONS ===

const performStatisticalComparison = (
  currentMeasurements: BenchmarkMeasurement[],
  previousMeasurements: BenchmarkMeasurement[],
  currentRelease: string,
  previousRelease: string,
  endpoint: string,
  method: string
): PerformanceComparison => {
  const currentDurations = currentMeasurements.map(m => m.performanceMetrics.totalDuration);
  const previousDurations = previousMeasurements.map(m => m.performanceMetrics.totalDuration);

  const currentStats = calculateStatistics(currentDurations);
  const previousStats = calculateStatistics(previousDurations);

  const avgDurationChange = ((currentStats.mean - previousStats.mean) / previousStats.mean) * 100;
  const p95DurationChange = ((currentStats.p95 - previousStats.p95) / previousStats.p95) * 100;
  const p99DurationChange = ((currentStats.p99 - previousStats.p99) / previousStats.p99) * 100;

  // Calculate throughput (requests per second)
  const currentThroughput = calculateThroughput(currentMeasurements);
  const previousThroughput = calculateThroughput(previousMeasurements);
  const throughputChange = ((currentThroughput - previousThroughput) / previousThroughput) * 100;

  // Calculate error rates
  const currentErrorRate = (currentMeasurements.filter(m => m.performanceMetrics.statusCode >= 400).length / currentMeasurements.length) * 100;
  const previousErrorRate = (previousMeasurements.filter(m => m.performanceMetrics.statusCode >= 400).length / previousMeasurements.length) * 100;
  const errorRateChange = currentErrorRate - previousErrorRate;

  // Calculate memory usage change
  const currentAvgMemory = currentMeasurements.reduce((sum, m) => sum + m.performanceMetrics.memoryUsage, 0) / currentMeasurements.length;
  const previousAvgMemory = previousMeasurements.reduce((sum, m) => sum + m.performanceMetrics.memoryUsage, 0) / previousMeasurements.length;
  const memoryUsageChange = ((currentAvgMemory - previousAvgMemory) / previousAvgMemory) * 100;

  // Determine significance
  let significance: 'improvement' | 'regression' | 'neutral' = 'neutral';
  const confidenceLevel = calculateConfidenceLevel(currentDurations, previousDurations);

  if (confidenceLevel > 0.8) {
    if (avgDurationChange > 10 || errorRateChange > 5 || memoryUsageChange > 15) {
      significance = 'regression';
    } else if (avgDurationChange < -10 && errorRateChange < -2 && memoryUsageChange < -10) {
      significance = 'improvement';
    }
  }

  return {
    currentRelease,
    previousRelease,
    endpoint,
    method,
    comparison: {
      avgDurationChange,
      p95DurationChange,
      p99DurationChange,
      throughputChange,
      errorRateChange,
      memoryUsageChange,
    },
    significance,
    confidenceLevel,
  };
};

const calculateStatistics = (values: number[]) => {
  const sorted = values.sort((a, b) => a - b);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  const stdDev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);

  return { mean, median, p95, p99, stdDev };
};

const calculateThroughput = (measurements: BenchmarkMeasurement[]): number => {
  if (measurements.length === 0) return 0;

  const timespan = (Math.max(...measurements.map(m => m.timestamp)) - Math.min(...measurements.map(m => m.timestamp))) / 1000;
  return measurements.length / timespan;
};

const calculateConfidenceLevel = (sample1: number[], sample2: number[]): number => {
  // Simplified confidence calculation using Welch's t-test
  const mean1 = sample1.reduce((sum, v) => sum + v, 0) / sample1.length;
  const mean2 = sample2.reduce((sum, v) => sum + v, 0) / sample2.length;

  const var1 = sample1.reduce((sum, v) => sum + Math.pow(v - mean1, 2), 0) / (sample1.length - 1);
  const var2 = sample2.reduce((sum, v) => sum + Math.pow(v - mean2, 2), 0) / (sample2.length - 1);

  const pooledSE = Math.sqrt(var1 / sample1.length + var2 / sample2.length);
  const tStat = Math.abs(mean1 - mean2) / pooledSE;

  // Simplified confidence mapping
  if (tStat > 2.576) return 0.99;
  if (tStat > 1.96) return 0.95;
  if (tStat > 1.645) return 0.90;
  if (tStat > 1.282) return 0.80;
  return 0.50;
};

// === UTILITY FUNCTIONS ===

const getMeasurementsForRelease = (
  releaseVersion: string,
  endpoint?: string,
  method?: string
): BenchmarkMeasurement[] => {
  const measurements: BenchmarkMeasurement[] = [];

  for (const suite of Array.from(benchmarkSuites.values())) {
    if (suite.releaseVersion !== releaseVersion) continue;
    if (endpoint && !suite.name.includes(endpoint)) continue;
    if (method && !suite.name.includes(method)) continue;

    measurements.push(...suite.measurements);
  }

  return measurements;
};

const setupBenchmarkGaugeCallbacks = (): void => {
  if (benchmarkPerformanceGauge) {
    benchmarkPerformanceGauge.addCallback((observableResult: any) => {
      // Calculate overall performance score for each release
      const releaseScores = new Map<string, number>();

      for (const suite of Array.from(benchmarkSuites.values())) {
        if (!releaseScores.has(suite.releaseVersion)) {
          const score = calculatePerformanceScore(suite.releaseVersion);
          releaseScores.set(suite.releaseVersion, score);
        }
      }

      for (const [release, score] of Array.from(releaseScores.entries())) {
        observableResult.observe(score, {
          'tooljet.release.version': release,
        });
      }
    });
  }
};

const calculatePerformanceScore = (releaseVersion: string): number => {
  const measurements = getMeasurementsForRelease(releaseVersion);
  if (measurements.length === 0) return 0;

  const avgDuration = measurements.reduce((sum, m) => sum + m.performanceMetrics.totalDuration, 0) / measurements.length;
  const errorRate = (measurements.filter(m => m.performanceMetrics.statusCode >= 400).length / measurements.length) * 100;
  const avgMemoryUsage = measurements.reduce((sum, m) => sum + m.performanceMetrics.memoryUsage, 0) / measurements.length;

  // Score calculation (100 = perfect, 0 = worst)
  let score = 100;
  score -= Math.min(avgDuration * 10, 50); // Duration penalty
  score -= Math.min(errorRate * 2, 30); // Error rate penalty
  score -= Math.min(avgMemoryUsage / 1024 / 1024, 20); // Memory usage penalty

  return Math.max(0, score);
};

const generateMeasurementId = (): string => {
  return `bm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

const generateSuiteId = (): string => {
  return `bs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// === EXPORT FUNCTIONS ===

export const getBenchmarkingStats = () => {
  return {
    totalSuites: benchmarkSuites.size,
    totalMeasurements: Array.from(benchmarkSuites.values()).reduce((sum, suite) => sum + suite.measurements.length, 0),
    recentComparisons: recentComparisons.size,
    releases: Array.from(new Set(Array.from(benchmarkSuites.values()).map(s => s.releaseVersion))),
    appBuilderViewerMeasurements: Array.from(benchmarkSuites.values())
      .reduce((sum, suite) => sum + suite.measurements.filter(m => m.contextMetrics.isAppBuilderViewer).length, 0),
  };
};

export const generateBenchmarkReport = (releaseVersion: string) => {
  const appBuilderAnalysis = analyzeAppBuilderViewerPerformance(releaseVersion);
  const allMeasurements = getMeasurementsForRelease(releaseVersion);

  return {
    releaseVersion,
    generatedAt: new Date().toISOString(),
    summary: {
      totalMeasurements: allMeasurements.length,
      appBuilderViewerMeasurements: appBuilderAnalysis.totalMeasurements,
      performanceScore: calculatePerformanceScore(releaseVersion),
    },
    appBuilderViewer: appBuilderAnalysis,
    endpoints: getEndpointPerformanceSummary(releaseVersion),
  };
};

const getEndpointPerformanceSummary = (releaseVersion: string) => {
  const measurements = getMeasurementsForRelease(releaseVersion);
  const endpointGroups = new Map<string, BenchmarkMeasurement[]>();

  measurements.forEach(m => {
    const key = `${m.endpoint} ${m.method}`;
    if (!endpointGroups.has(key)) {
      endpointGroups.set(key, []);
    }
    endpointGroups.get(key)!.push(m);
  });

  const summary: Record<string, any> = {};

  for (const [endpoint, measurements] of Array.from(endpointGroups.entries())) {
    const durations = measurements.map(m => m.performanceMetrics.totalDuration);
    const stats = calculateStatistics(durations);

    summary[endpoint] = {
      count: measurements.length,
      avgDuration: stats.mean,
      p95Duration: stats.p95,
      p99Duration: stats.p99,
      errorRate: (measurements.filter(m => m.performanceMetrics.statusCode >= 400).length / measurements.length) * 100,
      isAppBuilderViewer: measurements.some(m => m.contextMetrics.isAppBuilderViewer),
    };
  }

  return summary;
};