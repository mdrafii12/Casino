/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  email: string;
  username: string;
  avatar: string; // Avatar icon/name
  virtual_balance: number;
  xp: number;
  level: number;
  streak: number;
  last_claim_date: string | null;
  created_at: string;
  is_admin?: boolean;
}

export interface Game {
  id: string;
  name: string;
  category: 'slots' | 'roulette' | 'blackjack' | 'dice' | 'coinflip' | 'wheel' | 'scratch';
  image: string;
  description: string;
  active: boolean;
  min_bet: number;
  max_bet: number;
}

export interface GameHistory {
  id: string;
  user_id: string;
  username: string;
  game_id: string;
  game_name: string;
  bet_amount: number;
  result: 'win' | 'lose' | 'push';
  payout: number;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  username: string;
  avatar: string;
  total_winnings: number;
  level: number;
  rank?: number;
}

export interface DailyReward {
  id: string;
  user_id: string;
  claimed_at: string;
  reward_amount: number;
  streak_day: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  reward_coins: number;
  unlocked_at?: string; // If unlocked
  metric_required: number;
  metric_name: 'wins' | 'single_win' | 'streak' | 'balance' | 'plays';
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  reward_coins: number;
  claimed: boolean;
  type: 'play_games' | 'win_coins' | 'hit_blackjack' | 'scratch_cards';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  created_at: string;
  read: boolean;
}
