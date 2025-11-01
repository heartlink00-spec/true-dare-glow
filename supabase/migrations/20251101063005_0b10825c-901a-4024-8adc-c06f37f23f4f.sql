-- Fix search path for update_room_updated_at function
DROP TRIGGER IF EXISTS update_rooms_updated_at ON public.rooms;
DROP FUNCTION IF EXISTS public.update_room_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.update_room_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_room_updated_at();