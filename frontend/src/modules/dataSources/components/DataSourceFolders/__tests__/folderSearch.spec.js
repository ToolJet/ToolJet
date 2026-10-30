import { buildVisibleFolders } from '../folderSearch';

const PG = { id: 'ds-pg', name: 'Postgres prod' };
const REST = { id: 'ds-rest', name: 'Rest api' };
const MONGO = { id: 'ds-mongo', name: 'Mongo analytics' };
const DATA_SOURCES = [PG, REST, MONGO];

const REPORTING = {
  id: 'folder-reporting',
  name: 'Reporting',
  folder_data_sources: [{ data_source_id: REST.id }, { data_source_id: MONGO.id }],
};
const BILLING = { id: 'folder-billing', name: 'Billing', folder_data_sources: [{ data_source_id: PG.id }] };
const ARCHIVE = { id: 'folder-archive', name: 'Archive', folder_data_sources: [] };
const FOLDERS = [REPORTING, BILLING, ARCHIVE];

// The sidebar hands the helper its already-filtered list, so the specs mirror that split.
const matching = (term) => DATA_SOURCES.filter((ds) => ds.name.toLowerCase().includes(term.toLowerCase()));

const build = (searchValue) =>
  buildVisibleFolders({
    folders: FOLDERS,
    dataSources: DATA_SOURCES,
    visibleDataSources: searchValue ? matching(searchValue) : DATA_SOURCES,
    searchValue,
  });

const names = (result) => result.map(({ folder }) => folder.name);
const contentNames = (result, folderName) =>
  result.find(({ folder }) => folder.name === folderName).contents.map((ds) => ds.name);

describe('buildVisibleFolders', () => {
  it('should keep every folder, empty ones included, when there is no search term', () => {
    expect(names(build(''))).toEqual(['Archive', 'Billing', 'Reporting']);
    expect(contentNames(build(''), 'Archive')).toEqual([]);
  });

  it('should return folders alphabetically with alphabetical contents', () => {
    expect(contentNames(build(''), 'Reporting')).toEqual(['Mongo analytics', 'Rest api']);
  });

  it('should drop folders that hold no match for the search term', () => {
    expect(names(build('postgres'))).toEqual(['Billing']);
  });

  it('should narrow a contents-matched folder to the matching data sources only', () => {
    const result = build('mongo');

    expect(names(result)).toEqual(['Reporting']);
    expect(contentNames(result, 'Reporting')).toEqual(['Mongo analytics']);
  });

  it('should keep a folder whose own name matches, with all of its data sources', () => {
    const result = build('report');

    expect(names(result)).toEqual(['Reporting']);
    expect(contentNames(result, 'Reporting')).toEqual(['Mongo analytics', 'Rest api']);
  });

  it('should keep an empty folder whose own name matches', () => {
    expect(names(build('archive'))).toEqual(['Archive']);
  });

  it('should match folder names case-insensitively and ignore surrounding whitespace', () => {
    expect(names(build('  BILLing '))).toEqual(['Billing']);
  });

  it('should return nothing when neither a folder name nor any data source matches', () => {
    expect(build('nothing-matches-this')).toEqual([]);
  });

  it('should tolerate missing folders, data sources and membership rows', () => {
    expect(buildVisibleFolders({})).toEqual([]);
    expect(buildVisibleFolders({ folders: [{ id: 'f', name: 'F' }], searchValue: '' })).toEqual([
      { folder: { id: 'f', name: 'F' }, contents: [], folderNameMatches: false },
    ]);
  });
});
