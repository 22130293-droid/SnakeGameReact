import { useState, useEffect } from 'react';
import { Play, Trophy, Settings, LogOut, User, Users, Volume2, VolumeX, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from './firebase';
import { translations } from './utils/translations';
import { playBGM, stopBGM } from './utils/audio';
import Game from './components/Game';
import Auth from './components/Auth';
import Leaderboard from './components/Leaderboard';
import MultiplayerGame from './components/MultiplayerGame';

// ─── Mode data ───────────────────────────────────────────────
const MODES = [
  { id: 'classic',    emoji: '🐍', color: '#4caf50', bg: '#e8f5e9', border: '#a5d6a7', labelKey: 'classic',    descKey: 'classicDesc'    },
  { id: 'borderless', emoji: '🌀', color: '#8e24aa', bg: '#f3e5f5', border: '#ce93d8', labelKey: 'borderless', descKey: 'borderlessDesc' },
  { id: 'brick',      emoji: '🧱', color: '#fb8c00', bg: '#fff3e0', border: '#ffb74d', labelKey: 'brick',      descKey: 'brickDesc'      },
];

// ─── Slide transition variants ────────────────────────────────
const pageVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -16, transition: { duration: 0.2 } },
};

// ─── Snake SVG decoration ─────────────────────────────────────
const SnakeDeco = () => (
  <svg className="float-snake" width="60" height="60" viewBox="0 0 60 60" fill="none">
    <ellipse cx="30" cy="36" rx="18" ry="14" fill="#4caf50" />
    <ellipse cx="22" cy="28" rx="10" ry="8"  fill="#4caf50" />
    <ellipse cx="14" cy="22" rx="7" ry="6"  fill="#4caf50" />
    <circle cx="34" cy="28" r="16" fill="#4caf50" />
    {/* Head */}
    <ellipse cx="42" cy="18" rx="14" ry="12" fill="#66bb6a" />
    {/* Eyes */}
    <circle cx="38" cy="14" r="4" fill="white" />
    <circle cx="46" cy="14" r="4" fill="white" />
    <circle cx="39" cy="14" r="2" fill="#1a237e" />
    <circle cx="47" cy="14" r="2" fill="#1a237e" />
    {/* Tongue */}
    <path d="M44 24 L50 28 M50 28 L48 31 M50 28 L52 31" stroke="#e53935" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

function App() {
  const [activeTab, setActiveTab] = useState('loading');
  const [selectedMode, setSelectedMode] = useState('classic');
  const [language, setLanguage] = useState('vi');
  const t = translations[language];
  const [currentUser, setCurrentUser]   = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!isMuted) playBGM();
    else stopBGM();
  }, [isMuted]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseUser(user);
        setCurrentUser(user.displayName || user.email?.split('@')[0] || 'Player');
        setActiveTab('menu');
      } else {
        setFirebaseUser(null);
        setCurrentUser(null);
        setActiveTab('auth');
      }
    });
    return () => unsub();
  }, []);

  const handleLogin  = (name, user) => { setCurrentUser(name); setFirebaseUser(user); setActiveTab('menu'); };
  const handleLogout = async () => { await signOut(auth); setCurrentUser(null); setFirebaseUser(null); };
  const handleInteraction = () => { if (!isMuted) playBGM(); };

  // ── Loading ──────────────────────────────────────────────────
  if (activeTab === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#c8e89a' }}>
        <div className="text-5xl mb-6 float-snake">🐍</div>
        <div className="flex gap-3">
          <span className="gg-dot w-4 h-4 bg-gs-green" />
          <span className="gg-dot w-4 h-4 bg-gs-green-dark" />
          <span className="gg-dot w-4 h-4 bg-gs-green" />
        </div>
        <p className="mt-4 font-nunito font-bold text-gs-text-light text-sm">Đang tải...</p>
      </div>
    );
  }

  return (
    <div
      onClick={handleInteraction}
      className="min-h-screen flex items-center justify-center relative overflow-hidden select-none"
      style={{ background: 'linear-gradient(160deg, #c2e57a 0%, #a8d45a 100%)' }}
    >
      {/* Grass dots pattern */}
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* ── User pill (top-right) ── */}
      {currentUser && activeTab !== 'game' && activeTab !== 'auth' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 right-4 z-30 flex items-center gap-2 bg-white/90 backdrop-blur px-4 py-2 rounded-full border-2 border-gs-border shadow-card"
        >
          {firebaseUser?.photoURL
            ? <img src={firebaseUser.photoURL} alt="av" className="w-7 h-7 rounded-full border-2 border-gs-green" />
            : <div className="w-7 h-7 rounded-full bg-gs-green flex items-center justify-center text-white font-bold text-xs">{currentUser[0]?.toUpperCase()}</div>
          }
          <span className="font-nunito font-bold text-gs-text text-sm">{currentUser}</span>
          <button onClick={handleLogout} className="ml-1 text-gs-text-light hover:text-gs-red transition-colors" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      <AnimatePresence mode="wait">

        {/* ══════════════ AUTH ══════════════ */}
        {activeTab === 'auth' && (
          <Auth key="auth" onLoginSuccess={handleLogin} onBack={() => setActiveTab('menu')} />
        )}

        {/* ══════════════ MENU ══════════════ */}
        {activeTab === 'menu' && (
          <motion.div key="menu" variants={pageVariants} initial="hidden" animate="visible" exit="exit"
            className="z-10 flex flex-col items-center w-full max-w-md mx-4"
          >
            {/* Hero card */}
            <div className="gs-card w-full px-8 py-10 flex flex-col items-center">
              {/* Title */}
              <div className="flex items-center gap-3 mb-2">
                <span className="float-snake text-4xl">🐍</span>
                <h1 className="font-nunito font-black text-4xl text-gs-text leading-none">
                  {t.title}
                </h1>
              </div>
              <p className="text-gs-text-light font-semibold text-sm mb-8">Chơi ngay và lên bảng xếp hạng!</p>

              <div className="flex flex-col gap-3 w-full">
                {/* Play */}
                <button onClick={() => setActiveTab('select_mode')}
                  className="gs-btn w-full text-lg flex items-center justify-center gap-3 py-5"
                >
                  <Play className="w-6 h-6 fill-white" />
                  {t.play}
                </button>

                {/* 1VS1 */}
                <button onClick={() => setActiveTab('multiplayer')}
                  className="gs-btn w-full flex items-center justify-center gap-3 py-4"
                  style={{ background: '#fb8c00', borderColor: '#e65100' }}
                >
                  <Users className="w-5 h-5" />
                  {t.multiplayer}
                </button>

                {/* Leaderboard */}
                <button onClick={() => setActiveTab('leaderboard')}
                  className="gs-btn-outline w-full flex items-center justify-center gap-3 py-4 text-gs-text font-bold"
                >
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  {t.leaderboard}
                </button>

                {/* Row: Settings + Logout */}
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <button onClick={() => setActiveTab('settings')}
                    className="gs-btn-outline flex items-center justify-center gap-2 py-3 text-gs-text font-bold text-sm"
                  >
                    <Settings className="w-4 h-4" />
                    {t.settings}
                  </button>
                  {currentUser
                    ? <button onClick={handleLogout}
                        className="gs-btn-outline flex items-center justify-center gap-2 py-3 text-red-500 font-bold text-sm border-red-200 hover:border-red-400 hover:text-red-600"
                      ><LogOut className="w-4 h-4" />{t.logout}</button>
                    : <button onClick={() => setActiveTab('auth')}
                        className="gs-btn-outline flex items-center justify-center gap-2 py-3 text-gs-blue font-bold text-sm border-blue-200 hover:border-blue-400"
                      ><User className="w-4 h-4" />GOOGLE</button>
                  }
                </div>
              </div>
            </div>

            {/* Grass footer deco */}
            <div className="mt-4 text-3xl flex gap-3">
              <span>🍎</span><span className="opacity-60">🍓</span><span className="opacity-40">🫐</span>
            </div>
          </motion.div>
        )}

        {/* ══════════════ SELECT MODE ══════════════ */}
        {activeTab === 'select_mode' && (
          <motion.div key="select" variants={pageVariants} initial="hidden" animate="visible" exit="exit"
            className="z-10 w-full max-w-lg mx-4"
          >
            <div className="gs-card px-8 py-8">
              <button onClick={() => setActiveTab('menu')} className="gs-back mb-5">
                <ChevronLeft className="w-5 h-5" /> {t.back}
              </button>
              <h2 className="font-nunito font-black text-3xl text-gs-text mb-6">{t.selectMode}</h2>

              <div className="flex flex-col gap-3">
                {MODES.map((m) => (
                  <button key={m.id}
                    onClick={() => { setSelectedMode(m.id); setActiveTab('game'); }}
                    className="gs-mode-card flex items-center gap-4 text-left w-full"
                    style={{ borderColor: selectedMode === m.id ? m.color : undefined }}
                  >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                      style={{ background: m.bg, border: `2px solid ${m.border}` }}>
                      {m.emoji}
                    </div>
                    <div>
                      <div className="font-nunito font-black text-lg text-gs-text"
                        style={{ color: m.color }}>{t[m.labelKey]}</div>
                      <div className="text-gs-text-light text-sm font-semibold">{t[m.descKey]}</div>
                    </div>
                    <div className="ml-auto text-gs-border">›</div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════ GAME ══════════════ */}
        {activeTab === 'game' && (
          <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="z-10">
            <Game
              mode={selectedMode}
              onBack={() => setActiveTab('menu')}
              onMenu={() => setActiveTab('menu')}
              currentUser={currentUser}
              firebaseUser={firebaseUser}
              lang={language}
              isMuted={isMuted}
              onToggleMute={() => setIsMuted(m => !m)}
            />
          </motion.div>
        )}

        {/* ══════════════ LEADERBOARD ══════════════ */}
        {activeTab === 'leaderboard' && (
          <motion.div key="lb" variants={pageVariants} initial="hidden" animate="visible" exit="exit" className="z-10 w-full max-w-2xl mx-4">
            <Leaderboard onBack={() => setActiveTab('menu')} lang={language} />
          </motion.div>
        )}

        {/* ══════════════ MULTIPLAYER ══════════════ */}
        {activeTab === 'multiplayer' && (
          <motion.div key="mp" variants={pageVariants} initial="hidden" animate="visible" exit="exit" className="z-10 w-full max-w-lg mx-4">
            <MultiplayerGame
              onBack={() => setActiveTab('menu')}
              currentUser={currentUser}
              firebaseUser={firebaseUser}
              lang={language}
            />
          </motion.div>
        )}

        {/* ══════════════ SETTINGS ══════════════ */}
        {activeTab === 'settings' && (
          <motion.div key="settings" variants={pageVariants} initial="hidden" animate="visible" exit="exit"
            className="z-10 w-full max-w-sm mx-4"
          >
            <div className="gs-card px-8 py-8">
              <button onClick={() => setActiveTab('menu')} className="gs-back mb-5">
                <ChevronLeft className="w-5 h-5" /> {t.back}
              </button>
              <h2 className="font-nunito font-black text-3xl text-gs-text mb-6">{t.settings}</h2>

              <div className="flex flex-col gap-4">
                {/* Volume */}
                <div className="flex items-center justify-between bg-gs-bg rounded-2xl px-5 py-4 border-2 border-gs-border">
                  <div className="flex items-center gap-3">
                    {isMuted ? <VolumeX className="w-5 h-5 text-gs-text-light" /> : <Volume2 className="w-5 h-5 text-gs-green" />}
                    <span className="font-nunito font-bold text-gs-text">{t.volume}</span>
                  </div>
                  <button
                    onClick={() => setIsMuted(m => !m)}
                    className={`w-14 h-7 rounded-full border-2 transition-all duration-300 relative ${!isMuted ? 'bg-gs-green border-gs-green-dark' : 'bg-gray-200 border-gray-300'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${!isMuted ? 'left-7' : 'left-0.5'}`} />
                  </button>
                </div>

                {/* Language */}
                <div className="flex items-center justify-between bg-gs-bg rounded-2xl px-5 py-4 border-2 border-gs-border">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🌐</span>
                    <span className="font-nunito font-bold text-gs-text">{t.language}</span>
                  </div>
                  <div className="flex gap-2">
                    {['vi', 'en'].map(lang => (
                      <button key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`px-4 py-1.5 rounded-xl font-bold text-sm font-nunito transition-all border-2 ${
                          language === lang
                            ? 'bg-gs-green text-white border-gs-green-dark shadow-btn'
                            : 'bg-white text-gs-text border-gs-border hover:border-gs-green'
                        }`}
                      >{lang.toUpperCase()}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

export default App;
