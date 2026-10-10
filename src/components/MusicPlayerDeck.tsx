import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Disc3,
  ListMusic,
  Activity,
  Radio,
} from 'lucide-react';
import { synthEngine, TRACKS, TrackInfo } from '../audio/synthEngine';

interface MusicPlayerDeckProps {
  onTogglePlay?: () => void;
}

export const MusicPlayerDeck: React.FC<MusicPlayerDeckProps> = () => {
  const [isPlaying, setIsPlaying] = useState(synthEngine.isPlaying);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(synthEngine.currentTrackIndex);
  const [currentTime, setCurrentTime] = useState(synthEngine.currentTime);
  const [volume, setVolume] = useState(synthEngine.volume);
  const [isMuted, setIsMuted] = useState(synthEngine.isMuted);
  const [showPlaylist, setShowPlaylist] = useState(true);
  const [visualizerMode, setVisualizerMode] = useState<'bars' | 'wave'>('bars');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Subscribe to synth engine updates
  useEffect(() => {
    const unsubscribe = synthEngine.subscribe(() => {
      setIsPlaying(synthEngine.isPlaying);
      setCurrentTrackIndex(synthEngine.currentTrackIndex);
      setCurrentTime(synthEngine.currentTime);
      setVolume(synthEngine.volume);
      setIsMuted(synthEngine.isMuted);
    });
    return unsubscribe;
  }, []);

  const currentTrack: TrackInfo = TRACKS[currentTrackIndex] || TRACKS[0];

  // Real-time audio spectrum visualizer animation loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = synthEngine.getAnalyser();

    const draw = () => {
      animId = requestAnimationFrame(draw);
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Dark translucent backdrop
      ctx.fillStyle = 'rgba(15, 6, 28, 0.4)';
      ctx.fillRect(0, 0, width, height);

      if (!analyser || !isPlaying) {
        // Idle gentle wave when stopped
        ctx.strokeStyle = 'rgba(217, 70, 239, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        for (let x = 0; x < width; x += 6) {
          const y = height / 2 + Math.sin(x * 0.04 + Date.now() * 0.002) * 4;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      if (visualizerMode === 'bars') {
        analyser.getByteFrequencyData(dataArray);

        const barCount = 32;
        const barWidth = (width / barCount) - 2;
        const step = Math.floor(bufferLength / barCount);

        for (let i = 0; i < barCount; i++) {
          const val = dataArray[i * step] || 0;
          const percent = val / 255;
          const barHeight = Math.max(3, percent * (height - 6));

          // Vaporwave neon gradient: cyan at bottom, pink/magenta at top
          const grad = ctx.createLinearGradient(0, height, 0, 0);
          grad.addColorStop(0, '#00f0ff');
          grad.addColorStop(0.5, '#d946ef');
          grad.addColorStop(1, '#ff2a85');

          ctx.fillStyle = grad;
          ctx.shadowColor = '#d946ef';
          ctx.shadowBlur = percent > 0.5 ? 8 : 2;

          const x = i * (barWidth + 2);
          const y = height - barHeight;

          // Draw rounded bar
          ctx.fillRect(x, y, barWidth, barHeight);

          // Peak cap
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x, y - 2, barWidth, 1.5);
        }
        ctx.shadowBlur = 0;
      } else {
        // Waveform mode
        analyser.getByteTimeDomainData(dataArray);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 6;

        ctx.beginPath();
        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, visualizerMode]);

  // Format time mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    synthEngine.seek(val);
  };

  return (
    <div className="w-full max-w-[760px] rounded-2xl p-4 sm:p-5 bg-gradient-to-b from-purple-950/80 via-slate-950/90 to-purple-950/90 border border-fuchsia-500/30 shadow-[0_0_30px_rgba(168,85,247,0.18)] backdrop-blur-md">
      {/* Player Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-fuchsia-500/20 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-fuchsia-400 animate-pulse" />
          <span className="text-fuchsia-300 font-bold tracking-wider">RETRO-SYNTH DECK MK-IV</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVisualizerMode(visualizerMode === 'bars' ? 'wave' : 'bars')}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-fuchsia-200/80 hover:text-white bg-purple-900/40 hover:bg-purple-900/80 border border-fuchsia-500/30 rounded transition-all cursor-pointer"
            title="Toggle Visualizer Mode"
          >
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>{visualizerMode === 'bars' ? 'BARS' : 'WAVE'}</span>
          </button>
          <button
            onClick={() => setShowPlaylist(!showPlaylist)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded transition-all cursor-pointer border ${
              showPlaylist
                ? 'text-cyan-300 bg-cyan-950/50 border-cyan-400/50'
                : 'text-fuchsia-300/80 bg-purple-900/40 border-fuchsia-500/30'
            }`}
          >
            <ListMusic className="w-3 h-3 text-fuchsia-400" />
            <span>TRACKS (3)</span>
          </button>
        </div>
      </div>

      {/* Main Track Display Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Album Art & Vinyl Spinning Hub */}
        <div className="md:col-span-4 flex flex-col items-center justify-center">
          <div className="relative group w-32 h-32 sm:w-36 sm:h-36 rounded-xl overflow-hidden border-2 border-fuchsia-500/50 shadow-[0_0_20px_rgba(217,70,239,0.35)] bg-purple-950">
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.album}
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover transition-transform duration-700 ${
                isPlaying ? 'scale-105' : 'scale-100 opacity-90'
              }`}
            />
            {/* Spinning Vinyl Center Badge */}
            <div
              className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
                isPlaying ? 'opacity-100' : 'opacity-40'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full bg-black/60 border border-cyan-400/80 flex items-center justify-center ${
                  isPlaying ? 'animate-spin' : ''
                }`}
                style={{ animationDuration: '6s' }}
              >
                <Disc3 className="w-5 h-5 text-cyan-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Track Info & Visualizer */}
        <div className="md:col-span-8 flex flex-col justify-between space-y-3">
          {/* Metadata Display */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  TRACK 0{currentTrackIndex + 1} // {currentTrack.bpm} BPM
                </span>
                <span className="text-xs font-mono text-fuchsia-400/80">· {currentTrack.year}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-wide font-sans drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                {currentTrack.title}
              </h3>
              <p className="text-sm text-fuchsia-300/80 font-medium">
                {currentTrack.artist} — <span className="text-cyan-300/70">{currentTrack.album}</span>
              </p>
            </div>
            <div className="hidden sm:block text-right font-mono text-xs text-fuchsia-300/70">
              <span className="text-[10px] uppercase text-cyan-400 block font-bold">GENRE</span>
              <span>{currentTrack.genre}</span>
            </div>
          </div>

          {/* Real-time Visualizer Canvas */}
          <div className="relative w-full h-14 rounded-lg overflow-hidden bg-purple-950/60 border border-fuchsia-500/25">
            <canvas ref={canvasRef} width={480} height={56} className="w-full h-full block" />
            <div className="absolute top-1 right-2 text-[10px] font-mono text-fuchsia-400/60 pointer-events-none">
              SPECTRUM ANALYZER
            </div>
          </div>

          {/* Progress Timeline */}
          <div className="space-y-1">
            <div className="relative flex items-center">
              <input
                type="range"
                min={0}
                max={currentTrack.duration}
                step={0.5}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-purple-950 rounded-lg appearance-none cursor-pointer accent-fuchsia-400 hover:accent-cyan-400 transition-colors"
                style={{
                  background: `linear-gradient(to right, #00f0ff 0%, #d946ef ${(currentTime / currentTrack.duration) * 100}%, rgba(88,28,135,0.4) ${(currentTime / currentTrack.duration) * 100}%, rgba(88,28,135,0.4) 100%)`,
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-fuchsia-300/70">
              <span className="text-cyan-300">{formatTime(currentTime)}</span>
              <span>{formatTime(currentTrack.duration)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Buttons & Volume Row */}
      <div className="mt-4 pt-3 border-t border-fuchsia-500/20 flex flex-wrap items-center justify-between gap-3">
        {/* Playback Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => synthEngine.prevTrack()}
            className="p-2.5 rounded-lg text-fuchsia-300 hover:text-white bg-purple-900/50 hover:bg-purple-800/80 active:scale-95 border border-fuchsia-500/30 transition-all cursor-pointer"
            title="Previous Track"
            aria-label="Previous Track"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={() => synthEngine.togglePlay()}
            className="px-5 py-2.5 rounded-lg font-mono font-bold text-xs tracking-wider text-black bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-pink-500 hover:brightness-110 active:scale-95 border border-white/20 shadow-[0_0_18px_rgba(217,70,239,0.5)] transition-all cursor-pointer flex items-center gap-2"
            title={isPlaying ? 'Pause Music' : 'Play Music'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-black" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-black" />
                <span>PLAY</span>
              </>
            )}
          </button>

          <button
            onClick={() => synthEngine.nextTrack()}
            className="p-2.5 rounded-lg text-fuchsia-300 hover:text-white bg-purple-900/50 hover:bg-purple-800/80 active:scale-95 border border-fuchsia-500/30 transition-all cursor-pointer"
            title="Next Track"
            aria-label="Next Track"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Volume & Mute */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => synthEngine.toggleMute()}
            className="p-2 text-fuchsia-300 hover:text-cyan-300 transition-colors cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
            aria-label="Mute toggle"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-pink-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            )}
          </button>

          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={isMuted ? 0 : volume}
              onChange={(e) => synthEngine.setVolume(parseFloat(e.target.value))}
              className="w-20 sm:w-28 h-1.5 bg-purple-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              style={{
                background: `linear-gradient(to right, #00f0ff 0%, #00f0ff ${(isMuted ? 0 : volume) * 100}%, rgba(88,28,135,0.4) ${(isMuted ? 0 : volume) * 100}%, rgba(88,28,135,0.4) 100%)`,
              }}
              aria-label="Volume slider"
            />
            <span className="font-mono text-[10px] text-fuchsia-300/80 w-8 tabular-nums">
              {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
            </span>
          </div>
        </div>
      </div>

      {/* Collapsible Playlist Selector */}
      {showPlaylist && (
        <div className="mt-4 pt-3 border-t border-fuchsia-500/20 space-y-2">
          <div className="text-[11px] font-mono text-fuchsia-400 uppercase tracking-wider font-semibold">
            SELECT TRACK // SYNTHWAVE CASSETTE
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {TRACKS.map((t, idx) => {
              const active = idx === currentTrackIndex;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    synthEngine.setTrack(idx);
                    if (!synthEngine.isPlaying) {
                      synthEngine.play();
                    }
                  }}
                  className={`flex items-center gap-2.5 p-2 rounded-lg text-left transition-all cursor-pointer border ${
                    active
                      ? 'bg-fuchsia-950/60 border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                      : 'bg-purple-950/40 border-fuchsia-500/20 hover:border-fuchsia-500/50 hover:bg-purple-900/30'
                  }`}
                >
                  <img
                    src={t.coverUrl}
                    alt={t.title}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded object-cover border border-purple-700/50 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-bold truncate ${active ? 'text-cyan-300' : 'text-white'}`}>
                        {t.title}
                      </span>
                      {active && isPlaying && (
                        <span className="text-[9px] font-mono text-pink-400 animate-pulse shrink-0">
                          PLAYING
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-fuchsia-300/70 truncate">{t.artist}</p>
                    <div className="flex items-center justify-between text-[10px] font-mono text-fuchsia-400/60">
                      <span>{t.bpm} BPM</span>
                      <span>{formatTime(t.duration)}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
