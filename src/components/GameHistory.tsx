import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from './ui/scroll-area';

interface HistoryItem {
  player: string;
  playerId: string;
  type: 'truth' | 'dare';
  question: string;
  answer: string;
  timestamp: string;
}

interface GameHistoryProps {
  history: HistoryItem[];
}

const GameHistory = ({ history }: GameHistoryProps) => {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center bg-gradient-to-r from-[hsl(var(--bright-purple))] to-[hsl(var(--soft-purple))] bg-clip-text text-transparent">
        Game History
      </h2>
      <ScrollArea className="h-[400px] rounded-lg border border-border bg-card/50 backdrop-blur-sm p-4">
        <AnimatePresence>
          {history.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className="mb-4 p-4 rounded-lg bg-gradient-to-r from-card to-card/50 border border-border/50"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-foreground">{item.player}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  item.type === 'truth'
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'bg-pink-500/20 text-pink-300'
                }`}>
                  {item.type.toUpperCase()}
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground/60 mb-1">Question:</p>
                  <p className="text-sm text-muted-foreground">{item.question}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground/60 mb-1">Answer:</p>
                  <p className="text-sm text-foreground font-medium">{item.answer}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground/60 mt-2">{item.timestamp}</p>
            </motion.div>
          ))}
        </AnimatePresence>
        {history.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No history yet. Start playing!
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default GameHistory;
