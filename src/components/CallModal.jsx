import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  ShieldCheck,
  MonitorUp,
  SwitchCamera,
  Circle,
  Square,
  SlidersHorizontal,
  Camera,
  Check
} from 'lucide-react';
import AvatarIcon from './AvatarIcon';
import { supabase } from '../lib/supabase';
import { openPreferredMediaStream } from '../lib/mediaDevices';

const normalizeHandle = (h) => String(h || '').trim().replace(/^@+/, '').toLowerCase();
const isValidUUID = (str) =>
  typeof str === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export default function CallModal({ call, currentUser, onEndCall, onSaveCallRecording, onSendCallSignal }) {
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(call?.type !== 'video');
  const [facingMode, setFacingMode] = useState('user');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [connectionState, setConnectionState] = useState('connecting');

  // Smart Hardware Device Switching (Laptop Physical Webcam/Mic vs Mobile Front/Back)
  const [availableCameras, setAvailableCameras] = useState([]);
  const [availableMics, setAvailableMics] = useState([]);
  const [activeCameraId, setActiveCameraId] = useState('');
  const [activeMicId, setActiveMicId] = useState('');
  const [activeCameraLabel, setActiveCameraLabel] = useState('');
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [showDeviceMenu, setShowDeviceMenu] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const [localStreamState, setLocalStreamState] = useState(null);
  const screenStreamRef = useRef(null);
  const channelRef = useRef(null);
  const deviceMenuRef = useRef(null);

  const attachLocalVideoRef = useCallback(
    (node) => {
      localVideoRef.current = node;
      const activeStream = screenStreamRef.current || localStreamState || localStreamRef.current;
      if (node && activeStream && node.srcObject !== activeStream) {
        node.srcObject = activeStream;
      }
    },
    [localStreamState, isScreenSharing]
  );

  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recTimerRef = useRef(null);

  const isVideoCall = call?.type === 'video' || call?.call_type === 'video';
  const otherParty = call?.isIncoming ? call?.caller : (call?.contact || call?.recipient);
  const otherPartyName = otherParty?.name || otherParty?.full_name || call?.caller_name || 'Nexo Peer';
  const otherPartyHandle = otherParty?.handle || otherParty?.username || call?.caller_username || '@peer';
  const normalizedOtherHandle = normalizeHandle(otherPartyHandle);
  const isBotOrLocalCall =
    normalizedOtherHandle === 'placement_bot' ||
    otherParty?.id === 'chat_placement_bot' ||
    otherParty?.id === 'self_vault' ||
    Boolean(otherParty?.isSelfChat);

  useEffect(() => {
    const handleOutside = (e) => {
      if (deviceMenuRef.current && !deviceMenuRef.current.contains(e.target)) {
        setShowDeviceMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    if (connectionState !== 'connected' && connectionState !== 'ringing') return;
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [connectionState]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let isMounted = true;
    const callId = call?.call_id || call?.id || `call_${Date.now()}`;
    const sendSignal = (eventName, payload) => {
      if (onSendCallSignal) {
        onSendCallSignal(eventName, payload);
      } else if (channelRef.current) {
        channelRef.current.send({ type: 'broadcast', event: eventName, payload });
      }
    };

    const handleWindowSignal = async (e) => {
      const { kind, payload } = e?.detail || {};
      if (!payload) return;
      const msgCallId = payload.call_id || payload.callId;
      if (msgCallId !== callId) return;

      if (kind === 'call-answer' && (payload.answer || payload.answer_sdp) && pcRef.current) {
        try {
          if (pcRef.current.signalingState !== 'stable') {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer || payload.answer_sdp));
            setConnectionState('connected');
          }
        } catch {}
      } else if (kind === 'ice-candidate' && payload.candidate && payload.senderId !== currentUser?.id && pcRef.current) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch {}
      } else if (kind === 'call-ended' && payload.senderId !== currentUser?.id) {
        setConnectionState('ended');
        setTimeout(() => handleHangup(false), 300);
      }
    };

    window.addEventListener('nexo-call-signal', handleWindowSignal);

    const setupCall = async () => {
      try {
        const mediaInfo = await openPreferredMediaStream({
          audio: true,
          video: isVideoCall,
          facingMode: 'user',
        });

        if (!isMounted) {
          mediaInfo.stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = mediaInfo.stream;
        setLocalStreamState(mediaInfo.stream);
        setAvailableCameras(mediaInfo.cameras);
        setAvailableMics(mediaInfo.mics);
        setActiveCameraId(mediaInfo.activeCameraId);
        setActiveMicId(mediaInfo.activeMicId);
        setActiveCameraLabel(mediaInfo.activeCameraLabel);
        setIsMobileDevice(mediaInfo.isMobile);

        if (localVideoRef.current && isVideoCall) {
          localVideoRef.current.srcObject = mediaInfo.stream;
        }

        // For Bot / Mock Interview / Self Vault local preview
        if (isBotOrLocalCall) {
          setConnectionState('connected');
          return;
        }

        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        });
        pcRef.current = pc;

        mediaInfo.stream.getTracks().forEach((track) => pc.addTrack(track, mediaInfo.stream));

        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
          if (remoteAudioRef.current && event.streams[0]) {
            remoteAudioRef.current.srcObject = event.streams[0];
          }
          setConnectionState('connected');
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            sendSignal('ice-candidate', { callId, call_id: callId, candidate: event.candidate, senderId: currentUser?.id });
          }
        };

        const incomingOffer = call?.offer_sdp || call?.offer;
        if (call?.isIncoming && incomingOffer) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendSignal('call-answer', { callId, call_id: callId, answer, answer_sdp: answer, senderId: currentUser?.id });
            setConnectionState('connected');
          } catch {}
        } else {
          try {
            setConnectionState('ringing');
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // Resolve receiver UUID from profiles if not present
            let targetUuid = otherParty?.recipientId || (isValidUUID(otherParty?.id) ? otherParty.id : null);
            if (!targetUuid && normalizedOtherHandle) {
              try {
                const { data } = await supabase
                  .from('profiles')
                  .select('id')
                  .ilike('username', `@${normalizedOtherHandle}`)
                  .limit(1);
                if (data?.[0]?.id && isValidUUID(data[0].id)) targetUuid = data[0].id;
              } catch {}
            }

            const callPayload = {
              call_id: callId,
              callId,
              caller_id: currentUser?.id,
              caller_name: currentUser?.name || 'Nexo Peer',
              caller_username: currentUser?.username || '@peer',
              caller_avatar: currentUser?.avatar || currentUser?.avatar_url || null,
              callee_id: targetUuid,
              callee_username: normalizedOtherHandle,
              call_type: isVideoCall ? 'video' : 'voice',
              offer_sdp: offer,
              caller: currentUser,
              recipientId: targetUuid,
              recipientHandle: otherPartyHandle,
              offer,
              type: isVideoCall ? 'video' : 'voice',
            };

            sendSignal('incoming_call', callPayload);

            // DB Fallback row inside Supabase messages ("__NEXO_CALL__:") so background tabs/devices never miss
            if (isValidUUID(currentUser?.id) && isValidUUID(targetUuid)) {
              const dbCallRow = `__NEXO_CALL__:${JSON.stringify({
                call_id: callId,
                caller_id: currentUser.id,
                caller_name: currentUser?.name || 'Nexo Peer',
                caller_username: currentUser?.username || '@peer',
                caller_avatar: currentUser?.avatar || currentUser?.avatar_url || null,
                callee_id: targetUuid,
                callee_username: normalizedOtherHandle,
                call_type: isVideoCall ? 'video' : 'voice',
                offer_sdp: offer,
              })}`;
              supabase
                .from('messages')
                .insert({
                  id: `call_${callId}`,
                  sender_id: currentUser.id,
                  receiver_id: targetUuid,
                  content: dbCallRow,
                  status: 'sent',
                })
                .then(() => {})
                .catch(() => {});
            }
          } catch {}
        }
      } catch (mediaErr) {
        console.warn('Camera/Mic hardware unavailable fallback:', mediaErr);
        if (isMounted) setConnectionState(isBotOrLocalCall ? 'connected' : 'ringing');
      }
    };

    setupCall();

    return () => {
      isMounted = false;
      window.removeEventListener('nexo-call-signal', handleWindowSignal);
      if (recTimerRef.current) clearInterval(recTimerRef.current);
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
      if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach((t) => t.stop());
      if (pcRef.current) pcRef.current.close();
    };
  }, [call?.id, call?.call_id, isVideoCall]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
    setIsMuted((prev) => !prev);
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
    setIsVideoOff((prev) => !prev);
  };

  const handleSelectCamera = async (deviceId) => {
    setShowDeviceMenu(false);
    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId }, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      const newTrack = nextStream.getVideoTracks()[0];
      if (!newTrack) return;

      if (!localStreamRef.current) localStreamRef.current = new MediaStream();
      localStreamRef.current.getVideoTracks().forEach((t) => {
        localStreamRef.current.removeTrack(t);
        t.stop();
      });
      localStreamRef.current.addTrack(newTrack);
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;

      const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) sender.replaceTrack(newTrack);

      setActiveCameraId(deviceId);
      setActiveCameraLabel(newTrack.label || '');
      setIsVideoOff(false);
    } catch (err) {
      console.warn('Camera switch error:', err);
    }
  };

  const handleSelectMic = async (deviceId) => {
    setShowDeviceMenu(false);
    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
        video: false,
      });
      const newTrack = nextStream.getAudioTracks()[0];
      if (!newTrack) return;

      if (!localStreamRef.current) localStreamRef.current = new MediaStream();
      localStreamRef.current.getAudioTracks().forEach((t) => {
        localStreamRef.current.removeTrack(t);
        t.stop();
      });
      localStreamRef.current.addTrack(newTrack);

      const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === 'audio');
      if (sender) sender.replaceTrack(newTrack);

      setActiveMicId(deviceId);
    } catch (err) {
      console.warn('Mic switch error:', err);
    }
  };

  const handleFlipCamera = async () => {
    // On desktop with multiple physical cameras, cycle physical cameras; on mobile flip user <-> environment
    if (!isMobileDevice && availableCameras.length > 1) {
      const idx = availableCameras.findIndex((c) => c.deviceId === activeCameraId);
      const nextCam = availableCameras[(idx + 1) % availableCameras.length];
      if (nextCam?.deviceId) {
        await handleSelectCamera(nextCam.deviceId);
        return;
      }
    }

    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    try {
      const mediaInfo = await openPreferredMediaStream({
        audio: false,
        video: true,
        facingMode: nextFacing,
      });
      const newVideoTrack = mediaInfo.stream.getVideoTracks()[0];
      if (newVideoTrack && localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((t) => {
          localStreamRef.current.removeTrack(t);
          t.stop();
        });
        localStreamRef.current.addTrack(newVideoTrack);
        if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;

        const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(newVideoTrack);
        setActiveCameraId(mediaInfo.activeCameraId);
        setActiveCameraLabel(mediaInfo.activeCameraLabel);
      }
    } catch (err) {
      console.warn('Camera flip warning:', err);
    }
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === 'video');
      if (sender && camTrack) sender.replaceTrack(camTrack);
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);

      const screenTrack = screenStream.getVideoTracks()[0];
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }
      const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === 'video');
      if (sender && screenTrack) sender.replaceTrack(screenTrack);

      screenTrack.onended = () => {
        setIsScreenSharing(false);
        if (localVideoRef.current && localStreamRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      };
    } catch (err) {
      console.warn('Screen share cancelled:', err);
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      if (recTimerRef.current) {
        clearInterval(recTimerRef.current);
        recTimerRef.current = null;
      }
      try {
        mediaRecorderRef.current?.stop();
      } catch {}
      setIsRecording(false);
      return;
    }

    const activeStream = screenStreamRef.current || localStreamRef.current;
    if (!activeStream) return;

    try {
      recordedChunksRef.current = [];
      let mimeType = 'video/webm';
      if (!MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      }

      const recorder = mimeType ? new MediaRecorder(activeStream, { mimeType }) : new MediaRecorder(activeStream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      const startedSecs = Date.now();
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);
        const fileName = `Nexo_Call_${otherPartyName.replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}.webm`;
        const durationSec = Math.max(1, Math.round((Date.now() - startedSecs) / 1000));
        const sizeStr = blob.size > 1024 * 1024
          ? `${(blob.size / (1024 * 1024)).toFixed(2)} MB`
          : `${Math.max(1, Math.round(blob.size / 1024))} KB`;

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();

        onSaveCallRecording?.({
          fileName,
          fileSize: sizeStr,
          blobUrl: url,
          durationSeconds: durationSec,
          contactName: otherPartyName,
        });
        setRecordingSeconds(0);
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);
      recTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.warn('Call recording failed:', err);
    }
  };

  const handleHangup = (notifyRemote = true) => {
    if (isRecording) {
      try { mediaRecorderRef.current?.stop(); } catch {}
    }
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    const activeCallId = call?.call_id || call?.id;
    if (notifyRemote && activeCallId) {
      const endPayload = { callId: activeCallId, call_id: activeCallId, senderId: currentUser?.id };
      try {
        onSendCallSignal?.('call-ended', endPayload);
        channelRef.current?.send({
          type: 'broadcast',
          event: 'call-ended',
          payload: endPayload,
        });
      } catch {}
    }
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
    if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach((t) => t.stop());
    if (pcRef.current) pcRef.current.close();
    onEndCall({
      durationSeconds: callDuration,
      type: call?.call_type || call?.type || 'voice',
      contact: otherParty,
      chatId: otherParty?.id || otherParty?.recipientId || null,
    });
  };

  if (!call) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn font-sans">
      <audio ref={remoteAudioRef} autoPlay playsInline />

      <div className="w-full max-w-2xl bg-[#111b21] text-white rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col relative min-h-[460px]">
        {/* Top Header */}
        <div className="p-4 flex items-center justify-between z-30 bg-gradient-to-b from-black/85 via-black/45 to-transparent relative">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${connectionState === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'}`} />
            <span className="text-[12.5px] font-medium text-emerald-400 flex items-center gap-1 truncate">
              <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">
                E2EE {isBotOrLocalCall ? 'Studio' : 'WebRTC'} {isScreenSharing ? '• Screen Sharing' : activeCameraLabel ? `• ${activeCameraLabel.split('(')[0].trim()}` : ''}
              </span>
            </span>

            {isRecording && (
              <span className="ml-1 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-numeric font-bold flex items-center gap-1.5 animate-pulse shadow flex-shrink-0">
                <span className="w-2 h-2 rounded-full bg-white" />
                <span>REC {formatTime(recordingSeconds)}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            {/* Camera & Mic Hardware Switcher */}
            <div className="relative" ref={deviceMenuRef}>
              <button
                type="button"
                onClick={() => setShowDeviceMenu((v) => !v)}
                className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[11.5px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Switch Camera & Microphone"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Devices</span>
              </button>

              {showDeviceMenu && (
                <div className="absolute right-0 top-10 z-50 w-72 bg-[#202c33] rounded-2xl shadow-2xl border border-white/15 p-3 text-left space-y-3 animate-fadeIn">
                  <div>
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#8696a0] flex items-center gap-1.5 mb-1.5">
                      <Camera className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Physical Cameras ({availableCameras.length})</span>
                    </span>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {availableCameras.length === 0 ? (
                        <p className="text-[11.5px] text-slate-400 px-2 py-1">Default system camera</p>
                      ) : (
                        availableCameras.map((cam, i) => (
                          <button
                            key={cam.deviceId || i}
                            type="button"
                            onClick={() => handleSelectCamera(cam.deviceId)}
                            className={`w-full px-2.5 py-1.5 rounded-xl text-[12px] flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                              activeCameraId === cam.deviceId
                                ? 'bg-[#00a884]/25 text-[#25d366] font-semibold'
                                : 'text-slate-200 hover:bg-white/10'
                            }`}
                          >
                            <span className="truncate">{cam.label || `Webcam ${i + 1}`}</span>
                            {activeCameraId === cam.deviceId && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-2">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#8696a0] flex items-center gap-1.5 mb-1.5">
                      <Mic className="w-3.5 h-3.5 text-sky-400" />
                      <span>Microphones ({availableMics.length})</span>
                    </span>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {availableMics.length === 0 ? (
                        <p className="text-[11.5px] text-slate-400 px-2 py-1">Default system microphone</p>
                      ) : (
                        availableMics.map((mic, i) => (
                          <button
                            key={mic.deviceId || i}
                            type="button"
                            onClick={() => handleSelectMic(mic.deviceId)}
                            className={`w-full px-2.5 py-1.5 rounded-xl text-[12px] flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                              activeMicId === mic.deviceId
                                ? 'bg-[#0055ff]/30 text-sky-300 font-semibold'
                                : 'text-slate-200 hover:bg-white/10'
                            }`}
                          >
                            <span className="truncate">{mic.label || `Microphone ${i + 1}`}</span>
                            {activeMicId === mic.deviceId && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <span className="text-[14px] font-numeric font-semibold text-slate-300">
              {formatTime(callDuration)}
            </span>
          </div>
        </div>

        {/* Center Stage */}
        <div className="flex-1 flex flex-col items-center justify-center p-5 text-center z-10 relative">
          {(isVideoCall && !isVideoOff) || isScreenSharing ? (
            <div className="relative w-full h-[300px] sm:h-[340px] rounded-2xl overflow-hidden bg-slate-900 border border-white/10 flex items-center justify-center">
              {isBotOrLocalCall ? (
                <video
                  ref={attachLocalVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 right-3 w-32 h-24 rounded-xl overflow-hidden border-2 border-white/30 bg-black/80 shadow-lg">
                    <video
                      ref={attachLocalVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  </div>
                </>
              )}
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs font-medium flex items-center gap-2">
                <span>{isBotOrLocalCall ? `Self Preview • ${otherPartyName}` : otherPartyName}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-3 py-8">
              <div className={`p-1 rounded-full ${connectionState === 'connected' ? 'ring-4 ring-emerald-500/30' : 'ring-4 ring-[#00a884]/40 animate-pulse'}`}>
                <AvatarIcon size="3xl" isGroup={Boolean(otherParty?.isGroup)} name={otherPartyName} />
              </div>
              <div>
                <h2 className="text-[22px] font-bold tracking-tight text-white">{otherPartyName}</h2>
                <p className="text-[13.5px] text-[#00a884] font-medium mt-0.5">{otherPartyHandle}</p>
                <p className="text-[12.5px] text-slate-400 mt-1">
                  {connectionState === 'connected'
                    ? 'Connected • End-to-End Encrypted'
                    : 'Ringing • WebRTC Peer Connection'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Call Controls Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-t from-black/95 via-black/65 to-transparent flex flex-wrap items-center justify-center gap-3 sm:gap-4 z-20">
          <button
            type="button"
            onClick={toggleMute}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isMuted ? 'bg-rose-600 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={toggleVideo}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isVideoOff ? 'bg-rose-600 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={handleFlipCamera}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer"
            title={isMobileDevice ? 'Flip Front/Back Camera' : 'Cycle Physical Webcam'}
          >
            <SwitchCamera className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleToggleScreenShare}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isScreenSharing ? 'bg-[#0055ff] text-white' : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
          >
            <MonitorUp className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleToggleRecording}
            className={`px-3.5 h-11 sm:h-12 rounded-full flex items-center justify-center gap-1.5 text-[12px] font-bold transition-all cursor-pointer ${
              isRecording
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 animate-pulse'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            title={isRecording ? 'Stop & Save .webm to Study Vault' : 'Record Call (.webm)'}
          >
            {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Circle className="w-4 h-4 text-rose-500 fill-rose-500" />}
            <span>{isRecording ? 'Stop REC' : 'REC'}</span>
          </button>

          <button
            type="button"
            onClick={handleHangup}
            className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xl shadow-rose-600/50 transition-transform active:scale-95 cursor-pointer"
            title="End Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
