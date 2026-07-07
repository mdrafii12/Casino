/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCasinoStore } from '../../store';
import { sounds } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { Star, RefreshCw, Volume2, VolumeX, ShieldAlert, Coins, HelpCircle } from 'lucide-react';
import GameProcessingOverlay from './GameProcessingOverlay';

interface Segment {
  label: string;
  multiplier: number;
  color: string;
  isJackpot?: boolean;
}

const SEGMENTS: Segment[] = [
  { label: '0x BUST', multiplier: 0, color: 'bg-red-600/30 text-red-500 border-red-500/20' },
  { label: '1.5x', multiplier: 1.5, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { label: '5x BIG', multiplier: 5, color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  { label: '1.2x', multiplier: 1.2, color: 'bg-amber-500/10 text-amber-400 border-amber-500/10' },
  { label: '10x SUPER', multiplier: 10, color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  { label: '0.5x', multiplier: 0.5, color: 'bg-zinc-800/40 text-zinc-500 border-zinc-700/20' },
  { label: '20x MEGA', multiplier: 20, color: 'bg-gold-gradient text-black border-yellow-400', isJackpot: true },
  { label: '2x DOUBLE', multiplier: 2, color: 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20' }
];

export default function WheelSpinGame() {
  const { user, recordPlay, soundEnabled, toggleSound } = useCasinoStore();
  const [bet, setBet] = useState(100);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [winningSegment, setWinningSegment] = useState<Segment | null>(null);
  const [lastPayout, setLastPayout] = useState<number | null>(null);

  const spinWheel = () => {
    if (isSpinning || isProcessing) return;
    if (!user || user.virtual_balance < bet) {
      if (soundEnabled) sounds.playLose();
      return;
    }

    setIsProcessing(true);
    setIsSpinning(true);
    setWinningSegment(null);
    setLastPayout(null);
  };

  const resolveWheel = () => {
    // Roll final winning sector
    const rollIndex = Math.floor(Math.random() * SEGMENTS.length);
    const chosen = SEGMENTS[rollIndex];

    // Segment size is 360 / 8 = 45 degrees
    // Center of segment is rollIndex * 45 degrees
    // Spin 4 complete revolutions (1440 deg) + angle to sector
    const targetDegrees = 1440 + (360 - (rollIndex * 45));
    const nextRot = wheelRotation + targetDegrees;

    setWheelRotation(nextRot);

    if (soundEnabled) {
      let ticks = 0;
      const tickTimer = setInterval(() => {
        if (ticks < 12) {
          sounds.playWheelTick(ticks);
          ticks++;
        } else {
          clearInterval(tickTimer);
        }
      }, 180);
    }

    setTimeout(async () => {
      setWinningSegment(chosen);
      setIsSpinning(false);
      setIsProcessing(false);

      const didWin = chosen.multiplier > 0;
      const payout = Math.floor(bet * chosen.multiplier);
      setLastPayout(payout);

      if (didWin) {
        if (soundEnabled) {
          sounds.playCoin();
          setTimeout(() => sounds.playWinFanfare(), 250);
        }
        if (chosen.isJackpot || payout >= bet * 5) {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 }
          });
        }
      } else {
        if (soundEnabled) sounds.playLose();
      }

      await recordPlay('wheel', bet, didWin ? 'win' : 'lose', payout);
    }, 2200);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 relative" id="wheel_root">
      <GameProcessingOverlay
        isOpen={isProcessing}
        onComplete={resolveWheel}
        gameName="Mega Fortune Wheel"
        betAmount={bet}
      />
      {/* Disclaimer */}
      <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 text-center">
        <p className="text-xs text-amber-400 font-mono flex items-center justify-center gap-1.5">
          <ShieldAlert className="w-4 h-4" />
          ENTERTAINMENT SIMULATOR • PLAY MONEY ONLY • COINS ARE FICTITIOUS
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Wheel container */}
        <div className="md:col-span-5 flex flex-col items-center justify-center space-y-6">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 glass-card-gold rounded-full p-6 flex items-center justify-center">
            
            {/* Spinner golden peg */}
            <div className="absolute top-0 z-20 -translate-y-2 flex flex-col items-center">
              <div className="w-4 h-6 bg-amber-400 rounded-b-full shadow-lg" />
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-amber-400" />
            </div>

            {/* Canvas-style segment wheel */}
            <motion.div
              animate={{ rotate: wheelRotation }}
              transition={isSpinning ? { duration: 2.2, ease: 'easeOut' } : { duration: 0 }}
              style={{ originX: '50%', originY: '50%' }}
              className="w-full h-full rounded-full border-4 border-amber-500/30 relative bg-zinc-950 flex items-center justify-center shadow-2xl overflow-hidden"
            >
              {SEGMENTS.map((seg, idx) => {
                const angle = idx * 45;
                return (
                  <div
                    key={idx}
                    className="absolute w-1 h-12 top-0 origin-bottom"
                    style={{
                      transform: `rotate(${angle}deg)`,
                      height: '50%',
                      transformOrigin: '50% 100%'
                    }}
                  >
                    {/* Divider line */}
                    <div className="w-[1.5px] h-full bg-amber-500/25 mx-auto" />
                    
                    {/* Segment Value Text positioned radially */}
                    <div
                      className="absolute top-4 left-1/2 -translate-x-1/2 -rotate-12 select-none"
                      style={{ transform: `translateX(-50%) rotate(${22.5}deg)` }}
                    >
                      <span className={`text-[9px] font-extrabold tracking-tight font-display py-0.5 px-1.5 rounded-md border ${
                        seg.isJackpot ? 'bg-amber-400 text-black border-amber-500' : 'bg-black/60 text-white border-white/5'
                      }`}>
                        {seg.label}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Central golden crown center */}
              <div className="w-1/3 h-1/3 rounded-full border-2 border-amber-500 bg-zinc-900 absolute flex items-center justify-center shadow-2xl z-10">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bets configurations and logs */}
        <div className="md:col-span-7 space-y-6">
          <div className="glass-card-gold rounded-2xl p-6 relative">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-display font-extrabold text-gold-gradient uppercase">
                  Mega Fortune Wheel
                </h2>
                <p className="text-xs text-gray-400">Guaranteed multipliers with up to 20x jackpots</p>
              </div>
              <button
                onClick={toggleSound}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>

            {/* Result display */}
            <div className="min-h-12 flex justify-center items-center bg-black/40 rounded-xl p-3 border border-white/5 mb-6 text-center">
              <AnimatePresence mode="wait">
                {winningSegment ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center"
                  >
                    <span className="text-xs text-gray-400 font-mono">Wheel Stopped on:</span>
                    <span className="text-2xl font-display font-extrabold text-amber-400 mt-1 uppercase">
                      {winningSegment.label} Multiplier!
                    </span>
                    {lastPayout !== null && lastPayout > 0 && (
                      <span className="text-green-400 text-xs font-bold mt-1">
                        Credited Payout: +{lastPayout} Virtual Coins
                      </span>
                    )}
                  </motion.div>
                ) : (
                  <span className="text-gray-500 text-xs font-mono">
                    {isSpinning ? 'GRAND WHEEL ROTATING...' : 'ENTER BETS AND SPIN THE MULTIPLIER WHEEL'}
                  </span>
                )}
              </AnimatePresence>
            </div>

            {/* List of segment probabilities */}
            <div className="grid grid-cols-2 gap-2.5 mb-6">
              {SEGMENTS.map((seg, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border flex justify-between items-center text-xs font-mono ${seg.color}`}
                >
                  <span className="font-bold">{seg.label}</span>
                  <span className="text-[10px] text-gray-500">12.5% Prob</span>
                </div>
              ))}
            </div>

            {/* Bottom actions bar */}
            <div className="pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1.5">
                <span className="text-xs text-gray-400 font-mono flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-500" /> Bet Value:
                </span>
                <div className="flex gap-2">
                  {[50, 100, 200, 500].map(val => (
                    <button
                      key={val}
                      disabled={isSpinning}
                      onClick={() => setBet(val)}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition ${
                        bet === val ? 'bg-amber-400 text-black shadow-md' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <button
                disabled={isSpinning || !user || user.virtual_balance < bet}
                onClick={spinWheel}
                className="px-8 py-3 bg-gold-gradient text-black font-display font-extrabold rounded-xl hover:scale-105 active:scale-95 transition shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
                {isSpinning ? 'SPINNING...' : 'SPIN WHEEL'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
