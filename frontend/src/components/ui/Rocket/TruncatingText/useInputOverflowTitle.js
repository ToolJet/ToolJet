import { useEffect } from 'react';

/**
 * Detects when an `<input>` inside `containerRef` overflows its visible width,
 * and sets the input's `title` attribute to its current value so the browser
 * shows a native tooltip on hover. Removes the attribute when the value fits.
 *
 * Also resets `input.scrollLeft = 0` on blur so the ellipsis reappears
 * reliably after the user types past the visible area (Safari doesn't always
 * reset on its own).
 *
 * Limitation: programmatic writes to `input.value` (e.g. Base UI Combobox
 * setting the value when a user picks from the dropdown) do not fire `input`
 * events per HTML spec, so the title attribute may be stale until the next
 * user interaction (typing, blur, hover, container resize).
 */
export function useInputOverflowTitle(containerRef) {
  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return undefined;

    const input = container.querySelector('input');
    if (!input) return undefined;

    const measure = () => {
      const overflowed = input.scrollWidth - input.clientWidth > 0.5;
      if (overflowed && input.value) {
        input.title = input.value;
      } else if (input.hasAttribute('title')) {
        input.removeAttribute('title');
      }
    };

    const handleBlur = () => {
      input.scrollLeft = 0;
      measure();
    };

    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(input);

    input.addEventListener('input', measure);
    input.addEventListener('blur', handleBlur);

    return () => {
      resizeObserver.disconnect();
      input.removeEventListener('input', measure);
      input.removeEventListener('blur', handleBlur);
    };
  }, [containerRef]);
}
