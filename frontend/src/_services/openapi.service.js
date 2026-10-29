import YAML from 'yaml';
import $RefParser from '@apidevtools/json-schema-ref-parser';
import config from 'config';
import { authHeader } from '@/_helpers';

export const openapiService = {
  fetchSpecFromUrl,
  parseOpenapiSpec,
};

function resolveSpecUrl(url) {
  if (typeof url === 'string' && url.startsWith('@spec/')) {
    const specPath = url.slice('@spec/'.length);
    return `${config.apiUrl}/plugins/specs/${specPath}`;
  }
  return url;
}

function fetchSpecFromUrl(url) {
  const resolved = resolveSpecUrl(url);
  const isInternalSpec = typeof url === 'string' && url.startsWith('@spec/');
  const requestOptions = {
    method: 'GET',
    ...(isInternalSpec && {
      headers: authHeader(),
      credentials: 'include',
    }),
  };
  return fetch(resolved, requestOptions);
}

async function parseOpenapiSpec(spec, format) {
  if (format === 'json') {
    const jsonParsed = JSON.parse(spec);
    const dereferenced = await $RefParser.dereference(jsonParsed);
    return dereferenced;
  } else {
    const yamlParsed = YAML.parse(spec);
    const dereferenced = await $RefParser.dereference(yamlParsed);
    return dereferenced;
  }
}
