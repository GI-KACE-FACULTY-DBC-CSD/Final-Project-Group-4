-- Run this in SQL Server Management Studio (SSMS) to create the database.
-- Connect to your SQL Server instance, then execute:

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'attendance')
BEGIN
    CREATE DATABASE attendance;
END
GO
