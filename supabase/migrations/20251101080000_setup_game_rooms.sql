-- Create or update the rooms table
create table if not exists public.rooms (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    room_code text unique not null,
    player1_id text,
    player2_id text,
    mode text,
    current_question text,
    current_question_type text check (current_question_type in ('truth', 'dare')),
    waiting_for_answer boolean default false,
    is_spinning boolean default false,
    is_player1_turn boolean default true,
    question_history jsonb default '[]'::jsonb,
    last_activity timestamp with time zone default timezone('utc'::text, now())
);

-- Add indexes for better performance
create index if not exists rooms_room_code_idx on public.rooms(room_code);
create index if not exists rooms_player1_id_idx on public.rooms(player1_id);
create index if not exists rooms_player2_id_idx on public.rooms(player2_id);

-- Function to join room as player 1
create or replace function public.join_room_as_player_1(p_room_code text, p_player_id text)
returns boolean
language plpgsql
security definer
as $$
begin
    update public.rooms
    set 
        player1_id = p_player_id,
        last_activity = now()
    where 
        room_code = p_room_code
        and player1_id is null;
    return found;
end;
$$;

-- Function to join room as player 2
create or replace function public.join_room_as_player_2(p_room_code text, p_player_id text)
returns boolean
language plpgsql
security definer
as $$
begin
    update public.rooms
    set 
        player2_id = p_player_id,
        last_activity = now()
    where 
        room_code = p_room_code
        and player2_id is null
        and player1_id is not null
        and player1_id != p_player_id;
    return found;
end;
$$;

-- Function to cleanup inactive rooms (optional, can be run periodically)
create or replace function public.cleanup_inactive_rooms()
returns void
language plpgsql
security definer
as $$
begin
    delete from public.rooms
    where last_activity < now() - interval '24 hours';
end;
$$;

-- Enable Row Level Security
alter table public.rooms enable row level security;

-- Create policies for room access
create policy "Allow anyone to create rooms"
    on public.rooms for insert
    to anon
    with check (true);

create policy "Allow anyone to read rooms"
    on public.rooms for select
    to anon
    using (true);

create policy "Allow players to update their rooms"
    on public.rooms for update
    to anon
    using (
        player1_id = current_user
        or player2_id = current_user
        or player1_id is null
        or player2_id is null
    );

-- Grant necessary permissions
grant usage on schema public to anon;
grant all on public.rooms to anon;
grant execute on function public.join_room_as_player_1 to anon;
grant execute on function public.join_room_as_player_2 to anon;

-- Create function to automatically update last_activity
create or replace function public.update_last_activity()
returns trigger
language plpgsql
security definer
as $$
begin
    new.last_activity = now();
    return new;
end;
$$;

-- Create trigger for last_activity updates
create trigger update_rooms_last_activity
    before update on public.rooms
    for each row
    execute function public.update_last_activity();