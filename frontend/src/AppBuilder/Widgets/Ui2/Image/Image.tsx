import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { ImageIcon, ImageOff, X } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useHasEvent, useOverrides } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { DISMISS, Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useAutoHeight, useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { initials } from '@/AppBuilder/Widgets/Ui2/_shared/avatarHue';
import { Skeleton, cn, getPortalRoot } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { isSet, safeImageUrl, toText } from '@/AppBuilder/Widgets/Ui2/_shared/values';
import { onKeyActivate } from '@/AppBuilder/Widgets/Ui2/_shared/keyboard';

// ---- Image -----------------------------------------------------------------------------------------------------------

const FIT = new Set(['cover', 'contain', 'fill']);

export const ratioOf = (value: unknown): string | null => {
  if (!isSet(value) || value === 'auto') return null;
  const [w, h] = String(value)
    .split(/[/:x]/)
    .map((n) => Number(n));
  if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) return `${w} / ${h}`;
  const single = Number(value);
  return Number.isFinite(single) && single > 0 ? String(single) : null;
};

export const ImageFallback = ({ kind, text }: { kind: unknown; text: unknown }) => {
  const name = String(text ?? '').trim();
  const fg = 'tw-text-[color:var(--lk-fg,var(--sc-muted-foreground))]';
  if (kind === 'initials' && initials(name)) {
    return (
      <span className={cn('tw-select-none tw-text-2xl tw-font-semibold tw-tracking-wide', fg)} aria-label={name}>
        {initials(name)}
      </span>
    );
  }
  if (kind === 'icon' || kind === 'initials')
    return <ImageOff className={cn('tw-h-8 tw-w-8', fg)} aria-label="No image" />;
  return (
    <span className={cn('tw-flex tw-flex-col tw-items-center tw-gap-2 tw-px-3 tw-text-center', fg)}>
      <ImageIcon className="tw-h-7 tw-w-7" aria-hidden="true" />
      <span className="tw-text-xs">{name || 'No image'}</span>
    </span>
  );
};

export const ShadImage = (props: WidgetProps) => {
  const { setExposedVariables, fireEvent, height, id } = props;
  // setImageURL and clearImage change the source until the Source property itself changes.
  const [p, override] = useOverrides(props.properties);
  const ref = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  // With a ratio the image sizes itself from the width and the widget fits it; "auto" fills the drawn height instead.
  const ratio = ratioOf(p.aspectRatio);
  useAutoHeight({ ...props, properties: { ...p, dynamicHeight: ratio ? p.dynamicHeight : false } }, ref);
  const src = safeImageUrl(p.source);
  const alt = String(p.alternativeText ?? '');
  // The load outcome belongs to the source it was for: a new source starts loading (an empty one is an error) in the
  // same render, so setImageURL and clearImage expose hasError for the new source as soon as they return.
  const [loadResult, setLoadResult] = useState<{ src: string; status: 'loaded' | 'error' } | null>(null);
  const status: 'loading' | 'loaded' | 'error' = !src
    ? 'error'
    : loadResult?.src === src
    ? loadResult.status
    : 'loading';
  const setStatus = (next: 'loaded' | 'error') => setLoadResult({ src, status: next });
  // A cached image can finish before React listens for its load event.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) setLoadResult({ src, status: 'loaded' });
  }, [src]);
  useExposed(setExposedVariables, p, {
    hasError: status === 'error',
    imageURL: src,
    alternativeText: alt,
    setImageURL: async (url: unknown) => override('source', toText(url)),
    clearImage: async () => override('source', ''),
  });
  const hasClick = useHasEvent(id, 'onClick');
  const zoom = p.zoomOnClick === true && status === 'loaded';
  // The zoom is open only while there is a loaded image to show and the widget is visible: hiding the widget or
  // clearing its image closes it for good.
  const [zoomed, setZoomed] = useState(false);
  const canZoom = zoom && p.visibility !== false;
  useEffect(() => {
    if (!canZoom) setZoomed(false);
  }, [canZoom]);
  const open = zoomed && canZoom;
  const frameRef = useRef<HTMLDivElement>(null);
  const clickable = !busy(p) && (hasClick || zoom);
  const caption = isSet(p.caption) ? String(p.caption) : '';
  const fit = FIT.has(p.imageFit) ? p.imageFit : 'cover';
  const frameHeight = Math.max(24, (Number(height) || 200) - (caption ? 28 : 0));
  const click = () => {
    if (busy(p)) return;
    fireEvent('onClick');
    if (zoom) setZoomed(true);
  };
  return (
    <Shell {...props} innerRef={ref}>
      <figure className="tw-m-0 tw-flex tw-w-full tw-flex-col">
        <div
          ref={frameRef}
          role={clickable ? 'button' : undefined}
          tabIndex={clickable ? 0 : undefined}
          aria-label={clickable ? alt || 'Image' : undefined}
          onClick={click}
          onKeyDown={clickable ? onKeyActivate(click) : undefined}
          className={cn(
            'tw-relative tw-flex tw-w-full tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-[var(--lk-radius,var(--sc-radius))] tw-bg-[color:var(--lk-bg,transparent)]',
            p.showBorder === true && 'tw-border tw-border-[color:var(--lk-border,var(--sc-border))]',
            status === 'error' && 'tw-bg-[color:var(--lk-bg,var(--sc-muted))]',
            clickable &&
              'tw-cursor-pointer focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-ui2-ring',
            zoom && 'tw-cursor-zoom-in'
          )}
          style={ratio ? { aspectRatio: ratio } : { height: frameHeight }}
        >
          {status !== 'error' ? (
            <img
              ref={imgRef}
              src={src}
              alt={alt}
              draggable={false}
              onLoad={() => setStatus('loaded')}
              onError={() => setStatus('error')}
              className={cn(
                'tw-block tw-h-full tw-w-full tw-transition-opacity tw-duration-300',
                status === 'loaded' ? 'tw-opacity-100' : 'tw-opacity-0'
              )}
              style={{ objectFit: fit }}
            />
          ) : (
            <ImageFallback kind={p.fallback} text={isSet(p.fallbackText) ? p.fallbackText : alt} />
          )}
          {status === 'loading' ? <Skeleton className="tw-absolute tw-inset-0 tw-rounded-none" /> : null}
        </div>
        {caption ? (
          <figcaption className="tw-mt-2 tw-truncate tw-text-center tw-text-ui2-sm tw-leading-5 tw-text-[color:var(--lk-caption,var(--sc-muted-foreground))]">
            {caption}
          </figcaption>
        ) : null}
      </figure>
      {p.zoomOnClick === true ? (
        <DialogPrimitive.Root open={open} onOpenChange={setZoomed}>
          <DialogPrimitive.Portal container={getPortalRoot()}>
            {/* Dismissing the zoom is not input: a disabled Form around the widget lets it through (DISMISS). */}
            <DialogPrimitive.Overlay {...DISMISS} className="tw-fixed tw-inset-0 tw-z-[1300] tw-bg-black/80" />
            <DialogPrimitive.Content
              aria-describedby={undefined}
              // The zoom has no Radix trigger to hand focus back to: closing it returns focus to the image.
              onCloseAutoFocus={(e) => {
                e.preventDefault();
                frameRef.current?.focus();
              }}
              className="tw-fixed tw-left-1/2 tw-top-1/2 tw-z-[1300] -tw-translate-x-1/2 -tw-translate-y-1/2 tw-outline-none"
            >
              <DialogPrimitive.Title className="tw-sr-only">{alt || 'Image'}</DialogPrimitive.Title>
              <img
                src={src}
                alt={alt}
                className="tw-block tw-max-h-[90vh] tw-max-w-[90vw] tw-rounded-ui2-lg tw-object-contain tw-shadow-lg"
                draggable={false}
              />
              <DialogPrimitive.Close
                {...DISMISS}
                aria-label="Close"
                className="tw-absolute -tw-right-3 -tw-top-3 tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-full tw-border tw-bg-ui2-background tw-text-ui2-foreground tw-shadow-md tw-transition-colors hover:tw-bg-ui2-accent focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-ui2-ring"
              >
                <X className="tw-h-4 tw-w-4" />
              </DialogPrimitive.Close>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      ) : null}
    </Shell>
  );
};

export default withControlState(ShadImage);
