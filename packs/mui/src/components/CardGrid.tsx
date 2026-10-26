import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Box, Card as MuiCard, CardActionArea, CardContent, CardMedia, Chip, Grid, LinearProgress, Skeleton, Typography } from '@mui/material';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { MuiProvider, useThemeStyles } from '../lib/MuiProvider';
import { toArray } from '../lib/data';
import { useStateText } from '../lib/text';
import { Loading } from '../lib/loading';
import { useGrowingCount } from '../lib/growingList';
import { useSelection, type Selectable } from '../lib/useSelection';
import { avatarHue, barWidth, cardItems, chipLabel, chipTone, gridColumns, initials, percentLabel, type CardItem } from '../lib/ui2/display/lists/model';

// The tone a badge word reads as (lists/model chipTone) -> MUI's Chip colour.
const TONE_CHIP: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  success: 'success',
  warning: 'warning',
  danger: 'error',
  info: 'info',
  neutral: 'default',
};
const ASPECTS = ['16/9', '4/3', '1/1'];
const clamp = (lines: number) => ({ display: '-webkit-box', WebkitLineClamp: lines, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' });

/** The element's content width, kept current as it resizes (0 until measured, and in jsdom). */
const useWidth = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
};

const RowAvatar = ({ image, name }: { image: string; name: string }) =>
  image ? (
    <Avatar src={image} alt={name} sx={{ width: 36, height: 36 }} />
  ) : (
    <Avatar sx={{ width: 36, height: 36, fontSize: 14, bgcolor: `hsl(${avatarHue(name)} 45% 46%)` }}>{initials(name)}</Avatar>
  );

/** The card's picture: the image, or the title's initials on a tint where a row has no image (the box keeps its shape,
 *  so the cards of a row stay level). */
const Media = ({ card, aspect, row }: { card: CardItem; aspect: string; row: boolean }) => {
  const shape = row ? { width: '38%', minWidth: 96, maxWidth: 220, alignSelf: 'stretch', flexShrink: 0 } : { width: '100%', aspectRatio: aspect };
  if (card.image) return <CardMedia component="img" image={card.image} alt={card.title} sx={{ ...shape, objectFit: 'cover' }} />;
  return (
    <Box
      className="tj-mui-cardgrid__placeholder"
      aria-hidden
      sx={{ ...shape, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', color: 'text.secondary', typography: 'h5' }}
    >
      {initials(card.title)}
    </Box>
  );
};

const Badge = ({ value }: { value: string }) => <Chip size="small" label={chipLabel(value)} color={TONE_CHIP[chipTone(value)] ?? 'default'} />;

/** The loading look: skeleton cards in the grid's columns, a loaded card's shape (picture, title, a line of text). */
const CardsSkeleton = ({ count, columns, image, aspect }: { count: number; columns: number; image: boolean; aspect: string }) => (
  <Grid container columns={columns} spacing={2} sx={{ p: 0.5 }}>
    {Array.from({ length: count }, (_, i) => (
      <Grid key={i} size={1}>
        <MuiCard variant="outlined">
          {image ? <Skeleton variant="rectangular" sx={{ width: '100%', height: 'auto', aspectRatio: aspect }} /> : null}
          <CardContent>
            <Typography variant="subtitle1">
              <Skeleton width="70%" />
            </Typography>
            <Typography variant="body2">
              <Skeleton width="45%" />
            </Typography>
          </CardContent>
        </MuiCard>
      </Grid>
    ))}
  </Grid>
);

// A Grid of MUI Cards built from data fields, the Ant and shadcn packs' card grid (UI 2.0's Card grid): dataSource,
// titleField, subtitleField, imageField (CardMedia), badgeField / badgeFields (Chips toned by their words),
// eyebrowField, avatarField (image URL or a name), descriptionField, progressField (0 to 100), metaFields
// ('prep:{} min'); layout (stacked, row), columns (0: as many as fit minCardWidth), imageAspect, showImage, variant
// (elevation, outlined) with elevation, highlightSelected, emptyText. A click (or Enter) on a card fires onCardClicked
// with selectedItem, selectedItemId and selectedItemIndex exposed. Big data draws 48 cards, then more as the end
// scrolls into view.
export const CardGrid = () => {
  const [dataSource] = ToolJet.useStateArray({
    name: 'dataSource',
    label: 'Data source',
    initialValue: [
      { id: 1, title: 'Lemon herb roast chicken', category: 'Dinner', description: 'Crisp skin, bright pan sauce' },
      { id: 2, title: 'Miso glazed salmon', category: 'Dinner', description: 'Sweet, salty, ten minutes under the grill' },
      { id: 3, title: 'Blueberry oat pancakes', category: 'Breakfast', description: 'Fluffy, no buttermilk needed' },
    ],
  });
  const [titleField] = useStateText({ name: 'titleField', label: 'Title field', initialValue: 'title' });
  const [subtitleField] = useStateText({ name: 'subtitleField', label: 'Subtitle field', initialValue: '' });
  const [imageField] = useStateText({ name: 'imageField', label: 'Image field', description: 'An image URL field (CardMedia).', initialValue: '' });
  const [badgeField] = useStateText({ name: 'badgeField', label: 'Badge field', initialValue: 'category' });
  const [badgeFields] = ToolJet.useStateArray({ name: 'badgeFields', label: 'Badge fields', description: "More badge fields: ['diet', 'spice'].", initialValue: [] });
  const [eyebrowField] = useStateText({ name: 'eyebrowField', label: 'Eyebrow field', description: 'A small line above the title.', initialValue: '' });
  const [avatarField] = useStateText({ name: 'avatarField', label: 'Avatar field', description: 'An image URL or a name.', initialValue: '' });
  const [descriptionField] = useStateText({ name: 'descriptionField', label: 'Description field', initialValue: 'description' });
  const [progressField] = useStateText({ name: 'progressField', label: 'Progress field', description: 'A percentage, 0 to 100.', initialValue: '' });
  const [metaFields] = ToolJet.useStateArray({ name: 'metaFields', label: 'Meta fields', description: "['prep:{} min', 'serves:Serves']", initialValue: [] });
  const [idField] = useStateText({ name: 'idField', label: 'Id field', initialValue: 'id' });
  const [layout] = ToolJet.useStateEnumeration({ name: 'layout', label: 'Layout', enumDefinition: ['stacked', 'row'], initialValue: 'stacked' });
  const [columns] = ToolJet.useStateNumber({ name: 'columns', label: 'Columns', description: '0 fits as many as minCardWidth allows.', initialValue: 0, min: 0, max: 8 });
  const [minCardWidth] = ToolJet.useStateNumber({ name: 'minCardWidth', label: 'Min card width (px)', initialValue: 240, min: 120 });
  const [imageAspect] = ToolJet.useStateEnumeration({ name: 'imageAspect', label: 'Image aspect', enumDefinition: ASPECTS, initialValue: '16/9' });
  const [showImage] = ToolJet.useStateBoolean({ name: 'showImage', label: 'Show image', initialValue: true });
  const [variant] = ToolJet.useStateEnumeration({ name: 'variant', label: 'Variant', enumDefinition: ['elevation', 'outlined'], initialValue: 'outlined' });
  const [elevation] = ToolJet.useStateNumber({ name: 'elevation', label: 'Elevation', initialValue: 1, min: 0, max: 24, visibleWhen: { key: 'variant', value: 'elevation' } });
  const [highlightSelected] = ToolJet.useStateBoolean({ name: 'highlightSelected', label: 'Highlight the selected card', initialValue: true });
  const [emptyText] = useStateText({ name: 'emptyText', label: 'Empty text', initialValue: 'No items' });
  const onCardClicked = ToolJet.useEventCallback({ name: 'onCardClicked' });
  const { loading } = ToolJet.useControlState();
  const overrides = useThemeStyles();
  // One row of the three sample cards, not a tall box left mostly blank.
  ToolJet.useComponentSettings({ defaultWidth: 43, defaultHeight: 16 });

  const items = useMemo(
    () =>
      cardItems(toArray(dataSource), { titleField, subtitleField, imageField, badgeField, badgeFields, eyebrowField, avatarField, descriptionField, progressField, metaFields, idField }),
    [dataSource, titleField, subtitleField, imageField, badgeField, badgeFields, eyebrowField, avatarField, descriptionField, progressField, metaFields, idField]
  );
  const { selectedItemId, select } = useSelection(items as Selectable[], idField);
  const [rootRef, width] = useWidth();
  const count = gridColumns(columns, width || 960, minCardWidth);
  const aspect = ASPECTS.includes(imageAspect) ? imageAspect.replace('/', ' / ') : '16 / 9';
  // The picture area only when an image field is mapped: without one every card got a large initials panel.
  const pictured = showImage !== false && imageField.trim() !== '';
  const row = layout === 'row';
  const outlined = variant !== 'elevation';
  // The cards are drawn a screenful at a time as the grid scrolls (2,000 at once blocked the page for seconds); the
  // selection and the exposed values cover every item.
  const grow = useGrowingCount(items.length);

  return (
    <MuiProvider overrides={overrides} fill>
      <Loading loading={loading} fill look={<CardsSkeleton count={Math.min(items.length || count, Math.max(count, 3), 6)} columns={count} image={pictured} aspect={aspect} />}>
        <div ref={rootRef} className="tj-mui--fill tj-mui-cardgrid">
          {items.length === 0 ? (
            <Box className="tj-mui-cardgrid__empty" sx={{ height: '100%', minHeight: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
              <Typography variant="body2" color="text.secondary" align="center">
                {emptyText || 'No items'}
              </Typography>
            </Box>
          ) : (
            <Grid container columns={count} spacing={2} sx={{ p: 0.5 }}>
              {items.slice(0, grow.shown).map((card) => {
                const selected = highlightSelected !== false && card.key === selectedItemId;
                return (
                  <Grid key={card.key} size={1} sx={{ display: 'flex', minWidth: 0 }}>
                    <MuiCard
                      variant={outlined ? 'outlined' : 'elevation'}
                      elevation={outlined ? undefined : Math.max(0, Math.min(24, Number(elevation) || 0))}
                      className={selected ? 'tj-mui-gridcard is-selected' : 'tj-mui-gridcard'}
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        display: 'flex',
                        // The selected card: MUI's selected tint and a primary outline (its border stays in place).
                        ...(selected ? { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -1 } : null),
                      }}
                    >
                      <CardActionArea
                        data-active={selected ? '' : undefined}
                        aria-pressed={highlightSelected !== false ? selected : undefined}
                        onClick={() => {
                          select(card as unknown as Selectable);
                          onCardClicked();
                        }}
                        sx={{
                          display: 'flex',
                          flexDirection: row ? 'row' : 'column',
                          alignItems: 'stretch',
                          justifyContent: 'flex-start',
                          height: '100%',
                          '&[data-active]': { bgcolor: 'action.selected' },
                        }}
                      >
                        {pictured ? <Media card={card} aspect={aspect} row={row} /> : null}
                        <CardContent sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.75, p: 2, '&:last-child': { pb: 2 } }}>
                          {card.eyebrow ? (
                            <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.4, ...clamp(1) }}>
                              {card.eyebrow}
                            </Typography>
                          ) : null}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                            {card.avatar ? <RowAvatar image={card.avatar.image} name={card.avatar.name} /> : null}
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography variant="subtitle1" component="div" sx={{ fontWeight: 500, lineHeight: 1.35, ...clamp(2) }}>
                                {card.title}
                              </Typography>
                              {card.subtitle ? (
                                <Typography variant="body2" color="text.secondary" sx={clamp(1)}>
                                  {card.subtitle}
                                </Typography>
                              ) : null}
                            </Box>
                          </Box>
                          {card.badges.length ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {card.badges.map((b, i) => (
                                <Badge key={`${b}-${i}`} value={b} />
                              ))}
                            </Box>
                          ) : null}
                          {card.description ? (
                            <Typography variant="body2" color="text.secondary" sx={clamp(3)}>
                              {card.description}
                            </Typography>
                          ) : null}
                          {card.progress !== null ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress variant="determinate" value={barWidth(card.progress)} sx={{ flex: 1, height: 6, borderRadius: 3 }} />
                              <Typography variant="caption" color="text.secondary">
                                {percentLabel(card.progress)}
                              </Typography>
                            </Box>
                          ) : null}
                          {card.meta ? (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 'auto', ...clamp(2) }}>
                              {card.meta}
                            </Typography>
                          ) : null}
                        </CardContent>
                      </CardActionArea>
                    </MuiCard>
                  </Grid>
                );
              })}
            </Grid>
          )}
          {grow.more ? <div ref={grow.sentinelRef} className="tj-mui-grow-sentinel" aria-hidden /> : null}
        </div>
      </Loading>
    </MuiProvider>
  );
};
