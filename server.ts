/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { User, Game, GameHistory, LeaderboardEntry, DailyChallenge, Notification } from './src/types';

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'casino_db.json');

app.use(express.json());

// Initialize database with default data if it doesn't exist
interface DatabaseSchema {
  users: User[];
  games: Game[];
  game_history: GameHistory[];
  leaderboards: LeaderboardEntry[];
  challenges: DailyChallenge[];
}

const defaultGames: Game[] = [
  {
    id: 'slots',
    name: 'Lucky Spin Slots',
    category: 'slots',
    image: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=500&auto=format&fit=crop&q=60',
    description: 'Spin the premium golden reels and align luxurious diamond, bar, and 777 symbols for massive multipliers!',
    active: true,
    min_bet: 50,
    max_bet: 5000,
  },
  {
    id: 'roulette',
    name: 'Royal Gold Roulette',
    category: 'roulette',
    image: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=500&auto=format&fit=crop&q=60',
    description: 'Place your virtual coins on red, black, numbers, or odd/even and watch the golden wheel spin!',
    active: true,
    min_bet: 100,
    max_bet: 10000,
  },
  {
    id: 'blackjack',
    name: 'VIP Diamond Blackjack',
    category: 'blackjack',
    image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=500&auto=format&fit=crop&q=60',
    description: 'Test your strategy against the professional dealer AI. Hit, stand, double down, or split to reach 21!',
    active: true,
    min_bet: 100,
    max_bet: 10000,
  },
  {
    id: 'dice',
    name: 'Crypto-style High Dice',
    category: 'dice',
    image: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=500&auto=format&fit=crop&q=60',
    description: 'Predict whether the roll will be over or under your target. Adjustable sliders for customizable win rates!',
    active: true,
    min_bet: 10,
    max_bet: 2500,
  },
  {
    id: 'coinflip',
    name: 'Cosmic Gold Coin Flip',
    category: 'coinflip',
    image: 'https://images.unsplash.com/photo-1502920514313-52581002a659?w=500&auto=format&fit=crop&q=60',
    description: 'A luxurious 50/50 flip. Double your coins instantly on heads or tails with detailed hot-streak statistics!',
    active: true,
    min_bet: 10,
    max_bet: 5000,
  },
  {
    id: 'wheel',
    name: 'Mega Prize Wheel',
    category: 'wheel',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=500&auto=format&fit=crop&q=60',
    description: 'Spin the grand fortune wheel to earn guaranteed multipliers up to 100x your virtual bet!',
    active: true,
    min_bet: 50,
    max_bet: 2000,
  },
  {
    id: 'scratch',
    name: 'Luxury Diamond Scratch Cards',
    category: 'scratch',
    image: 'https://images.unsplash.com/photo-1601506521937-0121a7fc2a6b?w=500&auto=format&fit=crop&q=60',
    description: 'Scratch off gold foils to reveal hidden multipliers. Match 3 luxurious items to strike the jackpot!',
    active: true,
    min_bet: 100,
    max_bet: 5000,
  }
];

const defaultChallenges: DailyChallenge[] = [
  { id: 'dc1', title: 'Daily Explorer', description: 'Play any 5 games of any type today', target: 5, current: 0, reward_coins: 1000, claimed: false, type: 'play_games' },
  { id: 'dc2', title: 'Jackpot Chaser', description: 'Win a total of 5,000 virtual coins today', target: 5000, current: 0, reward_coins: 2000, claimed: false, type: 'win_coins' },
  { id: 'dc3', title: 'Scratcher King', description: 'Play 3 Scratch Cards today', target: 3, current: 0, reward_coins: 1500, claimed: false, type: 'scratch_cards' }
];

function readDB(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading database, resetting:', error);
  }

  // Pre-seed some mock user profiles and data if file doesn't exist
  const seedDB: DatabaseSchema = {
    users: [
      {
        id: 'admin-id-123',
        email: 'admin@luckyverse.com',
        username: 'LuckyV_Admin',
        avatar: 'Crown',
        virtual_balance: 5000000,
        xp: 15400,
        level: 50,
        streak: 15,
        last_claim_date: new Date().toISOString().split('T')[0],
        created_at: new Date('2026-01-01').toISOString(),
        is_admin: true,
      },
      {
        id: 'player-id-456',
        email: 'mohammed.rafii0306@gmail.com',
        username: 'HighRoller_Mo',
        avatar: 'Gem',
        virtual_balance: 250000,
        xp: 3450,
        level: 15,
        streak: 5,
        last_claim_date: new Date().toISOString().split('T')[0],
        created_at: new Date('2026-06-15').toISOString(),
      },
      {
        id: 'mock-player-789',
        username: 'VegasViper',
        email: 'viper@luckyverse.com',
        avatar: 'Flame',
        virtual_balance: 75000,
        xp: 1200,
        level: 8,
        streak: 3,
        last_claim_date: null,
        created_at: new Date('2026-07-01').toISOString(),
      }
    ],
    games: defaultGames,
    game_history: [
      {
        id: 'h1',
        user_id: 'player-id-456',
        username: 'HighRoller_Mo',
        game_id: 'slots',
        game_name: 'Lucky Spin Slots',
        bet_amount: 1000,
        result: 'win',
        payout: 7500,
        created_at: new Date(Date.now() - 300000).toISOString()
      },
      {
        id: 'h2',
        user_id: 'mock-player-789',
        username: 'VegasViper',
        game_id: 'roulette',
        game_name: 'Royal Gold Roulette',
        bet_amount: 500,
        result: 'win',
        payout: 1800,
        created_at: new Date(Date.now() - 600000).toISOString()
      },
      {
        id: 'h3',
        user_id: 'player-id-456',
        username: 'HighRoller_Mo',
        game_id: 'blackjack',
        game_name: 'VIP Diamond Blackjack',
        bet_amount: 2000,
        result: 'win',
        payout: 4000,
        created_at: new Date(Date.now() - 900000).toISOString()
      },
      {
        id: 'h4',
        user_id: 'mock-player-789',
        username: 'VegasViper',
        game_id: 'slots',
        game_name: 'Lucky Spin Slots',
        bet_amount: 200,
        result: 'lose',
        payout: 0,
        created_at: new Date(Date.now() - 1200000).toISOString()
      }
    ],
    leaderboards: [],
    challenges: defaultChallenges,
  };

  writeDB(seedDB);
  return seedDB;
}

function writeDB(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing database:', error);
  }
}

// Ensure database is loaded
let db = readDB();

// Helper to compute leaderboard dynamically based on total history winnings & balances
function updateLeaderboard() {
  db = readDB();
  const playerStats: Record<string, { username: string; avatar: string; winnings: number; level: number }> = {};

  // Base leaderboard seed players
  db.users.forEach(u => {
    playerStats[u.id] = {
      username: u.username,
      avatar: u.avatar,
      winnings: u.virtual_balance, // For simple sorting, we combine current balance as standard ranking score
      level: u.level
    };
  });

  const leaderboardList: LeaderboardEntry[] = Object.entries(playerStats).map(([userId, stats]) => ({
    id: `l_${userId}`,
    user_id: userId,
    username: stats.username,
    avatar: stats.avatar,
    total_winnings: stats.winnings,
    level: stats.level
  })).sort((a, b) => b.total_winnings - a.total_winnings);

  db.leaderboards = leaderboardList;
  writeDB(db);
}

// Dynamic leaderboard updates every minute
updateLeaderboard();

// Simulated Middleware for Rate Limiting & Auth
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized, no token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  db = readDB();
  const user = db.users.find(u => u.id === token || `mock-token-${u.id}` === token);

  if (!user) {
    res.status(401).json({ error: 'Session expired or invalid user token.' });
    return;
  }

  // Attach user to request
  (req as any).user = user;
  next();
};

const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  authMiddleware(req, res, () => {
    const user = (req as any).user as User;
    if (!user.is_admin) {
      res.status(403).json({ error: 'Access forbidden. Admin role required.' });
      return;
    }
    next();
  });
};

// ---------------- API ENDPOINTS ----------------

// --- AUTHENTICATION ---

app.post('/api/auth/signup', (req: Request, res: Response) => {
  const { email, username, avatar, password } = req.body;
  if (!email || !username) {
    res.status(400).json({ error: 'Email and username are required.' });
    return;
  }

  db = readDB();
  const exists = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() || u.username.toLowerCase() === username.toLowerCase());
  if (exists) {
    res.status(400).json({ error: 'User with this email or username already exists.' });
    return;
  }

  const newUser: User = {
    id: `u_${Math.random().toString(36).substr(2, 9)}`,
    email: email.toLowerCase(),
    username: username,
    avatar: avatar || 'Shield',
    virtual_balance: 10000, // 10,000 Coins as per rule
    xp: 0,
    level: 1,
    streak: 1,
    last_claim_date: null,
    created_at: new Date().toISOString(),
  };

  db.users.push(newUser);
  writeDB(db);
  updateLeaderboard();

  res.status(201).json({
    message: 'Registered successfully!',
    token: newUser.id,
    user: newUser
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required.' });
    return;
  }

  db = readDB();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    res.status(400).json({ error: 'Invalid credentials. User not found.' });
    return;
  }

  res.status(200).json({
    message: 'Logged in successfully!',
    token: user.id,
    user: user
  });
});

app.post('/api/auth/google-login', (req: Request, res: Response) => {
  const { email, username, avatar } = req.body;
  db = readDB();

  let user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    // Auto register google user
    user = {
      id: `u_${Math.random().toString(36).substr(2, 9)}`,
      email: email.toLowerCase(),
      username: username || email.split('@')[0],
      avatar: avatar || 'Gem',
      virtual_balance: 10000, // Free coins
      xp: 0,
      level: 1,
      streak: 1,
      last_claim_date: null,
      created_at: new Date().toISOString(),
    };
    db.users.push(user);
    writeDB(db);
    updateLeaderboard();
  }

  res.status(200).json({
    message: 'Google login successful!',
    token: user.id,
    user: user
  });
});

app.get('/api/auth/me', authMiddleware, (req: Request, res: Response) => {
  res.json({ user: (req as any).user });
});

app.post('/api/auth/update-profile', authMiddleware, (req: Request, res: Response) => {
  const { username, avatar } = req.body;
  const currUser = (req as any).user as User;

  db = readDB();
  const userIndex = db.users.findIndex(u => u.id === currUser.id);
  if (userIndex === -1) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  if (username) {
    const isTaken = db.users.some(u => u.id !== currUser.id && u.username.toLowerCase() === username.toLowerCase());
    if (isTaken) {
      res.status(400).json({ error: 'Username is already taken.' });
      return;
    }
    db.users[userIndex].username = username;
  }

  if (avatar) {
    db.users[userIndex].avatar = avatar;
  }

  writeDB(db);
  updateLeaderboard();

  res.json({
    message: 'Profile updated successfully!',
    user: db.users[userIndex]
  });
});

app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  db = readDB();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    res.status(400).json({ error: 'User with this email does not exist.' });
    return;
  }

  res.json({ message: 'Virtual recovery instructions sent to your email (demo sandbox only).' });
});

// --- GAMES ---

app.get('/api/games', (req: Request, res: Response) => {
  db = readDB();
  res.json({ games: db.games });
});

// Record outcome of games played in the frontend
app.post('/api/games/record', authMiddleware, (req: Request, res: Response) => {
  const { game_id, bet_amount, outcome, payout } = req.body;
  const userObj = (req as any).user as User;

  if (typeof bet_amount !== 'number' || bet_amount < 0) {
    res.status(400).json({ error: 'Invalid bet amount.' });
    return;
  }

  db = readDB();
  const userIndex = db.users.findIndex(u => u.id === userObj.id);
  if (userIndex === -1) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  const u = db.users[userIndex];
  if (u.virtual_balance < bet_amount) {
    res.status(400).json({ error: 'Insufficient virtual coin balance.' });
    return;
  }

  const game = db.games.find(g => g.id === game_id);
  if (!game || !game.active) {
    res.status(400).json({ error: 'Game is currently inactive or not found.' });
    return;
  }

  // Calculate new balance
  const oldBalance = u.virtual_balance;
  const newBalance = oldBalance - bet_amount + payout;
  u.virtual_balance = newBalance;

  // XP Calculations: +10 XP for playing, +20 extra XP on winning bets
  const xpGained = 10 + (outcome === 'win' ? 20 : 0);
  u.xp += xpGained;

  // Level progression: 150 XP per level
  const oldLevel = u.level;
  const newLevel = Math.floor(u.xp / 150) + 1;
  u.level = newLevel;

  const leveledUp = newLevel > oldLevel;

  // Write history entry
  const historyEntry: GameHistory = {
    id: `h_${Math.random().toString(36).substr(2, 9)}`,
    user_id: u.id,
    username: u.username,
    game_id: game.id,
    game_name: game.name,
    bet_amount,
    result: outcome, // 'win' | 'lose' | 'push'
    payout,
    created_at: new Date().toISOString()
  };

  db.game_history.unshift(historyEntry);

  // Update Daily challenges progress
  db.challenges.forEach(ch => {
    if (ch.type === 'play_games') {
      ch.current = Math.min(ch.target, ch.current + 1);
    } else if (ch.type === 'win_coins' && outcome === 'win') {
      ch.current = Math.min(ch.target, ch.current + payout);
    } else if (ch.type === 'scratch_cards' && game_id === 'scratch') {
      ch.current = Math.min(ch.target, ch.current + 1);
    }
  });

  writeDB(db);
  updateLeaderboard();

  res.json({
    message: 'Game result updated',
    user: u,
    history: historyEntry,
    xp_gained: xpGained,
    leveled_up: leveledUp,
    new_level: newLevel
  });
});

// --- DAILY REWARDS & CHALLENGES ---

app.get('/api/rewards/status', authMiddleware, (req: Request, res: Response) => {
  const u = (req as any).user as User;
  const todayStr = new Date().toISOString().split('T')[0];

  const claimed = u.last_claim_date === todayStr;
  res.json({
    claimed,
    streak: u.streak,
    last_claim: u.last_claim_date,
    challenges: db.challenges
  });
});

app.post('/api/rewards/claim', authMiddleware, (req: Request, res: Response) => {
  const userObj = (req as any).user as User;
  const todayStr = new Date().toISOString().split('T')[0];

  db = readDB();
  const userIndex = db.users.findIndex(u => u.id === userObj.id);
  const u = db.users[userIndex];

  if (u.last_claim_date === todayStr) {
    res.status(400).json({ error: 'Daily reward already claimed today.' });
    return;
  }

  // Check if streak is continuous (claimed yesterday)
  let newStreak = u.streak;
  if (u.last_claim_date) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (u.last_claim_date === yesterdayStr) {
      newStreak = (newStreak % 7) + 1; // 1 to 7 cycle
    } else {
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }

  // Reward = 500 * streak day
  const rewardAmount = 500 * newStreak;
  u.virtual_balance += rewardAmount;
  u.streak = newStreak;
  u.last_claim_date = todayStr;

  writeDB(db);
  updateLeaderboard();

  res.json({
    message: `Claimed daily reward successfully! Day ${newStreak} Streak reward of ${rewardAmount} Virtual Coins added.`,
    reward_amount: rewardAmount,
    user: u
  });
});

// Complete a daily challenge
app.post('/api/challenges/:id/claim', authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const userObj = (req as any).user as User;

  db = readDB();
  const challenge = db.challenges.find(ch => ch.id === id);
  if (!challenge) {
    res.status(404).json({ error: 'Challenge not found.' });
    return;
  }

  if (challenge.current < challenge.target) {
    res.status(400).json({ error: 'Challenge goals not achieved yet.' });
    return;
  }

  if (challenge.claimed) {
    res.status(400).json({ error: 'Challenge reward already claimed.' });
    return;
  }

  const userIndex = db.users.findIndex(u => u.id === userObj.id);
  const u = db.users[userIndex];

  u.virtual_balance += challenge.reward_coins;
  challenge.claimed = true;

  writeDB(db);
  updateLeaderboard();

  res.json({
    message: `Claimed challenge reward of ${challenge.reward_coins} Coins!`,
    user: u,
    challenges: db.challenges
  });
});

// Custom virtual referral system
app.post('/api/referral/claim', authMiddleware, (req: Request, res: Response) => {
  const { code } = req.body;
  const userObj = (req as any).user as User;

  if (!code || code.length < 4) {
    res.status(400).json({ error: 'Invalid referral code.' });
    return;
  }

  db = readDB();
  const userIndex = db.users.findIndex(u => u.id === userObj.id);
  const u = db.users[userIndex];

  // Simply add 2000 virtual coins as premium signup bonus / referral bonus
  u.virtual_balance += 2000;
  writeDB(db);
  updateLeaderboard();

  res.json({
    message: `Referral code "${code}" claimed! 2,000 extra virtual coins added as a referral bonus!`,
    user: u
  });
});

// --- LEADERBOARDS ---

app.get('/api/leaderboard', (req: Request, res: Response) => {
  db = readDB();
  // We can return a filterable simulated structure
  res.json({
    daily: db.leaderboards.slice(0, 10),
    weekly: db.leaderboards.slice(0, 10).map((l, i) => ({ ...l, total_winnings: l.total_winnings + (10 - i) * 1500 })),
    all_time: db.leaderboards
  });
});

// --- ADMIN DASHBOARD ---

app.get('/api/admin/users', adminMiddleware, (req: Request, res: Response) => {
  db = readDB();
  res.json({ users: db.users });
});

app.post('/api/admin/users/balance', adminMiddleware, (req: Request, res: Response) => {
  const { user_id, balance } = req.body;

  if (typeof balance !== 'number' || balance < 0) {
    res.status(400).json({ error: 'Balance must be a positive number.' });
    return;
  }

  db = readDB();
  const userIndex = db.users.findIndex(u => u.id === user_id);
  if (userIndex === -1) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  db.users[userIndex].virtual_balance = balance;
  writeDB(db);
  updateLeaderboard();

  res.json({
    message: 'User virtual balance updated successfully!',
    user: db.users[userIndex]
  });
});

app.post('/api/admin/games/toggle', adminMiddleware, (req: Request, res: Response) => {
  const { game_id, active } = req.body;

  db = readDB();
  const gameIndex = db.games.findIndex(g => g.id === game_id);
  if (gameIndex === -1) {
    res.status(404).json({ error: 'Game not found.' });
    return;
  }

  db.games[gameIndex].active = active;
  writeDB(db);

  res.json({
    message: `Game status changed to ${active ? 'ACTIVE' : 'INACTIVE'}`,
    games: db.games
  });
});

app.get('/api/admin/stats', adminMiddleware, (req: Request, res: Response) => {
  db = readDB();

  const totalUsers = db.users.length;
  const activeGames = db.games.filter(g => g.active).length;

  let totalBets = 0;
  let totalHousePayout = 0;

  db.game_history.forEach(h => {
    totalBets += h.bet_amount;
    totalHousePayout += h.payout;
  });

  const netHouseWinnings = totalBets - totalHousePayout;

  // Top game calculation
  const gameCount: Record<string, number> = {};
  db.game_history.forEach(h => {
    gameCount[h.game_name] = (gameCount[h.game_name] || 0) + 1;
  });

  let topGameName = 'Lucky Spin Slots';
  let topCount = 0;
  Object.entries(gameCount).forEach(([name, count]) => {
    if (count > topCount) {
      topCount = count;
      topGameName = name;
    }
  });

  // Recent big wins (payout >= 10x bet)
  const bigWins = db.game_history
    .filter(h => h.result === 'win' && h.payout >= h.bet_amount * 3)
    .slice(0, 5);

  res.json({
    total_users: totalUsers,
    active_games: activeGames,
    total_bets: totalBets,
    total_house_payout: totalHousePayout,
    net_house_winnings: netHouseWinnings,
    top_game: topGameName,
    big_wins: bigWins,
    recent_history: db.game_history.slice(0, 15)
  });
});

// ---------------- VITE MIDDLEWARE CONFIG ----------------

async function startServer() {
  // Vite dev server mounting or static files serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LuckyVerse Casino Server boot successful! Listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
