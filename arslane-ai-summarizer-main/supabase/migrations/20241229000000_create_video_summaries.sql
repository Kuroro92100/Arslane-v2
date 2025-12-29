-- Create video_summaries table for caching YouTube video summaries
CREATE TABLE IF NOT EXISTS video_summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id VARCHAR(11) NOT NULL,
    url TEXT NOT NULL,
    mode VARCHAR(10) NOT NULL CHECK (mode IN ('quick', 'detailed')),
    summary TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Unique constraint for video_id + mode combination
    CONSTRAINT unique_video_mode UNIQUE (video_id, mode)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_video_summaries_video_id ON video_summaries(video_id);
CREATE INDEX IF NOT EXISTS idx_video_summaries_created_at ON video_summaries(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_video_summaries_updated_at
    BEFORE UPDATE ON video_summaries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (optional but recommended)
ALTER TABLE video_summaries ENABLE ROW LEVEL SECURITY;

-- Policy to allow the service role to read/write
CREATE POLICY "Service role can manage video_summaries"
    ON video_summaries
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE video_summaries IS 'Cache table for YouTube video AI-generated summaries';
COMMENT ON COLUMN video_summaries.video_id IS 'YouTube video ID (11 characters)';
COMMENT ON COLUMN video_summaries.mode IS 'Summary mode: quick or detailed';
COMMENT ON COLUMN video_summaries.summary IS 'AI-generated summary in markdown format';
