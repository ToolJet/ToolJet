import YAML from 'yaml';
import RefResolver from '@/_helpers/ref_resolver';

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
    const res = new RefResolver(jsonParsed);
    const { result } = await res.resolve();
    return result;
  } else {
    const yamlParsed = YAML.parse(spec);
    const res = new RefResolver(yamlParsed);
    const { result } = await res.resolve();
    return result;
  }
}
