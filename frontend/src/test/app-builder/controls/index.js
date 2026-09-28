function replacePropertyAndCreateRestore(target, key, value) {
  const descriptor = Object.getOwnPropertyDescriptor(target, key);
  Object.defineProperty(target, key, { configurable: true, writable: true, value });
  return () => (descriptor ? Object.defineProperty(target, key, descriptor) : delete target[key]);
}

export function createAppBuilderControls() {
  const restores = [];
  return {
    time: {
      freeze(at = '2024-01-01T00:00:00.000Z') {
        jest.useFakeTimers().setSystemTime(new Date(at));
        restores.push(() => jest.useRealTimers());
      },
    },
    ids: {
      sequence(values = ['test-id-1']) {
        const queue = [...values];
        restores.push(
          replacePropertyAndCreateRestore(
            global.crypto,
            'randomUUID',
            jest.fn(() => queue.shift() || values.at(-1))
          )
        );
      },
    },
    geometry: {
      element(element, rect) {
        const value = { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, ...rect };
        restores.push(
          replacePropertyAndCreateRestore(
            element,
            'getBoundingClientRect',
            jest.fn(() => value)
          )
        );
      },
    },
    observers: {
      install() {
        class Observer {
          observe() {}
          unobserve() {}
          disconnect() {}
          takeRecords() {
            return [];
          }
        }
        restores.push(replacePropertyAndCreateRestore(window, 'ResizeObserver', Observer));
        restores.push(replacePropertyAndCreateRestore(window, 'IntersectionObserver', Observer));
      },
    },
    media: {
      match(matches = false) {
        restores.push(
          replacePropertyAndCreateRestore(
            window,
            'matchMedia',
            jest.fn((media) => ({
              matches,
              media,
              onchange: null,
              addListener() {},
              removeListener() {},
              addEventListener() {},
              removeEventListener() {},
              dispatchEvent() {
                return true;
              },
            }))
          )
        );
      },
    },
    storage: {
      clear() {
        window.localStorage.clear();
        window.sessionStorage.clear();
      },
    },
    restore() {
      while (restores.length) restores.pop()();
    },
  };
}
