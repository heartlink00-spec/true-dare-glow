import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Check, Home, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
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
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    if (!roomCode) return;

    const setupRoom = async () => {
      // Generate a persistent player ID
      const storedId = localStorage.getItem(`player_id_${roomCode}`);
      const newId = `player_${Math.random().toString(36).substr(2, 9)}`;
      const id = storedId || newId;
      
      if (!storedId) {
        localStorage.setItem(`player_id_${roomCode}`, id);
      }
      
      setPlayerId(id);

      // Initial room fetch and join
      const { data: initialRoom } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', roomCode)
        .single();

      if (initialRoom) {
        setRoom(initialRoom);
        if (initialRoom.mode) {
          setMode(initialRoom.mode as GameMode);
        }
        
        // If not already in room, try to join
        if (id !== initialRoom.player1_id && id !== initialRoom.player2_id) {
          joinRoom(id);
        }
      }

      // Setup presence channel for real-time updates
      const channel = supabase.channel(`presence:${roomCode}`, {
        config: {
          presence: {
            key: id,
          },
        },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          console.log('Presence state:', state);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('Join:', key, newPresences);
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          console.log('Leave:', key);
        })
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
        );

      // Track online status
      const trackPresence = async () => {
        await channel.track({
          online_at: new Date().toISOString(),
          user_id: id
        });
      };

      await channel.subscribe(trackPresence);

      // Handle window/tab close - cleanup player slot
      const handleBeforeUnload = async () => {
        const currentRoom = await supabase
          .from('rooms')
          .select('*')
          .eq('room_code', roomCode)
          .single();

        if (!currentRoom.data) return;

        const isPlayer1 = id === currentRoom.data.player1_id;
        const isPlayer2 = id === currentRoom.data.player2_id;

        const updateData = isPlayer1
          ? { player1_id: null }
          : isPlayer2
          ? { player2_id: null }
          : null;

        if (updateData) {
          localStorage.removeItem(`player_id_${roomCode}`);

          try {
            await supabase
              .from('rooms')
              .update(updateData)
              .eq('room_code', roomCode);
          } catch (error) {
            console.error('Error cleaning up player on exit:', error);
          }
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      // Cleanup function
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        channel.unsubscribe();
      };
    };

    setupRoom();
  }, [roomCode]);

  const joinRoom = async (id: string) => {
    if (!id || !roomCode) return;
    
    try {
      // Get current room state
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

      // Return early if player is already in the room
      if (id === existingRoom.player1_id || id === existingRoom.player2_id) {
        return;
      }

      // If both slots are taken, show error
      if (existingRoom.player1_id && existingRoom.player2_id) {
        toast({
          title: 'Room is full',
          description: 'This room already has two players.',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      // Try to join empty slot
      const { data: updateResult, error: updateError } = await supabase
        .from('rooms')
        .update({
          player1_id: !existingRoom.player1_id ? id : existingRoom.player1_id,
          player2_id: existingRoom.player1_id && !existingRoom.player2_id ? id : existingRoom.player2_id
        })
        .eq('room_code', roomCode)
        .select()
        .single();

      if (updateError || !updateResult) {
        toast({
          title: 'Error joining room',
          description: 'Please try again.',
          variant: 'destructive',
        });
        return;
      }

      // Successfully joined
      return;

      // If we get here, something went wrong
      toast({
        title: 'Room is full',
        description: 'This room already has two players.',
        variant: 'destructive',
      });
      navigate('/');

    } catch (error) {
      console.error('Error joining room:', error);
      toast({
        title: 'Error joining room',
        description: 'Please try again later.',
        variant: 'destructive',
      });
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

  const handleSpinStart = async () => {
    if (!mode || !isMyTurn() || room?.waiting_for_answer || room?.is_spinning) return false;

    const { error } = await supabase
      .from('rooms')
      .update({ is_spinning: true })
      .eq('room_code', roomCode);

    if (error) {
      console.error('Error starting spin:', error);
      return false;
    }
    return true;
  };

  const handleSpinResult = async (result: 'truth' | 'dare') => {
    if (!mode) return;

    const question = getRandomQuestion(mode, result);

    const { error } = await supabase
      .from('rooms')
      .update({
        current_question: question,
        current_question_type: result,
        waiting_for_answer: true,
        is_spinning: false,
      })
      .eq('room_code', roomCode);

    if (error) {
      console.error('Error setting question:', error);
      await supabase
        .from('rooms')
        .update({ is_spinning: false })
        .eq('room_code', roomCode);
      toast({
        title: 'Error',
        description: 'Failed to get question. Try again.',
        variant: 'destructive',
      });
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim() || !room?.current_question || !isMyTurn()) return;

    const history = Array.isArray(room?.question_history) ? room.question_history : [];
    const playerName = playerId === room?.player1_id ? 'Player 1' : 'Player 2';

    const newHistoryItem = {
      player: playerName,
      playerId: playerId,
      type: room.current_question_type,
      question: room.current_question,
      answer: answer.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };

    const newIsPlayer1Turn = !room.is_player1_turn;

    const { error } = await supabase
      .from('rooms')
      .update({
        question_history: [...history, newHistoryItem],
        waiting_for_answer: false,
        is_player1_turn: newIsPlayer1Turn,
        current_question: null,
        current_question_type: null,
      })
      .eq('room_code', roomCode);

    if (error) {
      console.error('Error submitting answer:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit answer. Try again.',
        variant: 'destructive',
      });
      return;
    }

    setAnswer('');

    toast({
      title: 'Answer submitted!',
      description: 'Turn passed to the other player.',
    });
  };

  const isMyTurn = () => {
    if (!room) return false;
    const isPlayer1 = playerId === room.player1_id;
    return (isPlayer1 && room.is_player1_turn) || (!isPlayer1 && !room.is_player1_turn);
  };

  const canSpin = () => {
    if (!room?.player1_id || !room?.player2_id || !mode) return false;
    return isMyTurn() && !room.waiting_for_answer && !room.is_spinning;
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
        {room?.player1_id && room?.player2_id && (
          <div className="mt-4">
            {isMyTurn() ? (
              <p className="text-lg font-semibold text-green-400">Your Turn!</p>
            ) : (
              <p className="text-lg font-semibold text-yellow-400">Waiting for other player...</p>
            )}
          </div>
        )}
      </motion.div>

      <div className="max-w-4xl mx-auto space-y-8">
        {!room?.waiting_for_answer && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center gap-4"
          >
            {canSpin() ? (
              <>
                <SpinningWheel onResult={handleSpinResult} onSpinStart={handleSpinStart} mode={mode} disabled={room?.is_spinning} />
                <p className="text-sm text-muted-foreground">Spin the wheel to get your question!</p>
              </>
            ) : (
              <Card className="p-8 bg-card/50 backdrop-blur-sm border-border text-center">
                <p className="text-muted-foreground">
                  {!room?.player1_id || !room?.player2_id
                    ? 'Waiting for both players to join...'
                    : 'The wheel is locked. Wait for your turn.'}
                </p>
              </Card>
            )}
          </motion.div>
        )}

        {room?.current_question && room?.waiting_for_answer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className={`p-8 bg-gradient-to-br ${getModeGradient()} border-none text-white max-w-2xl mx-auto`}>
              <div className="text-sm uppercase tracking-wider mb-4 opacity-80">
                {room.current_question_type}
              </div>
              <p className="text-2xl font-semibold">{room.current_question}</p>
            </Card>

            {isMyTurn() ? (
              <Card className="p-6 max-w-2xl mx-auto bg-card/50 backdrop-blur-sm border-border">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Your Answer</h3>
                <div className="space-y-4">
                  <Textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="min-h-[120px] resize-none bg-input border-border text-foreground"
                  />
                  <Button
                    onClick={submitAnswer}
                    disabled={!answer.trim()}
                    variant="glow"
                    className="w-full gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Submit Answer
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="p-6 max-w-2xl mx-auto bg-card/50 backdrop-blur-sm border-border text-center">
                <p className="text-muted-foreground">Waiting for the other player to answer...</p>
              </Card>
            )}
          </motion.div>
        )}

        <GameHistory history={Array.isArray(room?.question_history) ? room.question_history : []} />
      </div>
    </div>
  );
};

export default GameRoom;
