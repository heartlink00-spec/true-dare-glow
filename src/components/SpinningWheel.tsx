import { motion } from 'framer-motion';
import { useState } from 'react';
import { Button } from './ui/button';

interface SpinningWheelProps {
  onResult: (result: 'truth' | 'dare') => void;
  mode: 'friendly' | 'crush' | 'adult';
}

const SpinningWheel = ({ onResult, mode }: SpinningWheelProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);

  const spin = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    const result = Math.random() > 0.5 ? 'truth' : 'dare';
    const baseRotation = result === 'truth' ? 0 : 180;
    const spins = 5;
    const newRotation = rotation + (360 * spins) + baseRotation + Math.random() * 30 - 15;
    
    setRotation(newRotation);
    
    setTimeout(() => {
      setIsSpinning(false);
      onResult(result);
    }, 3000);
  };

  const getGradient = () => {
    switch (mode) {
      case 'friendly':
        return 'from-[hsl(var(--bright-purple))] to-[hsl(var(--soft-purple))]';
      case 'crush':
        return 'from-[hsl(var(--vibrant-purple))] to-[hsl(330_100%_71%)]';
      case 'adult':
        return 'from-[hsl(var(--royal-purple))] to-[hsl(0_84%_60%)]';
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative">
        {/* Pointer Arrow - Right Side */}
        <div className="absolute -right-8 top-1/2 -translate-y-1/2 z-10">
          <div className="w-0 h-0 border-t-[25px] border-t-transparent border-l-[40px] border-l-yellow-400 border-b-[25px] border-b-transparent drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
        </div>

        <motion.div
          className="w-64 h-64 rounded-full relative shadow-[0_0_60px_hsl(var(--bright-purple)/0.4)] overflow-hidden"
          animate={{ rotate: rotation }}
          transition={{ duration: 3, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {/* Top Half - TRUTH (Blue) */}
          <div className="absolute inset-0 top-0 bottom-1/2 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-b-4 border-white">
            <span className="text-4xl font-bold text-white drop-shadow-lg">TRUTH</span>
          </div>
          
          {/* Bottom Half - DARE (Pink) */}
          <div className="absolute inset-0 top-1/2 bottom-0 bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
            <span className="text-4xl font-bold text-white drop-shadow-lg">DARE</span>
          </div>
          
          {/* Center Circle */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-br ${getGradient()} border-4 border-white shadow-lg`} />
        </motion.div>
      </div>
      
      <Button
        onClick={spin}
        disabled={isSpinning}
        variant="glow"
        size="lg"
        className="text-lg px-8 py-6"
      >
        {isSpinning ? 'Spinning...' : 'Spin the Wheel'}
      </Button>
    </div>
  );
};

export default SpinningWheel;
