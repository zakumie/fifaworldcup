-- Add SettlementMode column to Groups table
-- 0 = Normal, 1 = WinnerKeepsLoserPays
ALTER TABLE Groups ADD SettlementMode INT NOT NULL DEFAULT 0;

-- Make Bet.SelectedTeamId nullable (for auto-loss entries where user didn't bet)
ALTER TABLE Bets ALTER COLUMN SelectedTeamId UNIQUEIDENTIFIER NULL;
