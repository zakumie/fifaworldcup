-- Add Group column to Matches table
ALTER TABLE [Matches] ADD [Group] NVARCHAR(50) NULL;
CREATE INDEX [IX_Matches_Group] ON [Matches]([Group]);
