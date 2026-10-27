/**
 * Can these components be dropped into that canvas? One answer for every way a component gets placed: dragging one
 * or several, and dropping a new one from the components panel. Pure: callers pass in what they know.
 */
import { NESTING_LEVEL_LIMITS } from '../appCanvasConstants';
import {
  RESTRICTED_WIDGETS_CONFIG,
  RESTRICTED_WIDGET_SLOTS_CONFIG,
} from '@/AppBuilder/WidgetManager/configs/restrictedWidgetsConfig';

const ID_LENGTH = 36;

// What a refusal calls the target: its slot for a header/footer, its component type otherwise.
const targetLabel = (type, slotType) => (slotType === 'header' || slotType === 'footer' ? slotType : type);

/** The component that owns a canvas: `<id>`, `<id>-header`, `<id>-footer` and `<id>-<tab>` all belong to `<id>`. */
export const ownerOfSlot = (slotId) =>
  !slotId || slotId === 'canvas' ? null : slotId.length > ID_LENGTH ? slotId.slice(0, ID_LENGTH) : slotId;

/** 'header' / 'footer' / a tab id / … for a component's slots, 'canvas' for the page canvas. */
export const slotTypeOf = (slotId) => (!slotId || slotId === 'canvas' ? 'canvas' : slotId.split('-').pop());

/** The saved `parent` for a canvas: `null` for the page canvas, the slot id otherwise. */
export const parentOfSlot = (slotId) => (!slotId || slotId === 'canvas' ? null : slotId);

/** The slot id of a saved `parent`. */
export const slotOfParent = (parent) => parent ?? 'canvas';

/**
 * Ids of every component above `slotId`, innermost first. `components` maps id → { type, parent }.
 * Stops on a cycle instead of looping.
 */
export const ancestorsOfSlot = (slotId, components) => {
  const ancestors = [];
  const seen = new Set();
  let owner = ownerOfSlot(slotId);
  while (owner && !seen.has(owner)) {
    seen.add(owner);
    ancestors.push(owner);
    owner = ownerOfSlot(components[owner]?.parent);
  }
  return ancestors;
};

const nestingLimitReached = (slotId, type, components) => {
  const limit = NESTING_LEVEL_LIMITS[type];
  if (!limit) return false;
  const sameTypeAbove = ancestorsOfSlot(slotId, components).filter((id) => components[id]?.type === type).length;
  return sameTypeAbove >= limit;
};

/**
 * @param {object} drop
 * @param {{id?: string, type: string}[]} drop.dragged   components being placed (`id` absent for a new one)
 * @param {string} drop.slotId                           target canvas: 'canvas' or a slot id
 * @param {Record<string, {type: string, parent: string|null}>} drop.components   every component on the page
 * @param {boolean} [drop.isModuleEditor]
 * @param {boolean} [drop.insideModule]                  the target canvas is inside a module shown in an app
 * @returns {{ok: true} | {ok: false, message?: string}} `message` is shown to the user; a refusal without one is
 *   silent (it is not something the user did wrong, e.g. the module editor's page canvas)
 */
export const canDrop = ({ dragged, slotId, components, isModuleEditor = false, insideModule = false }) => {
  if (isModuleEditor && slotId === 'canvas') return { ok: false };
  if (!isModuleEditor && insideModule) return { ok: false, message: 'Modules cannot be edited inside an app' };

  // A component can't go inside itself or inside one of its own children.
  const ancestors = ancestorsOfSlot(slotId, components);
  if (dragged.some(({ id }) => id && ancestors.includes(id))) return { ok: false };

  const targetType = components[ownerOfSlot(slotId)]?.type ?? 'canvas';
  const slotType = slotTypeOf(slotId);
  const restricted = [
    ...(RESTRICTED_WIDGETS_CONFIG[targetType] ?? []),
    ...(['header', 'footer'].includes(slotType) ? RESTRICTED_WIDGET_SLOTS_CONFIG : []),
  ];
  const refused = [
    ...new Set(
      dragged
        .map(({ type }) => type)
        .filter((type) => restricted.includes(type) || nestingLimitReached(slotId, type, components))
    ),
  ];
  if (refused.length) {
    return {
      ok: false,
      message: `${refused.join(', ')} is not compatible as a child component of ${targetLabel(targetType, slotType)}`,
    };
  }
  return { ok: true };
};

/**
 * The modal a component lives in, if any: components inside a modal stay inside it (its backdrop covers the rest of
 * the page while it is open).
 */
export const enclosingModal = (slotId, components) =>
  ancestorsOfSlot(slotId, components).find((id) => ['Modal', 'ModalV2'].includes(components[id]?.type)) ?? null;
