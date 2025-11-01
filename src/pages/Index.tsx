import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Heart, Users, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MusicPlayer from '@/components/MusicPlayer';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const createRoom = async () => {
    setIsCreating(true);
    try {
      // Generate a unique room code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Generate a player ID for the room creator
      const playerId = `player_${Math.random().toString(36).substr(2, 9)}`;
      
      // Check if a room with this code already exists
      const { data: existingRoom } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', code)
        .single();

      if (existingRoom) {
        throw new Error('Room code already exists, please try again');
      }

      // Store player ID in localStorage
      localStorage.setItem(`player_id_${code}`, playerId);

      const { error } = await supabase
        .from('rooms')
        .insert({
          room_code: code,
          player1_id: playerId, // Set the creator as player1
        });

      if (error) throw error;

      toast({
        title: 'Room created!',
        description: 'Share the room code with your partner.',
      });
      
      navigate(`/room/${code}`);
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: 'Error',
        description: 'Failed to create room. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = async () => {
    if (!roomCode.trim()) {
      toast({
        title: 'Enter a room code',
        description: 'Please enter a valid room code.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .single();

      if (error || !data) {
        toast({
          title: 'Room not found',
          description: 'Please check the room code and try again.',
          variant: 'destructive',
        });
        return;
      }

      // Check if room is full before redirecting
      if (data.player1_id && data.player2_id) {
        toast({
          title: 'Room is full',
          description: 'This room already has two players.',
          variant: 'destructive',
        });
        return;
      }

      navigate(`/room/${roomCode.toUpperCase()}`);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <MusicPlayer />
      
      {/* Animated background elements */}
      <motion.div
        className="absolute top-20 left-10 text-[hsl(var(--soft-purple))] opacity-20"
        animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <Heart className="w-16 h-16" fill="currentColor" />
      </motion.div>
      
      <motion.div
        className="absolute bottom-20 right-10 text-[hsl(var(--bright-purple))] opacity-20"
        animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
      >
        <Heart className="w-20 h-20" fill="currentColor" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-12"
      >
        <motion.h1
          className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-[hsl(var(--bright-purple))] to-[hsl(var(--soft-purple))] bg-clip-text text-transparent"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Heart Link
        </motion.h1>
        <p className="text-xl md:text-2xl text-muted-foreground">
          Truth or Dare for Two Hearts
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-md space-y-6"
      >
        <Card className="p-8 bg-card/50 backdrop-blur-sm border-border shadow-[0_0_50px_hsl(var(--vibrant-purple)/0.2)]">
          <Button
            onClick={createRoom}
            variant="glow"
            className="w-full text-lg py-6 mb-4"
            disabled={isCreating}
          >
            <Users className="w-5 h-5 mr-2" />
            {isCreating ? 'Creating...' : 'Create New Room'}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-card text-muted-foreground">or</span>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              placeholder="Enter Room Code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
              className="text-center text-lg tracking-wider bg-input border-border"
              maxLength={6}
            />
            <Button
              onClick={joinRoom}
              variant="outline"
              className="w-full text-lg py-6"
            >
              Join Room
            </Button>
          </div>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-3 gap-4 text-center"
        >
          <div className="p-4 rounded-lg bg-card/30 backdrop-blur-sm border border-border/50">
            <Zap className="w-8 h-8 mx-auto mb-2 text-[hsl(var(--bright-purple))]" />
            <p className="text-xs text-muted-foreground">Real-time</p>
          </div>
          <div className="p-4 rounded-lg bg-card/30 backdrop-blur-sm border border-border/50">
            <Heart className="w-8 h-8 mx-auto mb-2 text-[hsl(330_100%_71%)]" />
            <p className="text-xs text-muted-foreground">3 Modes</p>
          </div>
          <div className="p-4 rounded-lg bg-card/30 backdrop-blur-sm border border-border/50">
            <Users className="w-8 h-8 mx-auto mb-2 text-[hsl(var(--soft-purple))]" />
            <p className="text-xs text-muted-foreground">2 Players</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Index;
