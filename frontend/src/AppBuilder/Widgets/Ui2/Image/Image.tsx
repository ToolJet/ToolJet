import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { ImageIcon, ImageOff, X } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useHasEvent, useOverrides, textArg } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { initials, useAutoHeight, useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Skeleton, cn, getPortalRoot } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { isSet } from '@/AppBuilder/Widgets/Ui2/_shared/looks/kanbanLook';
import { onKeyActivate } from '@/AppBuilder/Widgets/Ui2/_display/displayParts';

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
  const fg = 'text-[color:var(--lk-fg,var(--sc-muted-foreground))]';
  if (kind === 'initials' && initials(name)) {
    return (
      <span className={cn('select-none text-2xl font-semibold tracking-wide', fg)} aria-label={name}>
        {initials(name)}
      </span>
    );
  }
  if (kind === 'icon' || kind === 'initials') return <ImageOff className={cn('h-8 w-8', fg)} aria-label="No image" />;
  return (
    <span className={cn('flex flex-col items-center gap-2 px-3 text-center', fg)}>
      <ImageIcon className="h-7 w-7" aria-hidden="true" />
      <span className="text-xs">{name || 'No image'}</span>
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
  const src = String(p.source ?? '').trim();
  const alt = String(p.alternativeText ?? '');
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(src ? 'loading' : 'error');
  const [open, setOpen] = useState(false);
  useEffect(() => setStatus(src ? 'loading' : 'error'), [src]);
  // A cached image can finish before React listens for its load event.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) setStatus('loaded');
  }, [src]);
  useExposed(setExposedVariables, p, {
    hasError: status === 'error',
    imageURL: src,
    alternativeText: alt,
    setImageURL: async (url: unknown) => override('source', textArg(url)),
    clearImage: async () => override('source', ''),
  });
  const hasClick = useHasEvent(id, 'onClick');
  const zoom = p.zoomOnClick === true && status === 'loaded';
  const clickable = !busy(p) && (hasClick || zoom);
  const caption = isSet(p.caption) ? String(p.caption) : '';
  const fit = FIT.has(p.imageFit) ? p.imageFit : 'cover';
  const frameHeight = Math.max(24, (Number(height) || 200) - (caption ? 28 : 0));
  const click = () => {
    if (busy(p)) return;
    fireEvent('onClick');
    if (zoom) setOpen(true);
  };
  return (
    <Shell {...props} innerRef={ref}>
      <figure className="m-0 flex w-full flex-col">
        <div
          role={clickable ? 'button' : undefined}
          tabIndex={clickable ? 0 : undefined}
          aria-label={clickable ? alt || 'Image' : undefined}
          onClick={click}
          onKeyDown={clickable ? onKeyActivate(click) : undefined}
          className={cn(
            'relative flex w-full items-center justify-center overflow-hidden rounded-[var(--lk-radius,var(--sc-radius))] bg-[color:var(--lk-bg,transparent)]',
            p.showBorder === true && 'border border-[color:var(--lk-border,var(--sc-border))]',
            status === 'error' && 'bg-[color:var(--lk-bg,var(--sc-muted))]',
            clickable && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            zoom && 'cursor-zoom-in'
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
                'block h-full w-full transition-opacity duration-300',
                status === 'loaded' ? 'opacity-100' : 'opacity-0'
              )}
              style={{ objectFit: fit }}
            />
          ) : (
            <ImageFallback kind={p.fallback} text={isSet(p.fallbackText) ? p.fallbackText : alt} />
          )}
          {status === 'loading' ? <Skeleton className="absolute inset-0 rounded-none" /> : null}
        </div>
        {caption ? (
          <figcaption className="mt-2 truncate text-center text-sm leading-5 text-[color:var(--lk-caption,var(--sc-muted-foreground))]">
            {caption}
          </figcaption>
        ) : null}
      </figure>
      {p.zoomOnClick === true ? (
        <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
          <DialogPrimitive.Portal container={getPortalRoot()}>
            <DialogPrimitive.Overlay className="fixed inset-0 z-[1300] bg-black/80" />
            <DialogPrimitive.Content
              aria-describedby={undefined}
              className="fixed left-1/2 top-1/2 z-[1300] -translate-x-1/2 -translate-y-1/2 outline-none"
            >
              <DialogPrimitive.Title className="sr-only">{alt || 'Image'}</DialogPrimitive.Title>
              <img
                src={src}
                alt={alt}
                className="block max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-lg"
                draggable={false}
              />
              <DialogPrimitive.Close
                aria-label="Close"
                className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full border bg-background text-foreground shadow-md transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      ) : null}
    </Shell>
  );
};

export default withControlState(ShadImage);
