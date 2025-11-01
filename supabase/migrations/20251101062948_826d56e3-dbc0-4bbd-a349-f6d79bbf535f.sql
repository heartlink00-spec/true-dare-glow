-- Create rooms table for game sessions
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT UNIQUE NOT NULL,
  mode TEXT CHECK (mode IN ('friendly', 'crush', 'adult')),
  player1_id TEXT,
  player2_id TEXT,
  current_turn TEXT, -- player1 or player2
  current_question_type TEXT, -- truth or dare
  current_question TEXT,
  question_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can create a room
CREATE POLICY "Anyone can create rooms"
  ON public.rooms
  FOR INSERT
  WITH CHECK (true);

-- Policy: Anyone can read rooms they're part of
CREATE POLICY "Players can view their rooms"
  ON public.rooms
  FOR SELECT
  USING (true);

-- Policy: Players can update rooms they're part of
CREATE POLICY "Players can update their rooms"
  ON public.rooms
  FOR UPDATE
  USING (true);

-- Enable realtime for rooms
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION public.update_room_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_room_updated_at();