/*
  # Create Rooms Table with Turn System

  1. New Tables
    - `rooms`
      - `id` (uuid, primary key)
      - `room_code` (text, unique)
      - `mode` (text) - game mode: friendly, crush, or adult
      - `player1_id` (text) - first player identifier
      - `player2_id` (text) - second player identifier
      - `is_player1_turn` (boolean) - tracks whose turn it is
      - `is_spinning` (boolean) - prevents multiple simultaneous spins
      - `waiting_for_answer` (boolean) - locks turn until answer is submitted
      - `current_question` (text) - current active question
      - `current_question_type` (text) - truth or dare
      - `question_history` (jsonb) - array of past questions with answers
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `rooms` table
    - Add policy for anyone to read rooms (real-time game updates)
    - Add policy for anyone to create/update rooms (simplified for game flow)
*/

CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text UNIQUE NOT NULL,
  mode text,
  player1_id text,
  player2_id text,
  is_player1_turn boolean DEFAULT true,
  is_spinning boolean DEFAULT false,
  waiting_for_answer boolean DEFAULT false,
  current_question text,
  current_question_type text,
  current_turn text,
  question_history jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read rooms"
  ON rooms
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can insert rooms"
  ON rooms
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can update rooms"
  ON rooms
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);