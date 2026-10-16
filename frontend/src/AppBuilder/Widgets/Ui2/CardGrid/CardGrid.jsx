import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { LoadingBox, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { initials, useAutoHeight, useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { cardItems, gridColumns } from '@/AppBuilder/Widgets/Ui2/_sections/sectionsModel';
import { avatarHue } from '@/AppBuilder/Widgets/NewTable/_utils/avatarHue';
import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';
import {
  ACCENT,
  ACCENT_INK,
  Chip,
  InlineProgress,
  RecordAvatar,
  TITLE_FONT,
  onKeyActivate,
  text,
  useHasEvent,
} from '@/AppBuilder/Widgets/Ui2/_sections/sectionParts';

/** The picture of a card: its image, or (none, or one that fails to load) a tinted panel with the title's initials.
 *  Its badges sit over its top left corner. `fill` makes it a side panel as tall as the card (the row layout). */
export const CardImage = ({ src, title, aspect, badges = [], fill = false }) => {
  const [failed, setFailed] = useState(false);
  const hue = avatarHue(title);
  const showImg = src && !failed;
  return (
    <div
      className={cn(
        'relative overflow-hidden',
        fill ? 'w-[38%] min-w-[96px] max-w-[200px] shrink-0 self-stretch' : 'w-full'
      )}
      style={fill ? { minHeight: 120 } : { aspectRatio: aspect }}
      data-image-layout={fill ? 'side' : 'top'}
    >
      {showImg ? (
        <img
          src={src}
          alt={title}
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, hsl(${hue} 70% 92%) 0%, hsl(${(hue + 40) % 360} 65% 84%) 100%)`,
          }}
          data-fallback="initials"
        >
          <span
            className="text-3xl font-semibold tracking-tight"
            style={{ color: `hsl(${hue} 45% 32%)`, fontFamily: TITLE_FONT }}
          >
            {initials(title)}
          </span>
        </div>
      )}
      {badges.length ? (
        <span className="absolute left-3 top-3 flex max-w-[80%] flex-wrap gap-1">
          {badges.map((badge, i) => (
            <Chip key={i} value={badge} onImage />
          ))}
        </span>
      ) : null}
    </div>
  );
};

export const CARD_STYLE = {
  elevated: 'border shadow-sm hover:shadow-md hover:-translate-y-0.5',
  outline: 'border',
  flat: 'border-0',
};

export const CARDS_PER_STEP = 48;

export const ShadCardGrid = (props) => {
  const { properties: p, setExposedVariables, setExposedVariable, fireEvent, id } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const [width, setWidth] = useState(Number(props.width) || 0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width || Number(props.width) || 0);
    return () => ro.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const cards = useMemo(
    () =>
      cardItems(p.data, {
        titleField: p.titleField,
        subtitleField: p.subtitleField,
        imageField: p.imageField,
        badgeField: p.badgeField,
        badgeFields: p.badgeFields,
        eyebrowField: p.eyebrowField,
        avatarField: p.avatarField,
        descriptionField: p.descriptionField,
        progressField: p.progressField,
        metaFields: p.metaFields,
        idField: p.idField,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      stringify(p.data ?? null),
      p.titleField,
      p.subtitleField,
      p.imageField,
      p.badgeField,
      stringify(p.badgeFields ?? null),
      p.eyebrowField,
      p.avatarField,
      p.descriptionField,
      p.progressField,
      p.metaFields,
      p.idField,
    ]
  );
  // A grid draws its first CARDS_PER_STEP cards and a button for the next ones: a 10,000-row binding drew every card
  // (over 100,000 elements) and froze the page. A new data binding starts again from the first step.
  const [shownCount, setShownCount] = useState(CARDS_PER_STEP);
  useEffect(() => setShownCount(CARDS_PER_STEP), [cards]);
  const [selected, setSelected] = useState(null);
  useExposed(setExposedVariables, p, {
    selectedItem: selected?.row ?? {},
    selectedItemId: selected ? selected.row?.[text(p.idField) || 'id'] ?? null : null,
  });
  const hasClick = useHasEvent(id, 'onCardClicked');
  const columns = gridColumns(p.columns, width || Number(props.width) || 960, p.minCardWidth);
  const aspect = ['16/9', '4/3', '1/1'].includes(p.imageAspect) ? p.imageAspect.replace('/', ' / ') : '4 / 3';
  // The picture area only when an image field is mapped: without one every card got a large initials panel, which
  // took most of the card on menus, tickets and figures that have no picture.
  const showImage = p.showImage !== false && typeof p.imageField === 'string' && p.imageField.trim() !== '';
  const style = ['elevated', 'outline', 'flat'].includes(p.cardStyle) ? p.cardStyle : 'elevated';
  const row = p.layout === 'row';

  const click = (card) => {
    if (busy(p)) return;
    setSelected(card);
    setExposedVariable('selectedItem', card.row);
    setExposedVariable('selectedItemId', card.row?.[text(p.idField) || 'id'] ?? null);
    fireEvent('onCardClicked');
  };

  let body;
  if (p.loadingState && !wantsSkeleton(p)) {
    body = <LoadingBox height={props.height} />;
  } else if (p.loadingState) {
    body = (
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className={cn('flex gap-3 rounded-xl border p-0', row ? 'flex-row' : 'flex-col')}>
            {showImage ? (
              <Skeleton
                className={cn('rounded-none', row ? 'w-[38%] max-w-[200px]' : 'w-full')}
                style={row ? { minHeight: 120 } : { aspectRatio: aspect }}
              />
            ) : null}
            <div className="flex flex-col gap-2 p-4">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  } else if (!cards.length) {
    body = (
      <p className="m-0 py-10 text-center text-sm text-muted-foreground">{text(p.emptyText) || 'Nothing here yet'}</p>
    );
  } else {
    body = (
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {cards.slice(0, shownCount).map((card) => {
          const isSelected = p.highlightSelected !== false && selected?.key === card.key;
          // With a picture on top, the badges sit on it; otherwise one badge goes beside the title and several in a
          // row under it.
          const badgesOnImage = showImage && !row;
          const badgeBeside = !badgesOnImage && card.badges.length === 1;
          const badgeRow = !badgesOnImage && card.badges.length > 1;
          return (
            <div
              key={card.key}
              role="button"
              tabIndex={0}
              onClick={() => click(card)}
              onKeyDown={onKeyActivate(() => click(card))}
              data-layout={row ? 'row' : 'stacked'}
              className={cn(
                'group flex min-w-0 overflow-hidden text-left outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[color:var(--lk-accent,var(--sc-ring))]',
                row ? 'flex-row' : 'flex-col',
                CARD_STYLE[style],
                // The pack's border reset beats an inline border colour, so Card border color and the selected card's
                // accent edge never showed; the colour goes through a variable the border class reads.
                'border-[color:var(--cg-border)]',
                (hasClick || p.highlightSelected !== false) && !busy(p) && 'cursor-pointer'
              )}
              style={{
                borderRadius: 'var(--lk-radius,calc(var(--sc-radius) + 4px))',
                '--cg-border': isSelected ? ACCENT : 'var(--lk-border,var(--sc-border))',
                boxShadow: isSelected ? `0 0 0 2px ${ACCENT}` : undefined,
                background: style === 'flat' ? 'var(--lk-bg,var(--sc-muted))' : 'var(--lk-bg,var(--sc-card))',
              }}
              data-selected={isSelected || undefined}
            >
              {showImage ? (
                <CardImage
                  src={card.image}
                  title={card.title}
                  aspect={aspect}
                  badges={badgesOnImage ? card.badges : []}
                  fill={row}
                />
              ) : null}
              <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-4">
                {card.eyebrow ? (
                  <span
                    className="truncate text-[11px] font-semibold uppercase tracking-[0.12em]"
                    style={{ color: ACCENT_INK }}
                    data-part="eyebrow"
                  >
                    {card.eyebrow}
                  </span>
                ) : null}
                <div className="flex min-w-0 items-start gap-3">
                  {card.avatar ? <RecordAvatar src={card.avatar.image} name={card.avatar.name} size={36} /> : null}
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    {/* The title takes 60% of the row; a badge wider than the room left wraps under it, and one wider
                        than the card ends in an ellipsis. A long badge beside the title ("-$19,305.50 vs last week")
                        was cut off. */}
                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-2 gap-y-1.5">
                      <span
                        className="line-clamp-2 min-w-0 flex-[1_1_60%] text-base font-semibold leading-snug"
                        style={{
                          color: 'var(--lk-title,var(--sc-foreground))',
                          fontFamily: TITLE_FONT,
                        }}
                      >
                        {card.title}
                      </span>
                      {badgeBeside ? (
                        <span className="flex min-w-0 max-w-full">
                          <Chip value={card.badges[0]} />
                        </span>
                      ) : null}
                    </div>
                    {card.subtitle ? (
                      <span
                        className="truncate text-sm"
                        style={{
                          color: 'var(--lk-fg,var(--sc-muted-foreground))',
                        }}
                      >
                        {card.subtitle}
                      </span>
                    ) : null}
                  </div>
                </div>
                {badgeRow ? (
                  <span className="flex min-w-0 flex-wrap gap-1.5">
                    {card.badges.map((badge, i) => (
                      <Chip key={i} value={badge} />
                    ))}
                  </span>
                ) : null}
                {card.description ? (
                  <p className="m-0 line-clamp-2 text-sm leading-relaxed text-[color:var(--sc-foreground)] opacity-80">
                    {card.description}
                  </p>
                ) : null}
                {card.progress !== null ? <InlineProgress pct={card.progress} className="mt-auto pt-2" /> : null}
                {card.meta ? (
                  <span
                    className={cn(
                      'pt-2 text-xs font-medium tabular-nums',
                      card.progress === null ? 'mt-auto' : 'pt-0.5'
                    )}
                    style={{ color: 'var(--lk-fg,var(--sc-muted-foreground))' }}
                  >
                    {card.meta}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
        {cards.length > shownCount ? (
          <div className="col-span-full flex justify-center pt-1">
            <button
              type="button"
              onClick={() => setShownCount((n) => n + CARDS_PER_STEP)}
              className="rounded-md border border-[color:var(--lk-border,var(--sc-border))] px-3 py-1.5 text-sm text-[color:var(--sc-muted-foreground)] transition-colors hover:bg-[color:var(--sc-muted)] hover:text-[color:var(--sc-foreground)]"
            >
              {`Show ${Math.min(CARDS_PER_STEP, cards.length - shownCount)} more of ${cards.length - shownCount}`}
            </button>
          </div>
        ) : null}
      </div>
    );
  }
  return (
    <Shell {...props} innerRef={ref}>
      {body}
    </Shell>
  );
};

export default withControlState(ShadCardGrid);
