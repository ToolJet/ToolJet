import React, { useMemo, useRef, useState } from 'react';
import { LoadingBox, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import {
  rootWidth,
  useAutoHeight,
  useExposed,
  useStable,
  withControlState,
} from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { initials } from '@/AppBuilder/Widgets/Ui2/_shared/avatarHue';
import { Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { cardItems, gridColumns, type CardItem } from '@/AppBuilder/Widgets/Ui2/_sections/sectionsModel';
import type { StyleWithVars, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { avatarHue } from '@/AppBuilder/Widgets/Ui2/_shared/avatarHue';
import {
  ACCENT,
  ACCENT_INK,
  Chip,
  EmptyText,
  InlineProgress,
  RecordAvatar,
  TITLE_FONT,
} from '@/AppBuilder/Widgets/Ui2/_sections/sectionParts';
import { useHasEvent } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { toText } from '@/AppBuilder/Widgets/Ui2/_shared/values';
import { onKeyActivate } from '@/AppBuilder/Widgets/Ui2/_shared/keyboard';
import { ShowMore, useShownCount } from '@/AppBuilder/Widgets/Ui2/_shared/ShowMore';

/** The picture of a card: its image, or (none, or one that fails to load) a tinted panel with the title's initials.
 *  Its badges sit over its top left corner. `fill` makes it a side panel as tall as the card (the row layout). */
export const CardImage = ({
  src,
  title,
  aspect,
  badges = [],
  fill = false,
}: {
  src: string;
  title: string;
  aspect: string;
  badges?: string[];
  fill?: boolean;
}) => {
  const [failed, setFailed] = useState(false);
  const hue = avatarHue(title);
  const showImg = src && !failed;
  return (
    <div
      className={cn(
        'tw-relative tw-overflow-hidden',
        fill ? 'tw-w-[38%] tw-min-w-[96px] tw-max-w-[200px] tw-shrink-0 tw-self-stretch' : 'tw-w-full'
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
          className="tw-absolute tw-inset-0 tw-h-full tw-w-full tw-object-cover"
        />
      ) : (
        <div
          className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center"
          style={{
            background: `linear-gradient(135deg, hsl(${hue} 70% 92%) 0%, hsl(${(hue + 40) % 360} 65% 84%) 100%)`,
          }}
          data-fallback="initials"
        >
          <span
            className="tw-text-3xl tw-font-semibold tw-tracking-tight"
            style={{ color: `hsl(${hue} 45% 32%)`, fontFamily: TITLE_FONT }}
          >
            {initials(title)}
          </span>
        </div>
      )}
      {badges.length ? (
        <span className="tw-absolute tw-left-3 tw-top-3 tw-flex tw-max-w-[80%] tw-flex-wrap tw-gap-1">
          {badges.map((badge, i) => (
            <Chip key={i} value={badge} onImage />
          ))}
        </span>
      ) : null}
    </div>
  );
};

export const CARD_STYLE: Record<string, string> = {
  elevated: 'tw-border tw-shadow-sm hover:tw-shadow-md hover:-tw-translate-y-0.5',
  outline: 'tw-border',
  flat: 'tw-border-0',
};

export const CARDS_PER_STEP = 48;

export const ShadCardGrid = (props: WidgetProps) => {
  const { properties: p, setExposedVariables, setExposedVariable, fireEvent, id } = props;
  const ref = useRef<HTMLDivElement>(null);
  useAutoHeight(props, ref);
  // The root has no padding of its own, so its width is the box's.
  const width = rootWidth(props.width);
  const data = useStable(p.data);
  const badgeFields = useStable(p.badgeFields);
  const metaFields = useStable(p.metaFields);
  const { titleField, subtitleField, imageField, badgeField, eyebrowField, avatarField, descriptionField } = p;
  const { progressField, idField } = p;
  const cards = useMemo(
    () =>
      cardItems(data, {
        titleField,
        subtitleField,
        imageField,
        badgeField,
        badgeFields,
        eyebrowField,
        avatarField,
        descriptionField,
        progressField,
        metaFields,
        idField,
      }),
    [
      data,
      titleField,
      subtitleField,
      imageField,
      badgeField,
      badgeFields,
      eyebrowField,
      avatarField,
      descriptionField,
      progressField,
      metaFields,
      idField,
    ]
  );
  // A grid draws its first CARDS_PER_STEP cards and a button for the next ones: a 10,000-row binding drew every card
  // (over 100,000 elements) and froze the page. A new data binding starts again from the first step.
  const [shownCount, showMore] = useShownCount(CARDS_PER_STEP, cards);
  const [selected, setSelected] = useState<CardItem | null>(null);
  useExposed(setExposedVariables, p, {
    selectedItem: selected?.row ?? {},
    selectedItemId: selected ? selected.row?.[toText(p.idField) || 'id'] ?? null : null,
  });
  const hasClick = useHasEvent(id, 'onCardClicked');
  const columns = gridColumns(p.columns, width || Number(props.width) || 960, p.minCardWidth);
  const aspect = ['16/9', '4/3', '1/1'].includes(p.imageAspect) ? p.imageAspect.replace('/', ' / ') : '4 / 3';
  // The picture area only when an image field is mapped: without one every card got a large initials panel, which
  // took most of the card on menus, tickets and figures that have no picture.
  const showImage = p.showImage !== false && typeof p.imageField === 'string' && p.imageField.trim() !== '';
  const style = ['elevated', 'outline', 'flat'].includes(p.cardStyle) ? p.cardStyle : 'elevated';
  const row = p.layout === 'row';

  const click = (card: CardItem) => {
    if (busy(p)) return;
    setSelected(card);
    setExposedVariable('selectedItem', card.row);
    setExposedVariable('selectedItemId', card.row?.[toText(p.idField) || 'id'] ?? null);
    fireEvent('onCardClicked');
  };

  let body;
  if (p.loadingState && !wantsSkeleton(p)) {
    body = <LoadingBox height={props.height} />;
  } else if (p.loadingState) {
    body = (
      <div className="tw-grid tw-gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            className={cn('tw-flex tw-gap-3 tw-rounded-ui2-xl tw-border tw-p-0', row ? 'tw-flex-row' : 'tw-flex-col')}
          >
            {showImage ? (
              <Skeleton
                className={cn('tw-rounded-none', row ? 'tw-w-[38%] tw-max-w-[200px]' : 'tw-w-full')}
                style={row ? { minHeight: 120 } : { aspectRatio: aspect }}
              />
            ) : null}
            <div className="tw-flex tw-flex-col tw-gap-2 tw-p-4">
              <Skeleton className="tw-h-4 tw-w-2/3" />
              <Skeleton className="tw-h-3 tw-w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  } else if (!cards.length) {
    body = <EmptyText text={p.emptyText} fallback="Nothing here yet" />;
  } else {
    body = (
      <div className="tw-grid tw-gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
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
                'tw-group tw-flex tw-min-w-0 tw-overflow-hidden tw-text-left tw-outline-none tw-transition-all tw-duration-200 focus-visible:tw-ring-2 focus-visible:tw-ring-[color:var(--lk-accent,var(--sc-ring))]',
                row ? 'tw-flex-row' : 'tw-flex-col',
                CARD_STYLE[style],
                // The pack's border reset beats an inline border colour, so Card border color and the selected card's
                // accent edge never showed; the colour goes through a variable the border class reads.
                'tw-border-[color:var(--cg-border)]',
                (hasClick || p.highlightSelected !== false) && !busy(p) && 'tw-cursor-pointer'
              )}
              style={
                {
                  borderRadius: 'var(--lk-radius,calc(var(--sc-radius) + 4px))',
                  '--cg-border': isSelected ? ACCENT : 'var(--lk-border,var(--sc-border))',
                  boxShadow: isSelected ? `0 0 0 2px ${ACCENT}` : undefined,
                  background: style === 'flat' ? 'var(--lk-bg,var(--sc-muted))' : 'var(--lk-bg,var(--sc-card))',
                } as StyleWithVars
              }
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
              <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-1.5 tw-p-4">
                {card.eyebrow ? (
                  <span
                    className="tw-truncate tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.12em]"
                    style={{ color: ACCENT_INK }}
                    data-part="eyebrow"
                  >
                    {card.eyebrow}
                  </span>
                ) : null}
                <div className="tw-flex tw-min-w-0 tw-items-start tw-gap-3">
                  {card.avatar ? <RecordAvatar src={card.avatar.image} name={card.avatar.name} size={36} /> : null}
                  <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-1">
                    {/* The title takes 60% of the row; a badge wider than the room left wraps under it, and one wider
                        than the card ends in an ellipsis. A long badge beside the title ("-$19,305.50 vs last week")
                        was cut off. */}
                    <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-start tw-justify-between tw-gap-x-2 tw-gap-y-1.5">
                      <span
                        className="tw-line-clamp-2 tw-min-w-0 tw-flex-[1_1_60%] tw-text-ui2-base tw-font-semibold tw-leading-snug"
                        style={{
                          color: 'var(--lk-title,var(--sc-foreground))',
                          fontFamily: TITLE_FONT,
                        }}
                      >
                        {card.title}
                      </span>
                      {badgeBeside ? (
                        <span className="tw-flex tw-min-w-0 tw-max-w-full">
                          <Chip value={card.badges[0]} />
                        </span>
                      ) : null}
                    </div>
                    {card.subtitle ? (
                      <span
                        className="tw-truncate tw-text-ui2-sm"
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
                  <span className="tw-flex tw-min-w-0 tw-flex-wrap tw-gap-1.5">
                    {card.badges.map((badge, i) => (
                      <Chip key={i} value={badge} />
                    ))}
                  </span>
                ) : null}
                {card.description ? (
                  <p className="tw-m-0 tw-line-clamp-2 tw-text-ui2-sm tw-leading-relaxed tw-text-[color:var(--sc-foreground)] tw-opacity-80">
                    {card.description}
                  </p>
                ) : null}
                {card.progress !== null ? <InlineProgress pct={card.progress} className="tw-mt-auto tw-pt-2" /> : null}
                {card.meta ? (
                  <span
                    className={cn(
                      'tw-pt-2 tw-text-xs tw-font-medium tw-tabular-nums',
                      card.progress === null ? 'tw-mt-auto' : 'tw-pt-0.5'
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
          <div className="tw-col-span-full tw-flex tw-justify-center tw-pt-1">
            <ShowMore
              remaining={cards.length - shownCount}
              step={CARDS_PER_STEP}
              onMore={showMore}
              className="tw-rounded-ui2-md tw-border tw-border-[color:var(--lk-border,var(--sc-border))] tw-px-3 tw-py-1.5 tw-text-ui2-sm tw-text-[color:var(--sc-muted-foreground)] tw-transition-colors hover:tw-bg-[color:var(--sc-muted)] hover:tw-text-[color:var(--sc-foreground)]"
            />
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
