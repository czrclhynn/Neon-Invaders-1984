/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { SpaceInvadersCanvas } from './game/SpaceInvadersCanvas';
import { MusicPlayerDeck } from './components/MusicPlayerDeck';
import {
  Trophy,
  Volume2,
  VolumeX,
  Tv,
  Gamepad2,
  HelpCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const [scanlines, setScanlines] = useState(true);
  const [crtCurve, setCrtCurve] = useState(false);
  const [isSfxEnabled, setIsSfxEnabled] = useState(true);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('neon_invaders_hi_score');
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Score callback from game engine
  const handleScoreUpdate = (score: number, newHighScore: number) => {
    setCurrentScore(score);
    setHighScore(newHighScore);
  };

  const resetHighScore = () => {
    if (window.confirm('Reset high score to 000000?')) {
      try {
        localStorage.removeItem('neon_invaders_hi_score');
        setHighScore(0);
      } catch {
        // ignore
      }
    }
  };

  // Keyboard shortcut for help modal
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H' || e.key === '?') {
        setShowHelpModal((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#080214] text-slate-100 flex flex-col selection:bg-fuchsia-500 selection:text-white overflow-x-hidden">
      {/* Background Ambient Glows & Horizon Grid */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Giant Retrowave Sun Glow */}
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-pink-500/20 via-purple-600/15 to-transparent rounded-full blur-3xl opacity-60" />
        {/* Side Neon Violet/Cyan ambient spots */}
        <div className="absolute top-1/3 -left-32 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 vaporwave-bg-grid opacity-25" />
      </div>

      {/* Top Bar Header */}
      <header className="relative z-20 w-full border-b border-fuchsia-500/20 bg-slate-950/80 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-400 to-fuchsia-500 flex items-center justify-center shadow-[0_0_12px_rgba(217,70,239,0.5)]">
            <Gamepad2 className="w-5 h-5 text-black" />
          </div>
          <div>
            <span className="text-base sm:text-lg font-black tracking-widest bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-pink-400 bg-clip-text text-transparent font-sans whitespace-nowrap">
              NEON INVADERS
            </span>
            <span className="text-[10px] font-mono text-fuchsia-400/80 block -mt-1 tracking-wider">
              1984 VAPORWAVE ARCADE
            </span>
          </div>
        </div>

        {/* Zone 2: Display & Sound Settings Controls */}
        <div className="flex items-center gap-2 sm:gap-4 text-xs font-mono">
          {/* Scanlines Toggle */}
          <button
            onClick={() => setScanlines(!scanlines)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
              scanlines
                ? 'bg-purple-900/50 text-cyan-300 border-cyan-400/40 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                : 'bg-slate-900/60 text-slate-400 border-slate-700/50 hover:text-slate-200'
            }`}
            title="Toggle Scanlines Effect"
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="hidden md:inline">SCANLINES</span>
            <span className="text-[10px] font-bold">{scanlines ? 'ON' : 'OFF'}</span>
          </button>

          {/* CRT Curved Toggle */}
          <button
            onClick={() => setCrtCurve(!crtCurve)}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
              crtCurve
                ? 'bg-purple-900/50 text-fuchsia-300 border-fuchsia-400/40 shadow-[0_0_8px_rgba(217,70,239,0.2)]'
                : 'bg-slate-900/60 text-slate-400 border-slate-700/50 hover:text-slate-200'
            }`}
            title="Toggle CRT Curved Monitor Simulation"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>CRT CURVE</span>
          </button>

          {/* Sound FX Toggle */}
          <button
            onClick={() => setIsSfxEnabled(!isSfxEnabled)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
              isSfxEnabled
                ? 'bg-purple-900/50 text-pink-300 border-pink-400/40 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
                : 'bg-slate-900/60 text-slate-400 border-slate-700/50 hover:text-slate-200'
            }`}
            title="Toggle Arcade Sound Effects"
          >
            {isSfxEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">SFX</span>
          </button>

          {/* Controls Help */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="p-1.5 text-slate-400 hover:text-cyan-300 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
            title="Game Instructions (Press H)"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Zone 3: High Score Display & Reset */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-950/80 to-fuchsia-950/80 border border-fuchsia-500/40 shadow-[0_0_12px_rgba(217,70,239,0.2)]">
            <Trophy className="w-4 h-4 text-amber-400 drop-shadow-[0_0_6px_#f59e0b]" />
            <div className="text-right font-mono">
              <span className="text-[10px] uppercase text-fuchsia-300 block -mb-0.5 tracking-wider font-bold">
                HIGH SCORE
              </span>
              <span className="text-sm font-bold text-white tracking-widest tabular-nums drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">
                {highScore.toString().padStart(6, '0')}
              </span>
            </div>
          </div>

          {highScore > 0 && (
            <button
              onClick={resetHighScore}
              className="p-1.5 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
              title="Reset High Score"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Combined Experience Viewport */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-start p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Subheader Banner / Status Strip */}
        <div className="w-full max-w-[760px] flex items-center justify-between text-xs font-mono text-fuchsia-300/80 px-2">
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 font-bold">1P SCORE: {currentScore.toString().padStart(6, '0')}</span>
            <span aria-hidden="true">·</span>
            <span>HI: {highScore.toString().padStart(6, '0')}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-fuchsia-400/90">
            <span>SYNTH-WAVE CHILL & INVADE</span>
          </div>
        </div>

        {/* 1. Center Window: Space Invaders Arcade Game */}
        <section aria-label="Arcade Game Monitor" className="w-full flex justify-center">
          <SpaceInvadersCanvas
            onScoreUpdate={handleScoreUpdate}
            isSfxEnabled={isSfxEnabled}
            scanlines={scanlines}
            crtCurve={crtCurve}
          />
        </section>

        {/* 2. Synthwave Music Player Deck */}
        <section aria-label="Synthwave Music Player" className="w-full flex justify-center">
          <MusicPlayerDeck />
        </section>

        {/* 3. Retro Controls / Features Reference Card */}
        <footer className="w-full max-w-[760px] pt-4 pb-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-fuchsia-400/60 border-t border-fuchsia-500/20">
          <div className="flex items-center gap-3">
            <span>[←][→] Move Cannon</span>
            <span>·</span>
            <span>[SPACE] Fire Laser</span>
            <span>·</span>
            <span>[P] Pause</span>
          </div>
          <div className="flex items-center gap-2">
            <span>STEREO SYNTH ENGINE 1984</span>
            <span>·</span>
            <span className="text-cyan-400">HI-FI AUDIO</span>
          </div>
        </footer>
      </main>

      {/* Help / Instructions Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-[#140628] border-2 border-fuchsia-500/50 p-6 shadow-[0_0_40px_rgba(217,70,239,0.4)] text-slate-100 font-sans">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-fuchsia-500/30">
              <h2 className="text-lg font-bold font-mono text-cyan-300">
                ARCADE PILOT MANUAL
              </h2>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-white px-2 py-1 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <h3 className="text-xs font-mono text-fuchsia-400 font-bold uppercase mb-1">
                  1. Mission Objectives
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Defend the vaporwave grid from waves of descending alien invaders. Clear all invaders in each wave to advance to faster swarms and earn wave bonus points!
                </p>
              </div>

              <div>
                <h3 className="text-xs font-mono text-fuchsia-400 font-bold uppercase mb-1">
                  2. Scoring Table
                </h3>
                <ul className="text-xs space-y-1 font-mono text-slate-300">
                  <li className="flex justify-between">
                    <span className="text-amber-400">Mystery UFO Saucer:</span>
                    <span>50 - 300 PTS</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-pink-400">Squid Invader (Top):</span>
                    <span>30 PTS</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-purple-400">Crab Invader (Mid):</span>
                    <span>20 PTS</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-cyan-400">Octopus Invader (Bot):</span>
                    <span>10 PTS</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-mono text-fuchsia-400 font-bold uppercase mb-1">
                  3. Defensive Bunkers
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  The four green energy bunkers absorb fire from both your ship and alien bombs. They suffer realistic blast erosion from laser impacts.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-mono text-fuchsia-400 font-bold uppercase mb-1">
                  4. Synthwave Audio Deck
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Enjoy real-time synthesized synthwave music generated in your browser via the Web Audio API. Switch between 3 tracks, adjust volume, toggle the spectrum analyzer, or mute as desired.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-fuchsia-500/20 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 font-mono text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-all shadow-[0_0_10px_rgba(6,182,212,0.4)] cursor-pointer"
              >
                GOT IT, PILOT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
