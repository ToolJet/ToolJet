import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { useAutoHeight, useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { Button, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import {
  aspectRatio,
  carouselPositions,
  carouselSlides,
  clampInt,
  moveIndex,
} from '@/AppBuilder/Widgets/Ui2/_actions/actionsModel';
import { useLive } from '@/AppBuilder/Widgets/Ui2/_actions/actionParts';

// ---- Carousel ----------------------------------------------------------------------------------------------------

const ARROW =
  'absolute top-1/2 z-10 h-8 w-8 -translate-y-1/2 rounded-full border border-solid border-[color:var(--sc-border)] p-0 shadow-sm backdrop-blur bg-[color:var(--lk-arrow-bg,color-mix(in_srgb,var(--sc-background)_85%,transparent))] text-[color:var(--lk-arrow-fg,var(--sc-foreground))] hover:bg-[color:var(--lk-arrow-bg,var(--sc-background))] hover:text-[color:var(--lk-arrow-fg,var(--sc-foreground))] disabled:opacity-40';

export const SLIDE_RADIUS = 'rounded-[var(--lk-radius,calc(var(--sc-radius)+4px))]';

export const ShadCarousel = (props) => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent, height, currentMode } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const slides = carouselSlides(properties.slides);
  const perView = Math.min(clampInt(properties.slidesPerView, 1, 4, 1), Math.max(1, slides.length));
  const positions = carouselPositions(slides.length, perView);
  const loop = properties.loop !== false;
  const initial = moveIndex(clampInt(properties.defaultIndex, 0, 100000, 0), positions, false);
  const [index, setIndex] = useState(initial);
  const indexRef = useRef(initial);
  useEffect(() => {
    indexRef.current = initial;
    setIndex(initial);
  }, [initial, positions]);
  const [failed, setFailed] = useState({});
  const [hovered, setHovered] = useState(false);
  const disabled = busy(properties);
  const live = useLive({ positions, loop, slides });

  const go = (to) => {
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
    goTo: async (i) => go(clampInt(i, -100000, 100000, 0)),
  });

  const autoplay =
    properties.autoplay === true && positions > 1 && !disabled && !(properties.pauseOnHover !== false && hovered);
  const interval = clampInt(properties.interval, 1000, 600000, 5000);
  useEffect(() => {
    if (!autoplay) return undefined;
    const timer = setInterval(() => {
      const { positions: count, loop: wrap } = live.current;
      go(!wrap && indexRef.current >= count - 1 ? 0 : indexRef.current + 1);
    }, interval);
    return () => clearInterval(timer);
  }, [autoplay, interval]); // eslint-disable-line react-hooks/exhaustive-deps

  // Swipes: a horizontal drag of 40px or more moves a slide, and is not a click.
  const drag = useRef({ x: null, swiped: false });
  const ratio = aspectRatio(properties.aspectRatio);
  const fill = ratio === null;
  const caption = ['overlay', 'below', 'none'].includes(properties.captionPosition)
    ? properties.captionPosition
    : 'overlay';
  const fit = properties.imageFit === 'contain' ? 'object-contain' : 'object-cover';
  const gap = perView > 1 ? 'var(--lk-gap, 16px)' : 'var(--lk-gap, 0px)';
  const step = `((100% - (${perView} - 1) * ${gap}) / ${perView} + ${gap})`;
  const canPrev = positions > 1 && (loop || index > 0);
  const canNext = positions > 1 && (loop || index < positions - 1);

  const clickSlide = (i) => {
    if (drag.current.swiped) return;
    const slide = slides[i];
    setExposedVariable('clickedSlide', { ...slide, index: i });
    fireEvent('onSlideClicked');
    if (slide?.link && currentMode !== 'edit' && typeof window !== 'undefined') {
      window.open(slide.link, '_blank', 'noopener,noreferrer');
    }
  };

  if (!slides.length) {
    return (
      <Shell {...props} innerRef={ref}>
        <div
          className={cn(
            'flex flex-col items-center justify-center gap-2 border border-dashed border-[color:var(--sc-border)] text-sm text-[color:var(--sc-muted-foreground)]',
            SLIDE_RADIUS
          )}
          style={fill ? { height } : { aspectRatio: ratio }}
        >
          <ImageOff className="h-5 w-5" />
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
          'relative flex flex-col outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--sc-ring)]',
          SLIDE_RADIUS
        )}
        style={fill ? { height } : undefined}
        onKeyDown={(e) => {
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
        <div className={cn('relative overflow-hidden', SLIDE_RADIUS, fill && 'min-h-0 flex-1')}>
          <div
            className="flex h-full touch-pan-y transition-transform duration-500 ease-out motion-reduce:transition-none"
            style={{ columnGap: gap, transform: `translateX(calc(-1 * ${index} * ${step}))` }}
          >
            {slides.map((slide, i) => {
              const showImage = slide.image && !failed[i];
              const visible = i >= index && i < index + perView;
              return (
                <div
                  key={i}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${slides.length}`}
                  aria-hidden={visible ? undefined : true}
                  className={cn('flex min-w-0 shrink-0 grow-0 flex-col', fill && 'h-full')}
                  style={{ flexBasis: `calc((100% - (${perView} - 1) * ${gap}) / ${perView})` }}
                >
                  <div
                    className={cn(
                      'relative overflow-hidden bg-[color:var(--lk-slide-bg,var(--sc-muted))]',
                      SLIDE_RADIUS,
                      fill && 'min-h-0 flex-1',
                      'cursor-pointer'
                    )}
                    style={fill ? undefined : { aspectRatio: ratio }}
                    onClick={() => clickSlide(i)}
                  >
                    {showImage ? (
                      <img
                        src={slide.image}
                        alt={slide.title || `Slide ${i + 1}`}
                        loading={i <= index + perView ? 'eager' : 'lazy'}
                        draggable={false}
                        onError={() => setFailed((f) => ({ ...f, [i]: true }))}
                        className={cn('absolute inset-0 h-full w-full select-none', fit)}
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-6 text-center">
                        {slide.image ? (
                          <ImageOff className="h-6 w-6 text-[color:var(--sc-muted-foreground)]" />
                        ) : (
                          <>
                            <span className="text-lg font-semibold text-[color:var(--lk-title,var(--sc-foreground))]">
                              {slide.title}
                            </span>
                            {slide.description ? (
                              <span className="max-w-md text-sm text-[color:var(--lk-desc,var(--sc-muted-foreground))]">
                                {slide.description}
                              </span>
                            ) : null}
                          </>
                        )}
                      </div>
                    )}
                    {caption === 'overlay' && showImage && (slide.title || slide.description) ? (
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-0.5 px-4 pb-3 pt-10 text-[color:var(--lk-caption-fg,#fff)] [background:var(--lk-caption-bg,linear-gradient(to_top,rgb(0_0_0/0.68),rgb(0_0_0/0)))]">
                        {slide.title ? <span className="truncate text-sm font-semibold">{slide.title}</span> : null}
                        {slide.description ? (
                          <span className="line-clamp-2 text-xs opacity-90">{slide.description}</span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  {caption === 'below' && (slide.title || slide.description) && showImage ? (
                    <div className="flex shrink-0 flex-col gap-0.5 pt-3">
                      {slide.title ? (
                        <span className="truncate text-sm font-medium text-[color:var(--lk-title,var(--sc-foreground))]">
                          {slide.title}
                        </span>
                      ) : null}
                      {slide.description ? (
                        <span className="line-clamp-2 text-sm text-[color:var(--lk-desc,var(--sc-muted-foreground))]">
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
                className={cn(ARROW, 'left-3')}
                onClick={() => go(indexRef.current - 1)}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Next slide"
                disabled={disabled || !canNext}
                className={cn(ARROW, 'right-3')}
                onClick={() => go(indexRef.current + 1)}
              >
                <ChevronRight />
              </Button>
            </>
          ) : null}
        </div>
        {properties.showDots !== false && positions > 1 ? (
          <div className="flex h-7 shrink-0 items-center justify-center gap-1.5">
            {Array.from({ length: Math.min(positions, 30) }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index ? 'true' : undefined}
                disabled={disabled}
                onClick={() => go(i)}
                className={cn(
                  'h-1.5 rounded-full border-0 p-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  i === index
                    ? 'w-4 bg-[color:var(--lk-dot-active,var(--sc-primary))]'
                    : 'w-1.5 bg-[color:var(--lk-dot,color-mix(in_srgb,var(--sc-foreground)_20%,transparent))] hover:bg-[color:var(--lk-dot-active,color-mix(in_srgb,var(--sc-foreground)_40%,transparent))]'
                )}
              />
            ))}
          </div>
        ) : null}
      </div>
    </Shell>
  );
};

export default withControlState(ShadCarousel);
