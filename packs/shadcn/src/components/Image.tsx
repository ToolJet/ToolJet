import React, { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { ImageIcon, ImageOff, X } from 'lucide-react';
import { usePortalContainer } from '../lib/usePortalContainer';
import { useOwnerGuard } from '../lib/useOwnerGuard';
import { cn } from '../lib/cn';
import { initials, isSet, px, styleVars } from '../lib/ui2/display/lists/model';
import { LoadingFrame, blockLook, useLoadingLook } from '../lib/ui2/loading/look';
import '../styles/ui2-display.css';

const safeImageUrl = (url: unknown) => {
  const t = typeof url === 'string' ? url.trim() : '';
  return /^(https?:|data:image\/|blob:|\/)/i.test(t) ? t : '';
};

// UI 2.0's ratioOf: '4/3', '4:3', '4x3' or one number; 'auto' fills the widget's height.
const ratioOf = (value: unknown): string | null => {
  if (!isSet(value) || value === 'auto') return null;
  const [w, h] = String(value).split(/[/:x]/).map((n) => Number(n));
  if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) return `${w} / ${h}`;
  const single = Number(value);
  return Number.isFinite(single) && single > 0 ? String(single) : null;
};

const Fallback = ({ kind, text }: { kind: unknown; text: unknown }) => {
  const name = String(text ?? '').trim();
  if (kind === 'initials' && initials(name))
    return (
      <span className="ui2-image-initials" aria-label={name}>
        {initials(name)}
      </span>
    );
  if (kind === 'icon' || kind === 'initials') return <ImageOff size={32} className="ui2-image-fg" aria-label="No image" />;
  return (
    <span className="ui2-image-placeholder ui2-image-fg">
      <ImageIcon size={28} aria-hidden="true" />
      <span>{name || 'No image'}</span>
    </span>
  );
};

export const Image = () => {
  const [source, setSource] = ToolJet.useStateString({ name: 'source', label: 'Image URL', initialValue: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800' });
  const [alternativeText] = ToolJet.useStateString({ name: 'alternativeText', label: 'Alt text', initialValue: 'Mountain lake at sunrise' });
  const [imageFit] = ToolJet.useStateEnumeration({
    name: 'imageFit',
    label: 'Fit',
    enumDefinition: ['cover', 'contain', 'fill'],
    enumLabels: { cover: 'Cover (fill, crop)', contain: 'Contain (whole image)', fill: 'Fill (stretch)' },
    initialValue: 'cover',
  });
  const [aspectRatio] = ToolJet.useStateEnumeration({
    name: 'aspectRatio',
    label: 'Aspect ratio',
    enumDefinition: ['auto', '1/1', '4/3', '3/2', '16/9', '21/9', '3/4', '9/16'],
    enumLabels: {
      auto: 'Auto (widget height)',
      '1/1': '1:1 square',
      '4/3': '4:3',
      '3/2': '3:2',
      '16/9': '16:9',
      '21/9': '21:9',
      '3/4': '3:4 portrait',
      '9/16': '9:16 portrait',
    },
    initialValue: 'auto',
  });
  const [caption] = ToolJet.useStateString({ name: 'caption', label: 'Caption', initialValue: '' });
  const [fallback] = ToolJet.useStateEnumeration({
    name: 'fallback',
    label: 'Fallback',
    enumDefinition: ['placeholder', 'icon', 'initials'],
    enumLabels: { placeholder: 'Placeholder', icon: 'Icon', initials: 'Initials' },
    initialValue: 'placeholder',
    inspector: 'switch',
  });
  const [fallbackText] = ToolJet.useStateString({ name: 'fallbackText', label: 'Fallback name (initials) or text', initialValue: '' });
  const [showBorder] = ToolJet.useStateBoolean({ name: 'showBorder', label: 'Border', initialValue: false });
  const [zoomOnClick] = ToolJet.useStateBoolean({ name: 'zoomOnClick', label: 'Zoom on click (lightbox)', initialValue: false });
  const [, setHasError] = ToolJet.useStateBoolean({ name: 'hasError', initialValue: false, inspector: 'hidden' });
  const [, setImageURL] = ToolJet.useStateString({ name: 'imageURL', initialValue: '', inspector: 'hidden' });
  const onClick = ToolJet.useEventCallback({ name: 'onClick' });
  const borderRadius = ToolJet.useStyleNumber({ name: 'borderRadius', label: 'Image radius', initialValue: '' });
  const borderColor = ToolJet.useStyleString({ name: 'borderColor', label: 'Border color', inspector: 'color', initialValue: '' });
  const background = ToolJet.useStyleString({ name: 'backgroundColor', label: 'Background (letterbox and fallback)', inspector: 'color', initialValue: '' });
  const fallbackTextColor = ToolJet.useStyleString({ name: 'fallbackTextColor', label: 'Fallback text and icon color', inspector: 'color', initialValue: '' });
  const captionColor = ToolJet.useStyleString({ name: 'captionColor', label: 'Caption color', inspector: 'color', initialValue: '' });
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 20 });

  const [anchorRef, container] = usePortalContainer<HTMLElement>();
  const imgRef = useRef<HTMLImageElement>(null);
  const src = safeImageUrl(source);
  const alt = String(alternativeText ?? '');
  // The load outcome belongs to the source it was for, so a new source starts loading (an empty one is an error).
  const [loadResult, setLoadResult] = useState<{ src: string; status: 'loaded' | 'error' } | null>(null);
  const status: 'loading' | 'loaded' | 'error' = !src ? 'error' : loadResult?.src === src ? loadResult.status : 'loading';
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) setLoadResult({ src, status: 'loaded' });
  }, [src]);
  useEffect(() => {
    setHasError(status === 'error');
  }, [status]);
  useEffect(() => {
    setImageURL(src);
  }, [src]);

  ToolJet.useAction({ name: 'setImageURL', displayName: 'Set image URL', params: [{ handle: 'url', displayName: 'URL', defaultValue: '' }] }, (u) =>
    setSource(u === null || u === undefined || typeof u === 'object' ? '' : String(u))
  );
  ToolJet.useAction({ name: 'clearImage', displayName: 'Clear image' }, () => setSource(''));

  const zoom = zoomOnClick === true && status === 'loaded';
  const [zoomed, setZoomed] = useState(false);
  useEffect(() => {
    if (!zoom) setZoomed(false);
  }, [zoom]);
  // The lightbox portals into the shared popup layer, outside the widget, so disabling, loading or hiding the image
  // left it open (pack audit SP-02, 2026-10-23): it closes once the image cannot take input. Escape still closes it.
  const { disabled } = ToolJet.useControlState();
  useOwnerGuard(anchorRef, zoomed && zoom, () => setZoomed(false), disabled);
  const ratio = ratioOf(aspectRatio);
  const text = isSet(caption) ? String(caption) : '';
  const fit = ['cover', 'contain', 'fill'].includes(imageFit) ? imageFit : 'cover';
  const click = () => {
    onClick();
    if (zoom) setZoomed(true);
  };
  const vars = styleVars([
    [borderRadius, '--lk-radius', px],
    [borderColor, '--lk-border'],
    [background, '--lk-bg'],
    [fallbackTextColor, '--lk-fg'],
    [captionColor, '--lk-caption'],
  ]);

  return (
    <LoadingFrame loading={ld.loading} look={blockLook(ld.skeleton)}>
      <figure ref={anchorRef} className={cn('ui ui2-figure', ratio && 'has-ratio')} style={vars}>
        <div
          role="button"
          tabIndex={0}
          aria-label={alt || 'Image'}
          className={cn('ui2-image-frame', showBorder && 'has-border', status === 'error' && 'is-error', zoom && 'can-zoom')}
          style={ratio ? { aspectRatio: ratio } : undefined}
          onClick={click}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              click();
            }
          }}
        >
          {status !== 'error' ? (
            <img
              ref={imgRef}
              src={src}
              alt={alt}
              draggable={false}
              className={cn('ui2-image', status === 'loaded' && 'is-loaded')}
              style={{ objectFit: fit as 'cover' }}
              onLoad={() => setLoadResult({ src, status: 'loaded' })}
              onError={() => setLoadResult({ src, status: 'error' })}
            />
          ) : (
            <Fallback kind={fallback} text={isSet(fallbackText) ? fallbackText : alt} />
          )}
          {status === 'loading' ? <div className="ui-skeleton ui2-image-loading" /> : null}
        </div>
        {text ? <figcaption className="ui2-image-caption">{text}</figcaption> : null}
        {zoomOnClick === true && container ? (
          <Dialog.Root open={zoomed && zoom} onOpenChange={setZoomed}>
            <Dialog.Portal container={container}>
              <Dialog.Overlay className="ui-dialog-overlay ui2-zoom-overlay" />
              <Dialog.Content className="ui-popup ui2-image-zoom" aria-describedby={undefined}>
                <Dialog.Title className="ui-sr-only">{alt || 'Image'}</Dialog.Title>
                <img src={src} alt={alt} draggable={false} />
                <Dialog.Close className="ui2-zoom-close" aria-label="Close">
                  <X size={16} />
                </Dialog.Close>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        ) : null}
      </figure>
    </LoadingFrame>
  );
};
