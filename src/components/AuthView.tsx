/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useCasinoStore } from '../store';
import { sounds } from '../utils/audio';
import { KeyRound, Mail, User, ShieldAlert, Sparkles, LogIn, ChevronRight, RefreshCw, Trophy } from 'lucide-react';

const AVATARS = [
  { label: 'Crown', char: '👑', color: 'from-yellow-400 to-amber-600 border-amber-500' },
  { label: 'Gem', char: '💎', color: 'from-cyan-400 to-blue-600 border-blue-500' },
  { label: 'Flame', char: '🔥', color: 'from-orange-400 to-red-600 border-red-500' },
  { label: 'Spade', char: '♠', color: 'from-zinc-300 to-zinc-700 border-zinc-500' },
  { label: 'Club', char: '♣', color: 'from-zinc-400 to-zinc-800 border-zinc-600' },
  { label: 'Diamond', char: '♦', color: 'from-red-400 to-rose-600 border-rose-500' },
  { label: 'Shield', char: '🛡️', color: 'from-blue-400 to-indigo-600 border-indigo-500' }
];

export default function AuthView() {
  const { login, signup, googleLogin, forgotPassword, loading, error, setError } = useCasinoStore();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('Crown');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (email.trim() === '') {
      setError('Please provide an email address.');
      return;
    }

    if (mode === 'login') {
      const ok = await login(email);
      if (!ok && !error) {
        setError('Login credentials mismatched.');
      }
    } else if (mode === 'signup') {
      if (username.trim() === '') {
        setError('Username is required.');
        return;
      }
      await signup(email, username, selectedAvatar);
    } else {
      try {
        const msg = await forgotPassword(email);
        setMessage(msg);
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const handleGoogleSimulate = async () => {
    setError(null);
    setMessage(null);
    const mockEmail = 'mohammed.rafii0306@gmail.com';
    const mockUser = 'LuckyV_Mo';
    const mockAvatar = 'Gem';
    await googleLogin(mockEmail, mockUser, mockAvatar);
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6" id="auth_container">
      {/* Brand logo display */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gold-gradient text-black shadow-lg shadow-amber-500/20 mb-3">
          <Trophy className="w-8 h-8 fill-black" />
        </div>
        <h1 className="text-3xl font-display font-extrabold tracking-wider text-gold-gradient uppercase">
          LUCKYVERSE CASINO
        </h1>
        <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">
          Premium Virtual Gaming Arena
        </p>
      </div>

      {/* Main card panel */}
      <div className="glass-card-gold rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse" />

        {/* State Toggle tabs */}
        {mode !== 'forgot' && (
          <div className="flex bg-black/40 rounded-xl p-1 mb-6 border border-white/5">
            <button
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition ${
                mode === 'login' ? 'bg-amber-400 text-black font-extrabold shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 inline mr-1" /> Login
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition ${
                mode === 'signup' ? 'bg-amber-400 text-black font-extrabold shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 inline mr-1" /> Register
            </button>
          </div>
        )}

        {/* Error / info messages */}
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs font-mono">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-green-400 text-xs font-mono">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* EMAIL */}
          <div>
            <label className="text-[10px] text-gray-500 font-mono uppercase tracking-wider block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/50 transition font-mono"
              />
            </div>
          </div>

          {/* SIGNUP EXTRA FIELDS */}
          {mode === 'signup' && (
            <>
              <div>
                <label className="text-[10px] text-gray-500 font-mono uppercase tracking-wider block mb-1">
                  Choose Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="HighRoller_Vegas"
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/50 transition font-mono"
                  />
                </div>
              </div>

              {/* Avatar Selector Grid */}
              <div>
                <label className="text-[10px] text-gray-500 font-mono uppercase tracking-wider block mb-2">
                  Select Luxury Avatar
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
                  {AVATARS.map(av => (
                    <button
                      type="button"
                      key={av.label}
                      onClick={() => {
                        setSelectedAvatar(av.label);
                        sounds.playClick();
                      }}
                      className={`aspect-square rounded-xl bg-gradient-to-br ${av.color} border-2 flex items-center justify-center text-xl transition cursor-pointer hover:scale-105 active:scale-95 ${
                        selectedAvatar === av.label ? 'scale-110 ring-2 ring-white/40' : 'opacity-60'
                      }`}
                      title={av.label}
                    >
                      {av.char}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* PASSWORD */}
          {mode !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                    }}
                    className="text-[10px] text-amber-400 hover:underline font-mono"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/50 transition font-mono"
                />
              </div>
            </div>
          )}

          {/* Form Submit Trigger */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gold-gradient text-black font-display font-extrabold rounded-xl hover:scale-102 active:scale-98 transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10 cursor-pointer disabled:opacity-40"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : mode === 'login' ? (
              <>
                SIGN IN SECURELY <ChevronRight className="w-4 h-4" />
              </>
            ) : mode === 'signup' ? (
              <>
                CLAIM 10,000 COINS & REGISTER <Sparkles className="w-4 h-4 fill-black" />
              </>
            ) : (
              <>
                SEND RECOVERY EMAIL <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Back option for recovery */}
        {mode === 'forgot' && (
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
              setMessage(null);
            }}
            className="w-full text-center text-xs text-gray-400 hover:text-white mt-4 font-mono underline"
          >
            Back to Sign In
          </button>
        )}

        {/* Simulated Google SSO Trigger */}
        {mode !== 'forgot' && (
          <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
            <div className="relative text-center">
              <span className="absolute inset-y-1/2 left-0 right-0 h-[1px] bg-white/5" />
              <span className="relative bg-zinc-900 px-3 text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                Fast Sandbox SSO
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoogleSimulate}
              disabled={loading}
              className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-white transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.6 4.5 1.7l2.42-2.42C17.34 1.58 14.93 1 12.24 1 6.58 1 2 5.58 2 11.24s4.58 10.24 10.24 10.24c5.795 0 10.254-4.074 10.254-10.24 0-.695-.08-1.355-.22-1.955H12.24z" />
              </svg>
              Fast Google Sign In (mohammed.rafii0306@gmail.com)
            </button>
          </div>
        )}
      </div>

      {/* Rules Policy bottom disclaimer */}
      <div className="mt-6 flex gap-2 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 text-gray-400 text-[11px] leading-normal font-sans">
        <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0" />
        <p>
          <span className="font-bold text-amber-500">Virtual Coin Terms:</span> LuckyVerse is an entertainment-only platform. 
          By creating an account, you receive 10,000 virtual coins which hold zero real-world monetary value. 
          No payouts, crypto deposits, or cash withdrawals are supported.
        </p>
      </div>
    </div>
  );
}
