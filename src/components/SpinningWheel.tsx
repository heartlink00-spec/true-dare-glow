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
      <motion.div
        className={`w-64 h-64 rounded-full bg-gradient-to-br ${getGradient()} relative shadow-[0_0_60px_hsl(var(--bright-purple)/0.4)] flex items-center justify-center`}
        animate={{ rotate: rotation }}
        transition={{ duration: 3, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <div className="absolute inset-0 flex flex-col">
          <div className="flex-1 flex items-center justify-center border-b-2 border-white/20">
            <span className="text-3xl font-bold text-white">TRUTH</span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <span className="text-3xl font-bold text-white">DARE</span>
          </div>
        </div>
        <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[20px] border-t-transparent border-l-[30px] border-l-white border-b-[20px] border-b-transparent" />
      </motion.div>
      
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
