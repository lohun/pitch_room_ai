import { useState, useRef, useCallback, useEffect } from 'react';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

const generateWebrtcId = () => Math.random().toString(36).substr(2, 9);

export const useRtcAudioStream = (sessionId) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPiaSpeaking, setIsPiaSpeaking] = useState(false);
  const [transcripts, setTranscripts] = useState([]);
  const [evaluation, setEvaluation] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, connecting, active, error

  const pcRef = useRef(null);
  const streamRef = useRef(null);
  const dataChannelRef = useRef(null);
  const isPlayingRef = useRef(false);
  const micSenderRef = useRef(null);

  // ── Handle incoming Data Channel messages from FastRTC ────────────────────
  const handleDataChannelMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('RTC Data Channel Message:', data);

      if (data.type === 'transcript') {
        // Add to transcripts feed
        setTranscripts((prev) => [...prev, { 
          speaker: data.speaker, 
          text: data.text,
          timestamp: new Date().toISOString()
        }]);

        // Process evaluation if present
        if (data.evaluation) {
          // The LLM returns scores 0-10, but UI expects 0-1 for percentage calculation
          const normalizedScores = {};
          Object.entries(data.evaluation).forEach(([key, value]) => {
            normalizedScores[key] = typeof value === 'number' ? value / 10 : value;
          });
          
          console.log('Updated Normalized Evaluation:', normalizedScores);
          setEvaluation(normalizedScores);
        }
      }
    } catch (e) {
      console.warn('Failed to parse data channel message:', e);
    }
  }, []);

  // ── Start WebRTC stream ────────────────────────────────────────────────────
  const startStream = useCallback(async () => {
    if (!sessionId || (pcRef.current && pcRef.current.signalingState !== 'closed')) return;

    try {
      setStatus('connecting');

      const webrtcId = generateWebrtcId();

      // 1. Create RTCPeerConnection with Google STUN for NAT traversal
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      pcRef.current = pc;

      // 2. Open a Data Channel BEFORE createOffer
      // FastRTC defaults to 'data' for AdditionalOutputs
      const dataChannel = pc.createDataChannel('data');
      dataChannelRef.current = dataChannel;

      dataChannel.onopen = () => console.log('Data channel open');
      dataChannel.onmessage = handleDataChannelMessage;
      dataChannel.onerror = (e) => console.error('Data channel error:', e);
      dataChannel.onclose = () => console.log('Data channel closed');

      // Logging for debugging connection issues
      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState);
      };
      pc.onicegatheringstatechange = () => {
        console.log('ICE gathering state:', pc.iceGatheringState);
      };

      // 3. Capture microphone
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

      // Safety check: if endStream was called while waiting for mic permissions
      if (pc.signalingState === 'closed') {
        micStream.getTracks().forEach(t => t.stop());
        return;
      }

      streamRef.current = micStream;

      micStream.getAudioTracks().forEach((track) => {
        const sender = pc.addTrack(track, micStream);
        micSenderRef.current = sender;
      });

      // 4. Handle remote audio from backend
      pc.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind);
        if (event.track.kind === 'audio') {
          const remoteAudio = new Audio();
          remoteAudio.srcObject = event.streams[0];
          remoteAudio.autoplay = true;

          setIsPiaSpeaking(true);
          // Set up listeners for the audio track
          event.track.onended = () => setIsPiaSpeaking(false);
          event.track.onmute = () => setIsPiaSpeaking(false);
          event.track.onunmute = () => setIsPiaSpeaking(true);
        }
      };

      // 5. Create SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 5. Wait for ICE gathering to complete before sending offer
      await new Promise((resolve) => {
        if (pc.iceGatheringState === 'complete') {
          resolve();
        } else {
          pc.onicegatheringstatechange = () => {
            console.log('ICE gathering state change:', pc.iceGatheringState);
            if (pc.iceGatheringState === 'complete') resolve();
          };
          // Safety timeout: proceed after 5 seconds regardless
          setTimeout(resolve, 5000);
        }
      });

      pc.onicecandidateerror = (e) => {
        console.error('ICE candidate error:', e);
      };

      // 6. POST the offer to the FastRTC backend
      const response = await fetch(`${API_BASE}/rtc/${sessionId}/offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sdp: pc.localDescription.sdp,
          type: pc.localDescription.type,
          webrtc_id: webrtcId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend offer rejected: ${response.status}`);
      }

      // 7. Apply the SDP answer from FastRTC
      const answer = await response.json();

      if (pc.signalingState === 'closed') return;

      await pc.setRemoteDescription(new RTCSessionDescription(answer));

      pc.onconnectionstatechange = () => {
        console.log('RTC connection state:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          setStatus('active');
          setIsRecording(true);
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setStatus('error');
          setIsRecording(false);
        }
      };

    } catch (e) {
      console.error('Failed to start WebRTC stream:', e);
      setStatus('error');
    }
  }, [sessionId, handleDataChannelMessage]);

  // ── End stream ─────────────────────────────────────────────────────────────
  const endStream = useCallback(() => {
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    micSenderRef.current = null;
    isPlayingRef.current = false;
    setIsRecording(false);
    setIsPiaSpeaking(false);
    setStatus('idle');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => endStream();
  }, [endStream]);

  return {
    isRecording,
    isPiaSpeaking,
    transcripts,
    evaluation,
    status,
    startStream,
    endStream,
  };
};
