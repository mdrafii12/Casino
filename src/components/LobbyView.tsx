/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useCasinoStore } from '../store';
import { sounds } from '../utils/audio';
import { Game, LeaderboardEntry } from '../types';
import { Trophy, Coins, Star, Calendar, ArrowRight, Sparkles, Megaphone, Gift, Heart, Compass, ShieldCheck } from 'lucide-react';

interface LobbyProps {
  onSelectGame: (gameId: string) => void;
  onNavigate: (tab: string) => void;
}

export default function LobbyView({ onSelectGame, onNavigate }: LobbyProps) {
  const { user, games, dailyRewardClaimed, dailyStreak, claimDailyReward, claimReferralCode } = useCasinoStore();
  const [topRanks, setTopRanks] = useState<LeaderboardEntry[]>([]);
  const [referralCode, setReferralCode] = useState('');
  const [refMessage, setRefMessage] = useState<string | null>(null);
  const [refError, setRefError] = useState<string | null>(null);

  useEffect(() => {
    // Load top 3 from leaderboard
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => {
        if (data && data.all_time) {
          setTopRanks(data.all_time.slice(0, 3));
        }
      })
      .catch(err => console.error('Error fetching lobby rankings:', err));
  }, []);

  const handleClaimReward = async () => {
    if (dailyRewardClaimed) return;
    await claimDailyReward();
  };

  const handleClaimReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    setRefMessage(null);
    setRefError(null);

    if (referralCode.trim() === '') return;

    try {
      const msg = await claimReferralCode(referralCode);
      setRefMessage(msg);
      setReferralCode('');
    } catch (err: any) {
      setRefError(err.message || 'Claim failed');
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'slots': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'blackjack': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'roulette': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-8" id="lobby_root">
      
      {/* 1. MAJESTIC HERO PANEL */}
      <div className="relative rounded-2xl overflow-hidden glass-card p-6 sm:p-10 border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-radial from-amber-400/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-radial from-yellow-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs text-amber-400 font-mono uppercase tracking-widest animate-pulse">
              <Sparkles className="w-3.5 h-3.5 fill-amber-500" /> Virtual VIP Lobby Active
            </div>
            <h1 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight text-white leading-tight">
              THE WORLD’S FINEST <br />
              <span className="text-gold-gradient">VIRTUAL GOLD CASINO</span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
              Welcome to LuckyVerse. Spin deluxe custom slot reels, play interactive dealer VIP blackjack, 
              or flip the cosmic golden coins. Absolutely zero real money risk. Enjoy 100% premium safe entertainment.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => {
                  onSelectGame('slots');
                  sounds.playClick();
                }}
                className="px-6 py-2.5 bg-gold-gradient text-black font-display font-extrabold rounded-xl hover:scale-105 active:scale-95 transition shadow-lg shadow-amber-500/10 cursor-pointer flex items-center gap-2 text-sm"
              >
                SPIN FEATURED SLOTS <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate('profile')}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl text-xs transition"
              >
                VIEW PROFILE ACHIEVEMENTS
              </button>
            </div>
          </div>

          {/* Right Column: 4-image premium bento gallery representing the casino games */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3 bg-black/40 p-3 rounded-2xl border border-white/5">
            {[
              {
                title: 'Slots Reeled',
                desc: 'Golden Reels',
                img: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=500&auto=format&fit=crop&q=80',
              },
              {
                title: 'Royal Table',
                desc: 'Diamond Blackjack',
                img: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=500&auto=format&fit=crop&q=80',
              },
              {
                title: 'Fortune Wheel',
                desc: 'Mega Multipliers',
                img: 'https://images.unsplash.com/photo-1601506521937-0121a7fc2a6b?w=500&auto=format&fit=crop&q=80',
              },
              {
                title: 'Premium Play',
                desc: 'Cosmic Chips',
                img: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=500&auto=format&fit=crop&q=80',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="group/item relative overflow-hidden rounded-xl border border-white/5 hover:border-amber-400/40 transition-all duration-300 aspect-[4/3] bg-zinc-950 cursor-pointer"
                onClick={() => {
                  sounds.playClick();
                }}
              >
                <img
                  src={item.img}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover/item:scale-110 transition-all duration-700 opacity-80"
                />
                {/* Gradient shade overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80 group-hover/item:opacity-60 transition-opacity" />
                
                {/* Subtle Text */}
                <div className="absolute bottom-2 left-2 right-2 text-left">
                  <p className="text-[10px] font-mono font-bold text-amber-400 tracking-wider uppercase">
                    {item.title}
                  </p>
                  <p className="text-[8px] font-mono text-zinc-400 hidden sm:block">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. DAILY LOGIN BONUSES & REWARDS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Daily Bonus Banner Calendar */}
        <div className="lg:col-span-8 glass-card-gold rounded-2xl p-6 relative flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none" />
          
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <h2 className="text-lg font-display font-extrabold text-gold-gradient uppercase flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-500" /> Daily Golden Rewards
                </h2>
                <p className="text-xs text-gray-400">Claim your free coin multiplier consecutive daily streak</p>
              </div>
              <span className="px-2.5 py-1 bg-black/60 border border-white/10 rounded-lg text-xs font-mono font-bold text-amber-400">
                Streak: {dailyStreak} Days
              </span>
            </div>

            {/* Streak Progress Strip (7 Days) */}
            <div className="grid grid-cols-7 gap-2.5 my-6">
              {Array.from({ length: 7 }).map((_, idx) => {
                const day = idx + 1;
                const active = day <= dailyStreak;
                const isToday = day === dailyStreak && !dailyRewardClaimed;
                const bonusCoins = day * 500;

                return (
                  <div
                    key={idx}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition ${
                      isToday
                        ? 'bg-amber-400 border-amber-400 ring-2 ring-amber-400/20 text-black'
                        : active
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : 'bg-black/30 border-white/5 text-gray-500'
                    }`}
                  >
                    <span className="text-[9px] font-mono uppercase font-bold">D{day}</span>
                    <Coins className="w-4 h-4 my-1" />
                    <span className="text-[10px] font-mono font-bold">+{bonusCoins}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            disabled={dailyRewardClaimed}
            onClick={handleClaimReward}
            className={`w-full py-3 rounded-xl font-display font-extrabold tracking-wider transition uppercase flex items-center justify-center gap-2 text-sm cursor-pointer ${
              dailyRewardClaimed
                ? 'bg-zinc-800 text-gray-500 border border-zinc-700/30 pointer-events-none'
                : 'bg-gold-gradient text-black hover:scale-102 shadow-lg shadow-amber-500/15'
            }`}
          >
            {dailyRewardClaimed ? (
              <>BONUS CLAIMED TODAY • CHECK BACK TOMORROW</>
            ) : (
              <>
                CLAIM DAILY REWARD BONUS (+{dailyStreak * 500 || 500} COINS) <Gift className="w-4 h-4 fill-black" />
              </>
            )}
          </button>
        </div>

        {/* Dynamic Referral Code Claimer */}
        <div className="lg:col-span-4 glass-card rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-sm font-display font-bold text-amber-400 uppercase flex items-center gap-1.5">
              <Megaphone className="w-4 h-4" /> Virtual Referrals
            </h3>
            <p className="text-xs text-gray-400 leading-normal">
              Input the code <span className="text-amber-400 font-mono font-bold">SANDBOX</span>, 
              <span className="text-amber-400 font-mono font-bold"> JACKPOT</span>, or any virtual code 
              to receive an immediate <span className="text-white font-bold">2,000 Free Coins</span>!
            </p>

            {refMessage && (
              <div className="p-2.5 bg-green-500/10 border border-green-500/20 rounded-lg text-[11px] text-green-400 font-mono">
                {refMessage}
              </div>
            )}

            {refError && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-[11px] text-red-400 font-mono">
                {refError}
              </div>
            )}
          </div>

          <form onSubmit={handleClaimReferral} className="mt-4 flex gap-2">
            <input
              type="text"
              value={referralCode}
              onChange={e => setReferralCode(e.target.value)}
              placeholder="e.g. SANDBOX"
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-400/50"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-black font-display font-bold text-xs rounded-xl transition cursor-pointer"
            >
              CLAIM
            </button>
          </form>
        </div>
      </div>

      {/* 3. TRENDING GAMES ROSTER */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-xl font-display font-extrabold text-white uppercase flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-500" /> Premium Games Lobby
            </h2>
            <p className="text-xs text-gray-400">Browse and play customized zero-deposit casino simulators</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {games.map(game => (
            <div
              key={game.id}
              className="group glass-card rounded-2xl overflow-hidden border border-white/5 hover:border-amber-500/30 transition flex flex-col justify-between"
            >
              {/* Cover Card Art banner */}
              <div className="relative h-44 overflow-hidden bg-zinc-950">
                <img
                  src={game.image}
                  alt={game.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                
                {/* Category badge */}
                <span className={`absolute top-3 left-3 px-2 py-0.5 border text-[9px] font-mono uppercase font-bold rounded ${getCategoryColor(game.category)}`}>
                  {game.category}
                </span>

                {/* Min Bet badge */}
                <span className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/85 border border-white/10 rounded text-[9px] font-mono text-amber-400 font-bold">
                  Min: {game.min_bet} Coins
                </span>
              </div>

              {/* Detail body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <h3 className="font-display font-extrabold text-white group-hover:text-amber-400 transition text-base">
                    {game.name}
                  </h3>
                  <p className="text-gray-400 text-xs leading-relaxed line-clamp-3">
                    {game.description}
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      onSelectGame(game.id);
                      sounds.playClick();
                    }}
                    disabled={!game.active}
                    className="w-full py-2 bg-white/5 group-hover:bg-amber-400 group-hover:text-black hover:opacity-95 text-gray-300 font-display font-extrabold text-xs rounded-xl tracking-wider uppercase border border-white/5 group-hover:border-transparent transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                  >
                    {game.active ? (
                      <>
                        LAUNCH PLAYFIELD <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      'MAINTENANCE / LOCKED'
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. LEADERBOARD PREVIEW & HOUSE GUARANTEE BANNER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
        
        {/* Leaderboard widget */}
        <div className="lg:col-span-5 glass-card rounded-2xl p-6 border border-white/10 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-display font-bold text-amber-400 uppercase flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" /> Global High Rollers
            </h3>
            <button
              onClick={() => onNavigate('leaderboard')}
              className="text-[10px] text-gray-500 hover:text-amber-400 uppercase font-mono tracking-wider"
            >
              See All
            </button>
          </div>

          <div className="space-y-2">
            {topRanks.map((rank, idx) => (
              <div
                key={rank.id}
                className="flex items-center justify-between p-2.5 bg-black/40 rounded-xl border border-white/5 text-xs font-mono"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-5 h-5 flex items-center justify-center rounded-full font-bold text-[10px] ${
                    idx === 0 ? 'bg-amber-400 text-black' : idx === 1 ? 'bg-zinc-300 text-black' : 'bg-amber-700 text-white'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="text-white font-bold">{rank.username}</span>
                  <span className="text-[10px] text-gray-500">Lv.{rank.level}</span>
                </div>
                <span className="text-amber-400 font-extrabold">{rank.total_winnings.toLocaleString()} COINS</span>
              </div>
            ))}
          </div>
        </div>

        {/* VIP House Guarantee Banner */}
        <div className="lg:col-span-7 bg-dark-gradient rounded-2xl p-6 border border-amber-500/10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none" />
          
          <div className="space-y-2">
            <h3 className="text-sm font-display font-bold text-amber-400 uppercase flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-500" /> LuckyVerse FairPlay Sandbox Guarantee
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Our random number generators (RNG) for Slots multipliers, roulette wheels, blackjack cards, and coin flips 
              are fully verified for recreation of authentic casino probabilities. There are absolutely no mechanics designed 
              to trick or siphon currency. Players can reset their virtual balance to 10,000 coins at any time should they zero out!
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap justify-between items-center text-[10px] text-gray-500 font-mono gap-4">
            <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-red-500" /> Responsible Recreation ONLY</span>
            <span>RNG Status: PASS (0.98 base house edge)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
