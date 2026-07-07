-- Supabase Production Schema & Seed Migration Script
-- Platform: LuckyVerse Casino (Entertainment Only)

-- 1. Create CUSTOM USERS Table
CREATE TABLE public.users (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    avatar TEXT DEFAULT 'Shield',
    virtual_balance BIGINT DEFAULT 10000 CHECK (virtual_balance >= 0),
    xp INTEGER DEFAULT 0 CHECK (xp >= 0),
    level INTEGER DEFAULT 1 CHECK (level >= 1),
    streak INTEGER DEFAULT 1 CHECK (streak >= 0),
    last_claim_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_admin BOOLEAN DEFAULT false
);

-- 2. Create GAMES Catalog
CREATE TABLE public.games (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('slots', 'roulette', 'blackjack', 'dice', 'coinflip', 'wheel', 'scratch')),
    image TEXT NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    min_bet INTEGER DEFAULT 10,
    max_bet INTEGER DEFAULT 10000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create GAME HISTORIES Logs
CREATE TABLE public.game_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    game_id TEXT REFERENCES public.games(id) NOT NULL,
    bet_amount BIGINT NOT NULL CHECK (bet_amount >= 0),
    result TEXT NOT NULL CHECK (result IN ('win', 'lose', 'push')),
    payout BIGINT NOT NULL CHECK (payout >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create LEADERBOARD Ranks (Materialized or Computed view)
CREATE TABLE public.leaderboard (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    total_winnings BIGINT DEFAULT 0,
    rank INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create DAILY REWARDS Claim Logs
CREATE TABLE public.daily_rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    claimed_at DATE DEFAULT CURRENT_DATE NOT NULL,
    reward_amount INTEGER NOT NULL,
    streak_day INTEGER NOT NULL
);


-- ---------------- SECURITY POLICIES (Row-Level Security) ----------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;

-- Users policies: profiles are readable by authenticated users, but writable only by the profile owner
CREATE POLICY "Public profiles are viewable by anyone." ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profiles." ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Games policies: anyone can read active games, only administrators write games
CREATE POLICY "Anyone can browse active games." ON public.games
    FOR SELECT USING (active = true);

-- History policies: players can see only their own history logs
CREATE POLICY "Users can view their own game history logs." ON public.game_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game outcome log." ON public.game_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ---------------- AUTOMATED TRIGGERS (Auth sync) ----------------

-- Automatically insert a new user profile on auth signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, username, avatar, virtual_balance)
    VALUES (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
        coalesce(new.raw_user_meta_data->>'avatar', 'Shield'),
        10000 -- Free Welcome coins!
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ---------------- SEED DATA ----------------

INSERT INTO public.games (id, name, category, image, description, active, min_bet, max_bet) VALUES
('slots', 'Lucky Spin Slots', 'slots', 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=500', 'Spin golden reels and align luxury symbols for huge multiplier payouts!', true, 50, 5000),
('roulette', 'Royal Gold Roulette', 'roulette', 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=500', 'Place virtual chips on red, black, even/odd, or target numbers!', true, 100, 10000),
('blackjack', 'VIP Diamond Blackjack', 'blackjack', 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=500', 'Play double down or hit split strategies against the professional dealer AI!', true, 100, 10000),
('dice', 'Crypto-style High Dice', 'dice', 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=500', 'Adjust sliders to set probability levels and roll under/over goals!', true, 10, 2500),
('coinflip', 'Cosmic Gold Coin Flip', 'coinflip', 'https://images.unsplash.com/photo-1502920514313-52581002a659?w=500', 'A classic high-fidelity 50/50 toss designed with virtual coin streaks.', true, 10, 5000),
('wheel', 'Mega Prize Wheel', 'wheel', 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=500', 'Spin the fortune wheel for guaranteed payouts up to 20x multipliers!', true, 50, 2000),
('scratch', 'Luxury Diamond Scratch Cards', 'scratch', 'https://images.unsplash.com/photo-1601506521937-0121a7fc2a6b?w=500', 'Scratch virtual gold foils to uncover 3 identical multiplier symbols!', true, 100, 5000);
