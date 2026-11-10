// Pure option transforms for the Select inspector (DropdownV2 / MultiselectV2), kept out of
// Select.jsx so they can be unit-tested without mounting the editor.

// Returns the options with a copy of options[index] inserted right after it.
export const duplicateOption = (options, index) => {
  const source = options[index];
  if (!source) return options;

  // `value` is the option's identity (Draggable key + selection value), so it must stay unique.
  const base = `${source.value}_copy`;
  let newValue = base;
  let counter = 2;
  while (options.some((option) => option.value === newValue)) {
    newValue = `${base}_${counter}`;
    counter += 1;
  }

  const duplicated = {
    ...source, // copies icon, image, caption, visibility flags, visible, disable — everything
    label: `${source.label} copy`,
    value: newValue,
    default: { ...source.default, value: '{{false}}' }, // don't carry over the default selection
  };

  const items = [...options];
  items.splice(index + 1, 0, duplicated);
  return items;
};

export const setIconVisibility = (option, isVisible) => ({
  ...option,
  iconVisibility: isVisible,
  // Legacy/empty options: stamp the default the moment visibility turns on, so the stored value
  // matches what the picker displays (its IconHome2 is a render-time fallback only — without this
  // stamp the widget sees '' and shows nothing).
  ...(isVisible && !option?.icon?.value ? { icon: { ...option?.icon, value: 'IconHome2' } } : {}),
});

// An image set in the inspector is an explicit choice, so it turns its own gate on. Dynamic
// options must set `imageVisibility` themselves, so an `image` key already in query rows stays hidden.
export const setImage = (option, value) => ({
  ...option,
  image: value === '' ? undefined : value,
  imageVisibility: value !== '',
});
