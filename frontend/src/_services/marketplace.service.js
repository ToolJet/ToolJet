import HttpClient from '@/_helpers/http-client';
import config from 'config';

// Constructed on first use, not at module load. These service modules are reachable from
// http-client's own import chain (http-client -> authentication.service -> '@/_helpers' -> ...
// -> the '@/_services' barrel), so a module-scope `new HttpClient()` can run while http-client
// is still initialising and has not exported the class yet.
let httpClient;
const getAdapter = () => (httpClient ??= new HttpClient({ hostFn: () => config.apiUrl.replace('/api', '') }));

function findAll() {
  return getAdapter().get(`/assets/marketplace/plugins.json`);
}

export const marketplaceService = {
  findAll,
};
