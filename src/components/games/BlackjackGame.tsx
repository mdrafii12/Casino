/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCasinoStore } from '../../store';
import { sounds } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Volume2, VolumeX, ShieldAlert, AlertTriangle, Check, Award } from 'lucide-react';
import GameProcessingOverlay from './GameProcessingOverlay';

interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: string;
  value: number;
}

const SUITS = [
  { name: 'hearts', symbol: '♥', color: 'text-red-500' },
  { name: 'diamonds', symbol: '♦', color: 'text-red-500' },
  { name: 'clubs', symbol: '♣', color: 'text-zinc-400' },
  { name: 'spades', symbol: '♠', color: 'text-zinc-400' }
];

const RANKS = [
  { label: 'A', value: 11 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
  { label: '5', value: 5 },
  { label: '6', value: 6 },
  { label: '7', value: 7 },
  { label: '8', value: 8 },
  { label: '9', value: 9 },
  { label: '10', value: 10 },
  { label: 'J', value: 10 },
  { label: 'Q', value: 10 },
  { label: 'K', value: 10 }
];

function createDeck(): Card[] {
  const deck: Card[] = [];
  SUITS.forEach(suit => {
    RANKS.forEach(rank => {
      deck.push({
        suit: suit.name as any,
        rank: rank.label,
        value: rank.value
      });
    });
  });
  return shuffle(deck);
}

function shuffle(deck: Card[]): Card[] {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}

function calculateHandScore(cards: Card[]): number {
  let score = cards.reduce((sum, c) => sum + c.value, 0);
  let aces = cards.filter(c => c.rank === 'A').length;

  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
  }
  return score;
}

export default function BlackjackGame() {
  const { user, recordPlay, soundEnabled, toggleSound } = useCasinoStore();
  const [bet, setBet] = useState(100);
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'dealer_turn' | 'ended'>('betting');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [lastWinAmount, setLastWinAmount] = useState<number | null>(null);

  const startNewHand = () => {
    if (isProcessing) return;
    if (!user || user.virtual_balance < bet) {
      if (soundEnabled) sounds.playLose();
      return;
    }

    setIsProcessing(true);
    setPlayerCards([]);
    setDealerCards([]);
    setLastWinAmount(null);
    setResultMessage('');
  };

  const resolveNewHand = () => {
    const freshDeck = createDeck();
    const pCard1 = freshDeck.pop()!;
    const dCard1 = freshDeck.pop()!;
    const pCard2 = freshDeck.pop()!;
    const dCard2 = freshDeck.pop()!;

    setPlayerCards([pCard1, pCard2]);
    setDealerCards([dCard1, dCard2]);
    setDeck(freshDeck);
    setIsProcessing(false);

    if (soundEnabled) {
      sounds.playCard();
      setTimeout(() => sounds.playCard(), 150);
    }

    const pScore = calculateHandScore([pCard1, pCard2]);
    if (pScore === 21) {
      // Natural Blackjack!
      setGameState('dealer_turn');
      revealDealerTurn([dCard1, dCard2], freshDeck, [pCard1, pCard2], bet);
    } else {
      setGameState('playing');
    }
  };

  const hit = () => {
    if (gameState !== 'playing') return;

    const newDeck = [...deck];
    const newCard = newDeck.pop()!;
    const updatedCards = [...playerCards, newCard];

    setPlayerCards(updatedCards);
    setDeck(newDeck);

    if (soundEnabled) sounds.playCard();

    const score = calculateHandScore(updatedCards);
    if (score > 21) {
      endHand('Player Busts!', 'lose', 0, updatedCards, dealerCards);
    }
  };

  const stand = () => {
    if (gameState !== 'playing') return;
    setGameState('dealer_turn');
    revealDealerTurn(dealerCards, deck, playerCards, bet);
  };

  const doubleDown = async () => {
    if (gameState !== 'playing') return;
    if (!user || user.virtual_balance < bet * 2) return;

    const doubleBet = bet * 2;
    const newDeck = [...deck];
    const newCard = newDeck.pop()!;
    const updatedCards = [...playerCards, newCard];

    setPlayerCards(updatedCards);
    setDeck(newDeck);

    if (soundEnabled) sounds.playCard();

    const score = calculateHandScore(updatedCards);
    if (score > 21) {
      endHand('Double Down failed. Player Busts!', 'lose', 0, updatedCards, dealerCards);
    } else {
      setGameState('dealer_turn');
      revealDealerTurn(dealerCards, newDeck, updatedCards, doubleBet);
    }
  };

  const revealDealerTurn = (
    currentDealer: Card[],
    currentDeck: Card[],
    currentPlayer: Card[],
    activeBet: number
  ) => {
    let dCards = [...currentDealer];
    let dDeck = [...currentDeck];
    let dScore = calculateHandScore(dCards);
    const pScore = calculateHandScore(currentPlayer);

    if (soundEnabled) sounds.playCard();

    // AI logic: hits until 17
    const dealInterval = setInterval(async () => {
      if (dScore < 17) {
        const nextCard = dDeck.pop()!;
        dCards.push(nextCard);
        dScore = calculateHandScore(dCards);
        setDealerCards([...dCards]);
        setDeck([...dDeck]);
        if (soundEnabled) sounds.playCard();
      } else {
        clearInterval(dealInterval);

        // Evaluate Winner
        if (dScore > 21) {
          endHand('Dealer Busts! You Win!', 'win', activeBet * 2, currentPlayer, dCards, activeBet);
        } else if (pScore > dScore) {
          // Check for natural blackjack payout (3:2) if player got 21 in 2 cards
          const isBJ = currentPlayer.length === 2 && pScore === 21;
          const winnings = isBJ ? Math.floor(activeBet * 2.5) : activeBet * 2;
          endHand(isBJ ? 'Natural Blackjack! 3:2 Payout!' : 'You Win!', 'win', winnings, currentPlayer, dCards, activeBet);
        } else if (pScore < dScore) {
          endHand('Dealer Wins!', 'lose', 0, currentPlayer, dCards, activeBet);
        } else {
          endHand('Push. Bet returned.', 'push', activeBet, currentPlayer, dCards, activeBet);
        }
      }
    }, 600);
  };

  const endHand = async (
    msg: string,
    outcome: 'win' | 'lose' | 'push',
    payout: number,
    finalPlayer: Card[],
    finalDealer: Card[],
    activeBet: number = bet
  ) => {
    setResultMessage(msg);
    setGameState('ended');
    setLastWinAmount(payout);

    if (outcome === 'win') {
      if (soundEnabled) {
        sounds.playCoin();
        setTimeout(() => sounds.playWinFanfare(), 250);
      }
      if (payout >= activeBet * 2) {
        confetti({
          particleCount: 100,
          spread: 60,
          origin: { y: 0.6 }
        });
      }
    } else if (outcome === 'lose') {
      if (soundEnabled) sounds.playLose();
    } else {
      if (soundEnabled) sounds.playClick();
    }

    // Sync game log to backend
    await recordPlay('blackjack', activeBet, outcome, payout);
  };

  const getSuitSymbol = (cardName: string) => {
    const found = SUITS.find(s => s.name === cardName);
    return found ? found.symbol : '♥';
  };

  const getSuitColor = (cardName: string) => {
    const found = SUITS.find(s => s.name === cardName);
    return found ? found.color : 'text-red-500';
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 relative" id="blackjack_root">
      <GameProcessingOverlay
        isOpen={isProcessing}
        onComplete={resolveNewHand}
        gameName="VIP Blackjack Shuffling"
        betAmount={bet}
      />
      {/* Sandbox Disclaimer */}
      <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 text-center">
        <p className="text-xs text-amber-400 font-mono flex items-center justify-center gap-1.5">
          <ShieldAlert className="w-4 h-4" />
          ENTERTAINMENT CASINO SANDBOX • PLAY COINS ONLY • ZERO MONETARY TRANSFERS
        </p>
      </div>

      <div className="glass-card-gold rounded-2xl p-6 relative">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-display font-extrabold text-gold-gradient uppercase">
              Diamond VIP Blackjack
            </h2>
            <p className="text-xs text-gray-400">Standard dealer AI hits soft 16, stands 17</p>
          </div>
          <button
            onClick={toggleSound}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Playfield Board Table */}
        <div className="relative w-full min-h-[300px] bg-emerald-950/40 rounded-2xl border-2 border-emerald-900/50 p-6 flex flex-col justify-between overflow-hidden shadow-inner">
          <div className="absolute inset-0 bg-radial-gradient(circle at center, rgba(16,185,129,0.05) 0%, transparent 100%) pointer-events-none" />

          {/* DEALER FIELD */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-2">
              <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider">
                Dealer Hand
              </span>
              {gameState !== 'betting' && (
                <span className="text-xs font-mono font-bold text-white bg-black/60 px-2 py-0.5 rounded border border-white/10">
                  Score: {gameState === 'playing' ? '?' : calculateHandScore(dealerCards)}
                </span>
              )}
            </div>

            <div className="flex gap-3 min-h-[110px] items-center">
              {dealerCards.map((card, idx) => {
                const isHoleCard = idx === 1 && gameState === 'playing';
                return (
                  <motion.div
                    key={idx}
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={`w-16 h-24 sm:w-20 sm:h-28 rounded-lg flex flex-col justify-between p-2 shadow-xl border ${
                      isHoleCard
                        ? 'bg-gradient-to-br from-amber-600 to-amber-950 border-amber-500 flex items-center justify-center'
                        : 'bg-white text-black border-zinc-200'
                    }`}
                  >
                    {isHoleCard ? (
                      <div className="text-center">
                        <Award className="w-8 h-8 text-amber-300 animate-pulse" />
                      </div>
                    ) : (
                      <>
                        <div className="text-sm font-bold font-mono">{card.rank}</div>
                        <div className={`text-3xl text-center leading-none ${getSuitColor(card.suit)}`}>
                          {getSuitSymbol(card.suit)}
                        </div>
                        <div className="text-sm font-bold font-mono self-end rotate-180">
                          {card.rank}
                        </div>
                      </>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* OVERLAY OUTCOME BANNER */}
          <div className="my-4 min-h-12 flex items-center justify-center text-center">
            <AnimatePresence mode="wait">
              {gameState === 'ended' && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-black/80 rounded-xl px-6 py-2 border border-amber-500/30 shadow-2xl flex flex-col items-center"
                >
                  <span className="text-xs text-gray-400 font-mono uppercase">Round Result</span>
                  <span className="font-display font-extrabold text-gold-gradient text-lg mt-0.5">
                    {resultMessage}
                  </span>
                  {lastWinAmount !== null && lastWinAmount > 0 && (
                    <span className="text-xs text-green-400 font-bold mt-1">
                      Received Payout: +{lastWinAmount} Coins
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* PLAYER FIELD */}
          <div className="space-y-2">
            <div className="flex gap-3 min-h-[110px] items-center">
              {playerCards.map((card, idx) => (
                <motion.div
                  key={idx}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="w-16 h-24 sm:w-20 sm:h-28 rounded-lg bg-white text-black border border-zinc-200 flex flex-col justify-between p-2 shadow-xl"
                >
                  <div className="text-sm font-bold font-mono">{card.rank}</div>
                  <div className={`text-3xl text-center leading-none ${getSuitColor(card.suit)}`}>
                    {getSuitSymbol(card.suit)}
                  </div>
                  <div className="text-sm font-bold font-mono self-end rotate-180">
                    {card.rank}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex justify-between items-center px-2">
              <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider">
                Your Hand
              </span>
              {gameState !== 'betting' && (
                <span className="text-xs font-mono font-bold text-white bg-black/60 px-2 py-0.5 rounded border border-white/10">
                  Score: {calculateHandScore(playerCards)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION / BET CONTROLS */}
        <div className="mt-6 pt-6 border-t border-white/5">
          {gameState === 'betting' ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1.5">
                <span className="text-xs text-gray-400 font-mono">Choose Bet Coins:</span>
                <div className="flex items-center gap-2">
                  {[100, 200, 500, 1000].map(amt => (
                    <button
                      key={amt}
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
                disabled={!user || user.virtual_balance < bet}
                onClick={startNewHand}
                className="px-8 py-3 bg-gold-gradient text-black font-display font-extrabold rounded-xl hover:scale-105 active:scale-95 shadow-xl shadow-amber-500/10 cursor-pointer disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-black" /> Deal Hand ({bet})
              </button>
            </div>
          ) : gameState === 'playing' ? (
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={hit}
                className="px-6 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-white font-semibold transition active:scale-95"
              >
                Hit
              </button>
              <button
                onClick={stand}
                className="px-8 py-2.5 bg-gold-gradient hover:opacity-90 text-black font-extrabold rounded-xl transition active:scale-95"
              >
                Stand
              </button>
              <button
                disabled={!user || user.virtual_balance < bet * 2}
                onClick={doubleDown}
                className="px-6 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 rounded-xl font-semibold transition active:scale-95 disabled:opacity-40"
              >
                Double Down
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <button
                onClick={() => setGameState('betting')}
                className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-display font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Next Round / Change Bet
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
