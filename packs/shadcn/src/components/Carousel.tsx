import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { cn } from '../lib/cn';
import {
  aspectRatio,
  carouselPositions,
  carouselSlides,
  clampInt,
  moveIndex,
  safeImageUrl,
  safeUrl,
} from '../lib/ui2/nav/model';
import { lookVars, px } from '../lib/ui2/nav/look';
import { useLatest, useStable } from '../lib/ui2/nav/hooks';
import { ownerAvailable } from '../lib/useOwnerGuard';
import { LoadingFrame, blockLook, useLoadingLook } from '../lib/ui2/loading/look';
import { TOKEN, useBlankNumber, useThemeColor, useThemeRadius } from '../lib/styleDefaults';
import '../styles/ui2-nav.css';

// UI 2.0 Carousel: one or several slides per view, swipes, arrow keys, autoplay that pauses on hover and keyboard
// focus, captions over or below the image.
export const Carousel = () => {
  const [rawSlides] = ToolJet.useStateArray({
    name: 'slides',
    label: 'Slides',
    description: 'Array of { image, title, description, link } objects, or image URLs.',
    initialValue: [
      {
        image: 'https://picsum.photos/seed/tj-coast/1200/675',
        title: 'Coastal routes',
        description: 'Plan deliveries along the shoreline',
      },
      {
        image: 'https://picsum.photos/seed/tj-mountain/1200/675',
        title: 'Mountain depots',
        description: 'New warehouses opening in Q1',
      },
      {
        image: 'https://picsum.photos/seed/tj-lake/1200/675',
        title: 'Lakeside hubs',
        description: 'Cold-chain capacity doubled',
      },
    ],
  });
  const [defaultIndex] = ToolJet.useStateNumber({
    name: 'defaultIndex',
    label: 'Start at slide (0-based)',
    initialValue: 0,
  });
  const [currentIndex, setCurrentIndex] = ToolJet.useStateNumber({
    name: 'currentIndex',
    label: 'Current slide (0-based)',
    initialValue: 0,
  });
  const [ratioSetting] = ToolJet.useStateEnumeration({
    name: 'aspectRatio',
    label: 'Aspect ratio',
    description: 'fill: the slides fill the box.',
    enumDefinition: ['fill', '16/9', '4/3', '3/2', '1/1', '21/9', '3/4'],
    initialValue: 'fill',
  });
  const [imageFit] = ToolJet.useStateEnumeration({
    name: 'imageFit',
    label: 'Image fit',
    enumDefinition: ['cover', 'contain'],
    enumLabels: { cover: 'Cover', contain: 'Contain' },
    initialValue: 'cover',
    inspector: 'switch',
  });
  const [captionPosition] = ToolJet.useStateEnumeration({
    name: 'captionPosition',
    label: 'Caption',
    enumDefinition: ['overlay', 'below', 'none'],
    enumLabels: { overlay: 'Overlay', below: 'Below', none: 'None' },
    initialValue: 'overlay',
    inspector: 'switch',
  });
  const [slidesPerView] = ToolJet.useStateNumber({
    name: 'slidesPerView',
    label: 'Slides per view (1 to 4)',
    initialValue: 1,
    min: 1,
    max: 4,
  });
  const [showArrows] = ToolJet.useStateBoolean({ name: 'showArrows', label: 'Show arrows', initialValue: true });
  const [showDots] = ToolJet.useStateBoolean({ name: 'showDots', label: 'Show dots', initialValue: true });
  const [loop] = ToolJet.useStateBoolean({ name: 'loop', label: 'Loop', initialValue: true });
  const [autoplay] = ToolJet.useStateBoolean({ name: 'autoplay', label: 'Autoplay', initialValue: false });
  const [interval] = ToolJet.useStateNumber({
    name: 'interval',
    label: 'Autoplay interval (ms)',
    initialValue: 5000,
    min: 1000,
    visibleWhen: { key: 'autoplay', value: true },
  });
  const [pauseOnHover] = ToolJet.useStateBoolean({
    name: 'pauseOnHover',
    label: 'Pause on hover',
    initialValue: true,
    visibleWhen: { key: 'autoplay', value: true },
  });
  const [, setCurrentSlide] = ToolJet.useStateObject({ name: 'currentSlide', initialValue: {}, inspector: 'hidden' });
  const [, setClickedSlide] = ToolJet.useStateObject({ name: 'clickedSlide', initialValue: {}, inspector: 'hidden' });
  const onSlideChanged = ToolJet.useEventCallback({ name: 'onSlideChanged' });
  const onSlideClicked = ToolJet.useEventCallback({ name: 'onSlideClicked' });
  const { disabled } = ToolJet.useControlState();
  const slideBackgroundColor = useThemeColor('slideBackgroundColor', 'Slide background', TOKEN.muted);
  const arrowBackgroundColor = useThemeColor('arrowBackgroundColor', 'Arrow background', TOKEN.surface);
  const arrowColor = useThemeColor('arrowColor', 'Arrow icon color', TOKEN.text);
  const dotColor = useThemeColor('dotColor', 'Dot color', TOKEN.text);
  const activeDotColor = useThemeColor('activeDotColor', 'Active dot color', TOKEN.brand);
  const captionBackgroundColor = ToolJet.useStyleString({
    name: 'captionBackgroundColor',
    label: 'Caption overlay background',
    inspector: 'color',
    initialValue: '',
  });
  const captionTextColor = useThemeColor('captionTextColor', 'Caption overlay text color', '#fff');
  const titleColor = useThemeColor('titleColor', 'Caption title color (below)', TOKEN.text);
  const descriptionColor = useThemeColor('descriptionColor', 'Caption description color (below)', TOKEN.mutedText);
  const radius = useThemeRadius('borderRadius', 'Slide radius');
  const gapStyle = useBlankNumber('gap', 'Gap between slides (px)', '16 with several slides, else 0');
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ role: 'carousel', fit: false, loading: 'own', defaultWidth: 20, defaultHeight: 41 });

  const source = useStable(rawSlides);
  const slides = useMemo(() => carouselSlides(source), [source]);
  const perView = Math.min(clampInt(slidesPerView, 1, 4, 1), Math.max(1, slides.length));
  const positions = carouselPositions(slides.length, perView);
  const wrap = loop !== false;
  const index = moveIndex(currentIndex, positions, false);
  const indexRef = useRef(index);
  indexRef.current = index;
  const live = useLatest({ positions, wrap, slides });

  const go = (to: number, fire = true) => {
    const { positions: count, wrap: w, slides: list } = live.current;
    const next = moveIndex(to, count, w);
    if (next === indexRef.current) return;
    indexRef.current = next;
    setCurrentIndex(next);
    setCurrentSlide({ ...(list[next] ?? {}) });
    if (fire) onSlideChanged();
  };
  // A new Start at slide moves to it, with no event.
  const firstDefault = useRef(true);
  useEffect(() => {
    if (firstDefault.current) {
      firstDefault.current = false;
      if (!Number(defaultIndex)) return;
    }
    go(clampInt(defaultIndex, 0, 100000, 0), false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultIndex]);
  useEffect(() => setCurrentSlide({ ...(slides[index] ?? {}) }), [slides, index]); // eslint-disable-line react-hooks/exhaustive-deps

  ToolJet.useAction({ name: 'next', displayName: 'Next slide' }, () => go(indexRef.current + 1));
  ToolJet.useAction({ name: 'previous', displayName: 'Previous slide' }, () => go(indexRef.current - 1));
  ToolJet.useAction(
    { name: 'goTo', displayName: 'Go to slide', params: [{ handle: 'index', displayName: 'Index (0-based)' }] },
    (i) => go(clampInt(i, -100000, 100000, 0))
  );

  const [hovered, setHovered] = useState(false);
  // Keyboard focus pauses autoplay as hovering does (WCAG 2.2.2); focus a click brings does not.
  const [focused, setFocused] = useState(false);
  const pointerFocus = useRef(false);
  const playing = autoplay === true && positions > 1 && !disabled && !focused && !(pauseOnHover !== false && hovered);
  const every = clampInt(interval, 1000, 600000, 5000);
  const latestGo = useLatest(go);
  // Each tick first asks whether the carousel can be seen and used: a parent that disables it, shows its loading look
  // or hides it (an inactive tab, a closed section) does not re-render it, so the timer kept moving slides and firing
  // onSlideChanged out of sight (pack audit SP-09, 2026-10-23; UI 2.0 checked ownerTakesNoInput on every tick). The
  // timer keeps running, so autoplay resumes once the carousel is back.
  const regionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!playing) return undefined;
    const timer = setInterval(() => {
      if (!ownerAvailable(regionRef.current)) return;
      const { positions: count, wrap: w } = live.current;
      latestGo.current(!w && indexRef.current >= count - 1 ? 0 : indexRef.current + 1);
    }, every);
    return () => clearInterval(timer);
  }, [playing, every, live, latestGo]);

  // Swipes: a horizontal drag of 40px or more moves a slide, and is not a click.
  const drag = useRef<{ x: number | null; pointer: number | null; swiped: boolean }>({
    x: null,
    pointer: null,
    swiped: false,
  });
  const [failed, setFailed] = useState<Record<number, string>>({});
  const ratio = aspectRatio(ratioSetting);
  const fill = ratio === null;
  const caption = ['overlay', 'below', 'none'].includes(captionPosition) ? captionPosition : 'overlay';
  const gap = perView > 1 ? 'var(--lk-gap, 16px)' : 'var(--lk-gap, 0px)';
  const step = `((100% - (${perView} - 1) * ${gap}) / ${perView} + ${gap})`;
  const canPrev = positions > 1 && (wrap || index > 0);
  const canNext = positions > 1 && (wrap || index < positions - 1);
  const vars = lookVars([
    [slideBackgroundColor, '--lk-slide-bg'],
    [arrowBackgroundColor, '--lk-arrow-bg'],
    [arrowColor, '--lk-arrow-fg'],
    [dotColor, '--lk-dot'],
    [activeDotColor, '--lk-dot-active'],
    [captionBackgroundColor, '--lk-caption-bg'],
    [captionTextColor, '--lk-caption-fg'],
    [titleColor, '--lk-title'],
    [descriptionColor, '--lk-desc'],
    [radius, '--lk-radius', px],
    [gapStyle, '--lk-gap', px],
  ]);

  const clickSlide = (i: number) => {
    if (drag.current.swiped || disabled) return;
    const slide = slides[i];
    setClickedSlide({ ...slide, index: i });
    onSlideClicked();
    if (safeUrl(slide?.link)) window.open(safeUrl(slide.link), '_blank', 'noopener,noreferrer');
  };

  if (!slides.length) {
    return (
      <LoadingFrame loading={ld.loading} look={blockLook(ld.skeleton)}>
        <div className="ui" style={vars}>
          <div className="n2-carousel-empty" style={fill ? { height: '100%' } : { aspectRatio: String(ratio) }}>
            <ImageOff size={20} />
            No slides
          </div>
        </div>
      </LoadingFrame>
    );
  }

  return (
    <LoadingFrame loading={ld.loading} look={blockLook(ld.skeleton)}>
      <div className="ui" style={vars}>
        <div
          role="region"
          ref={regionRef}
          aria-roledescription="carousel"
          aria-label="Carousel"
          tabIndex={0}
          className={cn('n2-carousel', fill && 'is-fill')}
          onKeyDown={(e) => {
            pointerFocus.current = false;
            setFocused(true);
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
          onFocus={() => {
            setFocused(!pointerFocus.current);
            pointerFocus.current = false;
          }}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
          }}
          onPointerDown={(e) => {
            pointerFocus.current = true;
            if (drag.current.x !== null && e.isPrimary === false) return;
            drag.current = { x: e.clientX, pointer: e.pointerId, swiped: false };
          }}
          onPointerCancel={(e) => {
            if (e.pointerId === drag.current.pointer) drag.current.x = null;
          }}
          onPointerUp={(e) => {
            const start = drag.current.x;
            if (e.pointerId !== drag.current.pointer) return;
            drag.current.x = null;
            if (start === null || disabled) return;
            const dx = e.clientX - start;
            if (Math.abs(dx) >= 40) {
              drag.current.swiped = true;
              go(indexRef.current + (dx < 0 ? 1 : -1));
              setTimeout(() => (drag.current.swiped = false), 0);
            }
          }}
        >
          <div className="n2-carousel-viewport">
            <div
              className="n2-carousel-track"
              style={{ columnGap: gap, transform: `translateX(calc(-1 * ${index} * ${step}))` }}
            >
              {slides.map((slide, i) => {
                const src = safeImageUrl(slide.image);
                const showImage = !!src && failed[i] !== src;
                const visible = i >= index && i < index + perView;
                return (
                  <div
                    key={i}
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${i + 1} of ${slides.length}`}
                    aria-hidden={visible ? undefined : true}
                    className="n2-carousel-slide"
                    style={{ flexBasis: `calc((100% - (${perView} - 1) * ${gap}) / ${perView})` }}
                  >
                    <div
                      className={cn('n2-carousel-frame', !disabled && 'is-clickable')}
                      style={fill ? undefined : { aspectRatio: String(ratio) }}
                      role={disabled ? undefined : 'button'}
                      tabIndex={disabled ? undefined : visible ? 0 : -1}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter' && e.key !== ' ') return;
                        e.preventDefault();
                        e.stopPropagation();
                        clickSlide(i);
                      }}
                      onClick={() => clickSlide(i)}
                    >
                      {showImage ? (
                        <img
                          src={src}
                          alt={slide.title || `Slide ${i + 1}`}
                          loading={i <= index + perView ? 'eager' : 'lazy'}
                          draggable={false}
                          onError={() => setFailed((f) => ({ ...f, [i]: src }))}
                          style={{ objectFit: imageFit === 'contain' ? 'contain' : 'cover' }}
                        />
                      ) : (
                        <div className="n2-carousel-text">
                          {slide.image ? (
                            <ImageOff size={24} style={{ color: 'var(--ui-muted-fg)' }} />
                          ) : (
                            <>
                              <strong>{slide.title}</strong>
                              {slide.description ? <span>{slide.description}</span> : null}
                            </>
                          )}
                        </div>
                      )}
                      {caption === 'overlay' && showImage && (slide.title || slide.description) ? (
                        <div className="n2-carousel-overlay">
                          {slide.title ? <strong>{slide.title}</strong> : null}
                          {slide.description ? <span>{slide.description}</span> : null}
                        </div>
                      ) : null}
                    </div>
                    {caption === 'below' && showImage && (slide.title || slide.description) ? (
                      <div className="n2-carousel-below">
                        {slide.title ? <strong>{slide.title}</strong> : null}
                        {slide.description ? <span>{slide.description}</span> : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            {showArrows !== false && positions > 1 ? (
              <>
                <button
                  type="button"
                  className="n2-carousel-arrow is-prev"
                  aria-label="Previous slide"
                  disabled={disabled || !canPrev}
                  onClick={() => go(indexRef.current - 1)}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  className="n2-carousel-arrow is-next"
                  aria-label="Next slide"
                  disabled={disabled || !canNext}
                  onClick={() => go(indexRef.current + 1)}
                >
                  <ChevronRight size={16} />
                </button>
              </>
            ) : null}
          </div>
          {showDots !== false && positions > 1 ? (
            <div className="n2-carousel-dots">
              {Array.from({ length: Math.min(positions, 30) }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === index ? 'true' : undefined}
                  disabled={disabled}
                  onClick={() => go(i)}
                  className={cn('n2-carousel-dot', i === index && 'is-active')}
                >
                  <span />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </LoadingFrame>
  );
};
