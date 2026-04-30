import { useState, useEffect, useRef, useCallback } from 'react';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const SAMPLE_RATE = 16000;

export const useAudioStream = (sessionId) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPiaSpeaking, setIsPiaSpeaking] = useState(false);
  const [transcripts, setTranscripts] = useState([]);
  const [evaluation, setEvaluation] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, connecting, active, error

  const socketRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const processorRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);

  const speak = useCallback(async (text) => {
    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    const voiceId = import.meta.env.VITE_ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';

    if (!apiKey || apiKey === 'your_api_key_here') {
      console.warn("ElevenLabs API key not set in .env");
      return;
    }

    try {
      setIsPiaSpeaking(true);
      isPlayingRef.current = true;

      const elevenlabs = new ElevenLabsClient({ apiKey: apiKey });
      const generatedAudio = await elevenlabs.textToSpeech.convert(
        voiceId, // "George" - browse voices at elevenlabs.io/app/voice-library
        {
          text: text,
          modelId: 'eleven_v3',
          outputFormat: 'mp3_44100_128',
        }
      );
      const audioStream = (await generatedAudio.getReader().read()).value;
      const audioBlob = new Blob([audioStream], { type: 'audio/mpeg' })

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        setIsPiaSpeaking(false);
        isPlayingRef.current = false;
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (e) {
      console.error("Error in ElevenLabs TTS:", e);
      setIsPiaSpeaking(false);
      isPlayingRef.current = false;
    }
  }, []);

  const startStream = useCallback(async () => {
    if (!sessionId) return;

    try {
      setStatus('connecting');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//localhost:8000/ws/audio/${sessionId}`;
      socketRef.current = new WebSocket(wsUrl);

      socketRef.current.onopen = async () => {
        console.log("WebSocket connected");
        setStatus('active');
        await setupAudio();
      };

      socketRef.current.onmessage = async (event) => {
        if (typeof event.data === 'string') {
          const data = JSON.parse(event.data);
          if (data.type === 'transcript') {
            setTranscripts(prev => [...prev, { speaker: data.speaker, text: data.text }]);
            if (data.evaluation) {
              setEvaluation(data.evaluation);
            }
            // Trigger TTS for Pia
            if (data.speaker === 'pia') {
              speak(data.text);
            }
          }
        }
      };

      socketRef.current.onerror = (e) => {
        console.error("WebSocket error:", e);
        setStatus('error');
      };

      socketRef.current.onclose = () => {
        console.log("WebSocket closed");
        setStatus('idle');
        stopAudio();
      };

    } catch (e) {
      console.error("Failed to start stream:", e);
      setStatus('error');
    }
  }, [sessionId, speak]);

  const setupAudio = async () => {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: SAMPLE_RATE,
      });

      // Resume context (important for browsers)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);

      // Use ScriptProcessorNode for simplicity in this demo (deprecated but widely supported for small tasks)
      // For production, use AudioWorklet
      processorRef.current = audioContextRef.current.createScriptProcessor(512, 1, 1);

      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      processorRef.current.onaudioprocess = (e) => {
        // Echo suppression: don't send mic data while Pia is speaking
        if (socketRef.current?.readyState === WebSocket.OPEN && !isPlayingRef.current) {
          const inputData = e.inputBuffer.getChannelData(0);
          socketRef.current.send(inputData.buffer);
        }
      };

      setIsRecording(true);
    } catch (e) {
      console.error("Audio setup failed:", e);
      setStatus('error');
    }
  };

  const stopAudio = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsRecording(false);
    setIsPiaSpeaking(false);
  };

  const endStream = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
    }
    stopAudio();
    audioQueueRef.current = [];
    isPlayingRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      endStream();
    };
  }, [endStream]);

  return {
    isRecording,
    isPiaSpeaking,
    transcripts,
    evaluation,
    status,
    startStream,
    endStream
  };
};
