import React, { useState, useEffect, useRef } from 'react';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Volume2, 
  ShieldCheck
} from 'lucide-react';
import AvatarIcon from './AvatarIcon';
import { supabase } from '../lib/supabase';

export default function CallModal({ call, currentUser, onEndCall }) {
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(call?.type !== 'video');
  const [connectionState, setConnectionState] = useState('connecting'); // 'connecting' | 'ringing' | 'connected' | 'ended'

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const channelRef = useRef(null);

  const isVideoCall = call?.type === 'video';
  const otherParty = call?.isIncoming ? call?.caller : (call?.contact || call?.recipient);
  const otherPartyName = otherParty?.name || otherParty?.full_name || 'Nexo User';
  const otherPartyHandle = otherParty?.handle || otherParty?.username || '@contact';

  // Live Call Timer
  useEffect(() => {
    if (connectionState !== 'connected') return;
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

  // Real WebRTC setup & Supabase Realtime Broadcast signaling
  useEffect(() => {
    let isMounted = true;
    const callId = call?.id || `call_${Date.now()}`;

    const channel = supabase.channel(`call-signaling-${callId}`);
    channelRef.current = channel;

    const setupCall = async () => {
      try {
        // 1. Acquire Local Media Stream
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: isVideoCall ? { width: { ideal: 640 }, height: { ideal: 480 } } : false
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current && isVideoCall) {
          localVideoRef.current.srcObject = stream;
        }

        // 2. Create RTCPeerConnection with Google STUN
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
          ]
        });
        pcRef.current = pc;

        // Add local tracks to peer connection
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        // Remote track received
        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
          if (remoteAudioRef.current && event.streams[0]) {
            remoteAudioRef.current.srcObject = event.streams[0];
          }
          setConnectionState('connected');
        };

        // ICE candidate exchange
        pc.onicecandidate = (event) => {
          if (event.candidate && channelRef.current) {
            channelRef.current.send({
              type: 'broadcast',
              event: 'ice-candidate',
              payload: {
                callId,
                candidate: event.candidate,
                senderId: currentUser?.id
              }
            });
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') {
            setConnectionState('connected');
          } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
            setConnectionState('ended');
            setTimeout(handleHangup, 1500);
          }
        };

        // 3. Supabase Realtime channel listeners
        channel
          .on('broadcast', { event: 'call-answer' }, async ({ payload }) => {
            if (payload?.callId === callId && payload?.answer && pcRef.current) {
              try {
                if (pcRef.current.signalingState !== 'stable') {
                  await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
                  setConnectionState('connected');
                }
              } catch (e) {
                console.warn('Set remote answer error:', e);
              }
            }
          })
          .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
            if (payload?.callId === callId && payload?.candidate && payload?.senderId !== currentUser?.id && pcRef.current) {
              try {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
              } catch (e) {
                console.warn('Add ice candidate error:', e);
              }
            }
          })
          .on('broadcast', { event: 'call-declined' }, ({ payload }) => {
            if (payload?.callId === callId) {
              setConnectionState('ended');
              setTimeout(handleHangup, 1000);
            }
          })
          .on('broadcast', { event: 'call-ended' }, ({ payload }) => {
            if (payload?.callId === callId) {
              setConnectionState('ended');
              setTimeout(handleHangup, 800);
            }
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              if (call?.isIncoming && call?.offer) {
                // Incoming Call: Set Remote Offer and Create Answer
                try {
                  await pc.setRemoteDescription(new RTCSessionDescription(call.offer));
                  const answer = await pc.createAnswer();
                  await pc.setLocalDescription(answer);

                  channel.send({
                    type: 'broadcast',
                    event: 'call-answer',
                    payload: { callId, answer, senderId: currentUser?.id }
                  });
                  setConnectionState('connected');
                } catch (ansErr) {
                  console.warn('Create answer error:', ansErr);
                }
              } else {
                // Outgoing Call: Create Offer & Broadcast
                try {
                  setConnectionState('ringing');
                  const offer = await pc.createOffer();
                  await pc.setLocalDescription(offer);

                  const offerPayload = {
                    callId,
                    caller: currentUser,
                    recipientId: otherParty?.recipientId || otherParty?.id,
                    offer,
                    type: call.type
                  };

                  channel.send({
                    type: 'broadcast',
                    event: 'call-offer',
                    payload: offerPayload
                  });

                  try {
                    const globalChannel = supabase.channel('realtime-messages');
                    globalChannel.send({
                      type: 'broadcast',
                      event: 'call-offer',
                      payload: offerPayload
                    });
                  } catch {}
                } catch (offErr) {
                  console.warn('Create offer error:', offErr);
                }
              }
            }
          });

      } catch (mediaErr) {
        console.warn('WebRTC getUserMedia error:', mediaErr);
        alert('Could not access microphone/camera. Please ensure permissions are granted.');
        onEndCall();
      }
    };

    setupCall();

    return () => {
      isMounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [call?.id, isVideoCall]);

  // Toggle Microphone
  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle Camera
  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  // Hang up
  const handleHangup = () => {
    if (channelRef.current && call?.id) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'call-ended',
        payload: { callId: call.id, senderId: currentUser?.id }
      });
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (pcRef.current) {
      pcRef.current.close();
    }
    onEndCall();
  };

  if (!call) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-sans">
      {/* Hidden Audio element for remote voice stream */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      <div className="w-full max-w-lg bg-[#111b21] text-white rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col relative aspect-[4/3] sm:aspect-[16/10]">
        
        {/* Top Header */}
        <div className="p-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${connectionState === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'}`} />
            <span className="text-[12.5px] font-medium text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{connectionState === 'connected' ? 'WebRTC Encrypted' : connectionState === 'ringing' ? 'Ringing...' : 'Connecting...'}</span>
            </span>
          </div>

          <span className="text-[14px] font-mono font-semibold text-slate-300">
            {connectionState === 'connected' ? formatTime(callDuration) : '--:--'}
          </span>
        </div>

        {/* Center Stage: Video View OR Monochrome Silhouette Avatar */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10 relative">
          {isVideoCall && !isVideoOff && connectionState === 'connected' ? (
            /* Live Remote Video Stream */
            <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-900 border border-white/10 flex items-center justify-center">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs font-medium">
                {otherPartyName}
              </div>

              {/* Picture-in-picture Local User Video */}
              <div className="absolute bottom-3 right-3 w-28 h-20 rounded-xl overflow-hidden border-2 border-white/30 bg-black/80 shadow-lg">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ) : (
            /* Voice Call or Video Disabled: Clean Monochrome Silhouette Avatar */
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="relative">
                <div className={`p-1 rounded-full ${connectionState === 'connected' ? 'ring-4 ring-emerald-500/30' : 'ring-4 ring-[#00a884]/40 animate-pulse'}`}>
                  <AvatarIcon
                    size="3xl"
                    isGroup={Boolean(otherParty?.isGroup)}
                    name={otherPartyName}
                  />
                </div>
              </div>

              <div>
                <h2 className="text-[22px] font-bold tracking-tight text-white">
                  {otherPartyName}
                </h2>
                <p className="text-[13.5px] text-[#00a884] font-medium mt-0.5">
                  {otherPartyHandle}
                </p>
                <p className="text-[12.5px] text-slate-400 mt-1 capitalize">
                  {connectionState === 'connected'
                    ? (isVideoCall ? 'Nexo Video Call • Live' : 'Nexo Voice Call • Live')
                    : (connectionState === 'ringing' ? 'Ringing...' : 'Securing P2P WebRTC Connection...')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Call Controls Bar */}
        <div className="p-5 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-center gap-4 z-20">
          {/* Mute Mic Toggle */}
          <button
            type="button"
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isMuted
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Video Toggle (if video call) */}
          {isVideoCall && (
            <button
              type="button"
              onClick={toggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isVideoOff
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title={isVideoOff ? 'Turn video on' : 'Turn video off'}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}

          {/* End Call / Hang Up */}
          <button
            type="button"
            onClick={handleHangup}
            className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xl shadow-rose-600/40 transition-transform active:scale-95 cursor-pointer"
            title="End Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>

      </div>
    </div>
  );
}
