import { useAudioRecorder } from "../hooks/useAudioRecorder";

function RecorderTestPage() {
  const {
    isRecording,
    duration,
    audioBlob,
    error,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Create a URL to play back the recorded audio
  const audioUrl = audioBlob ? URL.createObjectURL(audioBlob) : null;

  return (
    <div className="min-h-screen bg-frame flex items-center justify-center p-12">
      <div className="max-w-lg w-full">
        <div className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-3">
          — Audio Recorder Test
        </div>
        <h1 className="font-display text-5xl mb-8">
          Test the <em className="italic text-accent">recorder</em>
        </h1>

        {/* Error display */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-warn/10 border-l-2 border-warn text-warn text-sm">
            {error}
          </div>
        )}

        {/* Recording state */}
        <div className="border border-line p-8 mb-6">
          {isRecording ? (
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-3 h-3 bg-warn rounded-full animate-pulse"></div>
                <span className="font-mono text-xs uppercase tracking-widest text-warn">
                  Recording
                </span>
              </div>
              <div className="font-display text-6xl mb-6">{formatDuration(duration)}</div>
              <button
                onClick={stopRecording}
                className="bg-ink text-page px-8 py-4 font-mono text-sm uppercase tracking-widest hover:bg-accent transition-colors"
              >
                Stop Recording
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-6">
                — Ready to record
              </div>
              <button
                onClick={startRecording}
                className="bg-ink text-page px-8 py-4 font-mono text-sm uppercase tracking-widest hover:bg-accent transition-colors"
              >
                Start Recording
              </button>
            </div>
          )}
        </div>

        {/* Playback */}
        {audioBlob && audioUrl && (
          <div className="border border-line p-8">
            <div className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-4">
              — Playback ({formatDuration(duration)} · {(audioBlob.size / 1024).toFixed(0)} KB)
            </div>
            <audio src={audioUrl} controls className="w-full mb-6" />
            <button
              onClick={resetRecording}
              className="font-mono text-xs uppercase tracking-widest text-ink-soft border border-line-strong px-4 py-2"
            >
              Discard & Record Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecorderTestPage;