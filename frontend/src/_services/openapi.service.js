import YAML from 'yaml';
import $RefParser from '@apidevtools/json-schema-ref-parser';

export const openapiService = {
  fetchSpecFromUrl,
  parseOpenapiSpec,
};

function fetchSpecFromUrl(url) {
  const requestOptions = { method: 'GET' };
  return fetch(url, requestOptions);
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
