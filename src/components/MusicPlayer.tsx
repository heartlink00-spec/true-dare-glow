import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
    }
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const restart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2">
      <audio
        ref={audioRef}
        src="https://assets.mixkit.co/music/preview/mixkit-deep-urban-623.mp3"
      />
      <Button
        variant="outline"
        size="icon"
        onClick={togglePlay}
        className="bg-card/50 backdrop-blur-sm border-border hover:bg-card/80"
      >
        {isPlaying ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={restart}
        className="bg-card/50 backdrop-blur-sm border-border hover:bg-card/80"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default MusicPlayer;
