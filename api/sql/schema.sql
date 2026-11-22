-- =========================================================
-- SWEETY - BLOOD GLUCOSE TRACKER
-- PostgreSQL database schema
-- Run this script when setting up a NEW database.
-- =========================================================

-- USERS
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT users_name_not_empty
        CHECK (LENGTH(TRIM(name)) > 0),

    CONSTRAINT users_email_not_empty
        CHECK (LENGTH(TRIM(email)) > 0)
);

-- Case-insensitive unique email address
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique
    ON users (LOWER(email));


-- READINGS
CREATE TABLE IF NOT EXISTS readings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    reading_date DATE NOT NULL,
    time_slot VARCHAR NOT NULL,
    glucose_value INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT readings_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT readings_valid_glucose
        CHECK (glucose_value >= 40 AND glucose_value <= 600),

    CONSTRAINT readings_valid_slot
        CHECK (
            time_slot IN (
                'morning',
                'after_breakfast',
                'after_lunch',
                'after_dinner'
            )
        ),

    CONSTRAINT readings_unique_slot_per_day
        UNIQUE (user_id, reading_date, time_slot)
);

-- Supports user-specific date searches and reports
CREATE INDEX IF NOT EXISTS readings_user_date_index
    ON readings (user_id, reading_date);

-- =========================================================
-- END OF SCHEMA
-- =========================================================
