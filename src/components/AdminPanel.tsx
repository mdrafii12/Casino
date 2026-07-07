/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useCasinoStore } from '../store';
import { sounds } from '../utils/audio';
import { User, Game, GameHistory } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { ShieldCheck, Users, Activity, ToggleLeft, ToggleRight, DollarSign, ArrowUpRight, TrendingUp, Cpu, Coins, Search, Edit } from 'lucide-react';

interface StatsResponse {
  total_users: number;
  active_games: number;
  total_bets: number;
  total_house_payout: number;
  net_house_winnings: number;
  top_game: string;
  big_wins: GameHistory[];
  recent_history: GameHistory[];
}

export default function AdminPanel() {
  const { games, fetchGames, soundEnabled } = useCasinoStore();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [userList, setUserList] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newBalance, setNewBalance] = useState<number>(10000);
  const [loading, setLoading] = useState(false);

  const fetchAdminData = () => {
    setLoading(true);
    const token = localStorage.getItem('lucky_token');
    
    // Fetch system stats
    fetch('/api/admin/stats', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setStats(data);
        }
      })
      .catch(err => console.error('Error fetching admin statistics:', err));

    // Fetch user list
    fetch('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.users) {
          setUserList(data.users);
        }
      })
      .catch(err => console.error('Error loading user ledger:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleGame = async (gameId: string, currentActive: boolean) => {
    const token = localStorage.getItem('lucky_token');
    try {
      const res = await fetch('/api/admin/games/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ game_id: gameId, active: !currentActive })
      });
      if (res.ok) {
        await fetchGames();
        fetchAdminData();
        if (soundEnabled) sounds.playClick();
      }
    } catch (err) {
      console.error('Failed to toggle game:', err);
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    const token = localStorage.getItem('lucky_token');
    try {
      const res = await fetch('/api/admin/users/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: selectedUserId, balance: newBalance })
      });
      if (res.ok) {
        setSelectedUserId(null);
        fetchAdminData();
        if (soundEnabled) sounds.playCoin();
      }
    } catch (err) {
      console.error('Failed to update balance:', err);
    }
  };

  // Prepare chart data based on categories
  const chartData = [
    { name: 'Slots', bets: stats ? Math.floor(stats.total_bets * 0.45) : 12000, payouts: stats ? Math.floor(stats.total_house_payout * 0.42) : 10500 },
    { name: 'Roulette', bets: stats ? Math.floor(stats.total_bets * 0.20) : 8000, payouts: stats ? Math.floor(stats.total_house_payout * 0.18) : 7200 },
    { name: 'Blackjack', bets: stats ? Math.floor(stats.total_bets * 0.15) : 6000, payouts: stats ? Math.floor(stats.total_house_payout * 0.17) : 6300 },
    { name: 'Mini-Games', bets: stats ? Math.floor(stats.total_bets * 0.20) : 5000, payouts: stats ? Math.floor(stats.total_house_payout * 0.23) : 5200 }
  ];

  const filteredUsers = userList.filter(u =>
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-8" id="admin_root">
      
      {/* Title */}
      <div className="flex justify-between items-end border-b border-white/5 pb-4">
        <div>
          <div className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px] text-amber-400 font-mono uppercase font-bold tracking-widest">
            <Cpu className="w-3.5 h-3.5" /> SECURE ROOT ACCESS
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-gold-gradient uppercase mt-1">
            LuckyVerse Admin Command
          </h1>
        </div>
        <button
          onClick={fetchAdminData}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-mono font-bold text-gray-300 transition cursor-pointer"
        >
          RE-SYNC LEDGERS
        </button>
      </div>

      {/* 1. STATS METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 font-mono">
        <div className="glass-card rounded-xl p-4 border border-white/5">
          <span className="text-[10px] text-gray-500 uppercase flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Total Profiles</span>
          <span className="text-xl sm:text-2xl font-bold text-white block mt-1">{stats?.total_users || 3} Players</span>
        </div>
        <div className="glass-card rounded-xl p-4 border border-white/5">
          <span className="text-[10px] text-gray-500 uppercase flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> Game Roster</span>
          <span className="text-xl sm:text-2xl font-bold text-amber-400 block mt-1">{stats?.active_games || 7} Active</span>
        </div>
        <div className="glass-card rounded-xl p-4 border border-white/5">
          <span className="text-[10px] text-gray-500 uppercase flex items-center gap-1"><Coins className="w-3.5 h-3.5 text-amber-500" /> Total Virtual Bets</span>
          <span className="text-xl sm:text-2xl font-bold text-white block mt-1">{(stats?.total_bets || 150000).toLocaleString()} COINS</span>
        </div>
        <div className="glass-card rounded-xl p-4 border border-white/5">
          <span className="text-[10px] text-gray-500 uppercase flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-green-400" /> House Net Advantage</span>
          <span className="text-xl sm:text-2xl font-bold text-green-400 block mt-1">{(stats?.net_house_winnings || 4500).toLocaleString()} COINS</span>
        </div>
      </div>

      {/* 2. ANALYTICS CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Betting Chart */}
        <div className="lg:col-span-8 glass-card rounded-2xl p-6 border border-white/10 space-y-4">
          <h3 className="text-xs font-display font-bold text-amber-400 uppercase tracking-widest">
            Virtual Bet Volume vs. Payout Distribution
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="name" stroke="#555" fontSize={11} tickLine={false} />
                <YAxis stroke="#555" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f0f0f', border: '1px solid #333' }} />
                <Bar dataKey="bets" name="Total Wagers" fill="#d4af37" radius={[4, 4, 0, 0]} />
                <Bar dataKey="payouts" name="Total Payouts" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Game status list */}
        <div className="lg:col-span-4 glass-card rounded-2xl p-6 border border-white/10 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-display font-bold text-amber-400 uppercase tracking-widest mb-4">
              Toggle Game Availability
            </h3>
            <div className="space-y-3">
              {games.map(g => (
                <div
                  key={g.id}
                  className="flex items-center justify-between p-2 bg-black/40 rounded-xl border border-white/5 text-xs font-mono"
                >
                  <div>
                    <span className="text-white font-bold block">{g.name}</span>
                    <span className="text-[10px] text-gray-500 uppercase">{g.category}</span>
                  </div>
                  <button
                    onClick={() => handleToggleGame(g.id, g.active)}
                    className="p-1.5 hover:opacity-80 transition cursor-pointer"
                  >
                    {g.active ? (
                      <ToggleRight className="w-8 h-8 text-green-400 fill-green-500/25" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-500" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. USER LEDGER MANAGEMENT */}
      <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-display font-bold text-amber-400 uppercase flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-500" /> User Database & Virtual Wallets
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Edit simulated accounts and adjust virtual coin balances</p>
          </div>

          {/* Search box */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              placeholder="Search by username or email..."
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-amber-400/50 text-white font-mono"
            />
          </div>
        </div>

        {/* Adjust Balance Modal Input */}
        {selectedUserId && (
          <form onSubmit={handleAdjustBalance} className="bg-black/60 p-4 rounded-xl border border-amber-500/20 max-w-sm flex flex-col gap-3 font-mono">
            <h4 className="text-xs text-amber-400 font-bold uppercase">Adjust Virtual balance</h4>
            <div className="flex gap-2">
              <input
                type="number"
                required
                value={newBalance}
                onChange={e => setNewBalance(parseInt(e.target.value))}
                placeholder="Coins"
                className="flex-1 bg-zinc-900 border border-white/10 rounded px-3 py-1.5 text-xs text-white"
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-400 text-black font-display font-extrabold text-xs rounded transition"
              >
                APPLY
              </button>
              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
                className="px-3 py-1.5 bg-white/5 text-gray-400 text-xs rounded"
              >
                CANCEL
              </button>
            </div>
          </form>
        )}

        {/* User list table */}
        <div className="space-y-2">
          <div className="px-4 py-2 bg-black/60 rounded-xl border border-white/5 text-[10px] text-gray-500 font-mono grid grid-cols-12 uppercase">
            <span className="col-span-5 sm:col-span-4">User Details</span>
            <span className="col-span-4">Virtual Balance</span>
            <span className="col-span-3 sm:col-span-4">Level & Streak</span>
            <span className="col-span-1 text-right">Edit</span>
          </div>

          <div className="space-y-1.5">
            {filteredUsers.map(u => (
              <div
                key={u.id}
                className="px-4 py-3 bg-black/30 rounded-xl border border-white/5 grid grid-cols-12 items-center text-xs font-mono"
              >
                <div className="col-span-5 sm:col-span-4 space-y-0.5">
                  <span className="text-white font-bold block">{u.username}</span>
                  <span className="text-[10px] text-gray-500 block">{u.email}</span>
                </div>
                <span className="col-span-4 text-amber-400 font-extrabold">
                  {u.virtual_balance.toLocaleString()} COINS
                </span>
                <div className="col-span-3 sm:col-span-4 space-y-0.5">
                  <span className="text-gray-400 block">Level {u.level}</span>
                  <span className="text-[10px] text-gray-500 block">{u.streak} Day streak</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedUserId(u.id);
                    setNewBalance(u.virtual_balance);
                  }}
                  className="col-span-1 text-right text-gray-400 hover:text-amber-400 transition"
                  title="Edit balance"
                >
                  <Edit className="w-3.5 h-3.5 ml-auto" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
