import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Star } from 'lucide-react';
import { getHighScores } from '../utils/storage';

const Leaderboard = ({ onBack }) => {
  const [scores] = useState(getHighScores);
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'classic', 'speed', 'survival'

  const filteredScores = filterMode === 'all' 
    ? scores 
    : scores.filter(s => s.mode === filterMode);

  // Lấy top 10 cho view hiện tại
  const displayScores = filteredScores.slice(0, 10);

  const renderRankIcon = (index) => {
    switch(index) {
      case 0: return <Trophy className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />;
      case 1: return <Medal className="w-6 h-6 text-gray-300 drop-shadow-[0_0_8px_rgba(209,213,219,0.8)]" />;
      case 2: return <Medal className="w-6 h-6 text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.8)]" />;
      default: return <span className="text-gray-500 font-press-start text-sm w-6 text-center">{index + 1}</span>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="z-10 flex flex-col items-center glass-panel p-6 md:p-10 w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden"
    >
      <div className="flex items-center gap-4 mb-8">
        <Trophy className="w-10 h-10 text-yellow-400" />
        <h2 className="text-3xl md:text-4xl font-press-start text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">
          HALL OF FAME
        </h2>
      </div>

      <div className="flex gap-2 mb-6 w-full overflow-x-auto pb-2 justify-center scrollbar-hide">
        {['all', 'classic', 'speed', 'survival'].map((mode) => (
          <button
            key={mode}
            onClick={() => setFilterMode(mode)}
            className={`px-4 py-2 rounded font-press-start text-xs uppercase transition-all ${
              filterMode === mode 
                ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50 shadow-[0_0_10px_rgba(250,204,21,0.3)]' 
                : 'bg-black/30 text-gray-400 border border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      <div className="w-full flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[300px]">
        {displayScores.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4 mt-20">
            <Star className="w-12 h-12 opacity-20" />
            <p className="font-fira-code">No records found yet.</p>
            <p className="text-sm">Be the first to set a high score!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Header */}
            <div className="flex items-center px-4 py-2 text-xs text-gray-500 font-press-start border-b border-gray-700/50 mb-2">
              <div className="w-12 text-center">#</div>
              <div className="flex-1">PLAYER</div>
              <div className="w-24 text-right">SCORE</div>
              {filterMode === 'all' && <div className="w-24 text-center hidden sm:block">MODE</div>}
            </div>

            {/* List */}
            {displayScores.map((score, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex items-center px-4 py-3 rounded-lg border ${
                  idx === 0 ? 'bg-yellow-400/10 border-yellow-400/30' : 
                  idx === 1 ? 'bg-gray-300/10 border-gray-300/30' :
                  idx === 2 ? 'bg-amber-600/10 border-amber-600/30' :
                  'bg-black/40 border-white/5'
                }`}
              >
                <div className="w-12 flex justify-center items-center">
                  {renderRankIcon(idx)}
                </div>
                
                <div className="flex-1 font-fira-code font-bold text-lg text-white truncate pr-4 flex items-center gap-3">
                  {score.username}
                  {idx === 0 && <span className="text-[10px] bg-yellow-400/20 text-yellow-400 px-2 py-1 rounded font-press-start">CHAMP</span>}
                </div>
                
                <div className="w-24 text-right font-press-start text-neon-green">
                  {score.score}
                </div>
                
                {filterMode === 'all' && (
                  <div className="w-24 text-center hidden sm:flex justify-center">
                    <span className={`text-xs px-2 py-1 rounded font-fira-code ${
                      score.mode === 'classic' ? 'bg-neon-green/20 text-neon-green' :
                      score.mode === 'speed' ? 'bg-neon-pink/20 text-neon-pink' :
                      'bg-neon-cyan/20 text-neon-cyan'
                    }`}>
                      {score.mode}
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <button 
        onClick={onBack}
        className="mt-8 text-gray-400 hover:text-white transition-colors flex items-center gap-2 font-fira-code"
      >
        ← Back to Menu
      </button>
    </motion.div>
  );
};

export default Leaderboard;
