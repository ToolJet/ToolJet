import { createBrowserHistory } from 'history';

export const history = createBrowserHistory({
  basename: process.env.ASSET_PATH,
});
