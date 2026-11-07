import { onePerPerson } from '../presenceAvatars';

describe('onePerPerson', () => {
  it('shows a person with several tabs once, keeping the first (the current user)', () => {
    const me = { firstName: 'Tara', lastName: 'Dev', email: 'tara@example.com', color: 'red' };
    const myOtherTab = { firstName: 'Tara', lastName: 'Dev', email: 'TARA@example.com', color: 'blue' };
    const sam = { firstName: 'Sam', lastName: 'Lee', email: 'sam@example.com' };
    expect(onePerPerson([me, myOtherTab, sam, { ...sam }])).toEqual([me, sam]);
  });

  it('falls back to the name when a presence has no email yet', () => {
    const a = { firstName: 'Tara', lastName: 'Dev', email: '' };
    expect(onePerPerson([a, { ...a }, { firstName: 'Sam', lastName: 'Lee' }])).toHaveLength(2);
  });
});
