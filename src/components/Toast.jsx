import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';

function Toast({ message, isVisible, onClose, duration = 3500 }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -60, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.85 }}
          transition={{ type: 'spring', stiffness: 350, damping: 22 }}
          className="absolute top-20 z-50 flex items-center gap-3 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 border-2 border-white shadow-xl text-white font-nunito font-black px-6 py-3 rounded-2xl pointer-events-none"
          style={{
            boxShadow: '0 10px 30px rgba(245, 158, 11, 0.45), 0 4px 12px rgba(0,0,0,0.15)',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }}
        >
          <motion.div
            animate={{ rotate: [0, -15, 15, -15, 15, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, repeatDelay: 0.8 }}
          >
            <Trophy className="w-6 h-6 text-white drop-shadow-md fill-yellow-200" />
          </motion.div>
          <span className="tracking-wide text-base md:text-lg">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Toast;
