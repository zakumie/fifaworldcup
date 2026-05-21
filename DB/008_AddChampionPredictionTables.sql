-- Create ChampionPredictionConfig table
CREATE TABLE IF NOT EXISTS "ChampionPredictionConfigs" (
    "Id" uuid PRIMARY KEY,
    "GroupId" uuid NOT NULL,
    "IsEnabled" boolean NOT NULL DEFAULT false,
    "PredictionOpenTime" timestamp with time zone NOT NULL,
    "PredictionCloseTime" timestamp with time zone NOT NULL,
    "WinnerTeamId" uuid,
    "IsSettled" boolean NOT NULL DEFAULT false,
    "CreatedById" uuid NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "DeletedAt" timestamp with time zone,
    CONSTRAINT "fk_champion_prediction_configs_groups" FOREIGN KEY ("GroupId") REFERENCES "Groups" ("Id") ON DELETE CASCADE,
    CONSTRAINT "fk_champion_prediction_configs_teams" FOREIGN KEY ("WinnerTeamId") REFERENCES "Teams" ("Id") ON DELETE SET NULL,
    CONSTRAINT "fk_champion_prediction_configs_users" FOREIGN KEY ("CreatedById") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

-- Create ChampionPrediction table
CREATE TABLE IF NOT EXISTS "ChampionPredictions" (
    "Id" uuid PRIMARY KEY,
    "UserId" uuid NOT NULL,
    "GroupId" uuid NOT NULL,
    "ConfigId" uuid NOT NULL,
    "SelectedTeamId" uuid NOT NULL,
    "IsCorrect" boolean,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "DeletedAt" timestamp with time zone,
    CONSTRAINT "fk_champion_predictions_users" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE,
    CONSTRAINT "fk_champion_predictions_groups" FOREIGN KEY ("GroupId") REFERENCES "Groups" ("Id") ON DELETE CASCADE,
    CONSTRAINT "fk_champion_predictions_configs" FOREIGN KEY ("ConfigId") REFERENCES "ChampionPredictionConfigs" ("Id") ON DELETE CASCADE,
    CONSTRAINT "fk_champion_predictions_teams" FOREIGN KEY ("SelectedTeamId") REFERENCES "Teams" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "uq_champion_predictions_user_group_config" UNIQUE ("UserId", "GroupId", "ConfigId")
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "ix_champion_prediction_configs_group_id" ON "ChampionPredictionConfigs" ("GroupId");
CREATE INDEX IF NOT EXISTS "ix_champion_prediction_configs_created_by_id" ON "ChampionPredictionConfigs" ("CreatedById");
CREATE INDEX IF NOT EXISTS "ix_champion_prediction_configs_is_settled" ON "ChampionPredictionConfigs" ("IsSettled");
CREATE INDEX IF NOT EXISTS "ix_champion_predictions_user_id" ON "ChampionPredictions" ("UserId");
CREATE INDEX IF NOT EXISTS "ix_champion_predictions_group_id" ON "ChampionPredictions" ("GroupId");
CREATE INDEX IF NOT EXISTS "ix_champion_predictions_config_id" ON "ChampionPredictions" ("ConfigId");
CREATE INDEX IF NOT EXISTS "ix_champion_predictions_selected_team_id" ON "ChampionPredictions" ("SelectedTeamId");
