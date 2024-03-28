export const ItemTypes = {
  BOX: 'box',
  COMMENT: 'comment',
  NEW_COMMENT: 'new_comment',
};

export const EditorConstants = Object.freeze({
  deviceWindowWidth: 450,
});

export const decimalToHex = (alpha) => (alpha === 0 ? '00' : Math.round(255 * alpha).toString(16));
