import { create, zustandDevTools } from './utils';

/**
 * Transient store for ephemeral UI state that changes rapidly.
 * This store intentionally does NOT use Immer middleware to avoid
 * unnecessary object creation overhead for high-frequency updates
 * like hover states, drag positions, etc.
 */
export default create(
  zustandDevTools((set, get) => ({
    hoveredComponentForGrid: '',
    hoveredComponentBoundaryId: '',

    setHoveredComponentForGrid: (id) => set({ hoveredComponentForGrid: id }, false, 'setHoveredComponentForGrid'),
    getHoveredComponentForGrid: () => get().hoveredComponentForGrid,
    setHoveredComponentBoundaryId: (id) => set({ hoveredComponentBoundaryId: id }, false, 'setHoveredComponentBoundaryId'),
  }),
    { name: 'Transient Store', anonymousActionType: 'unknown' }
  )
);


