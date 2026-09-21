'use strict';

/**
 * storage.js — artifact offload for cypress-live-reporter.
 *
 * "db" (default): base64 stays inside the event payload and lands in Postgres
 * (or your webhook body). "s3": on the async send path the blob is uploaded to
 * S3 (or R2/MinIO via `endpoint`), the base64 field is replaced by `url`.
 *
 * Note on field names: a DOM event's page address lives in `pageUrl`; `url` is
 * reserved for the S3 artifact link. The two must never collide.
 *
 * @aws-sdk/client-s3 is a lazy, optional dependency — only required when a
 * storage mode is actually set to "s3".
 */

const TAG = '[cypress-live-reporter]';

let s3Client = null;
let sdkDisabled = false;
let warnedNoBucket = false;

function sanitize(value) {
  return String(value == null || value === '' ? 'unknown' : value)
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .slice(0, 200);
}

function getS3(s3cfg) {
  if (sdkDisabled) return null;
  if (s3Client) return s3Client;
  let sdk;
  try {
    sdk = require('@aws-sdk/client-s3');
  } catch (err) {
    sdkDisabled = true;
    console.warn(`${TAG} s3 storage needs "@aws-sdk/client-s3" (npm i -D @aws-sdk/client-s3) — keeping artifacts in db mode`);
    return null;
  }
  // credentials come from the standard AWS env/credential chain
  s3Client = new sdk.S3Client(
    Object.assign(
      { region: s3cfg.region || 'ap-south-1' },
      s3cfg.endpoint ? { endpoint: s3cfg.endpoint, forcePathStyle: true } : {}
    )
  );
  return s3Client;
}

function objectUrl(s3cfg, key) {
  if (s3cfg.publicBaseUrl) {
    return `${String(s3cfg.publicBaseUrl).replace(/\/+$/, '')}/${key}`;
  }
  if (s3cfg.endpoint) {
    return `${String(s3cfg.endpoint).replace(/\/+$/, '')}/${s3cfg.bucket}/${key}`;
  }
  return `https://${s3cfg.bucket}.s3.${s3cfg.region || 'ap-south-1'}.amazonaws.com/${key}`;
}

async function upload(s3cfg, key, body, contentType, contentEncoding) {
  const client = getS3(s3cfg);
  if (!client) return null;
  const { PutObjectCommand } = require('@aws-sdk/client-s3');
  await client.send(
    new PutObjectCommand(
      Object.assign(
        { Bucket: s3cfg.bucket, Key: key, Body: body, ContentType: contentType },
        contentEncoding ? { ContentEncoding: contentEncoding } : {}
      )
    )
  );
  return objectUrl(s3cfg, key);
}

/**
 * Mutates `event` in place: uploads its blob and swaps base64 → `url`.
 * Runs only on the async send path. Every failure degrades to leaving the
 * event in db mode — this can never throw.
 */
async function processArtifact(event, config, log) {
  try {
    if (!event || typeof event.type !== 'string' || event.type.indexOf('artifact:') !== 0) return;

    const isScreenshot = event.type === 'artifact:screenshot';
    const isDom = event.type === 'artifact:dom' || event.type === 'artifact:dom-backtrack';
    if (!isScreenshot && !isDom) return;

    // screenshots and DOM can use different storage modes
    const storage = isScreenshot
      ? config && config.screenshots && config.screenshots.storage
      : config && config.dom && config.dom.storage;
    if (storage !== 's3') return;

    const s3cfg = (config && config.s3) || {};
    if (!s3cfg.bucket) {
      if (!warnedNoBucket) {
        warnedNoBucket = true;
        console.warn(`${TAG} storage "s3" selected but s3.bucket is not set — falling back to db mode`);
      }
      return;
    }

    const keyBase = `${s3cfg.prefix || ''}${event.runId}/${sanitize(event.testId)}/attempt-${event.attempt || 1}/`;

    if (isScreenshot && typeof event.base64 === 'string') {
      const key = `${keyBase}${sanitize(event.name || 'screenshot')}.png`;
      const url = await upload(s3cfg, key, Buffer.from(event.base64, 'base64'), 'image/png', null);
      if (url) {
        event.url = url;
        delete event.base64;
      }
    } else if (isDom && typeof event.htmlGzipBase64 === 'string') {
      const name =
        event.type === 'artifact:dom-backtrack'
          ? `dom-backtrack-${event.stepsBeforeFailure || 0}`
          : 'dom';
      // ContentEncoding: gzip → browsers transparently decompress the .html.gz
      const key = `${keyBase}${name}.html.gz`;
      const url = await upload(
        s3cfg,
        key,
        Buffer.from(event.htmlGzipBase64, 'base64'),
        'text/html; charset=utf-8',
        'gzip'
      );
      if (url) {
        event.url = url;
        delete event.htmlGzipBase64;
      }
    }
  } catch (err) {
    if (log) log('artifact offload failed:', err && err.message);
  }
}

module.exports = { processArtifact, sanitize };
