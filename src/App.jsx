import { useState, useEffect } from 'react';
import { Play, Trophy, Settings, LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Game from './components/Game';
import Auth from './components/Auth';
import Leaderboard from './components/Leaderboard';
import { getCurrentUser, logoutUser } from './utils/storage';

function App() {
  const [activeTab, setActiveTab] = useState('auth'); // 'auth', 'menu', 'select_mode', 'game', 'leaderboard', 'settings'
  const [selectedMode, setSelectedMode] = useState('classic');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Only set state if the user object changes
    const fetchUser = async () => {
       const user = getCurrentUser();
       if (user) {
         setCurrentUser(user);
         setActiveTab('menu');
       } else {
         setActiveTab('auth');
       }
    };
    fetchUser();
  }, []);

  const handleLogin = (username) => {
    setCurrentUser(username);
    setActiveTab('menu');
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setActiveTab('auth');
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg text-white relative overflow-hidden font-fira-code">
      {/* Background decoration elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-green/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-[100px]" />

      {/* User Info Bar */}
      {currentUser && activeTab !== 'game' && activeTab !== 'auth' && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-4 bg-black/40 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-2 text-neon-green font-fira-code text-sm">
            <User className="w-4 h-4" />
            <span>{currentUser}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="text-gray-400 hover:text-neon-pink transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === 'auth' && (
          <Auth key="auth" onLoginSuccess={handleLogin} onBack={() => setActiveTab('menu')} />
        )}
      </AnimatePresence>

      {activeTab === 'menu' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="z-10 flex flex-col items-center glass-panel p-12 w-full max-w-2xl mx-4"
        >
          <motion.div
            animate={{ 
              textShadow: [
                "0 0 10px #39ff14, 0 0 20px #39ff14", 
                "0 0 5px #39ff14, 0 0 10px #39ff14", 
                "0 0 10px #39ff14, 0 0 20px #39ff14"
              ] 
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-6xl font-press-start text-neon-green mb-4">
              SNAKE
            </h1>
            <h2 className="text-2xl md:text-4xl font-press-start text-white text-glow-cyan tracking-widest">
              PLATFORM
            </h2>
          </motion.div>

          <div className="flex flex-col gap-6 w-full max-w-md">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('select_mode')}
              className="btn-neon border-neon-green text-neon-green hover:bg-neon-green/10 hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] flex items-center justify-center gap-4 group"
            >
              <Play className="w-6 h-6 group-hover:animate-pulse fill-current" />
              START GAME
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('leaderboard')}
              className="btn-neon border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] flex items-center justify-center gap-4 group"
            >
              <Trophy className="w-6 h-6 group-hover:animate-bounce" />
              LEADERBOARD
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('settings')}
              className="btn-neon border-neon-pink text-neon-pink hover:bg-neon-pink/10 hover:shadow-[0_0_20px_rgba(255,0,255,0.4)] flex items-center justify-center gap-4 group"
            >
              <Settings className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
              SETTINGS
            </motion.button>
          </div>

          <div className="mt-12 text-gray-400 text-sm flex gap-4">
            <p>Use <kbd className="bg-white/10 px-2 py-1 rounded font-press-start text-xs mx-1">WASD</kbd> or Arrows</p>
          </div>
        </motion.div>
      )}

      {activeTab === 'select_mode' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="z-10 flex flex-col items-center glass-panel p-12 w-full max-w-2xl mx-4"
        >
          <h2 className="text-3xl font-press-start text-neon-cyan mb-8 text-glow-cyan">SELECT MODE</h2>
          <div className="flex flex-col gap-6 w-full max-w-md">
            <button 
              onClick={() => { setSelectedMode('classic'); setActiveTab('game'); }}
              className="btn-neon border-neon-green text-neon-green hover:bg-neon-green/10 flex flex-col items-center py-6"
            >
              <span className="text-xl mb-2">CLASSIC</span>
              <span className="text-xs font-fira-code text-gray-400 normal-case">Standard speed, walls are deadly</span>
            </button>
            <button 
              onClick={() => { setSelectedMode('speed'); setActiveTab('game'); }}
              className="btn-neon border-neon-pink text-neon-pink hover:bg-neon-pink/10 flex flex-col items-center py-6"
            >
              <span className="text-xl mb-2">SPEED</span>
              <span className="text-xs font-fira-code text-gray-400 normal-case">Gets faster with every food</span>
            </button>
            <button 
              onClick={() => { setSelectedMode('survival'); setActiveTab('game'); }}
              className="btn-neon border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 flex flex-col items-center py-6"
            >
              <span className="text-xl mb-2">SURVIVAL</span>
              <span className="text-xs font-fira-code text-gray-400 normal-case">No walls! Wrap around the edges</span>
            </button>
          </div>
          <button 
            onClick={() => setActiveTab('menu')}
            className="mt-8 text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Menu
          </button>
        </motion.div>
      )}

      {activeTab === 'game' && (
        <div className="z-10">
          <Game mode={selectedMode} onBack={() => setActiveTab('menu')} currentUser={currentUser} />
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <Leaderboard onBack={() => setActiveTab('menu')} />
      )}

      {/* Placeholders for other tabs for future phases */}
      {activeTab !== 'auth' && activeTab !== 'menu' && activeTab !== 'game' && activeTab !== 'select_mode' && activeTab !== 'leaderboard' && (
        <div className="z-10 flex flex-col items-center glass-panel p-12">
          <h2 className="text-2xl font-press-start mb-8 text-neon-cyan">COMING SOON</h2>
          <button 
            onClick={() => setActiveTab('menu')}
            className="btn-neon border-white text-white hover:bg-white/10"
          >
            BACK TO MENU
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
