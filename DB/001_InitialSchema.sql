-- =====================================================
-- World Cup 2026 Prediction Game - Initial Schema
-- Database: SQL Server
-- =====================================================

-- Users
CREATE TABLE [Users] (
    [Id]                     UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    [Email]                  NVARCHAR(256)    NOT NULL,
    [PasswordHash]           NVARCHAR(500)    NULL,
    [DisplayName]            NVARCHAR(100)    NOT NULL,
    [AvatarUrl]              NVARCHAR(500)    NULL,
    [AuthProvider]           INT              NOT NULL DEFAULT 0,
    [ExternalAuthId]         NVARCHAR(256)    NULL,
    [RefreshToken]           NVARCHAR(500)    NULL,
    [RefreshTokenExpiryTime] DATETIME2        NULL,
    [IsActive]               BIT              NOT NULL DEFAULT 1,
    [CreatedAt]              DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [UpdatedAt]              DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [DeletedAt]              DATETIME2        NULL,
    CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
);
CREATE UNIQUE INDEX [IX_Users_Email] ON [Users]([Email]) WHERE [DeletedAt] IS NULL;

-- Teams
CREATE TABLE [Teams] (
    [Id]        UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    [Name]      NVARCHAR(100)    NOT NULL,
    [Code]      NVARCHAR(3)      NOT NULL,
    [FlagUrl]   NVARCHAR(500)    NULL,
    [GroupName] NVARCHAR(5)      NULL,
    [CreatedAt] DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [UpdatedAt] DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [DeletedAt] DATETIME2        NULL,
    CONSTRAINT [PK_Teams] PRIMARY KEY ([Id])
);
CREATE UNIQUE INDEX [IX_Teams_Code] ON [Teams]([Code]) WHERE [DeletedAt] IS NULL;

-- Groups
CREATE TABLE [Groups] (
    [Id]             UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    [Name]           NVARCHAR(200)    NOT NULL,
    [Description]    NVARCHAR(500)    NULL,
    [InviteCode]     NVARCHAR(20)     NOT NULL,
    [MaxMembers]     INT              NOT NULL DEFAULT 50,
    [DefaultBalance] DECIMAL(18,2)    NOT NULL DEFAULT 0.00,
    [CreatedById]    UNIQUEIDENTIFIER NOT NULL,
    [IsActive]       BIT              NOT NULL DEFAULT 1,
    [CreatedAt]      DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [UpdatedAt]      DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [DeletedAt]      DATETIME2        NULL,
    CONSTRAINT [PK_Groups] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Groups_CreatedBy] FOREIGN KEY ([CreatedById]) REFERENCES [Users]([Id]) ON DELETE NO ACTION
);
CREATE UNIQUE INDEX [IX_Groups_InviteCode] ON [Groups]([InviteCode]) WHERE [DeletedAt] IS NULL;

-- GroupMembers
CREATE TABLE [GroupMembers] (
    [Id]         UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    [GroupId]    UNIQUEIDENTIFIER NOT NULL,
    [UserId]     UNIQUEIDENTIFIER NOT NULL,
    [Role]       INT              NOT NULL DEFAULT 0,
    [Balance]    DECIMAL(18,2)    NOT NULL DEFAULT 0,
    [JoinedAt]   DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [IsActive]   BIT              NOT NULL DEFAULT 1,
    [RowVersion] ROWVERSION,
    [CreatedAt]  DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [UpdatedAt]  DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [DeletedAt]  DATETIME2        NULL,
    CONSTRAINT [PK_GroupMembers] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_GroupMembers_Group] FOREIGN KEY ([GroupId]) REFERENCES [Groups]([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_GroupMembers_User] FOREIGN KEY ([UserId]) REFERENCES [Users]([Id]) ON DELETE CASCADE
);
CREATE UNIQUE INDEX [IX_GroupMembers_GroupId_UserId] ON [GroupMembers]([GroupId], [UserId]) WHERE [DeletedAt] IS NULL;

-- Matches
CREATE TABLE [Matches] (
    [Id]              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    [ExternalMatchId] INT              NULL,
    [HomeTeamId]      UNIQUEIDENTIFIER NOT NULL,
    [AwayTeamId]      UNIQUEIDENTIFIER NOT NULL,
    [HomeScore]       INT              NULL,
    [AwayScore]       INT              NULL,
    [MatchDay]        INT              NOT NULL DEFAULT 0,
    [Stage]           NVARCHAR(50)     NOT NULL,
    [StartTime]       DATETIME2        NOT NULL,
    [Status]          INT              NOT NULL DEFAULT 0,
    [CreatedAt]       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [UpdatedAt]       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [DeletedAt]       DATETIME2        NULL,
    CONSTRAINT [PK_Matches] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Matches_HomeTeam] FOREIGN KEY ([HomeTeamId]) REFERENCES [Teams]([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Matches_AwayTeam] FOREIGN KEY ([AwayTeamId]) REFERENCES [Teams]([Id]) ON DELETE NO ACTION
);
CREATE INDEX [IX_Matches_ExternalMatchId] ON [Matches]([ExternalMatchId]);
CREATE INDEX [IX_Matches_StartTime] ON [Matches]([StartTime]);

-- MatchBettingConfigs
CREATE TABLE [MatchBettingConfigs] (
    [Id]               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    [MatchId]          UNIQUEIDENTIFIER NOT NULL,
    [GroupId]          UNIQUEIDENTIFIER NOT NULL,
    [Handicap]         DECIMAL(5,2)     NOT NULL DEFAULT 0,
    [FavoredTeamId]    UNIQUEIDENTIFIER NULL,
    [Odds]             DECIMAL(5,2)     NOT NULL DEFAULT 1.00,
    [MinBetAmount]     DECIMAL(18,2)    NOT NULL DEFAULT 10.00,
    [MaxBetAmount]     DECIMAL(18,2)    NOT NULL DEFAULT 500.00,
    [DefaultBetAmount] DECIMAL(18,2)    NULL,
    [IsFixedBet]       BIT              NOT NULL DEFAULT 0,
    [BettingOpenTime]  DATETIME2        NOT NULL,
    [BettingCloseTime] DATETIME2        NOT NULL,
    [IsSettled]        BIT              NOT NULL DEFAULT 0,
    [CreatedById]      UNIQUEIDENTIFIER NOT NULL,
    [CreatedAt]        DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [UpdatedAt]        DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [DeletedAt]        DATETIME2        NULL,
    CONSTRAINT [PK_MatchBettingConfigs] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_MatchBettingConfigs_Match] FOREIGN KEY ([MatchId]) REFERENCES [Matches]([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_MatchBettingConfigs_Group] FOREIGN KEY ([GroupId]) REFERENCES [Groups]([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_MatchBettingConfigs_FavoredTeam] FOREIGN KEY ([FavoredTeamId]) REFERENCES [Teams]([Id]) ON DELETE SET NULL,
    CONSTRAINT [FK_MatchBettingConfigs_CreatedBy] FOREIGN KEY ([CreatedById]) REFERENCES [Users]([Id]) ON DELETE NO ACTION
);
CREATE UNIQUE INDEX [IX_MatchBettingConfigs_MatchId_GroupId] ON [MatchBettingConfigs]([MatchId], [GroupId]) WHERE [DeletedAt] IS NULL;

-- Bets
CREATE TABLE [Bets] (
    [Id]                   UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    [UserId]               UNIQUEIDENTIFIER NOT NULL,
    [MatchBettingConfigId] UNIQUEIDENTIFIER NOT NULL,
    [GroupId]              UNIQUEIDENTIFIER NOT NULL,
    [MatchId]              UNIQUEIDENTIFIER NOT NULL,
    [SelectedTeamId]       UNIQUEIDENTIFIER NOT NULL,
    [BetAmount]            DECIMAL(18,2)    NOT NULL,
    [Status]               INT              NOT NULL DEFAULT 0,
    [Profit]               DECIMAL(18,2)    NOT NULL DEFAULT 0,
    [SettledAt]            DATETIME2        NULL,
    [CreatedAt]            DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [UpdatedAt]            DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [DeletedAt]            DATETIME2        NULL,
    CONSTRAINT [PK_Bets] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Bets_User] FOREIGN KEY ([UserId]) REFERENCES [Users]([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Bets_BettingConfig] FOREIGN KEY ([MatchBettingConfigId]) REFERENCES [MatchBettingConfigs]([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Bets_Group] FOREIGN KEY ([GroupId]) REFERENCES [Groups]([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Bets_Match] FOREIGN KEY ([MatchId]) REFERENCES [Matches]([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Bets_SelectedTeam] FOREIGN KEY ([SelectedTeamId]) REFERENCES [Teams]([Id]) ON DELETE NO ACTION
);
CREATE UNIQUE INDEX [IX_Bets_UserId_ConfigId] ON [Bets]([UserId], [MatchBettingConfigId]) WHERE [DeletedAt] IS NULL;
CREATE INDEX [IX_Bets_GroupId_MatchId] ON [Bets]([GroupId], [MatchId]);

-- Transactions
CREATE TABLE [Transactions] (
    [Id]            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    [UserId]        UNIQUEIDENTIFIER NOT NULL,
    [GroupId]       UNIQUEIDENTIFIER NOT NULL,
    [Type]          INT              NOT NULL,
    [Amount]        DECIMAL(18,2)    NOT NULL,
    [BalanceBefore] DECIMAL(18,2)    NOT NULL,
    [BalanceAfter]  DECIMAL(18,2)    NOT NULL,
    [ReferenceId]   UNIQUEIDENTIFIER NULL,
    [Description]   NVARCHAR(500)    NULL,
    [CreatedAt]     DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [UpdatedAt]     DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [DeletedAt]     DATETIME2        NULL,
    CONSTRAINT [PK_Transactions] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Transactions_User] FOREIGN KEY ([UserId]) REFERENCES [Users]([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Transactions_Group] FOREIGN KEY ([GroupId]) REFERENCES [Groups]([Id]) ON DELETE NO ACTION
);
CREATE INDEX [IX_Transactions_UserId_GroupId] ON [Transactions]([UserId], [GroupId]);

-- LeaderboardSnapshots
CREATE TABLE [LeaderboardSnapshots] (
    [Id]              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    [GroupId]         UNIQUEIDENTIFIER NOT NULL,
    [UserId]          UNIQUEIDENTIFIER NOT NULL,
    [TotalBets]       INT              NOT NULL DEFAULT 0,
    [TotalWins]       INT              NOT NULL DEFAULT 0,
    [TotalLosses]     INT              NOT NULL DEFAULT 0,
    [TotalWinAmount]  DECIMAL(18,2)    NOT NULL DEFAULT 0,
    [TotalLossAmount] DECIMAL(18,2)    NOT NULL DEFAULT 0,
    [NetProfit]       DECIMAL(18,2)    NOT NULL DEFAULT 0,
    [Rank]            INT              NOT NULL DEFAULT 0,
    [SnapshotDate]    DATETIME2        NOT NULL,
    [CreatedAt]       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [UpdatedAt]       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [DeletedAt]       DATETIME2        NULL,
    CONSTRAINT [PK_LeaderboardSnapshots] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_LeaderboardSnapshots_Group] FOREIGN KEY ([GroupId]) REFERENCES [Groups]([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_LeaderboardSnapshots_User] FOREIGN KEY ([UserId]) REFERENCES [Users]([Id]) ON DELETE CASCADE
);
CREATE INDEX [IX_LeaderboardSnapshots_GroupId_Date] ON [LeaderboardSnapshots]([GroupId], [SnapshotDate]);
