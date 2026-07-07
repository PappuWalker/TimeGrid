-- Run this in Supabase Dashboard > SQL Editor

ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS hourly_rate numeric(10,4) DEFAULT 0;

CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    hourly_rate numeric(10,4) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can view own settings') THEN
        CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can insert own settings') THEN
        CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can update own settings') THEN
        CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS week_paid (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_ending_date DATE NOT NULL,
    paid_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, week_ending_date)
);

ALTER TABLE week_paid ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'week_paid' AND policyname = 'Users can view own paid weeks') THEN
        CREATE POLICY "Users can view own paid weeks" ON week_paid FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'week_paid' AND policyname = 'Users can insert own paid weeks') THEN
        CREATE POLICY "Users can insert own paid weeks" ON week_paid FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'week_paid' AND policyname = 'Users can delete own paid weeks') THEN
        CREATE POLICY "Users can delete own paid weeks" ON week_paid FOR DELETE USING (auth.uid() = user_id);
    END IF;
END;
$$;
