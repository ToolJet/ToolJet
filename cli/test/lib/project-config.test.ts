import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import { mock } from 'node:test';

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

  // Present-but-empty is a distinct branch from absent: the field passes the
  // typeof check and is rejected only by the truthiness check after it.
  it('throws when libraryName is present but empty', () => {
    writeProjectConfig(tmp.get(), { libraryName: '', correlationId: 'corr-123' });

    expect(() => ProjectConfig.readFile(tmp.get())).to.throw(/malformed or missing/);
  });

  it('throws when correlationId is present but empty', () => {
    writeProjectConfig(tmp.get(), { libraryName: 'My Library', correlationId: '' });

    expect(() => ProjectConfig.readFile(tmp.get())).to.throw(/malformed or missing/);
  });

  it('throws when a required field is present but not a string', () => {
    fs.mkdirSync(path.join(tmp.get(), '.tooljet'), { recursive: true });
    fs.writeFileSync(
      path.join(tmp.get(), '.tooljet', 'config.json'),
      JSON.stringify({ libraryName: 'My Library', correlationId: 42 })
    );

    expect(() => ProjectConfig.readFile(tmp.get())).to.throw(/malformed or missing/);
  });

  it('throws when the config file holds a JSON array instead of an object', () => {
    fs.mkdirSync(path.join(tmp.get(), '.tooljet'), { recursive: true });
    fs.writeFileSync(path.join(tmp.get(), '.tooljet', 'config.json'), JSON.stringify([]));

    expect(() => ProjectConfig.readFile(tmp.get())).to.throw(/malformed or missing/);
  });

  it('defaults to the current working directory when no projectRoot is given', () => {
    writeProjectConfig(tmp.get(), { libraryName: 'Cwd Library', correlationId: 'corr-cwd' });

    expect(ProjectConfig.readFile()).to.deep.equal({ libraryName: 'Cwd Library', correlationId: 'corr-cwd' });
  });
});

describe('ProjectConfig.readFileOrExit', () => {
  const tmp = withTempCwd();
  afterEach(() => mock.restoreAll());

  it('exits the process and logs the error on failure', () => {
    const exitMock = mock.method(process, 'exit', () => {
      throw new Error('EXIT_1');
    });
    mock.method(console, 'log', () => {});

    expect(() => ProjectConfig.readFileOrExit(tmp.get())).to.throw('EXIT_1');
    expect(exitMock.mock.calls[0].arguments).to.deep.equal([1]);
  });
});
