-- ============================================================
-- Room Codes: 4-digit codes for quick-join sessions
-- ============================================================

ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS room_code VARCHAR(6);
CREATE UNIQUE INDEX IF NOT EXISTS idx_game_sessions_room_code ON game_sessions(room_code) WHERE room_code IS NOT NULL AND status = 'active';

-- Function to generate unique room code
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists BOOLEAN;
BEGIN
    LOOP
        code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
        SELECT EXISTS(SELECT 1 FROM game_sessions WHERE room_code = code AND status = 'active') INTO exists;
        IF NOT exists THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
