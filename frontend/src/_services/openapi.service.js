export const openapiService = {
  fetchSpecFromUrl,
};

function fetchSpecFromUrl(url) {
  const requestOptions = { method: 'GET' };
  return fetch(url, requestOptions);
}
