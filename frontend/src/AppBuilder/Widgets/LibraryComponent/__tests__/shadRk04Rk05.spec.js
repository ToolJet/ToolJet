import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { transformSync } from '@babel/core';

// Node fixes the time zone at start-up, so the shadcn date helpers run in a child process set to São Paulo,
// where clocks jumped from 00:00 to 01:00 on 2018-11-04 (RK-04 Calendar, RK-05 DatePicker).
const DATES = path.resolve(__dirname, '../../../../../../packs/shadcn/src/lib/ui2/choice/dates.ts');

const inSaoPaulo = (body) => {
  const { code } = transformSync(fs.readFileSync(DATES, 'utf8'), {
    filename: DATES,
    babelrc: false,
    configFile: false,
    presets: ['@babel/preset-typescript'],
    plugins: ['@babel/plugin-transform-modules-commonjs'],
  });
  const script = `const module = { exports: {} }; const exports = module.exports;\n${code}\nconst d = module.exports;\nprocess.stdout.write(JSON.stringify((${body})(d)));`;
  const out = execFileSync(process.execPath, ['-e', script], { env: { ...process.env, TZ: 'America/Sao_Paulo' } });
  return JSON.parse(out.toString());
};

describe('shadcn dates on a day whose midnight is skipped (America/Sao_Paulo, 2018-11-04)', () => {
  it('reads a date-only value as that day', () => {
    const result = inSaoPaulo(`(d) => ({
      iso: d.ymd(d.parseDateTime('2018-11-04')),
      day: d.ymd(d.toDay('2018-11-04')),
      display: d.ymd(d.toDay('04 Nov 2018', 'DD MMM YYYY')),
      next: d.ymd(d.toDay('2018-11-05')),
    })`);
    expect(result).toEqual({ iso: '2018-11-04', day: '2018-11-04', display: '2018-11-04', next: '2018-11-05' });
  });

  it('still refuses a time the clocks skip and keeps a real time that day', () => {
    const result = inSaoPaulo(`(d) => ({
      skipped: d.parseDateTime('2018-11-04 00:30'),
      real: d.parseDateTime('2018-11-04 10:00') && d.parseDateTime('2018-11-04 10:00').getHours(),
    })`);
    expect(result).toEqual({ skipped: null, real: 10 });
  });
});
