'use strict';

/**
 * sinks.js — event delivery for cypress-live-reporter.
 *
 * A sink accepts events fire-and-forget (`send`) and is only ever awaited
 * once, at the very end of the run (`flush`). All transport failures are
 * swallowed; nothing here may throw into a Cypress event handler.
 */

const { processArtifact } = require('./storage');

const TAG = '[cypress-live-reporter]';

function createLogger(config) {
  const debug = !!((config && config.debug) || process.env.CLR_DEBUG === '1');
  return function log() {
    if (!debug) return;
    try {
      console.log.apply(console, [TAG].concat(Array.prototype.slice.call(arguments)));
    } catch (err) {
      /* never throw from logging */
    }
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ------------------------------------------------------------------ */
/* Webhook transport                                                    */
/* ------------------------------------------------------------------ */

function createWebhookTransport(url, token, timeoutMs) {
  return {
    async send(event) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        await fetch(url, {
          method: 'POST',
          headers: Object.assign(
            { 'content-type': 'application/json' },
            token ? { authorization: `Bearer ${token}` } : {}
          ),
          body: JSON.stringify(event),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
    },
    async close() {},
  };
}

/* ------------------------------------------------------------------ */
/* Postgres transport (pg is a lazy, optional dependency)              */
/* ------------------------------------------------------------------ */

function createPgTransport(connectionString, timeoutMs, log) {
  let pool = null;
  let disabled = false;

  function getPool() {
    if (disabled) return null;
    if (pool) return pool;
    let pg;
    try {
      pg = require('pg');
    } catch (err) {
      disabled = true;
      console.warn(`${TAG} postgres mode needs the "pg" package (npm i -D pg) — events will be dropped`);
      return null;
    }
    pool = new pg.Pool({
      connectionString,
      max: 5,
      // an unreachable DB must never hang the run
      connectionTimeoutMillis: 3000,
      idleTimeoutMillis: 30000,
      query_timeout: timeoutMs,
      statement_timeout: timeoutMs,
    });
    pool.on('error', (err) => log('pg pool error:', err && err.message));
    return pool;
  }

  return {
    async send(event) {
      const p = getPool();
      if (!p) return;
      await p.query(
        `INSERT INTO clr_events (run_id, seq, type, ts, payload)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (run_id, seq) DO NOTHING`,
        [event.runId, event.seq, event.type, event.ts, JSON.stringify(event)]
      );
    },
    async close() {
      if (!pool) return;
      const p = pool;
      pool = null;
      // pool.end() can stall on wedged connections; never block shutdown for long
      await Promise.race([p.end(), sleep(2000)]);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Sink = transport + concurrency gate + FIFO overflow queue           */
/* ------------------------------------------------------------------ */

/**
 * @param {object} opts { mode: 'webhook'|'pg', url, token, config }
 * @returns {{ send(event): void, flush(capMs): Promise<void> }}
 */
function createSink(opts) {
  const { mode, url, token, config } = opts;
  const log = createLogger(config);
  const perf = (config && config.performance) || {};
  const maxParallel = Math.max(1, perf.maxParallelUploads || 3);
  const timeoutMs = Math.max(500, perf.timeoutMs || 4000);

  const transport =
    mode === 'pg'
      ? createPgTransport(url, timeoutMs, log)
      : createWebhookTransport(url, token, timeoutMs);

  let inFlight = 0;
  const queue = [];

  function pump() {
    while (inFlight < maxParallel && queue.length > 0) {
      const job = queue.shift();
      inFlight++;
      Promise.resolve()
        .then(job)
        .catch((err) => log('send failed:', err && err.message))
        .then(() => {
          inFlight--;
          pump();
        });
    }
  }

  function send(event) {
    try {
      queue.push(async () => {
        // artifact offload (s3) happens here, on the async path — never in a handler
        await processArtifact(event, config, log);
        await transport.send(event);
        log('sent', event.type, 'seq', event.seq);
      });
      pump();
    } catch (err) {
      log('enqueue failed:', err && err.message);
    }
  }

  async function flush(capMs) {
    const deadline = Date.now() + Math.max(0, capMs || 10000);
    try {
      while ((inFlight > 0 || queue.length > 0) && Date.now() < deadline) {
        await sleep(100);
      }
      if (inFlight > 0 || queue.length > 0) {
        log('final flush hit cap with', inFlight + queue.length, 'events unsent');
      }
    } catch (err) {
      log('flush error:', err && err.message);
    }
    try {
      await transport.close();
    } catch (err) {
      log('close error:', err && err.message);
    }
  }

  return { send, flush };
}

module.exports = { createSink, createLogger };
