/**
 * Smart Camera & Microphone Device Routing Helper
 * - Desktop/Laptop: Filters out Windows Phone Link, virtual mobile bridge cameras,
 *   and virtual drivers so physical Integrated/USB/HD webcams & local mics are selected.
 * - Mobile browsers: Selects front ('user') or back ('environment') camera via facingMode.
 */

const VIRTUAL_OR_PHONE_CAMERA_RE =
  /phone link|piyush|a55|samsung|galaxy|iphone|pixel|virtual|obs|snap\s?camera|manycam|camo|iriun|droidcam|epoccam|continuity|link to windows/i;

const PHYSICAL_WEBCAM_PRIORITY_RE =
  /integrated|webcam|usb|hd|facetime|built-in|laptop|internal|chicony|realtek|sunplus|logi|hp|dell|lenovo|asus|acer/i;

const VIRTUAL_AUDIO_RE =
  /phone link|piyush|a55|virtual|vb-audio|voicemeeter|droidcam|iriun/i;

export function isMobileBrowser() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return true;
  }
  return Boolean(
    typeof window !== 'undefined' &&
      navigator.maxTouchPoints > 1 &&
      window.innerWidth < 768
  );
}

export function isVirtualOrPhoneCamera(label = '') {
  return VIRTUAL_OR_PHONE_CAMERA_RE.test(label);
}

export function isVirtualAudioDevice(label = '') {
  return VIRTUAL_AUDIO_RE.test(label);
}

export async function getFilteredMediaDevices() {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
    return {
      allCameras: [],
      physicalCameras: [],
      allMics: [],
      physicalMics: [],
      isMobile: isMobileBrowser(),
    };
  }

  const devices = await navigator.mediaDevices.enumerateDevices();
  const isMobile = isMobileBrowser();

  const allCameras = devices.filter((d) => d.kind === 'videoinput');
  const allMics = devices.filter((d) => d.kind === 'audioinput');

  const nonVirtualCameras = allCameras.filter((d) => !isVirtualOrPhoneCamera(d.label || ''));
  const physicalCameras = (nonVirtualCameras.length > 0 ? nonVirtualCameras : allCameras).slice().sort((a, b) => {
    const aPref = PHYSICAL_WEBCAM_PRIORITY_RE.test(a.label || '') ? 1 : 0;
    const bPref = PHYSICAL_WEBCAM_PRIORITY_RE.test(b.label || '') ? 1 : 0;
    return bPref - aPref;
  });

  const nonVirtualMics = allMics.filter((d) => !isVirtualAudioDevice(d.label || ''));
  const physicalMics = nonVirtualMics.length > 0 ? nonVirtualMics : allMics;

  return {
    allCameras,
    physicalCameras,
    allMics,
    physicalMics,
    isMobile,
  };
}

export async function openPreferredMediaStream({
  audio = true,
  video = true,
  facingMode = 'user',
  preferredCameraId = null,
  preferredMicId = null,
} = {}) {
  const isMobile = isMobileBrowser();
  let deviceSnapshot = await getFilteredMediaDevices();

  let videoConstraint = false;
  if (video) {
    if (preferredCameraId) {
      videoConstraint = {
        deviceId: { exact: preferredCameraId },
        width: { ideal: 640 },
        height: { ideal: 480 },
      };
    } else if (isMobile) {
      videoConstraint = {
        facingMode: { ideal: facingMode },
        width: { ideal: 640 },
        height: { ideal: 480 },
      };
    } else {
      const labeledPhysical = deviceSnapshot.physicalCameras.find(
        (d) => d.label && !isVirtualOrPhoneCamera(d.label)
      );
      videoConstraint = labeledPhysical
        ? {
            deviceId: { exact: labeledPhysical.deviceId },
            width: { ideal: 640 },
            height: { ideal: 480 },
          }
        : {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
          };
    }
  }

  let audioConstraint = false;
  if (audio) {
    if (preferredMicId) {
      audioConstraint = { deviceId: { exact: preferredMicId } };
    } else if (!isMobile) {
      const labeledMic = deviceSnapshot.physicalMics.find(
        (d) => d.label && !isVirtualAudioDevice(d.label)
      );
      audioConstraint = labeledMic ? { deviceId: { exact: labeledMic.deviceId } } : true;
    } else {
      audioConstraint = true;
    }
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: audioConstraint,
    video: videoConstraint,
  });

  // Post-permission Desktop Guard: if browser initially defaulted to Phone Link / Virtual camera
  // before labels were exposed, immediately re-open using physical integrated/USB webcam!
  deviceSnapshot = await getFilteredMediaDevices();

  if (video && !isMobile && !preferredCameraId) {
    const activeVideoTrack = stream.getVideoTracks()[0];
    if (activeVideoTrack && isVirtualOrPhoneCamera(activeVideoTrack.label || '')) {
      const physicalReplacement = deviceSnapshot.physicalCameras.find(
        (d) => d.deviceId && !isVirtualOrPhoneCamera(d.label || '')
      );
      if (physicalReplacement) {
        try {
          const camOnlyStream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: { exact: physicalReplacement.deviceId },
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
            audio: false,
          });
          const replacementTrack = camOnlyStream.getVideoTracks()[0];
          if (replacementTrack) {
            stream.removeTrack(activeVideoTrack);
            activeVideoTrack.stop();
            stream.addTrack(replacementTrack);
          }
        } catch (err) {
          console.warn('Desktop physical camera switch fallback:', err);
        }
      }
    }
  }

  if (audio && !isMobile && !preferredMicId) {
    const activeAudioTrack = stream.getAudioTracks()[0];
    if (activeAudioTrack && isVirtualAudioDevice(activeAudioTrack.label || '')) {
      const physicalMic = deviceSnapshot.physicalMics.find(
        (d) => d.deviceId && !isVirtualAudioDevice(d.label || '')
      );
      if (physicalMic) {
        try {
          const micOnlyStream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: physicalMic.deviceId } },
            video: false,
          });
          const replacementMicTrack = micOnlyStream.getAudioTracks()[0];
          if (replacementMicTrack) {
            stream.removeTrack(activeAudioTrack);
            activeAudioTrack.stop();
            stream.addTrack(replacementMicTrack);
          }
        } catch (err) {
          console.warn('Desktop physical mic switch fallback:', err);
        }
      }
    }
  }

  const activeVideoSettings = stream.getVideoTracks()[0]?.getSettings?.() || {};
  const activeAudioSettings = stream.getAudioTracks()[0]?.getSettings?.() || {};

  return {
    stream,
    cameras: deviceSnapshot.physicalCameras,
    allCameras: deviceSnapshot.allCameras,
    mics: deviceSnapshot.physicalMics,
    allMics: deviceSnapshot.allMics,
    activeCameraId: activeVideoSettings.deviceId || '',
    activeCameraLabel: stream.getVideoTracks()[0]?.label || '',
    activeMicId: activeAudioSettings.deviceId || '',
    activeMicLabel: stream.getAudioTracks()[0]?.label || '',
    isMobile: deviceSnapshot.isMobile,
  };
}
