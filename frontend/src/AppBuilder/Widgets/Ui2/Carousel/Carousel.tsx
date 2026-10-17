import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { useAutoHeight, useExposed, useLatest, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { Button, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import {
  aspectRatio,
  carouselPositions,
  carouselSlides,
  clampUnwrapped,
  moveIndex,
} from '@/AppBuilder/Widgets/Ui2/_actions/actionsModel';
import { safeImageUrl, safeUrl } from '@/AppBuilder/Widgets/Ui2/_shared/values';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';

// ---- Carousel ----------------------------------------------------------------------------------------------------

const ARROW =
  'tw-absolute tw-top-1/2 tw-z-10 tw-h-8 tw-w-8 -tw-translate-y-1/2 tw-rounded-full tw-border tw-border-solid tw-border-[color:var(--sc-border)] tw-p-0 tw-shadow-sm tw-backdrop-blur tw-bg-[color:var(--lk-arrow-bg,color-mix(in_srgb,var(--sc-background)_85%,transparent))] tw-text-[color:var(--lk-arrow-fg,var(--sc-foreground))] hover:tw-bg-[color:var(--lk-arrow-bg,var(--sc-background))] hover:tw-text-[color:var(--lk-arrow-fg,var(--sc-foreground))] disabled:tw-opacity-40';

export const SLIDE_RADIUS = 'tw-rounded-[var(--lk-radius,calc(var(--sc-radius)+4px))]';

export const ShadCarousel = (props: WidgetProps) => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent, height, currentMode } = props;
  const ref = useRef<HTMLDivElement>(null);
  useAutoHeight(props, ref);
  const slides = carouselSlides(properties.slides);
  const perView = Math.min(clampUnwrapped(properties.slidesPerView, 1, 4, 1), Math.max(1, slides.length));
  const positions = carouselPositions(slides.length, perView);
  const loop = properties.loop !== false;
  const authored = clampUnwrapped(properties.defaultIndex, 0, 100000, 0);
  const initial = moveIndex(authored, positions, false);
  const [index, setIndex] = useState(initial);
  const indexRef = useRef(initial);
  // A new defaultIndex ("Start at slide") moves to it. New slides or a new slides-per-view keep the current slide,
  // only brought back within the positions there are now; neither fires onSlideChanged (a passive refresh).
  const authoredRef = useRef(authored);
  useEffect(() => {
    const next = moveIndex(authoredRef.current === authored ? indexRef.current : authored, positions, false);
    authoredRef.current = authored;
    if (next === indexRef.current) return;
    indexRef.current = next;
    setIndex(next);
  }, [authored, positions]);
  // The image URL that failed, by slide: a slide shows its image again when new data brings another URL.
  const [failed, setFailed] = useState<Record<number, string>>({});
  const [hovered, setHovered] = useState(false);
  const disabled = busy(properties);
  const live = useLatest({ positions, loop, slides });

  const go = (to: number) => {
    const { positions: count, loop: wrap, slides: list } = live.current;
    const next = moveIndex(to, count, wrap);
    if (next === indexRef.current) return;
    indexRef.current = next;
    setIndex(next);
    setExposedVariables({ currentIndex: next, currentSlide: list[next] || {} });
    fireEvent('onSlideChanged');
  };
  useExposed(setExposedVariables, properties, {
    currentIndex: index,
    currentSlide: slides[index] || {},
    next: async () => go(indexRef.current + 1),
    previous: async () => go(indexRef.current - 1),
    goTo: async (i: unknown) => go(clampUnwrapped(i, -100000, 100000, 0)),
  });

  const latestGo = useLatest(go);
  const autoplay =
    properties.autoplay === true && positions > 1 && !disabled && !(properties.pauseOnHover !== false && hovered);
  const interval = clampUnwrapped(properties.interval, 1000, 600000, 5000);
  useEffect(() => {
    if (!autoplay) return undefined;
    const timer = setInterval(() => {
      const { positions: count, loop: wrap } = live.current;
      latestGo.current(!wrap && indexRef.current >= count - 1 ? 0 : indexRef.current + 1);
    }, interval);
    return () => clearInterval(timer);
  }, [autoplay, interval, live, latestGo]);

  // Swipes: a horizontal drag of 40px or more moves a slide, and is not a click.
  const drag = useRef<{ x: number | null; swiped: boolean }>({ x: null, swiped: false });
  const ratio = aspectRatio(properties.aspectRatio);
  const fill = ratio === null;
  const caption = ['overlay', 'below', 'none'].includes(properties.captionPosition)
    ? properties.captionPosition
    : 'overlay';
  const fit = properties.imageFit === 'contain' ? 'tw-object-contain' : 'tw-object-cover';
  const gap = perView > 1 ? 'var(--lk-gap, 16px)' : 'var(--lk-gap, 0px)';
  const step = `((100% - (${perView} - 1) * ${gap}) / ${perView} + ${gap})`;
  const canPrev = positions > 1 && (loop || index > 0);
  const canNext = positions > 1 && (loop || index < positions - 1);

  const clickSlide = (i: number) => {
    if (drag.current.swiped) return;
    const slide = slides[i];
    setExposedVariable('clickedSlide', { ...slide, index: i });
    fireEvent('onSlideClicked');
    if (safeUrl(slide?.link) && currentMode !== 'edit' && typeof window !== 'undefined') {
      window.open(safeUrl(slide.link), '_blank', 'noopener,noreferrer');
    }
  };

  if (!slides.length) {
    return (
      <Shell {...props} innerRef={ref}>
        <div
          className={cn(
            'tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-border tw-border-dashed tw-border-[color:var(--sc-border)] tw-text-ui2-sm tw-text-[color:var(--sc-muted-foreground)]',
            SLIDE_RADIUS
          )}
          style={fill ? { height } : { aspectRatio: ratio }}
        >
          <ImageOff className="tw-h-5 tw-w-5" />
          No slides
        </div>
      </Shell>
    );
  }

  return (
    <Shell {...props} innerRef={ref}>
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Carousel"
        tabIndex={0}
        className={cn(
          'tw-relative tw-flex tw-flex-col tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-[color:var(--sc-ring)]',
          SLIDE_RADIUS
        )}
        style={fill ? { height } : undefined}
        onKeyDown={(e) => {
          // Disabled, the arrow keys do nothing, as the arrow buttons and swipes.
          if (disabled) return;
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            go(indexRef.current - 1);
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            go(indexRef.current + 1);
          }
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, swiped: false };
        }}
        onPointerUp={(e) => {
          const start = drag.current.x;
          if (start === null || start === undefined || disabled) return;
          const dx = e.clientX - start;
          if (Math.abs(dx) >= 40) {
            drag.current.swiped = true;
            go(indexRef.current + (dx < 0 ? 1 : -1));
            setTimeout(() => (drag.current.swiped = false), 0);
          }
          drag.current.x = null;
        }}
      >
        <div className={cn('tw-relative tw-overflow-hidden', SLIDE_RADIUS, fill && 'tw-min-h-0 tw-flex-1')}>
          <div
            className="tw-flex tw-h-full tw-touch-pan-y tw-transition-transform tw-duration-500 tw-ease-out motion-reduce:tw-transition-none"
            style={{ columnGap: gap, transform: `translateX(calc(-1 * ${index} * ${step}))` }}
          >
            {slides.map((slide, i) => {
              const showImage = !!safeImageUrl(slide.image) && failed[i] !== safeImageUrl(slide.image);
              const visible = i >= index && i < index + perView;
              return (
                <div
                  key={i}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${slides.length}`}
                  aria-hidden={visible ? undefined : true}
                  className={cn('tw-flex tw-min-w-0 tw-shrink-0 tw-grow-0 tw-flex-col', fill && 'tw-h-full')}
                  style={{ flexBasis: `calc((100% - (${perView} - 1) * ${gap}) / ${perView})` }}
                >
                  <div
                    className={cn(
                      'tw-relative tw-overflow-hidden tw-bg-[color:var(--lk-slide-bg,var(--sc-muted))]',
                      SLIDE_RADIUS,
                      fill && 'tw-min-h-0 tw-flex-1',
                      'tw-cursor-pointer'
                    )}
                    style={fill ? undefined : { aspectRatio: ratio }}
                    onClick={() => clickSlide(i)}
                  >
                    {showImage ? (
                      <img
                        src={safeImageUrl(slide.image)}
                        alt={slide.title || `Slide ${i + 1}`}
                        loading={i <= index + perView ? 'eager' : 'lazy'}
                        draggable={false}
                        onError={() => setFailed((f) => ({ ...f, [i]: safeImageUrl(slide.image) }))}
                        className={cn('tw-absolute tw-inset-0 tw-h-full tw-w-full tw-select-none', fit)}
                      />
                    ) : (
                      <div className="tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-1 tw-p-6 tw-text-center">
                        {slide.image ? (
                          <ImageOff className="tw-h-6 tw-w-6 tw-text-[color:var(--sc-muted-foreground)]" />
                        ) : (
                          <>
                            <span className="tw-text-ui2-lg tw-font-semibold tw-text-[color:var(--lk-title,var(--sc-foreground))]">
                              {slide.title}
                            </span>
                            {slide.description ? (
                              <span className="tw-max-w-md tw-text-ui2-sm tw-text-[color:var(--lk-desc,var(--sc-muted-foreground))]">
                                {slide.description}
                              </span>
                            ) : null}
                          </>
                        )}
                      </div>
                    )}
                    {caption === 'overlay' && showImage && (slide.title || slide.description) ? (
                      <div className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-bottom-0 tw-flex tw-flex-col tw-gap-0.5 tw-px-4 tw-pb-3 tw-pt-10 tw-text-[color:var(--lk-caption-fg,#fff)] [background:var(--lk-caption-bg,linear-gradient(to_top,rgb(0_0_0/0.68),rgb(0_0_0/0)))]">
                        {slide.title ? (
                          <span className="tw-truncate tw-text-ui2-sm tw-font-semibold">{slide.title}</span>
                        ) : null}
                        {slide.description ? (
                          <span className="tw-line-clamp-2 tw-text-xs tw-opacity-90">{slide.description}</span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  {caption === 'below' && (slide.title || slide.description) && showImage ? (
                    <div className="tw-flex tw-shrink-0 tw-flex-col tw-gap-0.5 tw-pt-3">
                      {slide.title ? (
                        <span className="tw-truncate tw-text-ui2-sm tw-font-medium tw-text-[color:var(--lk-title,var(--sc-foreground))]">
                          {slide.title}
                        </span>
                      ) : null}
                      {slide.description ? (
                        <span className="tw-line-clamp-2 tw-text-ui2-sm tw-text-[color:var(--lk-desc,var(--sc-muted-foreground))]">
                          {slide.description}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          {properties.showArrows !== false && positions > 1 ? (
            <>
              <Button
                variant="outline"
                size="icon"
                aria-label="Previous slide"
                disabled={disabled || !canPrev}
                className={cn(ARROW, 'tw-left-3')}
                onClick={() => go(indexRef.current - 1)}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Next slide"
                disabled={disabled || !canNext}
                className={cn(ARROW, 'tw-right-3')}
                onClick={() => go(indexRef.current + 1)}
              >
                <ChevronRight />
              </Button>
            </>
          ) : null}
        </div>
        {properties.showDots !== false && positions > 1 ? (
          <div className="tw-flex tw-h-7 tw-shrink-0 tw-items-center tw-justify-center">
            {Array.from({ length: Math.min(positions, 30) }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index ? 'true' : undefined}
                disabled={disabled}
                onClick={() => go(i)}
                // A 24px touch target (WCAG 2.5.8) around the small dot it draws.
                className="tw-group tw-inline-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-ui2-ring"
              >
                <span
                  className={cn(
                    'tw-h-1.5 tw-rounded-full tw-transition-all',
                    i === index
                      ? 'tw-w-4 tw-bg-[color:var(--lk-dot-active,var(--sc-primary))]'
                      : 'tw-w-1.5 tw-bg-[color:var(--lk-dot,color-mix(in_srgb,var(--sc-foreground)_20%,transparent))] group-hover:tw-bg-[color:var(--lk-dot-active,color-mix(in_srgb,var(--sc-foreground)_40%,transparent))]'
                  )}
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </Shell>
  );
};

export default withControlState(ShadCarousel);
