import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

interface FloatingHeartsProps {
  mode: 'friendly' | 'crush' | 'adult';
}

const FloatingHearts = ({ mode }: FloatingHeartsProps) => {
  const heartCount = 15;
  
  const getColor = () => {
    switch (mode) {
      case 'friendly':
        return 'hsl(var(--soft-purple))';
      case 'crush':
        return 'hsl(330, 100%, 71%)';
      case 'adult':
        return 'hsl(0, 84%, 60%)';
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {[...Array(heartCount)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{
            x: Math.random() * window.innerWidth,
            y: window.innerHeight + 50,
            opacity: 0,
          }}
          animate={{
            y: -100,
            opacity: [0, 1, 1, 0],
            rotate: [0, 360],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 8 + Math.random() * 4,
            repeat: Infinity,
            delay: i * 0.5,
            ease: 'linear',
          }}
        >
          <Heart
            className="w-6 h-6"
            fill={getColor()}
            color={getColor()}
            style={{ opacity: 0.6 }}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default FloatingHearts;
