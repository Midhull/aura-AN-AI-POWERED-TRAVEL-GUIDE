-- Migration: pgvector AI Memory Schema
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.travel_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(uid) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- 1536 dimensions for text-embedding-3-small or Gemini text-embedding-004
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on travel_memories
ALTER TABLE public.travel_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own memories" ON public.travel_memories FOR ALL USING (auth.uid() = user_id);

-- Create RPC semantic search function
CREATE OR REPLACE FUNCTION match_memories (
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  filter_user_id UUID
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    travel_memories.id,
    travel_memories.content,
    travel_memories.metadata,
    1 - (travel_memories.embedding <=> query_embedding) AS similarity
  FROM public.travel_memories
  WHERE travel_memories.user_id = filter_user_id
    AND 1 - (travel_memories.embedding <=> query_embedding) > match_threshold
  ORDER BY travel_memories.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
