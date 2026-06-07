-- =====================================================
-- Add Language column to Users table
-- Default: 'en' (English)
-- Allowed values: 'en', 'vi'
-- =====================================================

ALTER TABLE [Users]
ADD [Language] NVARCHAR(10) NOT NULL DEFAULT 'en';


--- PostgreSQL --

ALTER TABLE "Users"
ADD COLUMN "Language" VARCHAR(10) NOT NULL DEFAULT 'en';
