-- ============================================================
-- WorldCup2026 — PostgreSQL Production Schema
-- Converted from SQL Server DeployToProd.sql
-- ============================================================

-- NOTE: "RowVersion" in GroupMembers was SQL Server's [timestamp] (auto-incremented binary).
-- PostgreSQL equivalent: use xmin system column as EF Core concurrency token
-- via .UseXminAsConcurrencyToken() in DbContext configuration.
-- The column is kept as integer for schema compatibility.

-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE "Users" (
    "Id"                     uuid            NOT NULL DEFAULT gen_random_uuid(),
    "Email"                  varchar(256)    NOT NULL,
    "PasswordHash"           varchar(500)    NULL,
    "DisplayName"            varchar(100)    NOT NULL,
    "AvatarUrl"              varchar(500)    NULL,
    "AuthProvider"           integer         NOT NULL DEFAULT 0,
    "ExternalAuthId"         varchar(256)    NULL,
    "RefreshToken"           varchar(500)    NULL,
    "RefreshTokenExpiryTime" timestamptz     NULL,
    "IsActive"               boolean         NOT NULL DEFAULT true,
    "CreatedAt"              timestamptz     NOT NULL DEFAULT now(),
    "UpdatedAt"              timestamptz     NOT NULL DEFAULT now(),
    "DeletedAt"              timestamptz     NULL,
    "Role"                   integer         NOT NULL DEFAULT 0,
    "TimeZone"               varchar(100)    NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    CONSTRAINT "PK_Users" PRIMARY KEY ("Id")
);

CREATE TABLE "Teams" (
    "Id"        uuid            NOT NULL DEFAULT gen_random_uuid(),
    "Name"      varchar(100)    NOT NULL,
    "Code"      varchar(3)      NOT NULL,
    "FlagUrl"   varchar(500)    NULL,
    "GroupName" varchar(5)      NULL,
    "CreatedAt" timestamptz     NOT NULL DEFAULT now(),
    "UpdatedAt" timestamptz     NOT NULL DEFAULT now(),
    "DeletedAt" timestamptz     NULL,
    CONSTRAINT "PK_Teams" PRIMARY KEY ("Id")
);

CREATE TABLE "Groups" (
    "Id"             uuid            NOT NULL DEFAULT gen_random_uuid(),
    "Name"           varchar(200)    NOT NULL,
    "Description"    varchar(500)    NULL,
    "InviteCode"     varchar(20)     NOT NULL,
    "MaxMembers"     integer         NOT NULL DEFAULT 50,
    "DefaultBalance" numeric(18, 2)  NOT NULL DEFAULT 0.00,
    "CreatedById"    uuid            NOT NULL,
    "IsActive"       boolean         NOT NULL DEFAULT true,
    "CreatedAt"      timestamptz     NOT NULL DEFAULT now(),
    "UpdatedAt"      timestamptz     NOT NULL DEFAULT now(),
    "DeletedAt"      timestamptz     NULL,
    "SettlementMode" integer         NOT NULL DEFAULT 0,
    CONSTRAINT "PK_Groups" PRIMARY KEY ("Id")
);

CREATE TABLE "Matches" (
    "Id"              uuid            NOT NULL DEFAULT gen_random_uuid(),
    "ExternalMatchId" integer         NULL,
    "HomeTeamId"      uuid            NOT NULL,
    "AwayTeamId"      uuid            NOT NULL,
    "HomeScore"       integer         NULL,
    "AwayScore"       integer         NULL,
    "MatchDay"        integer         NOT NULL DEFAULT 0,
    "Stage"           varchar(50)     NOT NULL,
    "StartTime"       timestamptz     NOT NULL,
    "Status"          integer         NOT NULL DEFAULT 0,
    "CreatedAt"       timestamptz     NOT NULL DEFAULT now(),
    "UpdatedAt"       timestamptz     NOT NULL DEFAULT now(),
    "DeletedAt"       timestamptz     NULL,
    "Group"           varchar(50)     NULL,
    CONSTRAINT "PK_Matches" PRIMARY KEY ("Id")
);

CREATE TABLE "GroupMembers" (
    "Id"            uuid            NOT NULL DEFAULT gen_random_uuid(),
    "GroupId"       uuid            NOT NULL,
    "UserId"        uuid            NOT NULL,
    "Role"          integer         NOT NULL DEFAULT 0,
    "Balance"       numeric(18, 2)  NOT NULL DEFAULT 0,
    "JoinedAt"      timestamptz     NOT NULL DEFAULT now(),
    "IsActive"      boolean         NOT NULL DEFAULT true,
    "RowVersion"    integer         NOT NULL DEFAULT 0,
    "CreatedAt"     timestamptz     NOT NULL DEFAULT now(),
    "UpdatedAt"     timestamptz     NOT NULL DEFAULT now(),
    "DeletedAt"     timestamptz     NULL,
    "PenaltyAmount" numeric(18, 2)  NOT NULL DEFAULT 0,
    CONSTRAINT "PK_GroupMembers" PRIMARY KEY ("Id")
);

CREATE TABLE "MatchBettingConfigs" (
    "Id"               uuid            NOT NULL DEFAULT gen_random_uuid(),
    "MatchId"          uuid            NOT NULL,
    "GroupId"          uuid            NOT NULL,
    "Handicap"         numeric(5, 2)   NOT NULL DEFAULT 0,
    "FavoredTeamId"    uuid            NULL,
    "Odds"             numeric(5, 2)   NOT NULL DEFAULT 1.00,
    "MinBetAmount"     numeric(18, 2)  NOT NULL DEFAULT 10.00,
    "MaxBetAmount"     numeric(18, 2)  NOT NULL DEFAULT 500.00,
    "DefaultBetAmount" numeric(18, 2)  NULL,
    "IsFixedBet"       boolean         NOT NULL DEFAULT false,
    "BettingOpenTime"  timestamptz     NOT NULL,
    "BettingCloseTime" timestamptz     NOT NULL,
    "IsSettled"        boolean         NOT NULL DEFAULT false,
    "CreatedById"      uuid            NOT NULL,
    "CreatedAt"        timestamptz     NOT NULL DEFAULT now(),
    "UpdatedAt"        timestamptz     NOT NULL DEFAULT now(),
    "DeletedAt"        timestamptz     NULL,
    CONSTRAINT "PK_MatchBettingConfigs" PRIMARY KEY ("Id")
);

CREATE TABLE "Bets" (
    "Id"                   uuid            NOT NULL DEFAULT gen_random_uuid(),
    "UserId"               uuid            NOT NULL,
    "MatchBettingConfigId" uuid            NOT NULL,
    "GroupId"               uuid            NOT NULL,
    "MatchId"              uuid            NOT NULL,
    "SelectedTeamId"       uuid            NULL,
    "BetAmount"            numeric(18, 2)  NOT NULL,
    "Status"               integer         NOT NULL DEFAULT 0,
    "Profit"               numeric(18, 2)  NOT NULL DEFAULT 0,
    "SettledAt"            timestamptz     NULL,
    "CreatedAt"            timestamptz     NOT NULL DEFAULT now(),
    "UpdatedAt"            timestamptz     NOT NULL DEFAULT now(),
    "DeletedAt"            timestamptz     NULL,
    CONSTRAINT "PK_Bets" PRIMARY KEY ("Id")
);

CREATE TABLE "LeaderboardSnapshots" (
    "Id"              uuid            NOT NULL DEFAULT gen_random_uuid(),
    "GroupId"         uuid            NOT NULL,
    "UserId"          uuid            NOT NULL,
    "TotalBets"       integer         NOT NULL DEFAULT 0,
    "TotalWins"       integer         NOT NULL DEFAULT 0,
    "TotalLosses"     integer         NOT NULL DEFAULT 0,
    "TotalWinAmount"  numeric(18, 2)  NOT NULL DEFAULT 0,
    "TotalLossAmount" numeric(18, 2)  NOT NULL DEFAULT 0,
    "NetProfit"       numeric(18, 2)  NOT NULL DEFAULT 0,
    "Rank"            integer         NOT NULL DEFAULT 0,
    "SnapshotDate"    timestamptz     NOT NULL,
    "CreatedAt"       timestamptz     NOT NULL DEFAULT now(),
    "UpdatedAt"       timestamptz     NOT NULL DEFAULT now(),
    "DeletedAt"       timestamptz     NULL,
    CONSTRAINT "PK_LeaderboardSnapshots" PRIMARY KEY ("Id")
);

CREATE TABLE "Transactions" (
    "Id"            uuid            NOT NULL DEFAULT gen_random_uuid(),
    "UserId"        uuid            NOT NULL,
    "GroupId"       uuid            NOT NULL,
    "Type"          integer         NOT NULL,
    "Amount"        numeric(18, 2)  NOT NULL,
    "BalanceBefore" numeric(18, 2)  NOT NULL,
    "BalanceAfter"  numeric(18, 2)  NOT NULL,
    "ReferenceId"   uuid            NULL,
    "Description"   varchar(500)    NULL,
    "CreatedAt"     timestamptz     NOT NULL DEFAULT now(),
    "UpdatedAt"     timestamptz     NOT NULL DEFAULT now(),
    "DeletedAt"     timestamptz     NULL,
    CONSTRAINT "PK_Transactions" PRIMARY KEY ("Id")
);

-- ============================================================
-- Foreign Keys
-- ============================================================

-- Groups
ALTER TABLE "Groups"
    ADD CONSTRAINT "FK_Groups_CreatedBy"
    FOREIGN KEY ("CreatedById") REFERENCES "Users" ("Id");

-- Matches
ALTER TABLE "Matches"
    ADD CONSTRAINT "FK_Matches_HomeTeam"
    FOREIGN KEY ("HomeTeamId") REFERENCES "Teams" ("Id");

ALTER TABLE "Matches"
    ADD CONSTRAINT "FK_Matches_AwayTeam"
    FOREIGN KEY ("AwayTeamId") REFERENCES "Teams" ("Id");

-- GroupMembers
ALTER TABLE "GroupMembers"
    ADD CONSTRAINT "FK_GroupMembers_Group"
    FOREIGN KEY ("GroupId") REFERENCES "Groups" ("Id") ON DELETE CASCADE;

ALTER TABLE "GroupMembers"
    ADD CONSTRAINT "FK_GroupMembers_User"
    FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE;

-- MatchBettingConfigs
ALTER TABLE "MatchBettingConfigs"
    ADD CONSTRAINT "FK_MatchBettingConfigs_Match"
    FOREIGN KEY ("MatchId") REFERENCES "Matches" ("Id") ON DELETE CASCADE;

ALTER TABLE "MatchBettingConfigs"
    ADD CONSTRAINT "FK_MatchBettingConfigs_Group"
    FOREIGN KEY ("GroupId") REFERENCES "Groups" ("Id") ON DELETE CASCADE;

ALTER TABLE "MatchBettingConfigs"
    ADD CONSTRAINT "FK_MatchBettingConfigs_FavoredTeam"
    FOREIGN KEY ("FavoredTeamId") REFERENCES "Teams" ("Id") ON DELETE SET NULL;

ALTER TABLE "MatchBettingConfigs"
    ADD CONSTRAINT "FK_MatchBettingConfigs_CreatedBy"
    FOREIGN KEY ("CreatedById") REFERENCES "Users" ("Id");

-- Bets
ALTER TABLE "Bets"
    ADD CONSTRAINT "FK_Bets_User"
    FOREIGN KEY ("UserId") REFERENCES "Users" ("Id");

ALTER TABLE "Bets"
    ADD CONSTRAINT "FK_Bets_BettingConfig"
    FOREIGN KEY ("MatchBettingConfigId") REFERENCES "MatchBettingConfigs" ("Id");

ALTER TABLE "Bets"
    ADD CONSTRAINT "FK_Bets_Group"
    FOREIGN KEY ("GroupId") REFERENCES "Groups" ("Id");

ALTER TABLE "Bets"
    ADD CONSTRAINT "FK_Bets_Match"
    FOREIGN KEY ("MatchId") REFERENCES "Matches" ("Id");

ALTER TABLE "Bets"
    ADD CONSTRAINT "FK_Bets_SelectedTeam"
    FOREIGN KEY ("SelectedTeamId") REFERENCES "Teams" ("Id");

-- LeaderboardSnapshots
ALTER TABLE "LeaderboardSnapshots"
    ADD CONSTRAINT "FK_LeaderboardSnapshots_Group"
    FOREIGN KEY ("GroupId") REFERENCES "Groups" ("Id") ON DELETE CASCADE;

ALTER TABLE "LeaderboardSnapshots"
    ADD CONSTRAINT "FK_LeaderboardSnapshots_User"
    FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE;

-- Transactions
ALTER TABLE "Transactions"
    ADD CONSTRAINT "FK_Transactions_User"
    FOREIGN KEY ("UserId") REFERENCES "Users" ("Id");

ALTER TABLE "Transactions"
    ADD CONSTRAINT "FK_Transactions_Group"
    FOREIGN KEY ("GroupId") REFERENCES "Groups" ("Id");

-- ============================================================
-- Seed: Default Admin User
-- ============================================================
-- Password is hashed with BCrypt. Generate hash with:
--   dotnet script: BCrypt.Net.BCrypt.HashPassword("YourPassword")
--   online: https://bcrypt-generator.com (cost 11)
-- Replace <BCRYPT_HASH_HERE> with the actual hash before running.

INSERT INTO "Users" ("Id", "Email", "PasswordHash", "DisplayName", "AuthProvider", "IsActive", "Role", "TimeZone")
VALUES (
    gen_random_uuid(),
    'admin@worldcup2026.com',
    '<BCRYPT_HASH_HERE>',
    'Admin',
    0,
    true,
    1,
    'Asia/Ho_Chi_Minh'
)
ON CONFLICT DO NOTHING;
