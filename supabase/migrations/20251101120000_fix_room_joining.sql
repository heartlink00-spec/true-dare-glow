-- Drop existing functions
drop function if exists join_room_as_player_1(text, text);
drop function if exists join_room_as_player_2(text, text);

-- Create improved function to join room as player 1
create or replace function join_room_as_player_1(p_room_code text, p_player_id text)
returns boolean
language plpgsql
security definer
as $$
declare
  v_room record;
begin
  -- Lock the row and get current state
  select *
  into v_room
  from rooms
  where room_code = p_room_code
  for update;
  
  -- If room doesn't exist, return false
  if not found then
    return false;
  end if;
  
  -- If player is already player2, they can't be player1
  if v_room.player2_id = p_player_id then
    return false;
  end if;
  
  -- Only update if player1 slot is empty
  if v_room.player1_id is null then
    update rooms
    set player1_id = p_player_id
    where room_code = p_room_code;
    return true;
  end if;
  
  return false;
end;
$$;

-- Create improved function to join room as player 2
create or replace function join_room_as_player_2(p_room_code text, p_player_id text)
returns boolean
language plpgsql
security definer
as $$
declare
  v_room record;
begin
  -- Lock the row and get current state
  select *
  into v_room
  from rooms
  where room_code = p_room_code
  for update;
  
  -- If room doesn't exist, return false
  if not found then
    return false;
  end if;
  
  -- If player is already player1, they can't be player2
  if v_room.player1_id = p_player_id then
    return false;
  end if;
  
  -- Only update if player2 slot is empty
  if v_room.player2_id is null then
    update rooms
    set player2_id = p_player_id
    where room_code = p_room_code;
    return true;
  end if;
  
  return false;
end;
$$;

-- Grant execute permissions
grant execute on function join_room_as_player_1(text, text) to anon;
grant execute on function join_room_as_player_2(text, text) to anon;