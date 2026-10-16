import React, { useCallback, useEffect, useRef, useState } from 'react';
import moment from 'moment-timezone';
import cx from 'classnames';

const SCROLLBAR_PADDING = 2;
const MIN_THUMB_HEIGHT = 32;
const SCROLL_HIDE_DELAY_MS = 1000;

// Figma "calendar + time / scrollbar" popup: each column hides the native
// scrollbar and reserves a 12px slot on its right; a 7px thumb sits
// left-aligned inside that slot. The thumb is hidden at rest and appears while
// scrolling (lingers 1s), while the mouse is over the slot (the column's right
// edge), and while dragging. Items stay left-aligned in every column —
// including AM/PM, which reserves the slot but never scrolls — so all columns
// share the same left edge.
export const TimeScrollColumn = ({ withScrollbar = true, children }) => {
  const listRef = useRef(null);
  const barRef = useRef(null);
  const hideTimerRef = useRef(null);
  const [thumb, setThumb] = useState({ top: SCROLLBAR_PADDING, height: MIN_THUMB_HEIGHT });
  const [scrolling, setScrolling] = useState(false);
  const [dragging, setDragging] = useState(false);

  const getSizes = () => {
    const list = listRef.current;
    const bar = barRef.current;
    if (!list || !bar) return null;
    const track = bar.clientHeight - SCROLLBAR_PADDING * 2;
    const height = Math.max(MIN_THUMB_HEIGHT, (track * list.clientHeight) / list.scrollHeight);
    return { track, height, maxScroll: list.scrollHeight - list.clientHeight };
  };

  const placeThumb = useCallback(() => {
    const sizes = getSizes();
    if (!sizes) return;
    const progress = sizes.maxScroll ? listRef.current.scrollTop / sizes.maxScroll : 0;
    setThumb({ top: SCROLLBAR_PADDING + progress * (sizes.track - sizes.height), height: sizes.height });
  }, []);

  const itemCount = React.Children.count(children);
  useEffect(() => {
    if (withScrollbar) placeThumb();
  }, [withScrollbar, itemCount, placeThumb]);

  useEffect(() => () => clearTimeout(hideTimerRef.current), []);

  const onScroll = () => {
    placeThumb();
    setScrolling(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setScrolling(false), SCROLL_HIDE_DELAY_MS);
  };

  const scrollToThumbTop = (top) => {
    const sizes = getSizes();
    if (!sizes || sizes.track <= sizes.height) return;
    const clamped = Math.min(Math.max(top, 0), sizes.track - sizes.height);
    listRef.current.scrollTop = (clamped / (sizes.track - sizes.height)) * sizes.maxScroll;
  };

  const onThumbPointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const thumbEl = e.currentTarget;
    const barTop = barRef.current.getBoundingClientRect().top;
    const grabOffset = e.clientY - thumbEl.getBoundingClientRect().top;
    // Capture keeps the drag alive when the pointer leaves the thumb; the
    // listeners live on window so dragging still works if capture is refused.
    try {
      thumbEl.setPointerCapture(e.pointerId);
    } catch {
      /* non-capturable pointer */
    }
    setDragging(true);
    const onMove = (ev) => scrollToThumbTop(ev.clientY - barTop - SCROLLBAR_PADDING - grabOffset);
    const onUp = () => {
      setDragging(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const onBarPointerDown = (e) => {
    if (e.target !== barRef.current) return;
    const sizes = getSizes();
    if (!sizes) return;
    const y = e.clientY - barRef.current.getBoundingClientRect().top;
    scrollToThumbTop(y - SCROLLBAR_PADDING - sizes.height / 2);
  };

  return (
    <div className={cx('time-colwrap')}>
      <div className={cx('time-col')} ref={listRef} onScroll={withScrollbar ? onScroll : undefined}>
        {children}
      </div>
      {withScrollbar && (
        <div className={cx('time-scrollbar', { scrolling, dragging })} ref={barRef} onPointerDown={onBarPointerDown}>
          <div
            className={cx('time-scrollbar-thumb')}
            style={{ top: `${thumb.top}px`, height: `${thumb.height}px` }}
            onPointerDown={onThumbPointerDown}
          />
        </div>
      )}
    </div>
  );
};

const TimepickerInput = ({ currentTimestamp, isTwentyFourHourMode, darkMode, onTimeChange, minTime, maxTime }) => {
  const momentObj = currentTimestamp ? moment(currentTimestamp) : null;
  const selectedHour = momentObj?.hour() || 0;
  const selectedMinute = momentObj?.minute() || 0;
  const selectedAmPm = selectedHour >= 12 ? 'PM' : 'AM';

  // Convert 24-hour format to 12-hour display format
  const get12HourDisplay = (hour24) => {
    if (hour24 === 0) return 12; // 0 (midnight) -> 12 AM
    if (hour24 <= 12) return hour24; // 1-12 -> 1-12
    return hour24 - 12; // 13-23 -> 1-11
  };

  // Get display hour for current selection
  const selectedHourDisplay = !isTwentyFourHourMode ? get12HourDisplay(selectedHour) : selectedHour;

  let minHour = 0;
  let minMinute = 0;
  if (minTime) {
    if (typeof minTime === 'string') {
      [minHour, minMinute] = minTime.split(':');
    } else if (typeof minTime === 'object') {
      minHour = minTime.getHours();
      minMinute = minTime.getMinutes();
    }
  }

  let maxHour = 23;
  let maxMinute = 59;
  if (maxTime) {
    if (typeof maxTime === 'string') {
      [maxHour, maxMinute] = maxTime.split(':');
    } else if (typeof maxTime === 'object') {
      maxHour = maxTime.getHours();
      maxMinute = maxTime.getMinutes();
    }
  }

  // Convert 12-hour display to 24-hour format
  const convertTo24Hour = (hour12, isPM) => {
    if (hour12 === 12) {
      return isPM ? 12 : 0; // 12 PM = 12, 12 AM = 0
    }
    return isPM ? hour12 + 12 : hour12; // 1-11 PM = 13-23, 1-11 AM = 1-11
  };

  return (
    <div className={cx('custom-time-input ')}>
      <div className={cx('d-flex time-input-body')}>
        <div className={cx('time-col-group')}>
          <span className={cx('time-header')}>Hours</span>
          <TimeScrollColumn>
            {isTwentyFourHourMode
              ? [...Array(24).keys()].map((hour) => (
                  <div
                    key={hour}
                    className={cx('time-item', {
                      'selected-time': selectedHour === hour,
                      'disabled-time': hour < minHour || hour > maxHour,
                    })}
                    onClick={() => {
                      onTimeChange(hour, 'hours');
                    }}
                  >
                    {String(hour).padStart(2, '0')}
                  </div>
                ))
              : [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((hour12) => {
                  const hour24 = convertTo24Hour(hour12, selectedAmPm === 'PM');
                  return (
                    <div
                      key={hour12}
                      className={cx('time-item', {
                        'selected-time': selectedHourDisplay === hour12,
                        'disabled-time': hour24 < minHour || hour24 > maxHour,
                      })}
                      onClick={() => {
                        onTimeChange(hour24, 'hours');
                      }}
                    >
                      {String(hour12).padStart(2, '0')}
                    </div>
                  );
                })}
          </TimeScrollColumn>
        </div>
        <div className={cx('time-col-group')}>
          <span className={cx('time-header')}>Minutes</span>
          <TimeScrollColumn>
            {[...Array(60).keys()].map((minute) => (
              <div
                key={minute}
                className={cx('time-item', {
                  'selected-time': selectedMinute === minute,
                  'disabled-time':
                    selectedHour < minHour ||
                    selectedHour > maxHour ||
                    (selectedHour == minHour && minute < minMinute) ||
                    (selectedHour == maxHour && minute > maxMinute),
                })}
                onClick={() => onTimeChange(minute, 'minutes')}
              >
                {String(minute).padStart(2, '0')}
              </div>
            ))}
          </TimeScrollColumn>
        </div>
        {!isTwentyFourHourMode && (
          <div className={cx('time-col-group')}>
            <span className={cx('time-header')}>am/pm</span>
            <TimeScrollColumn withScrollbar={false}>
              <div
                className={cx('time-item', {
                  'selected-time': selectedAmPm === 'AM',
                  'disabled-time': minHour > 11,
                })}
                onClick={() => {
                  // Convert current hour to AM
                  const hour12 = get12HourDisplay(selectedHour);
                  const newHour24 = convertTo24Hour(hour12, false); // false = AM
                  onTimeChange(newHour24, 'hours');
                }}
              >
                AM
              </div>
              <div
                className={cx('time-item', {
                  'selected-time': selectedAmPm === 'PM',
                  'disabled-time': maxHour < 12,
                })}
                onClick={() => {
                  // Convert current hour to PM
                  const hour12 = get12HourDisplay(selectedHour);
                  const newHour24 = convertTo24Hour(hour12, true); // true = PM
                  onTimeChange(newHour24, 'hours');
                }}
              >
                PM
              </div>
            </TimeScrollColumn>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimepickerInput;
