import { create, zustandDevTools } from './utils';

/**
 * Transient store for ephemeral UI state that changes rapidly.
 * This store intentionally does NOT use Immer middleware to avoid
 * unnecessary object creation overhead for high-frequency updates
 * like hover states, drag positions, etc.
 */
export default create(
  zustandDevTools(
    (set, get) => ({
      hoveredComponentForGrid: '',
      hoveredComponentBoundaryId: '',

      setHoveredComponentForGrid: (id) => set({ hoveredComponentForGrid: id }, false, 'setHoveredComponentForGrid'),
      getHoveredComponentForGrid: () => get().hoveredComponentForGrid,
      setHoveredComponentBoundaryId: (id) =>
        set({ hoveredComponentBoundaryId: id }, false, 'setHoveredComponentBoundaryId'),

      // fx expressions parked while fx is off. Deliberately not persisted — recoverable only within
      // the tab session, which avoids a schema change on saved apps.
      fxExpressionStash: new Map(),

      stashFxExpression: (key, expression) => {
        if (!key) return;
        get().fxExpressionStash.set(key, expression);
      },

      // Read-and-delete, so a restored expression cannot be re-applied by a later fx toggle.
      takeFxExpression: (key) => {
        if (!key) return undefined;
        const stash = get().fxExpressionStash;
        const expression = stash.get(key);
        stash.delete(key);
        return expression;
      },
    }),
    { name: 'Transient Store', anonymousActionType: 'unknown' }
  )
);
