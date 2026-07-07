/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCasinoStore } from '../../store';
import { sounds } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { Sparkles, RefreshCw, Volume2, VolumeX, ShieldAlert, Coins } from 'lucide-react';
import GameProcessingOverlay from './GameProcessingOverlay';

interface ScratchCell {
  id: number;
  symbol: string;
  name: string;
  multiplier: number;
  scratched: boolean;
}

const SCRATCH_ITEMS = [
  { char: '👑', name: 'Crown', multiplier: 25 },
  { char: '💎', name: 'Diamond', multiplier: 15 },
  { char: '7️⃣', name: 'Lucky 7', multiplier: 8 },
  { char: '🪙', name: 'Gold Bar', multiplier: 5 },
  { char: '🍒', name: 'Cherry', multiplier: 2.5 },
  { char: '🍀', name: 'Clover', multiplier: 1.5 }
];

export default function ScratchGame() {
  const { user, recordPlay, soundEnabled, toggleSound } = useCasinoStore();
  const [bet, setBet] = useState(100);
  const [cells, setCells] = useState<ScratchCell[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scratchedCount, setScratchedCount] = useState(0);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [isWin, setIsWin] = useState<boolean | null>(null);

  const buyScratchCard = () => {
    if (gameStarted || isProcessing) return;
    if (!user || user.virtual_balance < bet) {
      if (soundEnabled) sounds.playLose();
      return;
    }

    setIsProcessing(true);
    setLastWin(null);
    setIsWin(null);
  };

  const resolveBuyCard = () => {
    // Generate random cells (6 cells total)
    // To make it fun, we have a random chance of generating matching sets of 3
    const isWinnerCard = Math.random() < 0.35;
    const items: typeof SCRATCH_ITEMS = [];

    if (isWinnerCard) {
      // Pick a winning symbol and push 3 instances of it
      const winSymbol = SCRATCH_ITEMS[Math.floor(Math.random() * SCRATCH_ITEMS.length)];
      for (let i = 0; i < 3; i++) {
        items.push(winSymbol);
      }
      // Fill remaining 3 cells randomly
      while (items.length < 6) {
        const randItem = SCRATCH_ITEMS[Math.floor(Math.random() * SCRATCH_ITEMS.length)];
        items.push(randItem);
      }
    } else {
      // Complete random fill (avoiding duplicate sets of 3 where possible)
      while (items.length < 6) {
        const randItem = SCRATCH_ITEMS[Math.floor(Math.random() * SCRATCH_ITEMS.length)];
        // Limit occurrences of any item to 2 max to ensure lose
        const count = items.filter(x => x.name === randItem.name).length;
        if (count < 2) {
          items.push(randItem);
        }
      }
    }

    // Shuffle final cells
    const shuffled = items.sort(() => Math.random() - 0.5);

    const mappedCells: ScratchCell[] = shuffled.map((item, idx) => ({
      id: idx,
      symbol: item.char,
      name: item.name,
      multiplier: item.multiplier,
      scratched: false
    }));

    setCells(mappedCells);
    setScratchedCount(0);
    setGameStarted(true);
    setIsProcessing(false);

    if (soundEnabled) {
      sounds.playCard();
    }
  };

  const scratchCell = async (id: number) => {
    if (!gameStarted) return;
    const cellIdx = cells.findIndex(c => c.id === id);
    if (cellIdx === -1 || cells[cellIdx].scratched) return;

    if (soundEnabled) {
      sounds.playScratch();
    }

    const updated = [...cells];
    updated[cellIdx].scratched = true;
    setCells(updated);

    const nextCount = scratchedCount + 1;
    setScratchedCount(nextCount);

    // Evaluates once all 6 cells have been scratched
    if (nextCount === 6) {
      setGameStarted(false);

      // Check occurrences of each symbol
      const counts: Record<string, number> = {};
      cells.forEach(c => {
        counts[c.name] = (counts[c.name] || 0) + 1;
      });

      let matchedItem = SCRATCH_ITEMS.find(item => (counts[item.name] || 0) >= 3);
      const didWin = !!matchedItem;
      const payout = didWin && matchedItem ? Math.floor(bet * matchedItem.multiplier) : 0;

      setIsWin(didWin);
      setLastWin(payout);

      if (didWin) {
        if (soundEnabled) {
          sounds.playCoin();
          setTimeout(() => sounds.playWinFanfare(), 200);
        }
        if (payout >= bet * 5) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      } else {
        if (soundEnabled) sounds.playLose();
      }

      await recordPlay('scratch', bet, didWin ? 'win' : 'lose', payout);
    }
  };

  const scratchAll = () => {
    if (!gameStarted) return;
    cells.forEach(c => {
      if (!c.scratched) {
        scratchCell(c.id);
      }
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 relative" id="scratch_root">
      <GameProcessingOverlay
        isOpen={isProcessing}
        onComplete={resolveBuyCard}
        gameName="Nebula Scratch Card"
        betAmount={bet}
      />
      {/* Disclaimer */}
      <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 text-center">
        <p className="text-xs text-amber-400 font-mono flex items-center justify-center gap-1.5">
          <ShieldAlert className="w-4 h-4" />
          CASINO SIMULATOR • FOR RECREATIONAL ENTERTAINMENT • STRICTLY PLAY COINS
        </p>
      </div>

      <div className="glass-card-gold rounded-2xl p-6 relative">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-display font-extrabold text-gold-gradient uppercase">
              Diamond Scratch Cards
            </h2>
            <p className="text-xs text-gray-400">Scratch 6 golden foil cells to Match 3 identical symbols</p>
          </div>
          <button
            onClick={toggleSound}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Output outcome bar */}
        <div className="min-h-12 flex justify-center items-center bg-black/40 rounded-xl p-3 border border-white/5 mb-6 text-center">
          <AnimatePresence mode="wait">
            {lastWin !== null && lastWin > 0 ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2 text-green-400"
              >
                <Sparkles className="w-5 h-5 animate-pulse" />
                <span className="font-display font-extrabold text-sm sm:text-base">
                  MATCH 3 DETECTED! Payout: +{lastWin} Coins!
                </span>
              </motion.div>
            ) : lastWin === 0 ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-gray-500 text-xs font-mono"
              >
                No sets of 3 matched. Buy another card!
              </motion.span>
            ) : (
              <span className="text-gray-500 text-xs font-mono uppercase tracking-widest">
                {gameStarted ? `Scratch cards: revealed (${scratchedCount}/6)` : 'Purchase a new card to start'}
              </span>
            )}
          </AnimatePresence>
        </div>

        {/* The Scratch Cells Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg mx-auto mb-6">
          {gameStarted && cells.length > 0 ? (
            cells.map(cell => (
              <div
                key={cell.id}
                onClick={() => scratchCell(cell.id)}
                className="w-full aspect-square relative rounded-xl overflow-hidden border border-white/10 cursor-pointer shadow-lg"
              >
                <AnimatePresence>
                  {!cell.scratched ? (
                    // Golden Scratchable Foil Cover
                    <motion.div
                      key="foil"
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-700 flex flex-col items-center justify-center p-2 z-10 hover:brightness-110 active:brightness-95 transition"
                    >
                      <Sparkles className="w-8 h-8 text-white animate-pulse" />
                      <span className="text-[9px] font-mono font-bold text-black tracking-wider uppercase mt-2">
                        SCRATCH ME
                      </span>
                    </motion.div>
                  ) : (
                    // Revealed Underlying Symbol
                    <motion.div
                      key="revealed"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute inset-0 bg-zinc-950/80 flex flex-col items-center justify-center p-3 text-center"
                    >
                      <span className="text-4xl sm:text-5xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                        {cell.symbol}
                      </span>
                      <span className="text-[9px] font-mono text-gray-500 tracking-wider uppercase mt-1">
                        {cell.name}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          ) : (
            // Inactive Cards Grid Placeholder
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-full aspect-square bg-zinc-900/60 rounded-xl border border-white/5 flex flex-col items-center justify-center p-3 text-gray-600 opacity-60"
              >
                <Coins className="w-8 h-8" />
                <span className="text-[9px] font-mono uppercase mt-2">No Active Card</span>
              </div>
            ))
          )}
        </div>

        {/* Action controllers */}
        <div className="pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-xs text-gray-400 font-mono flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-500" /> Card Price:
            </span>
            <div className="flex gap-2">
              {[100, 200, 500, 1000].map(val => (
                <button
                  key={val}
                  disabled={gameStarted}
                  onClick={() => setBet(val)}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition ${
                    bet === val ? 'bg-amber-400 text-black shadow-md' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {gameStarted && (
              <button
                onClick={scratchAll}
                className="px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-semibold transition hover:bg-white/10 active:scale-95"
              >
                Reveal All Cells
              </button>
            )}

            <button
              disabled={gameStarted || !user || user.virtual_balance < bet}
              onClick={buyScratchCard}
              className="px-8 py-3 bg-gold-gradient text-black font-display font-extrabold rounded-xl hover:scale-105 active:scale-95 transition shadow-lg shadow-amber-500/15 cursor-pointer disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${gameStarted ? 'animate-spin' : ''}`} />
              BUY CARD ({bet})
            </button>
          </div>
        </div>

        {/* Paytable Sidebar */}
        <div className="mt-8 p-4 bg-black/30 border border-white/5 rounded-xl">
          <h3 className="text-xs font-display font-bold text-amber-400 mb-2 uppercase">Scratch Matching Paytable</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
            {SCRATCH_ITEMS.map(item => (
              <div key={item.name} className="flex justify-between items-center bg-white/5 p-2 rounded border border-white/5">
                <span className="flex items-center gap-1.5">{item.char} {item.name}</span>
                <span className="text-amber-400 font-bold">{item.multiplier}x</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
