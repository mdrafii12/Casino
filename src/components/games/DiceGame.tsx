/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCasinoStore } from '../../store';
import { sounds } from '../../utils/audio';
import { Sliders, RefreshCw, Volume2, VolumeX, ShieldAlert, Coins, HelpCircle } from 'lucide-react';
import GameProcessingOverlay from './GameProcessingOverlay';

export default function DiceGame() {
  const { user, recordPlay, soundEnabled, toggleSound } = useCasinoStore();
  const [bet, setBet] = useState(100);
  const [targetValue, setTargetValue] = useState(50);
  const [rollMode, setRollMode] = useState<'over' | 'under'>('over');
  const [isRolling, setIsRolling] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rolledNumber, setRolledNumber] = useState<number | null>(null);
  const [recentRolls, setRecentRolls] = useState<number[]>([24, 76, 52, 91, 12]);
  const [isWin, setIsWin] = useState<boolean | null>(null);

  // Math for standard high-dice multipliers:
  // House Edge = 2% (0.98 multiplier base)
  // Over target multiplier = 98 / (100 - target)
  // Under target multiplier = 98 / target
  const winProbability = rollMode === 'over' ? 100 - targetValue : targetValue;
  const multiplier = Math.max(1.01, parseFloat((98 / winProbability).toFixed(2)));

  const handleRoll = () => {
    if (isRolling || isProcessing) return;
    if (!user || user.virtual_balance < bet) {
      if (soundEnabled) sounds.playLose();
      return;
    }

    setIsProcessing(true);
    setIsRolling(true);
    setRolledNumber(null);
    setIsWin(null);

    if (soundEnabled) {
      sounds.playDice();
    }
  };

  const resolveDice = () => {
    // Roll random outcome 1 to 100
    const finalRoll = Math.floor(Math.random() * 100) + 1;

    setTimeout(async () => {
      setRolledNumber(finalRoll);
      setRecentRolls(prev => [finalRoll, ...prev.slice(0, 4)]);
      setIsRolling(false);
      setIsProcessing(false);

      const didWin =
        rollMode === 'over' ? finalRoll > targetValue : finalRoll < targetValue;

      setIsWin(didWin);

      const payout = didWin ? Math.floor(bet * multiplier) : 0;

      if (didWin) {
        if (soundEnabled) {
          sounds.playCoin();
          setTimeout(() => sounds.playWinFanfare(), 200);
        }
      } else {
        if (soundEnabled) sounds.playLose();
      }

      await recordPlay('dice', bet, didWin ? 'win' : 'lose', payout);
    }, 800);
  };

  const handleBetChange = (delta: number) => {
    if (isRolling) return;
    setBet(prev => Math.max(10, Math.min(prev + delta, user?.virtual_balance || 10000)));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 relative" id="dice_root">
      <GameProcessingOverlay
        isOpen={isProcessing}
        onComplete={resolveDice}
        gameName="High Roller Dice"
        betAmount={bet}
      />
      {/* Warning Bar */}
      <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 text-center">
        <p className="text-xs text-amber-400 font-mono flex items-center justify-center gap-1.5">
          <ShieldAlert className="w-4 h-4" />
          CASINO ENTERTAINMENT MODE • PLAY MONEY COINS ONLY • ZERO MONETARY PULL
        </p>
      </div>

      <div className="glass-card-gold rounded-2xl p-6 relative">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-display font-extrabold text-gold-gradient uppercase">
              High Roller Dice
            </h2>
            <p className="text-xs text-gray-400">Configure win probability and roll targets</p>
          </div>
          <button
            onClick={toggleSound}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Dice roll animation stage */}
        <div className="bg-black/40 rounded-2xl p-8 border border-white/5 flex flex-col items-center justify-center min-h-[160px] text-center mb-6 relative overflow-hidden">
          
          <AnimatePresence mode="wait">
            {isRolling ? (
              <motion.div
                key="rolling"
                initial={{ scale: 0.8, rotate: 0 }}
                animate={{ scale: [1, 1.2, 1], rotate: 360 }}
                exit={{ scale: 0.8 }}
                className="flex gap-4 items-center justify-center"
              >
                <div className="w-14 h-14 bg-amber-400 rounded-xl flex items-center justify-center text-black font-extrabold text-2xl shadow-lg animate-bounce">
                  🎲
                </div>
                <span className="text-sm font-mono text-amber-400 animate-pulse uppercase tracking-wider">
                  Shaking dice...
                </span>
              </motion.div>
            ) : rolledNumber !== null ? (
              <motion.div
                key="result"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-2"
              >
                <span className="text-xs text-gray-500 font-mono block">Rolled Number</span>
                <span className={`text-5xl font-display font-extrabold block ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                  {rolledNumber}
                </span>
                <span className={`text-xs font-mono px-3 py-1 rounded-full uppercase inline-block ${
                  isWin ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {isWin ? `Win (+${Math.floor(bet * multiplier)} Coins)` : 'Lose'}
                </span>
              </motion.div>
            ) : (
              <div className="space-y-1 text-gray-500 text-xs font-mono">
                <p>SLIDE TARGET • SELECT OVER/UNDER • ROLL DICE</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Configurations slider and payouts metrics */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Main slider control */}
          <div className="md:col-span-8 space-y-6">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-gray-400 uppercase">Roll Target:</span>
              <span className="text-amber-400 font-bold text-lg">{targetValue}</span>
            </div>

            <input
              type="range"
              min="2"
              max="98"
              disabled={isRolling}
              value={targetValue}
              onChange={e => {
                setTargetValue(parseInt(e.target.value));
                if (soundEnabled) sounds.playClick();
              }}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />

            <div className="flex gap-4 justify-center">
              <button
                disabled={isRolling}
                onClick={() => setRollMode('over')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border font-display transition ${
                  rollMode === 'over'
                    ? 'bg-amber-400 text-black border-amber-400 font-bold'
                    : 'bg-white/5 text-gray-400 border-white/5'
                }`}
              >
                Roll Over
              </button>
              <button
                disabled={isRolling}
                onClick={() => setRollMode('under')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border font-display transition ${
                  rollMode === 'under'
                    ? 'bg-amber-400 text-black border-amber-400 font-bold'
                    : 'bg-white/5 text-gray-400 border-white/5'
                }`}
              >
                Roll Under
              </button>
            </div>
          </div>

          {/* Stats multiplier view */}
          <div className="md:col-span-4 bg-black/40 p-4 rounded-xl border border-white/5 grid grid-cols-2 md:grid-cols-1 gap-3 font-mono">
            <div>
              <span className="text-[10px] text-gray-500 uppercase block">Multiplier</span>
              <span className="text-xl font-bold text-white">{multiplier}x</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase block">Win Chance</span>
              <span className="text-xl font-bold text-amber-400">{winProbability}%</span>
            </div>
          </div>
        </div>

        {/* Bottom controls panel */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-xs text-gray-400 font-mono flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-500" /> Enter Bet Amount:
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={isRolling || bet <= 10}
                onClick={() => handleBetChange(-50)}
                className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded font-mono text-xs text-gray-400"
              >
                -50
              </button>
              <span className="w-16 text-center font-mono font-bold text-amber-400 text-sm">
                {bet}
              </span>
              <button
                disabled={isRolling}
                onClick={() => handleBetChange(50)}
                className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded font-mono text-xs text-gray-400"
              >
                +50
              </button>
            </div>
          </div>

          <button
            disabled={isRolling || !user || user.virtual_balance < bet}
            onClick={handleRoll}
            className="px-8 py-3 bg-gold-gradient text-black font-display font-extrabold rounded-xl hover:scale-105 active:scale-95 transition shadow-lg shadow-amber-500/15 cursor-pointer disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRolling ? 'animate-spin' : ''}`} />
            {isRolling ? 'ROLLING...' : 'ROLL DICE'}
          </button>
        </div>

        {/* Recent outcomes */}
        <div className="mt-6 flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-mono uppercase">Streak:</span>
          <div className="flex gap-1.5">
            {recentRolls.map((r, i) => (
              <span
                key={i}
                className="text-xs font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5 text-gray-300"
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
