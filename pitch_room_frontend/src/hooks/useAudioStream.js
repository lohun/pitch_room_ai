import { useState, useEffect, useRef, useCallback } from 'react';

const SAMPLE_RATE = 16000;

export const useAudioStream = (sessionId) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcripts, setTranscripts] = useState([]);
  const [evaluation, setEvaluation] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, connecting, active, error
  
  const socketRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const processorRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);

  const playNextInQueue = useCallback(async () => {
    if (audioQueueRef.current.length === 0 || isPlayingRef.current) return;
    
    isPlayingRef.current = true;
    const audioData = audioQueueRef.current.shift();
    
    try {
      const audioBuffer = await audioContextRef.current.decodeAudioData(audioData);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => {
        isPlayingRef.current = false;
        playNextInQueue();
      };
      source.start();
    } catch (e) {
      console.error("Error playing audio chunk:", e);
      isPlayingRef.current = false;
      playNextInQueue();
    }
  }, []);

  const startStream = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      setStatus('connecting');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // Adjust this URL to your backend
      const wsUrl = `${protocol}//localhost:8000/ws/audio/${sessionId}`;
      socketRef.current = new WebSocket(wsUrl);
      
      socketRef.current.onopen = () => {
        console.log("WebSocket connected");
        setStatus('active');
        setupAudio();
      };

      socketRef.current.onmessage = async (event) => {
        if (typeof event.data === 'string') {
          const data = JSON.parse(event.data);
          if (data.type === 'transcript') {
            setTranscripts(prev => [...prev, { speaker: data.speaker, text: data.text }]);
            if (data.evaluation) {
              setEvaluation(data.evaluation);
            }
          }
        } else {
          // Binary data (audio response)
          const arrayBuffer = await event.data.arrayBuffer();
          audioQueueRef.current.push(arrayBuffer);
          playNextInQueue();
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
  }, [sessionId, playNextInQueue]);

  const setupAudio = async () => {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: SAMPLE_RATE,
      });

      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      
      // Use ScriptProcessorNode for simplicity in this demo (deprecated but widely supported for small tasks)
      // For production, use AudioWorklet
      processorRef.current = audioContextRef.current.createScriptProcessor(512, 1, 1);
      
      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      processorRef.current.onaudioprocess = (e) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          // Send as Float32 binary
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
  };

  const endStream = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
    }
    stopAudio();
  }, []);

  useEffect(() => {
    return () => {
      endStream();
    };
  }, [endStream]);

  return {
    isRecording,
    transcripts,
    evaluation,
    status,
    startStream,
    endStream
  };
};
