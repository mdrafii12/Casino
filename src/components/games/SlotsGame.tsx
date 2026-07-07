/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCasinoStore } from '../../store';
import { sounds } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { HelpCircle, Play, Square, RotateCcw, Volume2, VolumeX, Coins, Star, Trophy } from 'lucide-react';
import GameProcessingOverlay from './GameProcessingOverlay';

interface SymbolConfig {
  char: string;
  name: string;
  color: string;
  multiplier: number;
}

const symbols: SymbolConfig[] = [
  { char: '👑', name: 'Crown', color: 'from-amber-300 to-yellow-500', multiplier: 20 },
  { char: '💎', name: 'Diamond', color: 'from-cyan-300 to-blue-500', multiplier: 12 },
  { char: '7️⃣', name: 'Lucky 7', color: 'from-red-400 to-rose-600', multiplier: 8 },
  { char: '🪙', name: 'Gold Bar', color: 'from-yellow-400 to-amber-600', multiplier: 5 },
  { char: '🔔', name: 'Golden Bell', color: 'from-yellow-300 to-orange-500', multiplier: 3 },
  { char: '🍒', name: 'Cherry', color: 'from-red-400 to-red-600', multiplier: 2 },
  { char: '🍀', name: 'Clover', color: 'from-green-400 to-emerald-600', multiplier: 1.5 }
];

export default function SlotsGame() {
  const { user, recordPlay, soundEnabled, toggleSound } = useCasinoStore();
  const [bet, setBet] = useState(100);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [reels, setReels] = useState<SymbolConfig[][]>([
    [symbols[4], symbols[5], symbols[6]],
    [symbols[3], symbols[4], symbols[5]],
    [symbols[5], symbols[6], symbols[1]]
  ]);
  const [isAuto, setIsAuto] = useState(false);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [showRules, setShowRules] = useState(false);
  const autoSpinRef = useRef<boolean>(false);

  autoSpinRef.current = isAuto;

  // Cleanup auto spin on unmount
  useEffect(() => {
    return () => {
      setIsAuto(false);
    };
  }, []);

  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ffe066', '#f1c40f', '#e67e22', '#f39c12']
    });
  };

  const spin = async () => {
    if (isSpinning || isProcessing) return;
    if (!user || user.virtual_balance < bet) {
      setIsAuto(false);
      return;
    }

    setIsProcessing(true);
    setIsSpinning(true);
    setLastWin(null);

    // Audio effects during start
    if (soundEnabled) {
      sounds.playClick();
    }
  };

  const resolveSpin = async () => {
    // Multi-step reel transition simulation
    const finalReels: SymbolConfig[][] = [];

    // Spin mechanics: Random selections per reel
    for (let i = 0; i < 3; i++) {
      const reelResult: SymbolConfig[] = [];
      for (let j = 0; j < 3; j++) {
        const randomIndex = Math.floor(Math.random() * symbols.length);
        // Weighted probability for top prizes
        const roll = Math.random();
        let selected = symbols[randomIndex];
        if (roll < 0.05) {
          selected = symbols[0]; // Crown
        } else if (roll < 0.15) {
          selected = symbols[1]; // Diamond
        } else if (roll < 0.3) {
          selected = symbols[2]; // Lucky 7
        }
        reelResult.push(selected);
      }
      finalReels.push(reelResult);
    }

    setReels(finalReels);
    setIsSpinning(false);
    setIsProcessing(false);

    // Evaluate win lines
    // Line 1: Center Horizontal Row index 1
    const middleRow = [finalReels[0][1], finalReels[1][1], finalReels[2][1]];
    const topRow = [finalReels[0][0], finalReels[1][0], finalReels[2][0]];
    const bottomRow = [finalReels[0][2], finalReels[1][2], finalReels[2][2]];

    let totalWinMultiplier = 0;
    let matchedSymbolName = '';

    // Check center horizontal line
    if (middleRow[0].name === middleRow[1].name && middleRow[1].name === middleRow[2].name) {
      totalWinMultiplier += middleRow[0].multiplier;
      matchedSymbolName = middleRow[0].name;
    }

    // Check top horizontal line (half pay multiplier for outer lines)
    if (topRow[0].name === topRow[1].name && topRow[1].name === topRow[2].name) {
      totalWinMultiplier += topRow[0].multiplier * 0.5;
      matchedSymbolName = topRow[0].name;
    }

    // Check bottom horizontal line
    if (bottomRow[0].name === bottomRow[1].name && bottomRow[1].name === bottomRow[2].name) {
      totalWinMultiplier += bottomRow[0].multiplier * 0.5;
      matchedSymbolName = bottomRow[0].name;
    }

    // Check diagonals
    const diag1 = [finalReels[0][0], finalReels[1][1], finalReels[2][2]];
    const diag2 = [finalReels[0][2], finalReels[1][1], finalReels[2][0]];

    if (diag1[0].name === diag1[1].name && diag1[1].name === diag1[2].name) {
      totalWinMultiplier += diag1[0].multiplier * 0.75;
      matchedSymbolName = diag1[0].name;
    }
    if (diag2[0].name === diag2[1].name && diag2[1].name === diag2[2].name) {
      totalWinMultiplier += diag2[0].multiplier * 0.75;
      matchedSymbolName = diag2[0].name;
    }

    const payout = Math.floor(bet * totalWinMultiplier);
    const isWin = payout > 0;

    // Handle payout sounds
    if (isWin) {
      setLastWin(payout);
      if (soundEnabled) {
        sounds.playCoin();
        setTimeout(() => sounds.playWinFanfare(), 250);
      }
      if (payout >= bet * 5) {
        triggerConfetti();
      }
    } else {
      if (soundEnabled) {
        sounds.playLose();
      }
    }

    // Record to store
    await recordPlay('slots', bet, isWin ? 'win' : 'lose', payout);

    // Auto-spin logic continuation
    if (autoSpinRef.current) {
      setTimeout(() => {
        if (autoSpinRef.current) {
          spin();
        }
      }, 1200);
    }
  };

  const handleQuickBet = (amount: number) => {
    if (isSpinning) return;
    setBet(Math.max(50, Math.min(amount, user?.virtual_balance || 10000)));
    if (soundEnabled) sounds.playClick();
  };

  const handleBetChange = (delta: number) => {
    if (isSpinning) return;
    setBet(prev => Math.max(50, Math.min(prev + delta, 5000)));
    if (soundEnabled) sounds.playClick();
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 relative" id="slots_root">
      <GameProcessingOverlay
        isOpen={isProcessing}
        onComplete={resolveSpin}
        gameName="Golden Reels Slots"
        betAmount={bet}
      />
      {/* Disclaimer Top */}
      <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 text-center">
        <p className="text-xs text-amber-400 font-mono flex items-center justify-center gap-1.5">
          <Coins className="w-4 h-4" />
          ENTERTAINMENT ONLY • NO REAL MONEY • STRICTLY PLAY COINS
        </p>
      </div>

      {/* Main Grid Wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Rules Sidebar on desktop */}
        <div className="lg:col-span-3 space-y-4">
          <div className="glass-card rounded-xl p-4 border border-white/5">
            <h3 className="text-sm font-display font-bold text-amber-400 mb-3 flex items-center gap-1.5 uppercase">
              <Trophy className="w-4 h-4 text-amber-500" /> Paytable
            </h3>
            <div className="space-y-2 text-xs font-mono">
              {symbols.map(s => (
                <div key={s.name} className="flex justify-between items-center py-1 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span>{s.char}</span>
                    <span className="text-gray-400">{s.name}</span>
                  </div>
                  <span className="text-amber-400 font-bold">{s.multiplier}x</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-2 bg-white/5 rounded text-[10px] text-gray-400 font-sans leading-relaxed">
              <p className="font-bold text-amber-500 mb-1">LINES OF PLAY:</p>
              <p>• Horizontal Center: Full Multiplier</p>
              <p>• Horizontals Top/Bot: 50% Pay</p>
              <p>• Diagonals (X shape): 75% Pay</p>
            </div>
          </div>
        </div>

        {/* Slot Reels Panel */}
        <div className="lg:col-span-9 space-y-6">
          <div className="glass-card-gold rounded-2xl p-6 relative overflow-hidden flex flex-col items-center">
            
            {/* Top gold header lights */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse" />
            
            <div className="w-full flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500 animate-spin" />
                <h2 className="text-xl font-display font-extrabold tracking-wider text-gold-gradient uppercase">
                  Golden Reels Slots
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSound}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
                  title={soundEnabled ? 'Mute' : 'Unmute'}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* The 3 Slot Reels Window */}
            <div className="relative w-full bg-black/80 rounded-xl p-4 border-2 border-amber-500/30 flex justify-center gap-4 min-h-[220px]">
              
              {/* Winning Line Overlay Indicator */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-red-500/70 border-b border-red-500/50 shadow-[0_0_10px_#ef4444] z-10 pointer-events-none" />
              
              {reels.map((reel, rIdx) => (
                <div
                  key={rIdx}
                  className="w-1/3 bg-zinc-950/90 rounded-lg overflow-hidden border border-white/10 relative h-[180px] flex flex-col justify-around py-1"
                >
                  <AnimatePresence mode="popLayout">
                    {reel.map((sym, sIdx) => (
                      <motion.div
                        key={`${sym.name}-${sIdx}`}
                        initial={isSpinning ? { y: -100, opacity: 0.5 } : { y: 0, opacity: 1 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={isSpinning ? { y: 100, opacity: 0 } : {}}
                        transition={{
                          type: 'spring',
                          stiffness: 100,
                          damping: 15,
                          delay: rIdx * 0.15
                        }}
                        className={`flex flex-col items-center justify-center p-2 rounded-md ${
                          sIdx === 1 ? 'bg-amber-500/5 border border-amber-500/10' : ''
                        }`}
                      >
                        <span className="text-3xl sm:text-4xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                          {sym.char}
                        </span>
                        <span className="text-[9px] font-mono text-gray-500 tracking-wider uppercase mt-1">
                          {sym.name}
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Results payout bar */}
            <div className="w-full h-12 flex justify-center items-center mt-6">
              <AnimatePresence mode="wait">
                {lastWin !== null && lastWin > 0 ? (
                  <motion.div
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.3, opacity: 0 }}
                    className="bg-green-500/10 border border-green-500/30 rounded-full px-6 py-2 flex items-center gap-2"
                  >
                    <Trophy className="w-5 h-5 text-green-400 fill-green-400" />
                    <span className="font-display font-extrabold text-green-400 text-lg">
                      Payout: +{lastWin} Coins!
                    </span>
                  </motion.div>
                ) : lastWin === 0 ? (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-gray-500 text-sm font-mono"
                  >
                    No pay lines matched. Spin again!
                  </motion.span>
                ) : (
                  <span className="text-amber-500/60 text-xs font-mono tracking-widest uppercase">
                    Awaiting golden reel activation...
                  </span>
                )}
              </AnimatePresence>
            </div>

            {/* Controls panel */}
            <div className="w-full mt-6 pt-6 border-t border-white/5 space-y-4">
              
              {/* Presets Bet Selection */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-gray-400 font-mono flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-500" /> Select Bet:
                </span>
                <div className="flex items-center gap-2">
                  {[50, 100, 200, 500, 1000].map(amt => (
                    <button
                      key={amt}
                      disabled={isSpinning}
                      onClick={() => handleQuickBet(amt)}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition ${
                        bet === amt
                          ? 'bg-amber-400 text-black shadow-lg shadow-amber-500/10'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider / Fine tuning bet selector */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 bg-black/40 rounded-lg p-2 border border-white/5">
                  <button
                    disabled={isSpinning || bet <= 50}
                    onClick={() => handleBetChange(-50)}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded font-bold font-mono transition text-xs"
                  >
                    -50
                  </button>
                  <span className="w-16 text-center font-mono font-bold text-amber-400">
                    {bet}
                  </span>
                  <button
                    disabled={isSpinning || bet >= 5000}
                    onClick={() => handleBetChange(50)}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded font-bold font-mono transition text-xs"
                  >
                    +50
                  </button>
                </div>

                {/* Spin / Auto Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsAuto(!isAuto)}
                    className={`px-4 py-2.5 rounded-xl font-display font-semibold text-xs transition flex items-center gap-1.5 border ${
                      isAuto
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {isAuto ? (
                      <>
                        <Square className="w-4 h-4" /> Stop Auto
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4" /> Auto Spin
                      </>
                    )}
                  </button>

                  <button
                    disabled={isSpinning || !user || user.virtual_balance < bet}
                    onClick={spin}
                    className="px-8 py-2.5 bg-gold-gradient text-black font-display font-extrabold rounded-xl hover:scale-105 shadow-xl shadow-amber-500/20 active:scale-95 transition flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:scale-100 disabled:pointer-events-none"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    {isSpinning ? 'SPINNING...' : 'SPIN REELS'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
