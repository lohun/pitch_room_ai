import { useState, useRef, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export const useAudioRecorder = (sessionId) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcripts, setTranscripts] = useState([]);
  const [evaluation, setEvaluation] = useState(null);
  const [status, setStatus] = useState('idle');

  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioChunksRef = useRef([]);
  const inputStreamRef = useRef(null);

  const processAudioTo16kHzWav = useCallback(async (audioBlob) => {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const offlineContext = new OfflineAudioContext(
        1,
        audioBuffer.length,
        16000
      );

      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;

      const resampleFilter = offlineContext.createBiquadFilter();
      resampleFilter.type = 'lowpass';
      resampleFilter.frequency.value = 8000;

      source.connect(resampleFilter);
      resampleFilter.connect(offlineContext.destination);
      source.start();

      const renderedBuffer = await offlineContext.startRendering();

      const wavBlob = audioBufferToWav(renderedBuffer);
      return wavBlob;
    } catch (error) {
      console.error('Error processing audio:', error);
      throw error;
    }
  }, []);

  const audioBufferToWav = (buffer) => {
    const numChannels = 1;
    const sampleRate = 16000;
    const format = 1;
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const dataLength = buffer.length * blockAlign;
    const bufferLength = 44 + dataLength;

    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    const writeString = (view, offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < channelData.length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      inputStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setStatus('recording');
    } catch (error) {
      console.error('Error starting recording:', error);
      setStatus('error');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        if (inputStreamRef.current) {
          inputStreamRef.current.getTracks().forEach(track => track.stop());
          inputStreamRef.current = null;
        }

        setIsRecording(false);
        setStatus('processing');
        setIsProcessing(true);

        try {
          const wavBlob = await processAudioTo16kHzWav(audioBlob);
          setIsProcessing(false);
          setStatus('idle');
          resolve(wavBlob);
        } catch (error) {
          setIsProcessing(false);
          setStatus('error');
          console.error('Error processing audio:', error);
          resolve(null);
        }
      };

      mediaRecorderRef.current.stop();
    });
  }, [processAudioTo16kHzWav]);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      return await stopRecording();
    } else {
      await startRecording();
      return null;
    }
  }, [isRecording, startRecording, stopRecording]);

  const sendAudioToBackend = useCallback(async (audioBlob) => {
    if (!audioBlob || !sessionId) return null;

    try {
      setStatus('processing');
      setIsProcessing(true);

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const token = localStorage.getItem('access_token');

      const response = await fetch(`${API_BASE}/conversation/respond?session_id=${sessionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      setTranscripts(prev => [
        ...prev,
        { speaker: 'user', text: data.transcription, timestamp: new Date().toISOString() },
        { speaker: 'pia', text: data.response_text, timestamp: new Date().toISOString() }
      ]);

      if (data.evaluation) {
        const normalizedScores = {};
        Object.entries(data.evaluation).forEach(([key, value]) => {
          normalizedScores[key] = typeof value === 'number' ? value / 10 : value;
        });
        setEvaluation(normalizedScores);
      }

      setIsProcessing(false);
      setStatus('idle');

      return data;
    } catch (error) {
      setIsProcessing(false);
      setStatus('error');
      console.error('Error sending audio to backend:', error);
      return null;
    }
  }, [sessionId]);

  const playAudio = useCallback((audioUrl) => {
    console.log(audioUrl);
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audio.play().catch(error => {
      console.error('Error playing audio:', error);
    });
  }, []);

  const cleanup = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (inputStreamRef.current) {
      inputStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsRecording(false);
    setIsProcessing(false);
    setStatus('idle');
  }, []);

  return {
    isRecording,
    isProcessing,
    transcripts,
    evaluation,
    status,
    toggleRecording,
    sendAudioToBackend,
    playAudio,
    cleanup
  };
};