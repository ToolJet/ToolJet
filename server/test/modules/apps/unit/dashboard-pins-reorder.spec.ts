import { planReorder } from '@modules/apps/dashboard/pins.service';

const current = [
  { id: 'p1', app_id: 'a1', folder_id: null, position: 2 },
  { id: 'p2', app_id: null, folder_id: 'f1', position: 5 },
  { id: 'p3', app_id: 'a2', folder_id: null, position: 9 },
];

describe('planReorder', () => {
  it('should reuse the existing position slots in the requested order', () => {
    expect(
      planReorder(current, [
        { resource_type: 'app', resource_id: 'a2' },
        { resource_type: 'app', resource_id: 'a1' },
        { resource_type: 'folder', resource_id: 'f1' },
      ])
    ).toEqual({ ids: ['p3', 'p1', 'p2'], positions: [2, 5, 9] });
  });

  it('should reject a request that adds, drops or repeats a pin', () => {
    expect(planReorder(current, [{ resource_type: 'app', resource_id: 'a1' }])).toBeNull();
    expect(
      planReorder(current, [
        { resource_type: 'app', resource_id: 'a1' },
        { resource_type: 'app', resource_id: 'a1' },
        { resource_type: 'folder', resource_id: 'f1' },
      ])
    ).toBeNull();
    expect(
      planReorder(current, [
        { resource_type: 'app', resource_id: 'a1' },
        { resource_type: 'folder', resource_id: 'a2' },
        { resource_type: 'folder', resource_id: 'f1' },
      ])
    ).toBeNull();
  });
});
