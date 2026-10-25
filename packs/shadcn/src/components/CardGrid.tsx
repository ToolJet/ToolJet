import React, { useMemo } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { cn } from '../lib/cn';
import { FONT_LABELS, FONT_VALUES, cardItems, fontStack, gridColumns, px, styleVars } from '../lib/ui2/display/lists/model';
import { CardImage, Chip, InlineProgress, RecordAvatar, onKeyActivate, useWidth } from '../lib/ui2/display/lists/parts';
import { useRecordSelection } from '../lib/ui2/display/lists/useRecordSelection';
import { LoadingBox, LoadingFrame, useLoadingLook } from '../lib/ui2/loading/look';
import { CardsSkel } from '../lib/ui2/loading/shapes';
import { TOKEN, useThemeColor, useThemeRadius } from '../lib/styleDefaults';
import '../styles/ui2-display-lists.css';

// UI 2.0's Card grid: cards built from data fields (a picture, an eyebrow, an avatar, a title with its badges, a
// subtitle, a description, a progress bar and a meta line), in a set number of columns that never squash a card
// below its minimum width.
export const CardGrid = () => {
  const [data] = ToolJet.useStateArray({
    name: 'data',
    label: 'Data',
    initialValue: [
      { id: 1, name: 'Lemon herb roast chicken', cuisine: 'Dinner', prep: 20, serves: 4, note: 'Crisp skin, bright pan sauce' },
      { id: 2, name: 'Miso glazed salmon', cuisine: 'Dinner', prep: 15, serves: 2, note: 'Sweet, salty, ten minutes under the grill' },
      { id: 3, name: 'Blueberry oat pancakes', cuisine: 'Breakfast', prep: 10, serves: 3, note: 'Fluffy, no buttermilk needed' },
    ],
  });
  const [titleField] = ToolJet.useStateString({ name: 'titleField', label: 'Title field', initialValue: 'name' });
  const [subtitleField] = ToolJet.useStateString({ name: 'subtitleField', label: 'Subtitle field', initialValue: '' });
  const [imageField] = ToolJet.useStateString({ name: 'imageField', label: 'Image field (URL)', initialValue: '' });
  const [badgeField] = ToolJet.useStateString({ name: 'badgeField', label: 'Badge field', initialValue: 'cuisine' });
  const [badgeFields] = ToolJet.useStateString({ name: 'badgeFields', label: "More badge fields (comma list, e.g. 'diet, spice')", initialValue: '' });
  const [eyebrowField] = ToolJet.useStateString({ name: 'eyebrowField', label: 'Eyebrow field (a small line above the title)', initialValue: '' });
  const [avatarField] = ToolJet.useStateString({ name: 'avatarField', label: 'Avatar field (image URL or a name)', initialValue: '' });
  const [descriptionField] = ToolJet.useStateString({ name: 'descriptionField', label: 'Description field', initialValue: 'note' });
  const [progressField] = ToolJet.useStateString({ name: 'progressField', label: 'Progress field (a percentage, 0 to 100)', initialValue: '' });
  const [metaFields] = ToolJet.useStateString({ name: 'metaFields', label: "Meta fields (comma list; 'prep:{} min')", initialValue: 'prep:{} min, serves:Serves' });
  const [idField] = ToolJet.useStateString({ name: 'idField', label: 'Id field', initialValue: 'id' });
  const [layout] = ToolJet.useStateEnumeration({ name: 'layout', label: 'Layout', enumDefinition: ['stacked', 'row'], initialValue: 'stacked', inspector: 'switch' });
  const [columns] = ToolJet.useStateNumber({ name: 'columns', label: 'Columns (0 fits as many as the width allows)', initialValue: 3 });
  const [minCardWidth] = ToolJet.useStateNumber({ name: 'minCardWidth', label: 'Minimum card width (px)', initialValue: 240 });
  const [imageAspect] = ToolJet.useStateEnumeration({ name: 'imageAspect', label: 'Image shape', enumDefinition: ['16/9', '4/3', '1/1'], initialValue: '4/3', inspector: 'switch' });
  const [showImage] = ToolJet.useStateBoolean({ name: 'showImage', label: 'Show image', initialValue: true });
  const [cardStyle] = ToolJet.useStateEnumeration({ name: 'cardStyle', label: 'Card style', enumDefinition: ['elevated', 'outline', 'flat'], initialValue: 'elevated', inspector: 'switch' });
  const [highlightSelected] = ToolJet.useStateBoolean({ name: 'highlightSelected', label: 'Highlight the selected card', initialValue: true });
  const [emptyText] = ToolJet.useStateString({ name: 'emptyText', label: 'Empty text', initialValue: 'Nothing here yet' });
  const [, setSelectedItemId] = ToolJet.useStateString({ name: 'selectedItemId', initialValue: '', inspector: 'hidden' });
  const [, setSelectedItem] = ToolJet.useStateObject({ name: 'selectedItem', initialValue: {}, inspector: 'hidden' });
  const [, setSelectedItemIndex] = ToolJet.useStateNumber({ name: 'selectedItemIndex', initialValue: -1, inspector: 'hidden' });
  const onCardClicked = ToolJet.useEventCallback({ name: 'onCardClicked' });
  const cardBackground = useThemeColor('cardBackground', 'Card background', TOKEN.surface);
  const borderColor = useThemeColor('borderColor', 'Card border color', TOKEN.border);
  const titleColor = useThemeColor('titleColor', 'Title color', TOKEN.text);
  const textColor = useThemeColor('textColor', 'Subtitle and meta color', TOKEN.mutedText);
  const accent = useThemeColor('accentColor', 'Selected card accent', TOKEN.brand);
  const radius = useThemeRadius('borderRadius', 'Card radius');
  const titleFont = ToolJet.useStyleEnumeration({
    name: 'titleFontFamily',
    label: 'Title typeface',
    enumDefinition: FONT_VALUES,
    enumLabels: FONT_LABELS,
    initialValue: 'theme',
  });
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ defaultWidth: 43, defaultHeight: 62 });

  const [rootRef, width] = useWidth<HTMLDivElement>();
  const cards = useMemo(
    () =>
      cardItems(data, { titleField, subtitleField, imageField, badgeField, badgeFields, eyebrowField, avatarField, descriptionField, progressField, metaFields, idField }),
    [data, titleField, subtitleField, imageField, badgeField, badgeFields, eyebrowField, avatarField, descriptionField, progressField, metaFields, idField]
  );
  const { selectedKey, pick: click } = useRecordSelection(
    cards,
    (row) => row[idField || 'id'],
    { setItem: setSelectedItem, setId: (id) => setSelectedItemId(id as string), setIndex: setSelectedItemIndex },
    onCardClicked
  );
  const count = gridColumns(columns, width || 960, minCardWidth);
  const aspect = ['16/9', '4/3', '1/1'].includes(imageAspect) ? imageAspect.replace('/', ' / ') : '4 / 3';
  // The picture area only when an image field is mapped: without one every card got a large initials panel.
  const pictured = showImage !== false && typeof imageField === 'string' && imageField.trim() !== '';
  const look = ['elevated', 'outline', 'flat'].includes(cardStyle) ? cardStyle : 'elevated';
  const row = layout === 'row';
  const vars = styleVars([
    [cardBackground, '--lk-bg'],
    [borderColor, '--lk-border'],
    [titleColor, '--lk-title'],
    [textColor, '--lk-fg'],
    [accent, '--lk-accent'],
    [radius, '--lk-radius', px],
    [titleFont, '--lk-title-font', fontStack],
  ]);

  return (
    <LoadingFrame loading={ld.loading} minHeight={160} look={ld.skeleton ? <CardsSkel count={Math.min(cards.length || count, 6)} columns={count} image={pictured} row={layout === 'row'} aspect={aspect} /> : <LoadingBox />}>
      <div ref={rootRef} className="ui u2l-root ui-scroll" style={vars}>
        {cards.length === 0 ? (
          <p className="u2l-empty-text">{emptyText || 'Nothing here yet'}</p>
        ) : (
          <div className="u2l-card-grid" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
            {cards.map((card) => {
              const isSelected = highlightSelected && selectedKey === card.key;
              // With a picture on top, the badges sit on it; otherwise one badge goes beside the title and several in a
              // row under it.
              const badgesOnImage = pictured && !row;
              const badgeBeside = !badgesOnImage && card.badges.length === 1;
              const badgeRow = !badgesOnImage && card.badges.length > 1;
              return (
                <div
                  key={card.key}
                  role="button"
                  tabIndex={0}
                  className={cn('u2l-card', `is-${look}`, row ? 'is-row' : 'is-stacked', isSelected && 'is-selected')}
                  data-selected={isSelected || undefined}
                  onClick={() => click(card)}
                  onKeyDown={onKeyActivate(() => click(card))}
                >
                  {pictured ? <CardImage src={card.image} title={card.title} aspect={aspect} badges={badgesOnImage ? card.badges : []} fill={row} /> : null}
                  <div className="u2l-card-body">
                    {card.eyebrow ? <span className="u2l-card-eyebrow">{card.eyebrow}</span> : null}
                    <div className="u2l-card-head">
                      {card.avatar ? <RecordAvatar src={card.avatar.image} name={card.avatar.name} size={36} /> : null}
                      <div className="u2l-card-heading">
                        <div className="u2l-card-title-row">
                          <span className="u2l-card-title">{card.title}</span>
                          {badgeBeside ? (
                            <span className="u2l-card-badge">
                              <Chip value={card.badges[0]} />
                            </span>
                          ) : null}
                        </div>
                        {card.subtitle ? <span className="u2l-card-subtitle">{card.subtitle}</span> : null}
                      </div>
                    </div>
                    {badgeRow ? (
                      <span className="u2l-card-badges">
                        {card.badges.map((badge, i) => (
                          <Chip key={i} value={badge} />
                        ))}
                      </span>
                    ) : null}
                    {card.description ? <p className="u2l-card-description">{card.description}</p> : null}
                    {card.progress !== null ? <InlineProgress pct={card.progress} className="u2l-card-progress" /> : null}
                    {card.meta ? <span className={cn('u2l-card-meta', card.progress === null && 'is-last')}>{card.meta}</span> : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </LoadingFrame>
  );
};
