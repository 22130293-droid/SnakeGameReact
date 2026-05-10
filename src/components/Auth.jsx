import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import { saveUser, loginUser } from '../utils/storage';

const Auth = ({ onLoginSuccess, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (isLogin) {
      const res = loginUser(username, password);
      if (res.success) {
        onLoginSuccess(username);
      } else {
        setError(res.message);
      }
    } else {
      if (username.length < 3) {
        setError('Username must be at least 3 characters');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      const res = saveUser(username, password);
      if (res.success) {
        // Tự động đăng nhập sau khi đăng ký thành công
        loginUser(username, password);
        onLoginSuccess(username);
      } else {
        setError(res.message);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="z-10 flex flex-col items-center glass-panel p-8 md:p-12 w-full max-w-md mx-4"
    >
      <div className="flex justify-between w-full mb-8 border-b border-gray-700 pb-4">
        <button
          className={`flex items-center gap-2 text-xl font-press-start transition-colors ${isLogin ? 'text-neon-cyan text-glow-cyan' : 'text-gray-500 hover:text-gray-300'}`}
          onClick={() => { setIsLogin(true); setError(''); }}
        >
          <LogIn className="w-5 h-5" /> LOGIN
        </button>
        <button
          className={`flex items-center gap-2 text-xl font-press-start transition-colors ${!isLogin ? 'text-neon-pink text-glow-pink' : 'text-gray-500 hover:text-gray-300'}`}
          onClick={() => { setIsLogin(false); setError(''); }}
        >
          <UserPlus className="w-5 h-5" /> REGISTER
        </button>
      </div>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
        <div className="relative">
          <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isLogin ? 'text-neon-cyan' : 'text-neon-pink'}`} />
          <input
            type="text"
            placeholder="USERNAME"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={`w-full bg-black/50 border ${isLogin ? 'border-neon-cyan/50 focus:border-neon-cyan focus:shadow-[0_0_10px_rgba(0,243,255,0.3)]' : 'border-neon-pink/50 focus:border-neon-pink focus:shadow-[0_0_10px_rgba(255,0,255,0.3)]'} rounded-md py-4 pl-12 pr-4 text-white font-fira-code outline-none transition-all placeholder:text-gray-600`}
            maxLength={15}
          />
        </div>

        <div className="relative">
          <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isLogin ? 'text-neon-cyan' : 'text-neon-pink'}`} />
          <input
            type="password"
            placeholder="PASSWORD"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full bg-black/50 border ${isLogin ? 'border-neon-cyan/50 focus:border-neon-cyan focus:shadow-[0_0_10px_rgba(0,243,255,0.3)]' : 'border-neon-pink/50 focus:border-neon-pink focus:shadow-[0_0_10px_rgba(255,0,255,0.3)]'} rounded-md py-4 pl-12 pr-4 text-white font-fira-code outline-none transition-all placeholder:text-gray-600`}
          />
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-red-500 font-fira-code text-sm text-center bg-red-500/10 py-2 rounded border border-red-500/30"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className={`btn-neon w-full flex items-center justify-center gap-3 py-4 mt-2 ${
            isLogin 
              ? 'border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10' 
              : 'border-neon-pink text-neon-pink hover:bg-neon-pink/10'
          }`}
        >
          {isLogin ? 'ENTER ARCADE' : 'CREATE ACCOUNT'}
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </form>

      {onBack && (
        <button 
          onClick={onBack}
          className="mt-8 text-gray-400 hover:text-white transition-colors font-fira-code text-sm"
        >
          ← Play as Guest
        </button>
      )}
    </motion.div>
  );
};

export default Auth;
