import { useState, useRef, useEffect } from "react";

// ===== Type definitions =====

interface UseAudioRecorderReturn {
  isRecording: boolean;
  duration: number;
  audioBlob: Blob | null;
  error: string;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetRecording: () => void;
}

// ===== The Hook =====

export function useAudioRecorder(): UseAudioRecorderReturn {
  // ===== State (triggers UI re-renders) =====
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState("");

  // ===== Refs (don't trigger re-renders, just remember things) =====
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // ===== Cleanup function =====
  const cleanup = () => {
    // Stop the timer
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop the media stream (releases the microphone)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Clear the recorder reference
    mediaRecorderRef.current = null;
  };

  // ===== Start recording =====
  const startRecording = async () => {
    try {
      // Reset state
      setError("");
      setAudioBlob(null);
      setDuration(0);
      chunksRef.current = [];

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create recorder
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      // Collect data chunks as they become available
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // When stopped, combine chunks into a single Blob
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        cleanup();
      };

      // Handle recording errors
      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        setError("An error occurred during recording.");
        cleanup();
        setIsRecording(false);
      };

      // Start recording
      recorder.start();
      setIsRecording(true);

      // Start the duration timer (updates every second)
      timerRef.current = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      // Handle permission denial and other errors
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError("Microphone access denied. Please enable it in your browser settings.");
      } else if (err.name === "NotFoundError") {
        setError("No microphone found. Please connect a microphone and try again.");
      } else {
        setError("Couldn't start recording. Please check your microphone.");
      }
      cleanup();
      setIsRecording(false);
    }
  };

  // ===== Stop recording =====
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      // Note: cleanup happens inside the recorder.onstop handler
    }
    setIsRecording(false);
  };

  // ===== Reset (clear the audio blob to record again) =====
  const resetRecording = () => {
    setAudioBlob(null);
    setDuration(0);
    setError("");
  };

  // ===== Cleanup on unmount (component unmounts during recording) =====
  useEffect(() => {
    // This return function runs when the component using this hook unmounts
    return () => {
      cleanup();
    };
  }, []);

  return {
    isRecording,
    duration,
    audioBlob,
    error,
    startRecording,
    stopRecording,
    resetRecording,
  };
}