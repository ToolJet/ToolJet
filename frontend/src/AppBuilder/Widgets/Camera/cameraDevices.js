import { isMobileDevice } from '@/_helpers/appUtils';

const FRONT_FACING_PATTERN = /\b(front|user|selfie)\b/i;
const BACK_FACING_PATTERN = /\b(back|rear|environment)\b/i;

// Device labels are the only cross-platform hint of which way a camera points:
// Android reports "camera2 0, facing back", iOS reports "Back Dual Wide Camera".
// Desktop webcams ("FaceTime HD Camera", "Logitech C920") carry no facing hint and
// return null so they are never collapsed into one another.
export const getFacingFromLabel = (label) => {
  if (!label) return null;
  if (FRONT_FACING_PATTERN.test(label)) return 'user';
  if (BACK_FACING_PATTERN.test(label)) return 'environment';
  return null;
};

// Phones expose several logical lenses per physical camera (two "facing back"
// entries, two "facing front"), which surfaced in the picker as duplicates. Keep
// the first camera of each facing direction and pass label-less devices through.
// Original labels are preserved so desktop webcam names stay recognisable.
export const mapCameraDevices = (videoInputDevices = []) => {
  const seenFacings = new Set();

  return videoInputDevices.reduce((cameras, device, index) => {
    const facing = getFacingFromLabel(device.label);

    if (facing) {
      if (seenFacings.has(facing)) return cameras;
      seenFacings.add(facing);
    }

    const value = device.deviceId || `camera-${index}`;
    cameras.push({
      id: value,
      label: device.label || `Camera ${index + 1}`,
      value,
      facing,
    });
    return cameras;
  }, []);
};

export const hasFrontAndBackCameras = (cameras = []) =>
  cameras.some((camera) => camera.facing === 'user') && cameras.some((camera) => camera.facing === 'environment');

// The user agent alone is not enough: Android Chrome in "Desktop site" mode and
// iPadOS Safari 13+ both report a desktop UA. Touch support plus a coarse pointer
// catches those. Only used before camera permission is granted, since labels (and
// therefore the real facing capability) are blank until then.
export const isMobileBrowser = () =>
  isMobileDevice() ||
  (typeof navigator !== 'undefined' &&
    navigator.maxTouchPoints > 1 &&
    !!window.matchMedia?.('(pointer: coarse)')?.matches);
