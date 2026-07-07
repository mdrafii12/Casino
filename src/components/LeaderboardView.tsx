/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useCasinoStore } from '../store';
import { sounds } from '../utils/audio';
import { LeaderboardEntry } from '../types';
import { Trophy, Coins, Star, Calendar, ArrowUpRight, ShieldAlert, Sparkles } from 'lucide-react';

export default function LeaderboardView() {
  const { soundEnabled } = useCasinoStore();
  const [filter, setFilter] = useState<'daily' | 'weekly' | 'all_time'>('all_time');
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => {
        if (data) {
          if (filter === 'daily') setRankings(data.daily || []);
          else if (filter === 'weekly') setRankings(data.weekly || []);
          else setRankings(data.all_time || []);
        }
      })
      .catch(err => console.error('Error fetching leaderboard data:', err))
      .finally(() => setLoading(false));
  }, [filter]);

  const getPodiumBadge = (rank: number) => {
    switch (rank) {
      case 1: return '👑 Gold Podium';
      case 2: return '🥈 Silver Rank';
      case 3: return '🥉 Bronze Rank';
      default: return `No. ${rank}`;
    }
  };

  const getPodiumBorder = (rank: number) => {
    switch (rank) {
      case 1: return 'border-amber-400 bg-amber-400/5 shadow-[0_0_15px_rgba(212,175,55,0.1)]';
      case 2: return 'border-zinc-400 bg-zinc-400/5';
      case 3: return 'border-amber-800 bg-amber-800/5';
      default: return 'border-white/5 bg-black/20';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-6" id="leaderboard_root">
      {/* Disclaimer */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 text-center">
        <p className="text-xs text-amber-400 font-mono flex items-center justify-center gap-1.5">
          <ShieldAlert className="w-4 h-4" />
          DEMO PLATFORM LEADERBOARD • PLAY COINS ONLY • ZERO MONETARY TRANSFERS
        </p>
      </div>

      <div className="glass-card-gold rounded-2xl p-6 relative">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-display font-extrabold text-gold-gradient uppercase flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" /> Hall of High Rollers
            </h2>
            <p className="text-xs text-gray-400">Dynamic rankings compiled from active virtual balances</p>
          </div>

          {/* Filter options */}
          <div className="flex bg-black/40 rounded-xl p-1 border border-white/5">
            {(['daily', 'weekly', 'all_time'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setFilter(tab);
                  if (soundEnabled) sounds.playClick();
                }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase transition cursor-pointer ${
                  filter === tab ? 'bg-amber-400 text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Podium Top 3 bento showcase */}
        {!loading && rankings.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* 2nd place on left */}
            {rankings[1] && (
              <div className="p-4 rounded-xl border border-zinc-400 bg-zinc-400/5 flex flex-col items-center text-center order-2 md:order-1">
                <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mb-1">
                  2ND PLACE
                </span>
                <span className="text-4xl mb-2">💎</span>
                <span className="font-display font-extrabold text-white text-sm">{rankings[1].username}</span>
                <span className="text-[10px] text-zinc-500 font-mono mt-0.5">Level {rankings[1].level}</span>
                <span className="text-zinc-400 font-mono font-extrabold mt-3">{rankings[1].total_winnings.toLocaleString()} COINS</span>
              </div>
            )}

            {/* 1st place in center */}
            {rankings[0] && (
              <div className="p-6 rounded-xl border border-amber-400 bg-amber-400/10 shadow-[0_0_20px_rgba(212,175,55,0.15)] flex flex-col items-center text-center order-1 md:order-2 scale-105">
                <div className="inline-flex gap-1 items-center px-2 py-0.5 bg-amber-400 text-black rounded text-[9px] font-mono font-bold uppercase tracking-widest mb-2">
                  <Star className="w-3 h-3 fill-black animate-spin" /> LEADER
                </div>
                <span className="text-5xl mb-2">👑</span>
                <span className="font-display font-extrabold text-white text-base">{rankings[0].username}</span>
                <span className="text-[10px] text-amber-500 font-mono mt-0.5 font-bold">Level {rankings[0].level}</span>
                <span className="text-amber-400 font-mono font-extrabold mt-3 text-lg">{rankings[0].total_winnings.toLocaleString()} COINS</span>
              </div>
            )}

            {/* 3rd place on right */}
            {rankings[2] && (
              <div className="p-4 rounded-xl border border-amber-800 bg-amber-800/5 flex flex-col items-center text-center order-3">
                <span className="text-[10px] font-mono font-bold text-amber-700 uppercase tracking-widest mb-1">
                  3RD PLACE
                </span>
                <span className="text-4xl mb-2">🛡️</span>
                <span className="font-display font-extrabold text-white text-sm">{rankings[2].username}</span>
                <span className="text-[10px] text-amber-800 font-mono mt-0.5">Level {rankings[2].level}</span>
                <span className="text-amber-700 font-mono font-extrabold mt-3">{rankings[2].total_winnings.toLocaleString()} COINS</span>
              </div>
            )}
          </div>
        )}

        {/* Detailed Full Rankings List */}
        <div className="space-y-3">
          <div className="px-4 py-2 bg-black/60 rounded-xl border border-white/5 text-[10px] text-gray-500 font-mono flex justify-between uppercase">
            <span>Ranks & Username</span>
            <span>Virtual Winnings</span>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500 font-mono text-xs">
              Loading Hall of Fame records...
            </div>
          ) : rankings.length === 0 ? (
            <div className="text-center py-8 text-gray-500 font-mono text-xs">
              No rankings submitted yet. Be the first!
            </div>
          ) : (
            <div className="space-y-2">
              {rankings.map((rank, idx) => (
                <div
                  key={rank.id}
                  className={`px-4 py-3 rounded-xl border flex justify-between items-center transition ${getPodiumBorder(idx + 1)}`}
                >
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="w-8 font-bold text-gray-400">
                      #{idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{rank.username}</span>
                      <span className="text-[9px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5 font-bold uppercase">
                        Level {rank.level}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-mono font-bold">
                    <span className="text-amber-400 font-extrabold">{rank.total_winnings.toLocaleString()}</span>
                    <span className="text-gray-500">COINS</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
