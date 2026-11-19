import { act, fireEvent } from '@testing-library/react';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack, settle } from './packMount';

installBrowserStubs();

// QA AD-33 and AD-34: an Ant Design Transfer item with disabled: true could still be ticked and moved, and number keys
// came back as text after a move: with keys 1 and 2 and Target keys [1], moving Two exposed ["2", "1"]. The pack's
// Transfer, the inline SDK and the host renderer are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

const item = (v, title) =>
  [...v.root().querySelectorAll('.ant-transfer-list-content-item')].find((e) => e.textContent.trim() === title);
const lists = (v) =>
  [...v.root().querySelectorAll('.ant-transfer-list')].map((list) =>
    [...list.querySelectorAll('.ant-transfer-list-content-item')].map((e) => e.textContent.trim())
  );
const moveRight = (v) => v.root().querySelectorAll('.ant-transfer-operation button')[0];

describe('Ant Design Transfer: disabled items and the keys it exposes', () => {
  test('[PackComponent-TRANSFER-001] an item marked disabled is drawn disabled and cannot be ticked or moved', async () => {
    const v = await mountPack('antd', 'Transfer', {
      dataSource: [
        { key: 'a', title: 'Alpha' },
        { key: 'b', title: 'Beta (disabled)', disabled: true },
      ],
    });
    const beta = () => item(v, 'Beta (disabled)');

    expect(beta().classList.contains('ant-transfer-list-content-item-disabled')).toBe(true);
    act(() => {
      fireEvent.click(beta());
    });
    await settle();

    expect(beta().querySelector('input[type="checkbox"]').checked).toBe(false);
    expect(moveRight(v).disabled).toBe(true);
    expect(lists(v)).toEqual([['Alpha', 'Beta (disabled)'], []]);
    expect(v.exposed.targetKeys).toEqual([]);
  });

  test('[PackComponent-TRANSFER-002] number keys stay numbers after a move, in the order of the data', async () => {
    const v = await mountPack('antd', 'Transfer', {
      dataSource: [
        { key: 1, title: 'One' },
        { key: 2, title: 'Two' },
      ],
      targetKeys: [1],
    });

    act(() => {
      fireEvent.click(item(v, 'Two'));
    });
    act(() => {
      fireEvent.click(moveRight(v));
    });
    await settle();

    expect(v.exposed.targetKeys).toEqual([1, 2]);
    expect(v.exposed.value).toEqual([1, 2]);
    expect(lists(v)).toEqual([[], ['One', 'Two']]);
    expect(v.events.filter((e) => e === 'onChange')).toHaveLength(1);
  });

  test('[PackComponent-TRANSFER-003] Set field value keeps number keys numbers', async () => {
    const v = await mountPack('antd', 'Transfer', {
      dataSource: [
        { key: 1, title: 'One' },
        { key: 2, title: 'Two' },
      ],
    });

    await v.run('setFieldValue', [2]);

    expect(v.exposed.targetKeys).toEqual([2]);
    expect(lists(v)).toEqual([['One'], ['Two']]);
  });
});
