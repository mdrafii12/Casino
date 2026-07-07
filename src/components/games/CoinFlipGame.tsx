/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCasinoStore } from '../../store';
import { sounds } from '../../utils/audio';
import { Star, RefreshCw, Volume2, VolumeX, ShieldAlert, Coins } from 'lucide-react';
import GameProcessingOverlay from './GameProcessingOverlay';

export default function CoinFlipGame() {
  const { user, recordPlay, soundEnabled, toggleSound } = useCasinoStore();
  const [bet, setBet] = useState(100);
  const [selectedSide, setSelectedSide] = useState<'heads' | 'tails'>('heads');
  const [isFlipping, setIsFlipping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [coinRotation, setCoinRotation] = useState(0);
  const [outcome, setOutcome] = useState<'heads' | 'tails' | null>(null);
  const [stats, setStats] = useState({ heads: 12, tails: 15 });
  const [isWin, setIsWin] = useState<boolean | null>(null);

  const flipCoin = () => {
    if (isFlipping || isProcessing) return;
    if (!user || user.virtual_balance < bet) {
      if (soundEnabled) sounds.playLose();
      return;
    }

    setIsProcessing(true);
    setIsFlipping(true);
    setOutcome(null);
    setIsWin(null);

    if (soundEnabled) {
      sounds.playClick();
    }
  };

  const resolveFlip = () => {
    const finalSide: 'heads' | 'tails' = Math.random() < 0.5 ? 'heads' : 'tails';
    
    // Rotation: spin multiple times and land either at 0 (heads) or 180 (tails)
    const extraSpins = 10 * 180; // 5 full rotations
    const targetRot = coinRotation + extraSpins + (finalSide === 'tails' ? 180 : 0);

    setCoinRotation(targetRot);

    setTimeout(async () => {
      setOutcome(finalSide);
      setIsFlipping(false);
      setIsProcessing(false);

      const didWin = selectedSide === finalSide;
      setIsWin(didWin);

      // Record payouts
      const payout = didWin ? bet * 2 : 0;

      if (didWin) {
        if (soundEnabled) {
          sounds.playCoin();
          setTimeout(() => sounds.playWinFanfare(), 200);
        }
      } else {
        if (soundEnabled) sounds.playLose();
      }

      // Update local win ratio counters
      setStats(prev => ({
        ...prev,
        [finalSide]: prev[finalSide] + 1
      }));

      await recordPlay('coinflip', bet, didWin ? 'win' : 'lose', payout);
    }, 1500);
  };

  const totalFlips = stats.heads + stats.tails;
  const headsPercentage = totalFlips > 0 ? Math.round((stats.heads / totalFlips) * 100) : 50;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 relative" id="coinflip_root">
      <GameProcessingOverlay
        isOpen={isProcessing}
        onComplete={resolveFlip}
        gameName="Cosmic Coin Flip"
        betAmount={bet}
      />
      {/* Disclaimer */}
      <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 text-center">
        <p className="text-xs text-amber-400 font-mono flex items-center justify-center gap-1.5">
          <ShieldAlert className="w-4 h-4" />
          ENTERTAINMENT SIMULATOR • NO DEPOSITS • VIRTUAL COINS HAVE NO LIQUIDITY VALUE
        </p>
      </div>

      <div className="glass-card-gold rounded-2xl p-6 relative">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-display font-extrabold text-gold-gradient uppercase">
              Cosmic Coin Flip
                </h2>
                <p className="text-xs text-gray-400">Double your virtual balance on 50/50 odds</p>
          </div>
          <button
            onClick={toggleSound}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* 3D coin render viewport */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-4">
          
          {/* Flip Animation View */}
          <div className="relative w-48 h-48 flex items-center justify-center bg-black/40 rounded-full border border-white/5 p-4 perspective-1000">
            <motion.div
              animate={{ rotateY: coinRotation }}
              transition={isFlipping ? { duration: 1.5, ease: 'easeOut' } : { duration: 0 }}
              className="w-36 h-36 preserve-3d relative cursor-pointer"
            >
              {/* Heads Face */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-yellow-600 border-4 border-amber-500 shadow-2xl flex flex-col items-center justify-center backface-hidden">
                <span className="text-5xl">🪙</span>
                <span className="text-[9px] font-mono text-black font-extrabold tracking-wider mt-1">HEADS</span>
              </div>

              {/* Tails Face */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-zinc-300 via-zinc-400 to-zinc-600 border-4 border-zinc-500 shadow-2xl flex flex-col items-center justify-center backface-hidden rotate-y-180">
                <span className="text-5xl">👑</span>
                <span className="text-[9px] font-mono text-white font-extrabold tracking-wider mt-1">TAILS</span>
              </div>
            </motion.div>
          </div>

          {/* Selector options and results stats */}
          <div className="space-y-6 flex-1 w-full max-w-sm">
            <div className="min-h-12 flex justify-center items-center bg-black/50 p-3 rounded-xl border border-white/5 text-center">
              <AnimatePresence mode="wait">
                {outcome ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center"
                  >
                    <span className="text-xs text-gray-500 font-mono">Coin Landed On</span>
                    <span className="text-xl font-display font-extrabold text-gold-gradient uppercase mt-0.5">
                      {outcome} ({isWin ? 'WIN!' : 'LOSE'})
                    </span>
                  </motion.div>
                ) : (
                  <span className="text-gray-500 text-xs font-mono">
                    {isFlipping ? 'COIN SPINNING IN AIR...' : 'CHOOSE HEADS OR TAILS TO DOUBLE'}
                  </span>
                )}
              </AnimatePresence>
            </div>

            {/* Selector Field */}
            <div className="grid grid-cols-2 gap-4">
              <button
                disabled={isFlipping}
                onClick={() => setSelectedSide('heads')}
                className={`py-3.5 rounded-2xl border text-sm font-semibold transition flex flex-col items-center gap-1.5 cursor-pointer ${
                  selectedSide === 'heads'
                    ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                    : 'border-white/10 text-gray-400 hover:bg-white/5'
                }`}
              >
                <span className="text-2xl">🪙</span>
                Heads
              </button>
              <button
                disabled={isFlipping}
                onClick={() => setSelectedSide('tails')}
                className={`py-3.5 rounded-2xl border text-sm font-semibold transition flex flex-col items-center gap-1.5 cursor-pointer ${
                  selectedSide === 'tails'
                    ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                    : 'border-white/10 text-gray-400 hover:bg-white/5'
                }`}
              >
                <span className="text-2xl">👑</span>
                Tails
              </button>
            </div>

            {/* Streak Ratio Percent */}
            <div className="bg-black/20 p-3.5 rounded-xl border border-white/5 space-y-2">
              <div className="flex justify-between text-[10px] text-gray-400 font-mono uppercase">
                <span>Heads: {headsPercentage}%</span>
                <span>Tails: {100 - headsPercentage}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
                <div className="bg-amber-400 h-full" style={{ width: `${headsPercentage}%` }} />
                <div className="bg-zinc-600 h-full flex-1" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom actions bar */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-xs text-gray-400 font-mono">Configure Chips:</span>
            <div className="flex gap-2">
              {[50, 100, 200, 500].map(amt => (
                <button
                  key={amt}
                  disabled={isFlipping}
                  onClick={() => setBet(amt)}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition ${
                    bet === amt ? 'bg-amber-400 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={isFlipping || !user || user.virtual_balance < bet}
            onClick={flipCoin}
            className="px-8 py-3 bg-gold-gradient text-black font-display font-extrabold rounded-xl hover:scale-105 active:scale-95 transition shadow-lg shadow-amber-500/15 cursor-pointer disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isFlipping ? 'animate-spin' : ''}`} />
            {isFlipping ? 'FLIPPING COIN...' : 'FLIP COIN'}
          </button>
        </div>
      </div>
    </div>
  );
}
