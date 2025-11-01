-- Create function to join room as player 1
create or replace function join_room_as_player_1(p_room_code text, p_player_id text)
returns boolean
language plpgsql
security definer
as $$
begin
  update rooms
  set player1_id = p_player_id
  where room_code = p_room_code
    and player1_id is null;
    
  return found;
end;
$$;

-- Create function to join room as player 2
create or replace function join_room_as_player_2(p_room_code text, p_player_id text)
returns boolean
language plpgsql
security definer
as $$
begin
  update rooms
  set player2_id = p_player_id
  where room_code = p_room_code
    and player2_id is null
    and player1_id != p_player_id;
    
  return found;
end;
$$;

-- Add RLS policies for the functions
grant execute on function join_room_as_player_1 to anon;
grant execute on function join_room_as_player_2 to anon;