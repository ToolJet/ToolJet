import React, { useState, useEffect, useCallback, useMemo } from 'react';
import performanceMonitor from '@/_services/performanceMonitor.service';
import useStore from '@/AppBuilder/_stores/store';
import './performanceMonitor.scss';

const PerformanceMonitor = ({ isVisible = true, position = 'bottom-right' }) => {
  // Don't render in production unless explicitly enabled
  const isDisabled =
    process.env.NODE_ENV === 'production' && process.env.REACT_APP_ENABLE_PERFORMANCE_MONITOR !== 'true';

  const [metrics, setMetrics] = useState(performanceMonitor.getMetrics());
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLogging, setIsLogging] = useState(false);
  const [logs, setLogs] = useState([]);

  // Get component mapping from store to calculate total components
  const componentNameIdMapping = useStore((state) => state.getComponentNameIdMapping?.('canvas') || {});

  // Calculate total components count
  const totalComponents = useMemo(() => {
    return Object.keys(componentNameIdMapping).length;
  }, [componentNameIdMapping]);

  useEffect(() => {
    performanceMonitor.startMonitoring();

    const unsubscribe = performanceMonitor.subscribe((newMetrics) => {
      setMetrics({ ...newMetrics, score: performanceMonitor.getScore() });
    });

    performanceMonitor.trackAppInit();

    const originalFetch = window.fetch;
    window.fetch = function (...args) {
      performanceMonitor.trackQuery();
      return originalFetch.apply(this, args);
    };

    const observer = new MutationObserver(() => {
      performanceMonitor.trackComponentMount();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      unsubscribe();
      performanceMonitor.stopMonitoring();
      window.fetch = originalFetch;
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isLogging) {
      const interval = setInterval(() => {
        const timestamp = new Date().toLocaleTimeString();
        const currentMetrics = performanceMonitor.getMetrics();
        setLogs((prev) => [...prev.slice(-99), { timestamp, metrics: currentMetrics }]);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isLogging]);

  const handleExport = useCallback(() => {
    const exportData = {
      timestamp: new Date().toISOString(),
      currentMetrics: metrics,
      logs: logs,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [metrics, logs]);

  const handleStop = useCallback(() => {
    performanceMonitor.stopMonitoring();
    setIsExpanded(false);
  }, []);

  const handleReset = useCallback(() => {
    performanceMonitor.reset();
    setLogs([]);
  }, []);

  const getScoreColor = useMemo(
    () => (score) => {
      if (score >= 90) return '#10b981';
      if (score >= 75) return '#f59e0b';
      return '#ef4444';
    },
    []
  );

  const getMetricStatus = useMemo(
    () => (value, goodThreshold, warningThreshold) => {
      if (!value) return 'na';
      const numValue = parseFloat(value);
      if (numValue <= goodThreshold) return 'good';
      if (numValue <= warningThreshold) return 'warning';
      return 'poor';
    },
    []
  );

  if (!isVisible || isDisabled) return null;

  return (
    <div className={`performance-monitor ${position} ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="monitor-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="header-left">
          <span className="rocket-icon">🚀</span>
          <span className="title">Web Vitals Monitor</span>
        </div>
        <div className="header-right">
          <span className="score" style={{ color: getScoreColor(metrics.score) }}>
            <span className="score-label">Score:</span>
            <span className="score-value">{metrics.score}%</span>
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="monitor-content">
          <div className="metrics-section">
            <div className="section-header">
              <span className="section-icon">📊</span>
              <span className="section-title">Core Web Vitals</span>
            </div>
            <div className="metrics-grid">
              <div className="metric-row">
                <span className="metric-label">CLS:</span>
                <span className={`metric-value ${getMetricStatus(metrics.webVitals.CLS, 0.1, 0.25)}`}>
                  {metrics.webVitals.CLS || 'N/A'}
                </span>
                <span className="metric-label">FID:</span>
                <span className={`metric-value ${getMetricStatus(parseFloat(metrics.webVitals.FID), 100, 300)}`}>
                  {metrics.webVitals.FID || 'N/A'}
                </span>
              </div>
              <div className="metric-row">
                <span className="metric-label">FCP:</span>
                <span className={`metric-value ${getMetricStatus(parseFloat(metrics.webVitals.FCP), 1800, 3000)}`}>
                  {metrics.webVitals.FCP || 'N/A'}
                </span>
                <span className="metric-label">LCP:</span>
                <span className={`metric-value ${getMetricStatus(parseFloat(metrics.webVitals.LCP), 2500, 4000)}`}>
                  {metrics.webVitals.LCP || 'N/A'}
                </span>
              </div>
              <div className="metric-row">
                <span className="metric-label">TTFB:</span>
                <span className={`metric-value ${getMetricStatus(parseFloat(metrics.webVitals.TTFB), 800, 1800)}`}>
                  {metrics.webVitals.TTFB || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="metrics-section">
            <div className="section-header">
              <span className="section-icon">⏱️</span>
              <span className="section-title">Page Load</span>
            </div>
            <div className="metrics-grid">
              <div className="metric-row">
                <span className="metric-label">Load:</span>
                <span className="metric-value">{metrics.pageLoad.loadTime || 'N/A'}</span>
                <span className="metric-label">DOM:</span>
                <span className="metric-value">{metrics.pageLoad.domContentLoaded || 'N/A'}</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">TTI:</span>
                <span className="metric-value">{metrics.pageLoad.timeToInteractive || 'N/A'}</span>
                <span className="metric-label">Render:</span>
                <span className="metric-value">{metrics.pageLoad.renderTime || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="metrics-section">
            <div className="section-header">
              <span className="section-icon">🎮</span>
              <span className="section-title">Performance</span>
            </div>
            <div className="metrics-grid">
              <div className="metric-row">
                <span className="metric-label">FPS:</span>
                <span
                  className={`metric-value ${
                    metrics.fps.current < 30 ? 'poor' : metrics.fps.current < 50 ? 'warning' : 'good'
                  }`}
                >
                  {metrics.fps.current}
                </span>
                <span className="metric-label">Avg FPS:</span>
                <span className="metric-value">{metrics.fps.avg}</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Frame Drops:</span>
                <span
                  className={`metric-value ${
                    metrics.frameDrops.count > 10 ? 'poor' : metrics.frameDrops.count > 5 ? 'warning' : 'good'
                  }`}
                >
                  {metrics.frameDrops.count}
                </span>
                <span className="metric-label">Drop Rate:</span>
                <span className="metric-value">{metrics.frameDrops.rate}/s</span>
              </div>
              {metrics.frameDrops.lastDropTime && (
                <div className="metric-row">
                  <span className="metric-label">Last Drop:</span>
                  <span className="metric-value">{metrics.frameDrops.lastDropTime}</span>
                  <span className="metric-label">Highest:</span>
                  <span
                    className={`metric-value ${
                      parseFloat(metrics.frameDrops.highestDropTime) > 100
                        ? 'poor'
                        : parseFloat(metrics.frameDrops.highestDropTime) > 50
                        ? 'warning'
                        : 'good'
                    }`}
                  >
                    {metrics.frameDrops.highestDropTime || 'N/A'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="metrics-section">
            <div className="section-header">
              <span className="section-icon">💾</span>
              <span className="section-title">Memory</span>
            </div>
            <div className="metrics-grid">
              <div className="metric-row">
                <span className="metric-label">Used:</span>
                <span className="metric-value">{metrics.memory.used} MB</span>
                <span className="metric-label">Total:</span>
                <span className="metric-value">{metrics.memory.total} MB</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Usage:</span>
                <span
                  className={`metric-value ${
                    metrics.memory.percent > 90 ? 'poor' : metrics.memory.percent > 70 ? 'warning' : 'good'
                  }`}
                >
                  {metrics.memory.percent}%
                </span>
              </div>
            </div>
          </div>

          <div className="metrics-section">
            <div className="section-header">
              <span className="section-icon">🔧</span>
              <span className="section-title">App Metrics</span>
            </div>
            <div className="metrics-grid">
              <div className="metric-row">
                <span className="metric-label">Init:</span>
                <span className="metric-value">{metrics.app.initTime || 'N/A'}</span>
                <span className="metric-label">Canvas:</span>
                <span className="metric-value">{metrics.app.canvasRenderTime || 'N/A'}</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Viewer:</span>
                <span className="metric-value">{metrics.app.viewerMountTime || 'N/A'}</span>
                <span className="metric-label">Data Load:</span>
                <span className="metric-value">{metrics.app.dataLoadTime || 'N/A'}</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">onLoad:</span>
                <span className="metric-value">{metrics.app.onLoadQueriesTime || 'N/A'}</span>
                <span className="metric-label">Total App:</span>
                <span className="metric-value accent">{metrics.app.totalAppLoadTime || 'N/A'}</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Queries:</span>
                <span className="metric-value accent">{metrics.app.queries}</span>
                <span className="metric-label">Mounts:</span>
                <span className="metric-value accent">{metrics.app.mountCount}</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Components:</span>
                <span className="metric-value accent">{totalComponents}</span>
              </div>
            </div>
          </div>

          <div className="monitor-actions">
            <button className={`action-btn ${isLogging ? 'logging' : ''}`} onClick={() => setIsLogging(!isLogging)}>
              <span className="btn-icon">📁</span>
              <span className="btn-text">{isLogging ? 'Stop Log' : 'Log'}</span>
            </button>
            <button className="action-btn" onClick={handleExport}>
              <span className="btn-icon">📥</span>
              <span className="btn-text">Export</span>
            </button>
            <button className="action-btn" onClick={handleReset}>
              <span className="btn-icon">🔄</span>
              <span className="btn-text">Reset</span>
            </button>
            <button className="action-btn stop" onClick={handleStop}>
              <span className="btn-text">Stop</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;
