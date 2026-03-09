import React, { useState, useEffect, useRef, useCallback } from 'react';
import Plot from 'react-plotly.js';
import { useNavigate } from 'react-router-dom';
import { observabilityService } from '@/_services/observabilityService';
import { authenticationService } from '@/_services';
import Logo from '@assets/images/tj-logo.svg';

const COLORS = ['#3E63DD', '#12A594', '#E54D2E', '#F76B15', '#8E4EC6', '#0091FF', '#F0C000', '#11A9FF'];

const TIME_RANGES = [
  { label: 'Last 5 minutes', value: 5 * 60 * 1000 },
  { label: 'Last 15 minutes', value: 15 * 60 * 1000 },
  { label: 'Last 30 minutes', value: 30 * 60 * 1000 },
  { label: 'Last 1 hour', value: 60 * 60 * 1000 },
  { label: 'Last 3 hours', value: 3 * 60 * 60 * 1000 },
  { label: 'Last 6 hours', value: 6 * 60 * 60 * 1000 },
  { label: 'Last 12 hours', value: 12 * 60 * 60 * 1000 },
  { label: 'Last 24 hours', value: 24 * 60 * 60 * 1000 },
];

const REFRESH_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '5s', value: 5000 },
  { label: '10s', value: 10000 },
  { label: '30s', value: 30000 },
  { label: '1m', value: 60000 },
];

export default function ObservabilityPage({ darkMode }) {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ appName: 'All', environment: 'All', mode: 'All' });
  const [timeRange, setTimeRange] = useState(5 * 60 * 1000);
  const [refreshInterval, setRefreshInterval] = useState(0);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const refreshTimerRef = useRef(null);

  const fetchMetrics = useCallback(async () => {
    const to = Date.now();
    const from = to - timeRange;
    setError(null);
    try {
      const data = await observabilityService.getMetrics({
        ...filters,
        from,
        to,
        bucketSize: 30,
      });
      setMetrics(data);
    } catch (e) {
      console.error('Failed to fetch observability metrics', e);
      setError('Failed to load metrics. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters, timeRange]);

  useEffect(() => {
    setLoading(true);
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    if (refreshInterval > 0) {
      refreshTimerRef.current = setInterval(fetchMetrics, refreshInterval);
    }
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [refreshInterval, fetchMetrics]);

  const filterValues = metrics?.filterValues || { apps: ['All'], environments: ['All'], modes: ['All'] };
  const overview = metrics?.overview || {};
  const timeSeries = metrics?.timeSeries || {};
  const topQueries = metrics?.topQueries || {};

  const bg = darkMode ? '#0d1117' : '#f8f9fa';
  const cardBg = darkMode ? '#1a202c' : '#fff';
  const cardBorder = darkMode ? '#2d3748' : '#e2e8f0';
  const textPrimary = darkMode ? '#e2e8f0' : '#2d3748';
  const textMuted = '#718096';
  const selectStyle = {
    border: `1px solid ${cardBorder}`,
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '12px',
    background: cardBg,
    color: textPrimary,
    cursor: 'pointer',
    outline: 'none',
  };

  const buildLineTraces = (seriesMap, yKey = 'rate') => {
    if (!seriesMap) return [];
    return Object.entries(seriesMap).map(([name, points], i) => ({
      x: points.map((p) => new Date(p.time)),
      y: points.map((p) => (p[yKey] != null ? p[yKey] : 0)),
      name,
      type: 'scatter',
      mode: 'lines+markers',
      line: { color: COLORS[i % COLORS.length], width: 1.5 },
      marker: { size: 4 },
    }));
  };

  const plotLayout = (title, yTitle = 'ops/s') => ({
    title: { text: title, font: { size: 12, color: textPrimary } },
    height: 230,
    margin: { t: 35, b: 45, l: 55, r: 15 },
    xaxis: {
      type: 'date',
      tickfont: { size: 9 },
      gridcolor: darkMode ? '#2d3748' : '#e2e8f0',
      linecolor: darkMode ? '#4a5568' : '#cbd5e0',
    },
    yaxis: {
      title: { text: yTitle, font: { size: 9 } },
      tickfont: { size: 9 },
      gridcolor: darkMode ? '#2d3748' : '#e2e8f0',
      linecolor: darkMode ? '#4a5568' : '#cbd5e0',
      rangemode: 'tozero',
    },
    plot_bgcolor: cardBg,
    paper_bgcolor: cardBg,
    font: { color: darkMode ? '#a0aec0' : '#4a5568', size: 11 },
    legend: { font: { size: 9 }, orientation: 'h', y: -0.25 },
    showlegend: true,
  });

  const plotConfig = { displayModeBar: false, responsive: true };

  const successVsFailureTraces = [];
  if (timeSeries.successVsFailure) {
    successVsFailureTraces.push({
      x: timeSeries.successVsFailure.map((p) => new Date(p.time)),
      y: timeSeries.successVsFailure.map((p) => p.successRate || 0),
      name: 'success',
      type: 'scatter',
      mode: 'lines+markers',
      line: { color: '#12A594', width: 1.5 },
      marker: { size: 4 },
      fill: 'tozeroy',
      fillcolor: 'rgba(18,165,148,0.15)',
    });
    successVsFailureTraces.push({
      x: timeSeries.successVsFailure.map((p) => new Date(p.time)),
      y: timeSeries.successVsFailure.map((p) => p.failureRate || 0),
      name: 'failure',
      type: 'scatter',
      mode: 'lines+markers',
      line: { color: '#E54D2E', width: 1.5 },
      marker: { size: 4 },
      fill: 'tozeroy',
      fillcolor: 'rgba(229,77,46,0.15)',
    });
  }

  const handleBackToDashboard = () => {
    const workspaceId =
      authenticationService.currentSessionValue?.current_organization_slug ||
      authenticationService.currentSessionValue?.current_organization_id;
    navigate(`/${workspaceId}`);
  };

  return (
    <div style={{ background: bg, height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'inherit', overflow: 'hidden' }}>
      {/* Top bar: logo + back button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 24px',
          background: darkMode ? '#161b22' : '#fff',
          borderBottom: `1px solid ${cardBorder}`,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Logo height={24} />
        <div style={{ width: '1px', height: '20px', background: cardBorder }} />
        <button
          onClick={handleBackToDashboard}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: textMuted,
            fontSize: '13px',
            padding: '4px 0',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to dashboard
        </button>
        <span style={{ fontSize: '13px', fontWeight: 600, color: textPrimary, marginLeft: '4px' }}>Observability</span>
      </div>

      <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Filter pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { label: 'app_name', key: 'appName', options: filterValues.apps },
            { label: 'environment', key: 'environment', options: filterValues.environments },
            { label: 'mode', key: 'mode', options: filterValues.modes },
          ].map((f) => (
            <div
              key={f.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '12px',
              }}
            >
              <span style={{ color: textMuted }}>{f.label}</span>
              <select
                value={filters[f.key]}
                onChange={(e) => setFilters((prev) => ({ ...prev, [f.key]: e.target.value }))}
                style={{ border: 'none', background: 'transparent', fontSize: '12px', cursor: 'pointer', color: textPrimary, outline: 'none' }}
              >
                {f.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={timeRange} onChange={(e) => setTimeRange(Number(e.target.value))} style={selectStyle}>
            {TIME_RANGES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-3.93" />
            </svg>
            <select value={refreshInterval} onChange={(e) => setRefreshInterval(Number(e.target.value))} style={selectStyle}>
              {REFRESH_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => { setLoading(true); fetchMetrics(); }}
            style={{
              border: `1px solid ${cardBorder}`,
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '12px',
              background: '#3E63DD',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div
          style={{
            background: '#fff5f5',
            border: '1px solid #E54D2E',
            borderRadius: '6px',
            padding: '10px 14px',
            fontSize: '12px',
            color: '#E54D2E',
            marginBottom: '16px',
          }}
        >
          {error}
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: textMuted, fontSize: '13px' }}>
          Loading metrics...
        </div>
      )}

      {!loading && (
        <>
          {/* ── App Overview ── */}
          <SectionHeader title="App Overview" darkMode={darkMode} textPrimary={textPrimary} />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '12px',
              marginBottom: '24px',
            }}
          >
            <StatCard label="Total Query Executions" value={overview.totalQueryExecutions ?? 0} darkMode={darkMode} cardBg={cardBg} cardBorder={cardBorder} />
            <StatCard
              label="App Success Rate"
              value={overview.successRate != null ? `${overview.successRate.toFixed(1)}%` : 'No data'}
              status={overview.successRate != null ? (overview.successRate >= 90 ? 'good' : overview.successRate >= 70 ? 'warn' : 'bad') : 'neutral'}
              darkMode={darkMode}
              cardBg={cardBg}
              cardBorder={cardBorder}
            />
            <StatCard
              label="p95 Query Latency"
              value={overview.p95Latency != null ? `${overview.p95Latency.toFixed(1)} ms` : 'No data'}
              darkMode={darkMode}
              cardBg={cardBg}
              cardBorder={cardBorder}
            />
            <StatCard
              label="Query Failures"
              value={overview.queryFailures ?? 0}
              status={overview.queryFailures > 0 ? 'bad' : 'good'}
              darkMode={darkMode}
              cardBg={cardBg}
              cardBorder={cardBorder}
            />
            <StatCard label="Total Queries in App" value={overview.totalQueriesInApp ?? 0} darkMode={darkMode} cardBg={cardBg} cardBorder={cardBorder} />
          </div>

          {/* ── Query Performance ── */}
          <SectionHeader title="Query Performance" darkMode={darkMode} textPrimary={textPrimary} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            <ChartCard cardBg={cardBg} cardBorder={cardBorder}>
              <Plot
                data={buildLineTraces(timeSeries.executionRateByQuery, 'rate')}
                layout={plotLayout('Query Execution Rate by Query', 'ops/s')}
                config={plotConfig}
                style={{ width: '100%' }}
                useResizeHandler
              />
            </ChartCard>
            <ChartCard cardBg={cardBg} cardBorder={cardBorder}>
              <Plot
                data={buildLineTraces(timeSeries.latencyByQuery, 'p95')}
                layout={plotLayout('Query Latency (p95) by Query', 'ms')}
                config={plotConfig}
                style={{ width: '100%' }}
                useResizeHandler
              />
            </ChartCard>
            <ChartCard cardBg={cardBg} cardBorder={cardBorder}>
              <Plot
                data={buildLineTraces(timeSeries.executionsByDatasourceType, 'rate')}
                layout={plotLayout('Queries by Data Source Type', 'ops/s')}
                config={plotConfig}
                style={{ width: '100%' }}
                useResizeHandler
              />
            </ChartCard>
            <ChartCard cardBg={cardBg} cardBorder={cardBorder}>
              <Plot
                data={successVsFailureTraces}
                layout={plotLayout('Success vs Failure Rate', 'ops/s')}
                config={plotConfig}
                style={{ width: '100%' }}
                useResizeHandler
              />
            </ChartCard>
          </div>

          {/* ── Top Queries ── */}
          <SectionHeader title="Top Queries" darkMode={darkMode} textPrimary={textPrimary} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
            <QueryTable
              title="Top 10 Most Executed Queries"
              darkMode={darkMode}
              cardBg={cardBg}
              cardBorder={cardBorder}
              textPrimary={textPrimary}
              columns={[
                { key: 'queryName', label: 'Query Name' },
                {
                  key: 'execRate',
                  label: 'Exec Rate',
                  align: 'right',
                  format: (v) => `${(v || 0).toFixed(4)} ops/s`,
                  bar: true,
                  maxKey: 'maxExecRate',
                },
              ]}
              rows={topQueries.mostExecuted || []}
            />
            <QueryTable
              title="Top 10 Slowest Queries (p95)"
              darkMode={darkMode}
              cardBg={cardBg}
              cardBorder={cardBorder}
              textPrimary={textPrimary}
              columns={[
                { key: 'queryName', label: 'Query Name' },
                {
                  key: 'p95Latency',
                  label: 'p95 Latency',
                  align: 'right',
                  format: (v) => (v != null ? `${v.toFixed(1)} ms` : 'N/A'),
                  bar: true,
                  maxKey: 'maxP95',
                },
              ]}
              rows={topQueries.slowest || []}
            />
            <QueryTable
              title="Top 10 Failed Queries"
              darkMode={darkMode}
              cardBg={cardBg}
              cardBorder={cardBorder}
              textPrimary={textPrimary}
              columns={[
                { key: 'queryName', label: 'Query Name' },
                { key: 'queryText', label: 'Query Text', truncate: true },
                { key: 'count', label: 'Failures', align: 'right', badge: true },
              ]}
              rows={topQueries.failed || []}
            />
          </div>
        </>
      )}
      </div>{/* end padding wrapper */}
    </div>
  );
}

function SectionHeader({ title, textPrimary }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#718096" strokeWidth="2">
        <polyline points="6 9 12 15 18 9" />
      </svg>
      <span style={{ fontSize: '13px', fontWeight: 600, color: textPrimary }}>{title}</span>
    </div>
  );
}

function StatCard({ label, value, status, cardBg, cardBorder }) {
  const valueColor =
    status === 'good'
      ? '#12A594'
      : status === 'bad'
      ? '#E54D2E'
      : status === 'warn'
      ? '#F76B15'
      : '#3E63DD';

  return (
    <div
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <span
        style={{
          fontSize: '10px',
          fontWeight: 500,
          color: '#718096',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: '26px', fontWeight: 700, color: valueColor, lineHeight: 1 }}>{value}</span>
    </div>
  );
}

function ChartCard({ children, cardBg, cardBorder }) {
  return (
    <div
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: '8px',
        padding: '12px',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}

function QueryTable({ title, columns, rows, cardBg, cardBorder, textPrimary }) {
  const maxValues = {};
  columns.forEach((col) => {
    if (col.bar && col.maxKey) {
      maxValues[col.maxKey] = Math.max(...rows.map((r) => r[col.key] || 0), 0.001);
    }
  });

  return (
    <div
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: '8px',
        padding: '12px',
        overflow: 'hidden',
      }}
    >
      <div style={{ fontSize: '12px', fontWeight: 600, color: textPrimary, marginBottom: '10px' }}>{title}</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  textAlign: col.align || 'left',
                  padding: '4px 6px',
                  color: '#718096',
                  fontWeight: 500,
                  borderBottom: `1px solid ${cardBorder}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{ textAlign: 'center', padding: '24px', color: '#a0aec0', fontSize: '12px' }}
              >
                No data in selected time range
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${cardBorder}` }}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: '6px 6px',
                      color: textPrimary,
                      textAlign: col.align || 'left',
                      maxWidth: col.truncate ? '120px' : 'auto',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={col.truncate ? String(row[col.key] || '') : undefined}
                  >
                    {col.bar && col.maxKey ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                        <span>{col.format ? col.format(row[col.key]) : row[col.key]}</span>
                        <div
                          style={{
                            width: '50px',
                            height: '8px',
                            background: '#e2e8f0',
                            borderRadius: '2px',
                            overflow: 'hidden',
                            flexShrink: 0,
                          }}
                        >
                          <div
                            style={{
                              width: `${((row[col.key] || 0) / maxValues[col.maxKey]) * 100}%`,
                              height: '100%',
                              background: '#12A594',
                            }}
                          />
                        </div>
                      </div>
                    ) : col.badge ? (
                      <span
                        style={{
                          background: '#E54D2E',
                          color: '#fff',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          fontSize: '10px',
                          fontWeight: 600,
                        }}
                      >
                        {row[col.key]}
                      </span>
                    ) : col.format ? (
                      col.format(row[col.key])
                    ) : col.truncate ? (
                      String(row[col.key] || '').substring(0, 40)
                    ) : (
                      row[col.key]
                    )}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
