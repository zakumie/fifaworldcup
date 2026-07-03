-- Add LuckyStar support
-- MatchBettingConfig: admin enables lucky star for a match
ALTER TABLE "MatchBettingConfigs" ADD COLUMN IF NOT EXISTS "IsLuckyStar" boolean NOT NULL DEFAULT false;

-- Bets: player opts in to hope star
ALTER TABLE "Bets" ADD COLUMN IF NOT EXISTS "IsLuckyStar" boolean NOT NULL DEFAULT false;
