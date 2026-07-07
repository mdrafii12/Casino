/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useCasinoStore } from './store';
import { sounds } from './utils/audio';

// Visual Components
import LobbyView from './components/LobbyView';
import SlotsGame from './components/games/SlotsGame';
import RouletteGame from './components/games/RouletteGame';
import BlackjackGame from './components/games/BlackjackGame';
import DiceGame from './components/games/DiceGame';
import CoinFlipGame from './components/games/CoinFlipGame';
import WheelSpinGame from './components/games/WheelSpinGame';
import ScratchGame from './components/games/ScratchGame';
import LeaderboardView from './components/LeaderboardView';
import UserProfile from './components/UserProfile';
import AdminPanel from './components/AdminPanel';

import { 
  Coins, Trophy, User, Cpu, LogOut, Volume2, VolumeX, Menu, X, 
  Bell, ShieldAlert, Sparkles, Home, ChevronLeft, Award, HelpCircle, Check, Trash2 
} from 'lucide-react';

export default function App() {
  const { 
    user, token, init, soundEnabled, toggleSound, 
    notifications, clearNotification, loading, error, setError 
  } = useCasinoStore();

  const [activeTab, setActiveTab] = useState<string>('lobby'); // lobby, leaderboard, profile, admin, or game-id
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  // Handle game select route
  const handleSelectGame = (gameId: string) => {
    setActiveTab(gameId);
    setMobileMenuOpen(false);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    if (soundEnabled) sounds.playClick();
  };

  const handleResetBalance = async () => {
    if (!user) return;
    const token = localStorage.getItem('lucky_token');
    try {
      const res = await fetch('/api/admin/users/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: user.id, balance: 10000 })
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Render sub views
  const renderContent = () => {
    switch (activeTab) {
      case 'lobby':
        return <LobbyView onSelectGame={handleSelectGame} onNavigate={handleTabChange} />;
      case 'leaderboard':
        return <LeaderboardView />;
      case 'profile':
        return <UserProfile />;
      case 'admin':
        return <AdminPanel />;
      
      // Games
      case 'slots':
        return <SlotsGame />;
      case 'roulette':
        return <RouletteGame />;
      case 'blackjack':
        return <BlackjackGame />;
      case 'dice':
        return <DiceGame />;
      case 'coinflip':
        return <CoinFlipGame />;
      case 'wheel':
        return <WheelSpinGame />;
      case 'scratch':
        return <ScratchGame />;
      
      default:
        return <LobbyView onSelectGame={handleSelectGame} onNavigate={handleTabChange} />;
    }
  };

  // If not logged in or loading, show a premium entering transition splash screen while auto-login resolves
  if (!token || !user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white bg-dark-gradient flex flex-col justify-between py-6">
        <main className="flex-1 flex flex-col items-center justify-center text-center space-y-4 px-4">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-gold-gradient text-black shadow-lg shadow-amber-500/20 mb-2 animate-bounce">
            <Trophy className="w-8 h-8 fill-black" />
          </div>
          <h1 className="text-3xl font-display font-extrabold tracking-wider text-gold-gradient uppercase animate-pulse">
            LUCKYVERSE CASINO
          </h1>
          <p className="text-xs text-zinc-400 uppercase tracking-widest font-mono">
            Entering VIP Arena...
          </p>
        </main>
        <footer className="text-center text-zinc-600 text-[10px] font-mono uppercase tracking-widest px-4 mt-6">
          LuckyVerse Entertainment Platform • Strictly Play Coins • No real cash risks
        </footer>
      </div>
    );
  }

  const unreadNotifsCount = notifications.length;

  return (
    <div className="min-h-screen bg-zinc-950 text-white bg-dark-gradient flex flex-col justify-between">
      
      {/* 1. MASTER GOLDEN HUD HEADER */}
      <header className="sticky top-0 z-50 glass-card border-b border-white/10 px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Back to Lobby arrow if inside a game or profile */}
          {activeTab !== 'lobby' && (
            <button
              onClick={() => handleTabChange('lobby')}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
              title="Back to Lobby"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Logo */}
          <div 
            onClick={() => handleTabChange('lobby')}
            className="flex items-center gap-1.5 cursor-pointer select-none"
          >
            <Trophy className="w-5 h-5 text-amber-500 fill-amber-500" />
            <span className="font-display font-extrabold text-base tracking-wider text-gold-gradient uppercase">
              LuckyVerse
            </span>
          </div>
        </div>

        {/* Center player HUD information */}
        <div className="hidden lg:flex items-center gap-6 font-mono text-xs">
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
            <span className="text-gray-500 uppercase font-bold">LEVEL {user.level}</span>
            <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full" style={{ width: `${(user.xp % 150) / 1.5}%` }} />
            </div>
            <span className="text-amber-400 font-bold">{user.xp % 150}/150 XP</span>
          </div>

          <span className="text-gray-500">|</span>

          <div className="text-gray-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            STREAK: <span className="text-white font-bold">{user.streak} DAYS</span>
          </div>
        </div>

        {/* Right side controls: Balance HUD + sound + notifs + logout */}
        <div className="flex items-center gap-3">
          
          {/* Balance display box */}
          <div className="bg-amber-400/10 border border-amber-500/20 rounded-xl px-3.5 py-1.5 flex items-center gap-2 shadow-lg shadow-amber-500/5">
            <Coins className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
            <span className="font-mono font-extrabold text-amber-400 text-sm sm:text-base">
              {user.virtual_balance.toLocaleString()}
            </span>
            <span className="text-[9px] font-mono text-amber-500 font-bold uppercase hidden sm:inline">COINS</span>
          </div>

          {/* SOUND CONTROL */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition hidden sm:inline-block cursor-pointer"
            title={soundEnabled ? 'Mute Retro Sounds' : 'Unmute Retro Sounds'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* NOTIFICATION LOG dropdown toggle */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition relative cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
              )}
            </button>

            {/* Notification logs overlay panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-zinc-900 border border-white/10 rounded-2xl p-4 shadow-2xl z-50 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-xs font-display font-bold text-amber-400 uppercase tracking-widest">
                    Virtual Logs
                  </span>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-[10px] text-gray-500 hover:text-white uppercase font-mono"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-[10px] text-gray-500 font-mono text-center py-4 uppercase">
                      No recent activities logged
                    </p>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif.id}
                        onClick={() => clearNotification(notif.id)}
                        className="p-2 bg-black/40 border border-white/5 rounded-xl text-[10px] font-mono cursor-pointer hover:bg-red-500/5 hover:border-red-500/10 transition flex justify-between gap-2"
                      >
                        <div className="space-y-0.5 text-left">
                          <span className="text-white font-bold block">{notif.title}</span>
                          <span className="text-gray-400 block leading-normal">{notif.message}</span>
                        </div>
                        <Trash2 className="w-3 h-3 text-gray-500 flex-shrink-0 self-center" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile drawer toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition lg:hidden cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 2. DYNAMIC MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="bg-zinc-900 border-b border-white/10 p-4 space-y-3 lg:hidden z-40 relative">
          <div className="flex justify-around items-center bg-black/40 p-2.5 rounded-xl border border-white/5 font-mono text-xs">
            <div>
              <span className="text-gray-500 block">LEVEL</span>
              <span className="text-white font-bold">{user.level}</span>
            </div>
            <div>
              <span className="text-gray-500 block">STREAK</span>
              <span className="text-white font-bold">{user.streak} DAYS</span>
            </div>
            <div>
              <span className="text-gray-500 block">XP</span>
              <span className="text-amber-400 font-bold">{user.xp % 150}/150</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleTabChange('lobby')}
              className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 ${
                activeTab === 'lobby' ? 'bg-amber-400 text-black font-extrabold' : 'bg-white/5 text-gray-300'
              }`}
            >
              <Home className="w-4 h-4" /> VIP Lobby
            </button>
            <button
              onClick={() => handleTabChange('leaderboard')}
              className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 ${
                activeTab === 'leaderboard' ? 'bg-amber-400 text-black font-extrabold' : 'bg-white/5 text-gray-300'
              }`}
            >
              <Trophy className="w-4 h-4" /> Ranks Hall
            </button>
            <button
              onClick={() => handleTabChange('profile')}
              className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 ${
                activeTab === 'profile' ? 'bg-amber-400 text-black font-extrabold' : 'bg-white/5 text-gray-300'
              }`}
            >
              <User className="w-4 h-4" /> My Profile
            </button>
            {user.is_admin && (
              <button
                onClick={() => handleTabChange('admin')}
                className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 ${
                  activeTab === 'admin' ? 'bg-amber-400 text-black font-extrabold' : 'bg-white/5 text-gray-300'
                }`}
              >
                <Cpu className="w-4 h-4" /> Admin Panel
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. PERSISTENT SIDEBAR NAVIGATION (DESKTOP) */}
      <div className="flex-1 flex" id="main_layout_body">
        <aside className="hidden lg:flex flex-col justify-between w-60 glass-card border-r border-white/10 p-5 space-y-6">
          <div className="space-y-6">
            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
              Lobby Controls
            </div>

            <nav className="space-y-1.5">
              <button
                onClick={() => handleTabChange('lobby')}
                className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
                  activeTab === 'lobby' || ['slots', 'roulette', 'blackjack', 'dice', 'coinflip', 'wheel', 'scratch'].includes(activeTab)
                    ? 'bg-amber-400 text-black font-extrabold shadow' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Home className="w-4 h-4" /> VIP Lobby Selection
              </button>

              <button
                onClick={() => handleTabChange('leaderboard')}
                className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
                  activeTab === 'leaderboard' ? 'bg-amber-400 text-black font-extrabold shadow' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Trophy className="w-4 h-4" /> Leaderboard Rankings
              </button>

              <button
                onClick={() => handleTabChange('profile')}
                className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
                  activeTab === 'profile' ? 'bg-amber-400 text-black font-extrabold shadow' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <User className="w-4 h-4" /> Achievements & Bio
              </button>

              {user.is_admin && (
                <button
                  onClick={() => handleTabChange('admin')}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
                    activeTab === 'admin' ? 'bg-amber-400 text-black font-extrabold shadow' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Cpu className="w-4 h-4" /> Admin Console
                </button>
              )}
            </nav>
          </div>

          {/* Quick sandbox control panel in side drawer */}
          <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-3 font-mono text-[10px]">
            <span className="text-gray-500 uppercase font-bold block">Sandbox Tools</span>
            <p className="text-gray-400 leading-normal">
              If your virtual balance runs dry, click below to restore 10,000 play coins!
            </p>
            <button
              onClick={handleResetBalance}
              className="w-full py-1.5 bg-white/5 hover:bg-amber-400 hover:text-black rounded border border-white/10 text-[9px] font-bold transition uppercase cursor-pointer"
            >
              Restore 10,000 Coins
            </button>
          </div>
        </aside>

        {/* 4. MAIN CENTRAL CONTENT */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {renderContent()}
        </main>
      </div>

      {/* 5. DUAL DISCLAIMER FOOTER */}
      <footer className="glass-card border-t border-white/5 py-6 px-4 text-center space-y-3 z-30">
        <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] text-gray-500 font-mono uppercase tracking-widest">
          <span>Entertainment Sandbox Only</span>
          <span>•</span>
          <span>No Depositing / Cryptos</span>
          <span>•</span>
          <span>Fictitious Coins Have Zero Cash Value</span>
        </div>
        <p className="max-w-2xl mx-auto text-[10px] text-gray-600 leading-relaxed font-sans">
          LuckyVerse Casino is built strictly as a recreational simulator. There are no real-money wagering, 
          cash winnings, banking APIs, or prize withdrawals. Play responsibly. Fictitious virtual coins do not transfer 
          to any external account.
        </p>
      </footer>
    </div>
  );
}
