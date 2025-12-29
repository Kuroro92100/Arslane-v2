-- Add user_id column to video_summaries for user-specific history
ALTER TABLE video_summaries
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for user queries
CREATE INDEX IF NOT EXISTS idx_video_summaries_user_id ON video_summaries(user_id);

-- Drop the old unique constraint and create a new one that includes user_id
ALTER TABLE video_summaries DROP CONSTRAINT IF EXISTS unique_video_mode;

-- New unique constraint: same video+mode can exist for different users (or null for cache)
-- For cached (anonymous) summaries, video_id+mode must be unique
-- For user summaries, user_id+video_id+mode must be unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_video_mode
ON video_summaries (user_id, video_id, mode)
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_cache_video_mode
ON video_summaries (video_id, mode)
WHERE user_id IS NULL;

-- Update RLS policies for user access
DROP POLICY IF EXISTS "Service role can manage video_summaries" ON video_summaries;

-- Users can read their own summaries
CREATE POLICY "Users can view own summaries"
    ON video_summaries
    FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can insert their own summaries
CREATE POLICY "Users can create own summaries"
    ON video_summaries
    FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can delete their own summaries
CREATE POLICY "Users can delete own summaries"
    ON video_summaries
    FOR DELETE
    USING (auth.uid() = user_id);

-- Service role can do everything (for Edge Functions)
CREATE POLICY "Service role full access"
    ON video_summaries
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

COMMENT ON COLUMN video_summaries.user_id IS 'User ID for personal history, NULL for anonymous cache';
