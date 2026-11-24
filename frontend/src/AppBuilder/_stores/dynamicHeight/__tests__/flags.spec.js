const load = (publicConfig) => {
  let flags;
  jest.isolateModules(() => {
    window.public_config = publicConfig;
    flags = require('../flags');
  });
  return flags;
};

describe('dynamic height engine flag', () => {
  afterEach(() => {
    delete window.public_config;
  });

  it('is off under Jest unless the public config turns it on, so widget specs keep describing the old engine', () => {
    expect(load({}).isDynamicHeightV2Enabled()).toBe(false);
    expect(load({ ENABLE_DYNAMIC_HEIGHT_V2: 'true' }).isDynamicHeightV2Enabled()).toBe(true);
  });

  it('follows ENABLE_DYNAMIC_HEIGHT_V2 from the server public config', () => {
    expect(load({ ENABLE_DYNAMIC_HEIGHT_V2: 'false' }).isDynamicHeightV2Enabled()).toBe(false);
    expect(load({ ENABLE_DYNAMIC_HEIGHT_V2: 'true' }).isDynamicHeightV2Enabled()).toBe(true);
  });

  it('ignores localStorage, so one browser cannot run a different engine from the rest', () => {
    window.localStorage.setItem('tj-dynamic-height-v2', 'on');
    expect(load({ ENABLE_DYNAMIC_HEIGHT_V2: 'false' }).isDynamicHeightV2Enabled()).toBe(false);
    window.localStorage.removeItem('tj-dynamic-height-v2');
  });

  it('decides once the public config has arrived, not when the module loads', () => {
    let flags;
    jest.isolateModules(() => {
      delete window.public_config;
      flags = require('../flags');
    });
    window.public_config = { ENABLE_DYNAMIC_HEIGHT_V2: 'true' };
    expect(flags.isDynamicHeightV2Enabled()).toBe(true);
  });
});
