/**
 * UI 2.0 Image: a picture with a fit, an aspect ratio, a caption, a fallback when it fails, and an optional zoom.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Image itself does. Titles carry [ShadImage-<AREA>-<NNN>] scenario ids. jsdom never loads
 * images, so a test fires the img's load or error event itself.
 */
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  countInvocationsOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'img1';
const SRC = 'https://example.invalid/lake.png';
const widget = createWidgetHarness({
  componentType: 'ShadImage',
  handle: 'image1',
  id: ID,
  widgetHeight: 200,
  widgetWidth: 300,
  defaultProperties: { source: binding(SRC), alternativeText: binding('Mountain lake') },
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const img = (container) => container.querySelector('figure img');
const frame = (container) => container.querySelector('figure > div');
const exposed = () => widget.exposed() ?? {};
const load = (container) => act(async () => fireEvent.load(img(container)));
const fail = (container) => act(async () => fireEvent.error(img(container)));

describe('UI 2.0 Image', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadImage-DEF-001] shows a skeleton until the image loads, then the image; exposes its URL and alt text', async () => {
    const { container } = render();

    await waitFor(() => expect(img(container)).toHaveAttribute('src', SRC));
    expect(img(container)).toHaveAttribute('alt', 'Mountain lake');
    expect(container.querySelector('.tw-animate-pulse')).toBeInTheDocument();
    expect(exposed()).toMatchObject({ imageURL: SRC, alternativeText: 'Mountain lake', hasError: false });

    await load(container);
    expect(container.querySelector('.tw-animate-pulse')).toBeNull();
    expect(img(container)).toHaveClass('tw-opacity-100');
    expect(img(container).style.objectFit).toBe('cover');
  });

  test('[ShadImage-PROP-001] imageFit sets how the picture fills its frame', async () => {
    const { container } = render({ properties: { imageFit: binding('contain') } });

    await waitFor(() => expect(img(container).style.objectFit).toBe('contain'));
  });

  test('[ShadImage-PROP-002] aspectRatio sizes the frame from its width instead of the widget height', async () => {
    const { container } = render();
    await waitFor(() => expect(frame(container).style.height).toBe('196px'));

    render({ properties: { aspectRatio: binding('16/9') } });
    await waitFor(() => expect(frame(container).style.aspectRatio).toBe('16 / 9'));
    expect(frame(container).style.height).toBe('');
  });

  test('[ShadImage-PROP-003] caption shows under the image and takes its line from the frame', async () => {
    const { container } = render({ properties: { caption: binding('Lake Louise, 6 am') } });

    expect(await screen.findByText('Lake Louise, 6 am')).toBeInTheDocument();
    expect(screen.getByText('Lake Louise, 6 am').tagName).toBe('FIGCAPTION');
    expect(frame(container).style.height).toBe('168px');
  });

  test('[ShadImage-PROP-004] a failed image shows the placeholder with the alt text, and exposes hasError', async () => {
    const { container } = render();

    await fail(container);

    await waitFor(() => expect(exposed().hasError).toBe(true));
    expect(img(container)).toBeNull();
    expect(screen.getByText('Mountain lake')).toBeInTheDocument();
  });

  test('[ShadImage-PROP-005] fallback initials draws the fallbackText initials; icon draws a broken image', async () => {
    const { container } = render({
      properties: { fallback: binding('initials'), fallbackText: binding('Ada Lovelace') },
    });
    await fail(container);
    expect(await screen.findByLabelText('Ada Lovelace')).toHaveTextContent('AL');

    const empty = render({ properties: { source: binding(''), fallback: binding('icon') } });
    expect(await screen.findByLabelText('No image')).toBeInTheDocument();
    expect(empty.container.querySelector('figure img')).toBeNull();
  });

  test('[ShadImage-PROP-006] an empty source shows the placeholder at once', async () => {
    render({ properties: { source: binding(''), alternativeText: binding('') } });

    expect(await screen.findByText('No image')).toBeInTheDocument();
    await waitFor(() => expect(exposed().hasError).toBe(true));
  });

  test('[ShadImage-PROP-007] showBorder draws a border round the frame', async () => {
    const { container } = render({ properties: { showBorder: binding('{{true}}') } });

    await waitFor(() => expect(frame(container)).toHaveClass('tw-border'));
    render({ properties: { showBorder: binding('{{false}}') } });
    await waitFor(() => expect(frame(container)).not.toHaveClass('tw-border'));
  });

  test('[ShadImage-PROP-008] zoomOnClick opens the loaded image full size in a dialog, and Close shuts it', async () => {
    const { container } = render({ properties: { zoomOnClick: binding('{{true}}') } });
    await load(container);

    const zoomable = screen.getByRole('button', { name: 'Mountain lake' });
    expect(zoomable).toHaveClass('tw-cursor-zoom-in');
    await act(async () => fireEvent.click(zoomable));

    const dialog = await screen.findByRole('dialog');
    expect(dialog.querySelector('img')).toHaveAttribute('src', SRC);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Close' })));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  test('[ShadImage-EVT-001] clicking the image fires onClick, and with onClick wired it is a button Enter presses', async () => {
    const { container } = render();
    widget.setEvents(countInvocationsOn(ID, 'onClick'));
    await load(container);

    const button = await screen.findByRole('button', { name: 'Mountain lake' });
    await act(async () => fireEvent.click(button));
    await waitFor(() => expect(widget.variables().calls).toBe(1));
    await act(async () => fireEvent.keyDown(button, { key: 'Enter' }));
    await waitFor(() => expect(widget.variables().calls).toBe(2));
  });

  test('[ShadImage-ACT-001] setImageURL swaps the picture until the Source property changes; clearImage empties it', async () => {
    const { container } = render();

    await widget.act('setImageURL', 'https://example.invalid/other.png');
    await waitFor(() => expect(img(container)).toHaveAttribute('src', 'https://example.invalid/other.png'));
    expect(exposed().imageURL).toBe('https://example.invalid/other.png');

    await widget.act('clearImage');
    await waitFor(() => expect(exposed().imageURL).toBe(''));
    expect(img(container)).toBeNull();
    expect(exposed().hasError).toBe(true);

    render({ properties: { source: binding('https://example.invalid/third.png') } });
    await waitFor(() => expect(exposed().imageURL).toBe('https://example.invalid/third.png'));
  });

  test('[ShadImage-STY-001] radius, border, background, fallback and caption colours reach the image as CSS variables', async () => {
    const { container } = render({
      properties: { caption: binding('Lake'), showBorder: binding('{{true}}') },
      styles: {
        borderRadius: binding('{{14}}'),
        borderColor: binding('#94a3b8'),
        backgroundColor: binding('#f1f5f9'),
        fallbackTextColor: binding('#64748b'),
        captionColor: binding('#334155'),
      },
    });

    await screen.findByText('Lake');
    const root = container.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--lk-radius')).toBe('14px');
    expect(root.style.getPropertyValue('--lk-border')).toBe('#94a3b8');
    expect(root.style.getPropertyValue('--lk-bg')).toBe('#f1f5f9');
    expect(root.style.getPropertyValue('--lk-fg')).toBe('#64748b');
    expect(root.style.getPropertyValue('--lk-caption')).toBe('#334155');
    expect(screen.getByText('Lake').className).toContain('var(--lk-caption');
  });
});
