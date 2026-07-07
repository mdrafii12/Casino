/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useCasinoStore } from '../store';
import { sounds } from '../utils/audio';
import { User, Achievement, DailyChallenge } from '../types';
import { Award, Trophy, Coins, Star, Settings, Check, Compass, ShieldCheck, Heart } from 'lucide-react';

const AVATARS = [
  { label: 'Crown', char: '👑', color: 'from-yellow-400 to-amber-600 border-amber-500' },
  { label: 'Gem', char: '💎', color: 'from-cyan-400 to-blue-600 border-blue-500' },
  { label: 'Flame', char: '🔥', color: 'from-orange-400 to-red-600 border-red-500' },
  { label: 'Spade', char: '♠', color: 'from-zinc-300 to-zinc-700 border-zinc-500' },
  { label: 'Club', char: '♣', color: 'from-zinc-400 to-zinc-800 border-zinc-600' },
  { label: 'Diamond', char: '♦', color: 'from-red-400 to-rose-600 border-rose-500' },
  { label: 'Shield', char: '🛡️', color: 'from-blue-400 to-indigo-600 border-indigo-500' }
];

export default function UserProfile() {
  const { user, updateProfile, dailyChallenges, claimChallengeReward, soundEnabled } = useCasinoStore();
  const [username, setUsername] = useState(user?.username || '');
  const [avatar, setAvatar] = useState(user?.avatar || 'Crown');
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState({ plays: 15, wins: 8, losses: 7 });

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setAvatar(user.avatar);

      // Query user statistics from history
      fetch('/api/admin/stats')
        .then(res => res.json())
        .then(data => {
          if (data && data.recent_history) {
            const userHistory = data.recent_history.filter((h: any) => h.user_id === user.id);
            const totalPlays = userHistory.length;
            const wins = userHistory.filter((h: any) => h.result === 'win').length;
            const losses = totalPlays - wins;
            setStats({
              plays: Math.max(totalPlays, 1),
              wins,
              losses
            });
          }
        })
        .catch(err => console.error('Error loading stats:', err));
    }
  }, [user]);

  // Compute stats metrics
  const winRate = stats.plays > 0 ? Math.round((stats.wins / stats.plays) * 100) : 50;

  // Level Progression: 150 XP per level
  const xpInCurrentLevel = user ? user.xp % 150 : 0;
  const xpPercentage = Math.round((xpInCurrentLevel / 150) * 100);

  // List of virtual achievement badges
  const achievements: Achievement[] = [
    { id: 'a1', name: 'First Spin Win', description: 'Win any game round in the casino', icon: '🏆', reward_coins: 500, metric_required: 1, metric_name: 'wins', unlocked_at: stats.wins >= 1 ? 'Unlocked' : undefined },
    { id: 'a2', name: 'Lucky Decurion', description: 'Accumulate a total of 10 wins', icon: '💎', reward_coins: 2000, metric_required: 10, metric_name: 'wins', unlocked_at: stats.wins >= 10 ? 'Unlocked' : undefined },
    { id: 'a3', name: 'Streak Cadet', description: 'Claim daily reward streak 3 consecutive days', icon: '🔥', reward_coins: 1500, metric_required: 3, metric_name: 'streak', unlocked_at: (user?.streak || 0) >= 3 ? 'Unlocked' : undefined },
    { id: 'a4', name: 'High Roller VIP', description: 'Reach a total virtual balance of 25,000 coins', icon: '👑', reward_coins: 3000, metric_required: 25000, metric_name: 'balance', unlocked_at: (user?.virtual_balance || 0) >= 25000 ? 'Unlocked' : undefined },
    { id: 'a5', name: 'Silver Miner', description: 'Spin at least 15 rounds across games', icon: '🪙', reward_coins: 1200, metric_required: 15, metric_name: 'plays', unlocked_at: stats.plays >= 15 ? 'Unlocked' : undefined }
  ];

  const handleUpdate = async () => {
    if (username.trim() === '') return;
    const ok = await updateProfile(username, avatar);
    if (ok) {
      setIsEditing(false);
    }
  };

  const getAvatarChar = (label: string) => {
    const av = AVATARS.find(x => x.label === label);
    return av ? av.char : '👑';
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-8" id="profile_root">
      
      {/* Disclaimer */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 text-center">
        <p className="text-xs text-amber-400 font-mono flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4" />
          ENTERTAINMENT ONLY • VIRTUAL XP & ACHS SYSTEM • NO LIQUIDITY OR MONEY VALUE
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Profile Card column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card-gold rounded-2xl p-6 relative">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] text-amber-400 font-mono uppercase font-bold tracking-widest">
                VIP Profile Summary
              </span>
              <button
                onClick={() => {
                  setIsEditing(!isEditing);
                  if (soundEnabled) sounds.playClick();
                }}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {/* Profile view or edit */}
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-gray-500 font-mono uppercase block mb-1">
                    Edit Nickname:
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-500 font-mono uppercase block mb-2">
                    Switch Avatar Icon:
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {AVATARS.map(av => (
                      <button
                        key={av.label}
                        onClick={() => setAvatar(av.label)}
                        className={`py-1.5 rounded-lg border text-base transition ${
                          avatar === av.label ? 'border-amber-400 bg-amber-400/15' : 'border-white/5'
                        }`}
                      >
                        {av.char}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleUpdate}
                  className="w-full py-2 bg-amber-400 hover:bg-amber-500 text-black font-display font-extrabold text-xs rounded-xl transition cursor-pointer"
                >
                  SAVE VIP PROFILE
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400/20 to-amber-600/30 border border-amber-500/30 flex items-center justify-center text-4xl shadow-xl">
                  {getAvatarChar(avatar)}
                </div>

                <div>
                  <h3 className="text-xl font-display font-extrabold text-white flex items-center justify-center gap-1">
                    {username}
                    {user?.is_admin && (
                      <span className="text-[8px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded uppercase font-bold">
                        ADMIN
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">{user?.email}</p>
                </div>

                {/* Coins details */}
                <div className="w-full bg-black/40 p-4 rounded-xl border border-white/5 flex justify-between items-center text-left font-mono">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">Coin Balance</span>
                    <span className="text-lg font-bold text-amber-400">{user?.virtual_balance.toLocaleString()} COINS</span>
                  </div>
                  <Coins className="w-5 h-5 text-amber-500" />
                </div>
              </div>
            )}

            {/* Level & XP progression */}
            <div className="mt-6 pt-6 border-t border-white/5 space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-400">Level {user?.level}</span>
                <span className="text-gray-400">{user ? user.xp % 150 : 0}/150 XP</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="bg-gold-gradient h-full" style={{ width: `${xpPercentage}%` }} />
              </div>
              <span className="text-[9px] text-gray-500 font-mono block">
                Receive +10 XP for playing, +20 extra XP on winning rounds to level up!
              </span>
            </div>
          </div>
        </div>

        {/* Challenges & Achievements column */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Daily Challenges */}
          <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
            <h3 className="text-sm font-display font-bold text-amber-400 uppercase flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-amber-500" /> Daily Arena Challenges
            </h3>

            <div className="space-y-3">
              {dailyChallenges.map(ch => {
                const complete = ch.current >= ch.target;
                return (
                  <div
                    key={ch.id}
                    className="p-3 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between text-xs font-mono"
                  >
                    <div className="space-y-1 pr-3">
                      <span className="text-white font-bold block">{ch.title}</span>
                      <p className="text-[10px] text-gray-400 leading-normal">{ch.description}</p>
                      
                      {/* Current Progress bar */}
                      <div className="flex items-center gap-2 pt-1">
                        <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="bg-green-500 h-full"
                            style={{ width: `${(ch.current / ch.target) * 100}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-gray-500">
                          {ch.current}/{ch.target}
                        </span>
                      </div>
                    </div>

                    <button
                      disabled={!complete || ch.claimed}
                      onClick={() => claimChallengeReward(ch.id)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                        ch.claimed
                          ? 'bg-zinc-800/40 text-gray-500 border border-zinc-700/10 pointer-events-none'
                          : complete
                          ? 'bg-green-500 text-black hover:scale-103'
                          : 'bg-white/5 text-gray-400 border border-white/5 pointer-events-none'
                      }`}
                    >
                      {ch.claimed ? (
                        <>
                          <Check className="w-3 h-3" /> CLAIMED
                        </>
                      ) : (
                        `CLAIM (+${ch.reward_coins})`
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Locked/Unlocked Badges */}
          <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
            <h3 className="text-sm font-display font-bold text-amber-400 uppercase flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" /> Unlockable VIP Milestones
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {achievements.map(ach => {
                const unlocked = !!ach.unlocked_at;
                return (
                  <div
                    key={ach.id}
                    className={`p-3 rounded-xl border flex items-start gap-3 transition ${
                      unlocked ? 'bg-amber-400/5 border-amber-400/20' : 'bg-black/30 border-white/5 opacity-50'
                    }`}
                  >
                    <span className="text-3xl p-1 bg-black/40 rounded-lg">{ach.icon}</span>
                    <div className="space-y-1 text-left">
                      <span className={`text-xs font-bold block ${unlocked ? 'text-amber-400' : 'text-gray-400'}`}>
                        {ach.name}
                      </span>
                      <p className="text-[10px] text-gray-400 leading-normal">{ach.description}</p>
                      
                      <div className="flex items-center justify-between gap-2 pt-1 font-mono text-[9px]">
                        <span className="text-gray-500 font-bold uppercase">Reward: +{ach.reward_coins} Coins</span>
                        <span className={`font-bold ${unlocked ? 'text-green-400' : 'text-gray-500'}`}>
                          {unlocked ? 'UNLOCKED' : 'LOCKED'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
