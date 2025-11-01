/*
  # Create Game Rooms Schema
  
  1. New Tables
    - `rooms`
      - `id` (uuid, primary key)
      - `room_code` (text, unique) - 6-character room identifier
      - `mode` (text) - game mode: friendly, crush, or adult
      - `player1_id` (text) - first player identifier
      - `player2_id` (text) - second player identifier
      - `is_player1_turn` (boolean) - tracks whose turn it is
      - `is_spinning` (boolean) - prevents multiple simultaneous spins
      - `waiting_for_answer` (boolean) - locks turn until answer is submitted
      - `current_question` (text) - current active question
      - `current_question_type` (text) - truth or dare
      - `question_history` (jsonb) - array of past questions with answers
      - `last_activity` (timestamptz) - for cleanup of inactive rooms
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `rooms` table
    - Add policies for anonymous users to create, read, and update rooms
    - Ensure data safety with check constraints
    
  3. Functions
    - join_room_as_player_1: Atomically join as player 1
    - join_room_as_player_2: Atomically join as player 2
    - cleanup_inactive_rooms: Remove old rooms (24+ hours)
*/

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text UNIQUE NOT NULL,
  mode text CHECK (mode IN ('friendly', 'crush', 'adult')),
  player1_id text,
  player2_id text,
  is_player1_turn boolean DEFAULT true NOT NULL,
  is_spinning boolean DEFAULT false NOT NULL,
  waiting_for_answer boolean DEFAULT false NOT NULL,
  current_question text,
  current_question_type text CHECK (current_question_type IN ('truth', 'dare')),
  question_history jsonb DEFAULT '[]'::jsonb NOT NULL,
  last_activity timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT different_players_check CHECK (
    player1_id IS NULL OR 
    player2_id IS NULL OR 
    player1_id != player2_id
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS rooms_room_code_idx ON rooms(room_code);
CREATE INDEX IF NOT EXISTS rooms_player1_id_idx ON rooms(player1_id);
CREATE INDEX IF NOT EXISTS rooms_player2_id_idx ON rooms(player2_id);
CREATE INDEX IF NOT EXISTS rooms_last_activity_idx ON rooms(last_activity);

-- Enable Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can create rooms"
  ON rooms
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read rooms"
  ON rooms
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update rooms"
  ON rooms
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Function to automatically update updated_at and last_activity
CREATE OR REPLACE FUNCTION update_room_timestamps()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_activity = now();
  RETURN NEW;
END;
$$;

-- Trigger to update timestamps
CREATE TRIGGER update_room_timestamps_trigger
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_room_timestamps();

-- Function to join room as player 1 (atomic operation)
CREATE OR REPLACE FUNCTION join_room_as_player_1(p_room_code text, p_player_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rows_updated integer;
BEGIN
  UPDATE rooms
  SET player1_id = p_player_id
  WHERE 
    room_code = p_room_code
    AND player1_id IS NULL
    AND (player2_id IS NULL OR player2_id != p_player_id);
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$;

-- Function to join room as player 2 (atomic operation)
CREATE OR REPLACE FUNCTION join_room_as_player_2(p_room_code text, p_player_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rows_updated integer;
BEGIN
  UPDATE rooms
  SET player2_id = p_player_id
  WHERE 
    room_code = p_room_code
    AND player2_id IS NULL
    AND player1_id IS NOT NULL
    AND player1_id != p_player_id;
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$;

-- Function to cleanup inactive rooms (call periodically)
CREATE OR REPLACE FUNCTION cleanup_inactive_rooms()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM rooms
  WHERE last_activity < now() - interval '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION join_room_as_player_1 TO anon, authenticated;
GRANT EXECUTE ON FUNCTION join_room_as_player_2 TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_inactive_rooms TO anon, authenticated;
