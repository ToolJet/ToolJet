import { avatarPeople } from '../Shadcn';

describe('avatarPeople', () => {
  it('reads one name, a comma list, or an array of names and { name, src }', () => {
    expect(avatarPeople('Ada Lovelace')).toEqual([{ name: 'Ada Lovelace', src: '' }]);
    expect(avatarPeople('Ada, Alan').map((p) => p.name)).toEqual(['Ada', 'Alan']);
    expect(avatarPeople(['Ada', { name: 'Grace', src: 'g.png' }])).toEqual([
      { name: 'Ada', src: '' },
      { name: 'Grace', src: 'g.png' },
    ]);
  });
  it('uses the single image property for a lone person without a photo', () => {
    expect(avatarPeople('Ada', 'a.png')).toEqual([{ name: 'Ada', src: 'a.png' }]);
    expect(avatarPeople('Ada, Alan', 'a.png').every((p) => p.src === '')).toBe(true);
  });
  it('skips empty entries and survives junk', () => {
    expect(avatarPeople([null, '', undefined, 'Ada'])).toEqual([{ name: 'Ada', src: '' }]);
    expect(avatarPeople(null)).toEqual([]);
    expect(avatarPeople(42)).toEqual([{ name: '42', src: '' }]);
  });
});
