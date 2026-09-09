import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import * as sinon from 'sinon';

import { ProjectConfig } from '../../src/lib/library/project-config';
import { withTempCwd, writeProjectConfig } from '../helpers/fixtures';

describe('ProjectConfig.readFile', () => {
  const tmp = withTempCwd();

  it('reads a valid .tooljet/config.json', () => {
    writeProjectConfig(tmp.get(), { libraryName: 'My Library', correlationId: 'corr-123' });

    const config = ProjectConfig.readFile(tmp.get());

    expect(config).to.deep.equal({ libraryName: 'My Library', correlationId: 'corr-123' });
  });

  it('throws when .tooljet/config.json is missing', () => {
    expect(() => ProjectConfig.readFile(tmp.get())).to.throw(/not found/);
  });

  it('throws when .tooljet/config.json is not valid JSON', () => {
    fs.mkdirSync(path.join(tmp.get(), '.tooljet'), { recursive: true });
    fs.writeFileSync(path.join(tmp.get(), '.tooljet', 'config.json'), '{ not valid json');

    expect(() => ProjectConfig.readFile(tmp.get())).to.throw(/not valid JSON/);
  });

  it('throws when required fields are missing', () => {
    fs.mkdirSync(path.join(tmp.get(), '.tooljet'), { recursive: true });
    fs.writeFileSync(path.join(tmp.get(), '.tooljet', 'config.json'), JSON.stringify({ libraryName: 'Only Name' }));

    expect(() => ProjectConfig.readFile(tmp.get())).to.throw(/malformed or missing/);
  });
});

describe('ProjectConfig.readFileOrExit', () => {
  const tmp = withTempCwd();
  afterEach(() => sinon.restore());

  it('exits the process and logs the error on failure', () => {
    const exitStub = sinon.stub(process, 'exit').throws(new Error('EXIT_1'));
    sinon.stub(console, 'log');

    expect(() => ProjectConfig.readFileOrExit(tmp.get())).to.throw('EXIT_1');
    expect(exitStub.calledWith(1)).to.be.true;
  });
});
