-- Add TimeZone column to Users table
-- Stores IANA timezone identifier (e.g. 'Asia/Ho_Chi_Minh', 'America/New_York')
-- All datetime values in DB remain UTC; frontend converts using this field

ALTER TABLE Users
ADD TimeZone NVARCHAR(100) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh';
