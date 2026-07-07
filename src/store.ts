/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { User, Game, GameHistory, LeaderboardEntry, DailyChallenge, Notification } from './types';

interface CasinoState {
  user: User | null;
  token: string | null;
  games: Game[];
  dailyChallenges: DailyChallenge[];
  dailyRewardClaimed: boolean;
  dailyStreak: number;
  soundEnabled: boolean;
  notifications: Notification[];
  loading: boolean;
  error: string | null;

  // Actions
  init: () => Promise<void>;
  login: (email: string) => Promise<boolean>;
  signup: (email: string, username: string, avatar: string) => Promise<boolean>;
  googleLogin: (email: string, username: string, avatar: string) => Promise<boolean>;
  logout: () => void;
  loadUser: () => Promise<void>;
  updateProfile: (username: string, avatar: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<string>;
  fetchGames: () => Promise<void>;
  recordPlay: (gameId: string, betAmount: number, outcome: 'win' | 'lose' | 'push', payout: number) => Promise<void>;
  claimDailyReward: () => Promise<string | null>;
  claimChallengeReward: (challengeId: string) => Promise<void>;
  claimReferralCode: (code: string) => Promise<string>;
  toggleSound: () => void;
  addNotification: (title: string, message: string, type: 'success' | 'info' | 'warning') => void;
  clearNotification: (id: string) => void;
  setError: (err: string | null) => void;
}

export const useCasinoStore = create<CasinoState>((set, get) => ({
  user: null,
  token: localStorage.getItem('lucky_token'),
  games: [],
  dailyChallenges: [],
  dailyRewardClaimed: false,
  dailyStreak: 0,
  soundEnabled: localStorage.getItem('lucky_sound') !== 'false',
  notifications: [],
  loading: false,
  error: null,

  init: async () => {
    set({ loading: true, error: null });
    try {
      const { token } = get();
      if (token) {
        await get().loadUser();
      }
      
      // If no valid token or user profile after loading, auto-authenticate a guest user
      if (!get().token || !get().user) {
        const guestEmail = 'guest@luckyverse.com';
        const guestUsername = 'LuckyGuest';
        const guestAvatar = 'Crown';
        
        // Try to log in
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: guestEmail }),
        });
        
        let data = await loginRes.json();
        if (!loginRes.ok) {
          // If login fails (user does not exist), register guest user
          const signupRes = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: guestEmail, username: guestUsername, avatar: guestAvatar }),
          });
          data = await signupRes.json();
        }
        
        if (data.token) {
          localStorage.setItem('lucky_token', data.token);
          set({ user: data.user, token: data.token });
          get().addNotification('Welcome Guest!', `Logged in as ${data.user.username}. Happy playing!`, 'success');
        }
      }

      await get().fetchGames();
    } catch (err: any) {
      set({ error: err.message || 'Initialization failed' });
    } finally {
      set({ loading: false });
    }
  },

  login: async (email: string) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      localStorage.setItem('lucky_token', data.token);
      set({ user: data.user, token: data.token });
      get().addNotification('Welcome Back!', `Logged in as ${data.user.username}. Happy spinning!`, 'success');
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  signup: async (email: string, username: string, avatar: string) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, avatar }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');

      localStorage.setItem('lucky_token', data.token);
      set({ user: data.user, token: data.token });
      get().addNotification('Welcome aboard!', '10,000 Free Virtual Coins added to your balance!', 'success');
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  googleLogin: async (email: string, username: string, avatar: string) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, avatar }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google login failed');

      localStorage.setItem('lucky_token', data.token);
      set({ user: data.user, token: data.token });
      get().addNotification('Google Authenticated', `Virtual profile synced successfully.`, 'success');
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('lucky_token');
    set({ user: null, token: null });
    get().addNotification('Signed Out', 'You have been safely signed out.', 'info');
  },

  loadUser: async () => {
    const { token } = get();
    if (!token) return;

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        set({ user: data.user });
        // Fetch reward status too
        const rewardRes = await fetch('/api/rewards/status', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const rewardData = await rewardRes.json();
        if (rewardRes.ok) {
          set({
            dailyRewardClaimed: rewardData.claimed,
            dailyStreak: rewardData.streak,
            dailyChallenges: rewardData.challenges,
          });
        }
      } else {
        // Stale token
        get().logout();
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
    }
  },

  updateProfile: async (username: string, avatar: string) => {
    const { token } = get();
    if (!token) return false;

    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username, avatar }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      set({ user: data.user });
      get().addNotification('Profile Updated', 'Your virtual bio has been locked in.', 'success');
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  forgotPassword: async (email: string) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request reset');
      return data.message;
    } catch (err: any) {
      throw new Error(err.message || 'Reset request failed.');
    }
  },

  fetchGames: async () => {
    try {
      const res = await fetch('/api/games');
      const data = await res.json();
      if (res.ok) {
        set({ games: data.games });
      }
    } catch (err) {
      console.error('Failed to fetch games roster:', err);
    }
  },

  recordPlay: async (gameId: string, betAmount: number, outcome: 'win' | 'lose' | 'push', payout: number) => {
    const { token, user } = get();
    if (!token || !user) return;

    try {
      const res = await fetch('/api/games/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ game_id: gameId, bet_amount: betAmount, outcome, payout }),
      });
      const data = await res.json();
      if (res.ok) {
        set({ user: data.user });

        // Trigger dynamic audio or success notifications
        if (outcome === 'win') {
          get().addNotification(
            'WINNER!',
            `Congrats! You won ${payout} Virtual Coins on ${data.history.game_name}!`,
            'success'
          );
        }

        if (data.leveled_up) {
          get().addNotification(
            'LEVEL UP!',
            `Awesome job! You reached Level ${data.new_level}! Keep grinding.`,
            'success'
          );
        }

        // Re-sync challenges status
        get().loadUser();
      } else {
        get().addNotification('Game Error', data.error || 'Transaction failed', 'warning');
      }
    } catch (err) {
      console.error('Error logging bet outcome:', err);
    }
  },

  claimDailyReward: async () => {
    const { token } = get();
    if (!token) return null;

    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/rewards/claim', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to claim daily bonus');

      set({
        user: data.user,
        dailyRewardClaimed: true,
        dailyStreak: data.user.streak,
      });
      get().addNotification(
        'Daily Bonus Claimed!',
        `Received +${data.reward_amount} Virtual Coins. Current Streak: ${data.user.streak} Days.`,
        'success'
      );
      return data.message;
    } catch (err: any) {
      set({ error: err.message });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  claimChallengeReward: async (challengeId: string) => {
    const { token } = get();
    if (!token) return;

    try {
      const res = await fetch(`/api/challenges/${challengeId}/claim`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        set({
          user: data.user,
          dailyChallenges: data.challenges,
        });
        get().addNotification('Challenge Claimed!', 'Your virtual reward has been credited.', 'success');
      } else {
        get().addNotification('Error', data.error || 'Claim failed', 'warning');
      }
    } catch (err) {
      console.error('Failed to claim challenge reward:', err);
    }
  },

  claimReferralCode: async (code: string) => {
    const { token } = get();
    if (!token) throw new Error('You must be logged in.');

    try {
      const res = await fetch('/api/referral/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Referral code error');

      set({ user: data.user });
      get().addNotification('Referral Claimed', 'Received 2,000 extra free coins!', 'success');
      return data.message;
    } catch (err: any) {
      throw new Error(err.message || 'Claiming referral failed');
    }
  },

  toggleSound: () => {
    const nextVal = !get().soundEnabled;
    localStorage.setItem('lucky_sound', String(nextVal));
    set({ soundEnabled: nextVal });
    get().addNotification(
      'Sound Toggled',
      `Game sound effects are now ${nextVal ? 'ENABLED' : 'MUTED'}.`,
      'info'
    );
  },

  addNotification: (title: string, message: string, type: 'success' | 'info' | 'warning') => {
    const newNotif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      type,
      created_at: new Date().toISOString(),
      read: false,
    };
    set(state => ({
      notifications: [newNotif, ...state.notifications].slice(0, 20), // Cap at 20 logs
    }));
  },

  clearNotification: (id: string) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id),
    }));
  },

  setError: (err: string | null) => set({ error: err }),
}));
