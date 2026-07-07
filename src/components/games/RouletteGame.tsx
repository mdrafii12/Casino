/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCasinoStore } from '../../store';
import { sounds } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { ShieldAlert, RefreshCw, Volume2, VolumeX, Coins, Star, Trophy } from 'lucide-react';
import GameProcessingOverlay from './GameProcessingOverlay';

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

interface BetOption {
  id: string;
  label: string;
  type: 'color' | 'parity' | 'range' | 'single';
  payoutMultiplier: number;
  colorClass: string;
}

export default function RouletteGame() {
  const { user, recordPlay, soundEnabled, toggleSound } = useCasinoStore();
  const [betAmount, setBetAmount] = useState(100);
  const [selectedBet, setSelectedBet] = useState<string>('red');
  const [singleNumber, setSingleNumber] = useState<number>(7);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [recentOutcomes, setRecentOutcomes] = useState<number[]>([14, 32, 0, 25, 3]);
  const [lastPayout, setLastPayout] = useState<number | null>(null);

  const betOptions: BetOption[] = [
    { id: 'red', label: 'RED (2x)', type: 'color', payoutMultiplier: 2, colorClass: 'bg-red-600 border-red-500 hover:bg-red-700' },
    { id: 'black', label: 'BLACK (2x)', type: 'color', payoutMultiplier: 2, colorClass: 'bg-zinc-950 border-zinc-800 hover:bg-zinc-900' },
    { id: 'even', label: 'EVEN (2x)', type: 'parity', payoutMultiplier: 2, colorClass: 'bg-white/5 border-white/10 hover:bg-white/10' },
    { id: 'odd', label: 'ODD (2x)', type: 'parity', payoutMultiplier: 2, colorClass: 'bg-white/5 border-white/10 hover:bg-white/10' },
    { id: 'low_half', label: '1 - 18 (2x)', type: 'range', payoutMultiplier: 2, colorClass: 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20 text-amber-400' },
    { id: 'high_half', label: '19 - 36 (2x)', type: 'range', payoutMultiplier: 2, colorClass: 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20 text-amber-400' },
    { id: 'single_num', label: 'SINGLE NO. (36x)', type: 'single', payoutMultiplier: 36, colorClass: 'bg-green-600/20 border-green-500/30 hover:bg-green-600/30 text-green-400' }
  ];

  const spinWheel = () => {
    if (isSpinning || isProcessing) return;
    if (!user || user.virtual_balance < betAmount) {
      sounds.playLose();
      return;
    }

    setIsProcessing(true);
    setIsSpinning(true);
    setWinningNumber(null);
    setLastPayout(null);
  };

  const resolveRoulette = () => {
    // Roll final winning number (0 to 36)
    const resultNum = Math.floor(Math.random() * 37);

    // Dynamic rotation math: 5 full spins (1800 degrees) + extra degrees for the result segment
    // Segment size is 360 / 37 = 9.73 degrees
    const extraDegrees = resultNum * 9.73;
    const totalRotation = wheelRotation + 1800 + (360 - extraDegrees);

    setWheelRotation(totalRotation);

    // Simulated wheel sound ticks
    if (soundEnabled) {
      let ticks = 0;
      const tickTimer = setInterval(() => {
        if (ticks < 15) {
          sounds.playWheelTick(ticks);
          ticks++;
        } else {
          clearInterval(tickTimer);
        }
      }, 150);
    }

    setTimeout(async () => {
      setWinningNumber(resultNum);
      setRecentOutcomes(prev => [resultNum, ...prev.slice(0, 4)]);
      setIsSpinning(false);
      setIsProcessing(false);

      // Evaluate outcome
      let didWin = false;
      const isResultRed = RED_NUMBERS.includes(resultNum);
      const isResultBlack = BLACK_NUMBERS.includes(resultNum);
      const isResultEven = resultNum !== 0 && resultNum % 2 === 0;
      const isResultOdd = resultNum !== 0 && resultNum % 2 !== 0;

      const activeBet = betOptions.find(o => o.id === selectedBet);

      if (activeBet) {
        if (activeBet.id === 'red' && isResultRed) didWin = true;
        else if (activeBet.id === 'black' && isResultBlack) didWin = true;
        else if (activeBet.id === 'even' && isResultEven) didWin = true;
        else if (activeBet.id === 'odd' && isResultOdd) didWin = true;
        else if (activeBet.id === 'low_half' && resultNum >= 1 && resultNum <= 18) didWin = true;
        else if (activeBet.id === 'high_half' && resultNum >= 19 && resultNum <= 36) didWin = true;
        else if (activeBet.id === 'single_num' && resultNum === singleNumber) didWin = true;
      }

      const mult = activeBet ? activeBet.payoutMultiplier : 1;
      const payout = didWin ? betAmount * mult : 0;

      setLastPayout(payout);

      if (didWin) {
        if (soundEnabled) {
          sounds.playCoin();
          setTimeout(() => sounds.playWinFanfare(), 200);
        }
        if (payout >= betAmount * 5) {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 }
          });
        }
      } else {
        if (soundEnabled) sounds.playLose();
      }

      // Record play results to server
      await recordPlay('roulette', betAmount, didWin ? 'win' : 'lose', payout);
    }, 2500); // 2.5 second spin
  };

  const getNumberColor = (num: number) => {
    if (num === 0) return 'text-green-500';
    return RED_NUMBERS.includes(num) ? 'text-red-500' : 'text-zinc-400';
  };

  const getNumberBg = (num: number) => {
    if (num === 0) return 'bg-green-600';
    return RED_NUMBERS.includes(num) ? 'bg-red-600' : 'bg-zinc-800';
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 relative" id="roulette_root">
      <GameProcessingOverlay
        isOpen={isProcessing}
        onComplete={resolveRoulette}
        gameName="Royal Roulette"
        betAmount={betAmount}
      />
      {/* Disclaimer */}
      <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 text-center">
        <p className="text-xs text-amber-400 font-mono flex items-center justify-center gap-1.5">
          <ShieldAlert className="w-4 h-4" />
          VIRTUAL ENTERTAINMENT ONLY • NO REAL MONEY VALUE TRANSFERS
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Wheel column */}
        <div className="md:col-span-5 flex flex-col items-center justify-center space-y-6">
          <div className="glass-card-gold rounded-full p-6 relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
            
            {/* Pointer peg */}
            <div className="absolute top-0 z-20 -translate-y-2 flex flex-col items-center">
              <div className="w-4 h-6 bg-amber-400 rounded-b-full shadow-lg shadow-amber-500/30" />
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-amber-400" />
            </div>

            {/* Rotatable wheel design */}
            <motion.div
              animate={{ rotate: wheelRotation }}
              transition={isSpinning ? { duration: 2.5, ease: 'easeOut' } : { duration: 0 }}
              style={{ originX: '50%', originY: '50%' }}
              className="w-full h-full rounded-full border-4 border-amber-500/40 relative bg-zinc-950 flex items-center justify-center shadow-2xl overflow-hidden"
            >
              {/* Outer wheel ticks */}
              {Array.from({ length: 37 }).map((_, idx) => {
                const angle = (idx * 360) / 37;
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
                    <div className={`w-[2px] h-4 mx-auto rounded-full ${idx === 0 ? 'bg-green-500' : idx % 2 === 0 ? 'bg-red-500' : 'bg-white/40'}`} />
                    <span className="text-[7px] font-mono block text-center text-white font-extrabold mt-1">
                      {idx}
                    </span>
                  </div>
                );
              })}

              {/* Wheel Inner Gold Accent */}
              <div className="w-2/3 h-2/3 rounded-full border border-amber-500/20 bg-dark-gradient absolute flex items-center justify-center">
                <div className="w-1/3 h-1/3 rounded-full bg-black border border-amber-500/50 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_10px_#fce085]" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Recent results strip */}
          <div className="w-full text-center">
            <span className="text-[10px] text-gray-500 font-mono tracking-wider uppercase block mb-2">
              Recent outcomes
            </span>
            <div className="flex justify-center gap-2">
              {recentOutcomes.map((num, idx) => (
                <span
                  key={idx}
                  className={`w-7 h-7 flex items-center justify-center rounded-full font-mono text-xs font-extrabold ${getNumberBg(num)} text-white shadow-md`}
                >
                  {num}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bets control column */}
        <div className="md:col-span-7 space-y-6">
          <div className="glass-card-gold rounded-2xl p-6 relative">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-display font-extrabold text-gold-gradient uppercase">
                  Royal Roulette
                </h2>
                <p className="text-xs text-gray-400">Place virtual bets on standard fields</p>
              </div>
              <button
                onClick={toggleSound}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>

            {/* Display Payout Center */}
            <div className="min-h-12 flex justify-center items-center bg-black/40 rounded-xl p-3 border border-white/5 mb-6 text-center">
              <AnimatePresence mode="wait">
                {winningNumber !== null ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center"
                  >
                    <span className="text-xs text-gray-400 font-mono">Ball Landed on:</span>
                    <span className={`text-2xl font-display font-extrabold mt-1 ${getNumberColor(winningNumber)}`}>
                      Number {winningNumber} ({winningNumber === 0 ? 'Zero' : RED_NUMBERS.includes(winningNumber) ? 'Red' : 'Black'})
                    </span>
                    {lastPayout !== null && lastPayout > 0 && (
                      <span className="text-green-400 text-sm font-extrabold mt-1">
                        Payout Received: +{lastPayout} Coins!
                      </span>
                    )}
                  </motion.div>
                ) : (
                  <span className="text-gray-500 text-xs font-mono">
                    {isSpinning ? 'BALL ROLLING IN REELS...' : 'PLACE YOUR VIRTUAL CHIPS AND SPIN'}
                  </span>
                )}
              </AnimatePresence>
            </div>

            {/* Betting Board Options */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {betOptions.map(opt => (
                <button
                  key={opt.id}
                  disabled={isSpinning}
                  onClick={() => setSelectedBet(opt.id)}
                  className={`p-3 rounded-xl border text-sm font-semibold transition text-left relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                    selectedBet === opt.id
                      ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-lg'
                      : 'border-white/10'
                  } ${opt.colorClass}`}
                >
                  <span className="text-xs uppercase tracking-wider text-gray-400">Bet field</span>
                  <span className="font-display font-bold mt-1 text-white">{opt.label}</span>
                  
                  {selectedBet === opt.id && (
                    <div className="absolute right-2 bottom-2 w-3.5 h-3.5 rounded-full bg-amber-400 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-black" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Single number picker panel if selected */}
            {selectedBet === 'single_num' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6 bg-black/30 border border-white/5 rounded-xl p-4 space-y-3"
              >
                <label className="text-xs text-gray-400 font-mono block">
                  Select your single golden number (0 to 36):
                </label>
                <div className="grid grid-cols-8 gap-1.5">
                  {Array.from({ length: 37 }).map((_, n) => (
                    <button
                      key={n}
                      disabled={isSpinning}
                      onClick={() => setSingleNumber(n)}
                      className={`py-1 text-xs font-mono rounded font-bold transition ${
                        singleNumber === n
                          ? 'bg-amber-400 text-black border border-amber-400'
                          : getNumberBg(n) + ' text-white hover:opacity-80'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Bet configuration */}
            <div className="pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-col space-y-1.5">
                <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                  <Coins className="w-4 h-4 text-amber-500" /> Chip Value:
                </span>
                <div className="flex items-center gap-2">
                  {[100, 200, 500, 1000].map(val => (
                    <button
                      key={val}
                      disabled={isSpinning}
                      onClick={() => setBetAmount(val)}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition ${
                        betAmount === val ? 'bg-amber-400 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <button
                disabled={isSpinning || !user || user.virtual_balance < betAmount}
                onClick={spinWheel}
                className="px-8 py-3 bg-gold-gradient text-black font-display font-extrabold rounded-xl hover:scale-105 active:scale-95 transition shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
                {isSpinning ? 'SPINNING WHEEL...' : 'SPIN BALL'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
