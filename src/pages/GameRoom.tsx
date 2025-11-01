import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Check, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MusicPlayer from '@/components/MusicPlayer';
import FloatingHearts from '@/components/FloatingHearts';
import SpinningWheel from '@/components/SpinningWheel';
import GameHistory from '@/components/GameHistory';
import { getRandomQuestion, type GameMode } from '@/data/questions';

const GameRoom = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<GameMode | null>(null);
  const [playerId, setPlayerId] = useState('');
  const [room, setRoom] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [currentType, setCurrentType] = useState<'truth' | 'dare' | null>(null);

  useEffect(() => {
    const id = `player_${Math.random().toString(36).substr(2, 9)}`;
    setPlayerId(id);
    joinRoom(id);
  }, [roomCode]);

  useEffect(() => {
    if (!roomCode) return;

    const channel = supabase
      .channel(`room:${roomCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `room_code=eq.${roomCode}`,
        },
        (payload) => {
          const newRoom = payload.new as any;
          setRoom(newRoom);
          if (newRoom.mode && !mode) {
            setMode(newRoom.mode as GameMode);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode, mode]);

  const joinRoom = async (id: string) => {
    try {
      const { data: existingRoom, error: fetchError } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', roomCode)
        .single();

      if (fetchError) {
        toast({
          title: 'Room not found',
          description: 'This room does not exist.',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      setRoom(existingRoom);
      setMode(existingRoom.mode as GameMode);

      if (!existingRoom.player1_id) {
        await supabase
          .from('rooms')
          .update({ player1_id: id })
          .eq('room_code', roomCode);
      } else if (!existingRoom.player2_id && existingRoom.player1_id !== id) {
        await supabase
          .from('rooms')
          .update({ player2_id: id })
          .eq('room_code', roomCode);
      }
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  const selectMode = async (selectedMode: GameMode) => {
    try {
      await supabase
        .from('rooms')
        .update({ mode: selectedMode })
        .eq('room_code', roomCode);
      setMode(selectedMode);
    } catch (error) {
      console.error('Error setting mode:', error);
    }
  };

  const handleSpinResult = async (result: 'truth' | 'dare') => {
    if (!mode) return;
    
    const question = getRandomQuestion(mode, result);
    setCurrentQuestion(question);
    setCurrentType(result);

    const history = room?.question_history || [];
    const newHistoryItem = {
      player: playerId === room?.player1_id ? 'Player 1' : 'Player 2',
      type: result,
      question,
      timestamp: new Date().toLocaleTimeString(),
    };

    await supabase
      .from('rooms')
      .update({
        current_question: question,
        current_question_type: result,
        question_history: [...history, newHistoryItem],
      })
      .eq('room_code', roomCode);
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast({
      title: 'Link copied!',
      description: 'Share this link with your partner.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const getModeGradient = () => {
    switch (mode) {
      case 'friendly':
        return 'from-[hsl(var(--bright-purple))] to-[hsl(var(--soft-purple))]';
      case 'crush':
        return 'from-[hsl(var(--vibrant-purple))] to-[hsl(330_100%_71%)]';
      case 'adult':
        return 'from-[hsl(var(--royal-purple))] to-[hsl(0_84%_60%)]';
      default:
        return 'from-[hsl(var(--vibrant-purple))] to-[hsl(var(--bright-purple))]';
    }
  };

  if (!mode) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center relative overflow-hidden">
        <MusicPlayer />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-[hsl(var(--bright-purple))] to-[hsl(var(--soft-purple))] bg-clip-text text-transparent">
            Choose Your Mode
          </h1>
          <p className="text-muted-foreground text-lg">Select how you want to play</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl w-full mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-8 cursor-pointer hover:scale-105 transition-transform bg-gradient-to-br from-[hsl(var(--bright-purple))] to-[hsl(var(--soft-purple))] border-none text-white"
              onClick={() => selectMode('friendly')}
            >
              <div className="text-6xl mb-4 text-center">😊</div>
              <h3 className="text-2xl font-bold mb-2 text-center">Friendly</h3>
              <p className="text-white/80 text-center">Fun and casual questions</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-8 cursor-pointer hover:scale-105 transition-transform bg-gradient-to-br from-[hsl(var(--vibrant-purple))] to-[hsl(330_100%_71%)] border-none text-white"
              onClick={() => selectMode('crush')}
            >
              <div className="text-6xl mb-4 text-center">💕</div>
              <h3 className="text-2xl font-bold mb-2 text-center">Crush</h3>
              <p className="text-white/80 text-center">Romantic and flirty vibes</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-8 cursor-pointer hover:scale-105 transition-transform bg-gradient-to-br from-[hsl(var(--royal-purple))] to-[hsl(0_84%_60%)] border-none text-white"
              onClick={() => selectMode('adult')}
            >
              <div className="text-6xl mb-4 text-center">🔥</div>
              <h3 className="text-2xl font-bold mb-2 text-center">Adult</h3>
              <p className="text-white/80 text-center">Mature and daring content</p>
            </Card>
          </motion.div>
        </div>

        <Button
          variant="outline"
          onClick={copyRoomLink}
          className="gap-2"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Link Copied!' : 'Copy Room Link'}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      <MusicPlayer />
      {mode && <FloatingHearts mode={mode} />}
      
      <Button
        variant="outline"
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 gap-2"
      >
        <Home className="w-4 h-4" />
        Home
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 mt-16"
      >
        <h1 className={`text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r ${getModeGradient()} bg-clip-text text-transparent`}>
          Heart Link
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">Room: {roomCode}</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-sm text-muted-foreground">
            {room?.player1_id && room?.player2_id ? '2 Players Connected' : 'Waiting for player...'}
          </span>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center"
        >
          <SpinningWheel onResult={handleSpinResult} mode={mode} />
        </motion.div>

        {currentQuestion && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Card className={`p-8 bg-gradient-to-br ${getModeGradient()} border-none text-white max-w-2xl mx-auto`}>
              <div className="text-sm uppercase tracking-wider mb-4 opacity-80">
                {currentType}
              </div>
              <p className="text-2xl font-semibold">{currentQuestion}</p>
            </Card>
          </motion.div>
        )}

        <GameHistory history={room?.question_history || []} />
      </div>
    </div>
  );
};

export default GameRoom;
