import React from 'react';
import { motion } from 'framer-motion';

// Sparkle effect component for visual flair
const Sparkles: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-blue-400/30 dark:bg-yellow-300/50 rounded-full"
          initial={{ 
            scale: 0,
            x: `${Math.random() * 100}%`, 
            y: `${Math.random() * 100}%` 
          }}
          animate={{ 
            scale: [0, 1, 0],
            opacity: [0, 1, 0]
          }}
          transition={{ 
            duration: 2 + Math.random() * 3,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
            delay: Math.random() * 5
          }}
        />
      ))}
    </div>
  );
};

export default Sparkles; 