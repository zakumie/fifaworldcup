ALTER TABLE Users ADD Role INT NOT NULL DEFAULT 0;

-- Set existing admin user to Admin role
UPDATE Users SET Role = 1 WHERE Email = 'admin@worldcup2026.com';
