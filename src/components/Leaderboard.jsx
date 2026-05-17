import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, RefreshCw, ChevronLeft } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const FILTER_MODES = [
  { id: 'all',         emoji: '🏆', label: 'Tất cả'    },
  { id: 'classic',     emoji: '🐍', label: 'Cổ điển'   },
  { id: 'borderless',  emoji: '🌀', label: 'Biên giới'  },
  { id: 'brick',       emoji: '🧱', label: 'Tường gạch' },
  { id: 'multiplayer', emoji: '⚔️', label: '1VS1'       },
];

const MODE_STYLE = {
  classic:     { bg: '#e8f5e9', text: '#2e7d32',  label: 'Classic'    },
  borderless:  { bg: '#f3e5f5', text: '#6a1b9a',  label: 'Borderless' },
  brick:       { bg: '#fff3e0', text: '#e65100',  label: 'Brick'      },
  multiplayer: { bg: '#fffde7', text: '#f57f17',  label: '1VS1'       },
};

const Leaderboard = ({ onBack }) => {
  const [allScores, setAllScores] = useState([]);   // raw data from Firebase
  const [filterMode, setFilterMode] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Fetch all scores once, filter client-side ─────────────────
  const fetchScores = async () => {
    setLoading(true);
    setError('');
    try {
      // fetch top 200 by score — client will filter/slice to top-10 per mode
      const q = query(
        collection(db, 'scores'),
        orderBy('score', 'desc'),
        limit(200)
      );
      const snap = await getDocs(q);
      setAllScores(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
      setError('Không thể tải bảng xếp hạng. Kiểm tra kết nối mạng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchScores(); }, []);

  // ── Client-side filter ────────────────────────────────────────
  const getTopScores = (scores, modeFilter) => {
    const filtered = modeFilter === 'all' ? scores : scores.filter(s => s.mode === modeFilter);
    const bestMap = new Map();
    
    filtered.forEach(s => {
      const uKey = s.uid || s.username || s.id;
      const key = `${uKey}_${s.mode}`;
      if (!bestMap.has(key) || s.score > bestMap.get(key).score) {
        bestMap.set(key, s);
      }
    });

    return Array.from(bestMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  };

  const displayed = getTopScores(allScores, filterMode);

  // ── Helpers ───────────────────────────────────────────────────
  const timeAgo = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const s = Math.floor((Date.now() - d) / 1000);
    if (s < 60)    return 'vừa xong';
    if (s < 3600)  return `${Math.floor(s / 60)} phút trước`;
    if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`;
    return d.toLocaleDateString('vi-VN');
  };

  const rankIcon = (i) => {
    if (i === 0) return <span className="text-2xl">🥇</span>;
    if (i === 1) return <span className="text-2xl">🥈</span>;
    if (i === 2) return <span className="text-2xl">🥉</span>;
    return (
      <span className="w-8 h-8 rounded-full bg-gs-bg border-2 border-gs-border flex items-center justify-center font-bold text-gs-text-light text-sm">
        {i + 1}
      </span>
    );
  };

  return (
    <div className="gs-card px-6 py-8 w-full max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="gs-back">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <Trophy className="w-7 h-7 text-yellow-500" />
          <h2 className="font-nunito font-black text-2xl text-gs-text">Bảng Xếp Hạng</h2>
        </div>
        <button
          onClick={fetchScores}
          disabled={loading}
          className="p-2 rounded-xl hover:bg-gs-bg border-2 border-transparent hover:border-gs-border transition-all"
          title="Làm mới"
        >
          <RefreshCw className={`w-5 h-5 text-gs-text-light ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Mode filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {FILTER_MODES.map(m => {
          const count = m.id === 'all'
            ? allScores.length
            : allScores.filter(s => s.mode === m.id).length;
          return (
            <button key={m.id}
              onClick={() => setFilterMode(m.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-2xl font-nunito font-bold text-sm border-2 transition-all ${
                filterMode === m.id
                  ? 'bg-gs-green text-white border-gs-green-dark shadow-btn'
                  : 'bg-white text-gs-text border-gs-border hover:border-gs-green'
              }`}
            >
              <span>{m.emoji}</span>
              <span className="hidden sm:inline">{m.label}</span>
              {!loading && (
                <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                  filterMode === m.id ? 'bg-white/30 text-white' : 'bg-gs-bg text-gs-text-light'
                }`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Score list */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="text-4xl float-snake">🐍</div>
            <div className="flex gap-2 mt-2">
              <span className="gg-dot w-3 h-3 bg-gs-green" />
              <span className="gg-dot w-3 h-3 bg-gs-green-dark" />
              <span className="gg-dot w-3 h-3 bg-gs-green" />
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <span className="text-4xl">⚠️</span>
            <p className="font-nunito font-bold text-red-500">{error}</p>
            <button onClick={fetchScores} className="gs-btn px-6 py-2 text-sm mt-2">Thử lại</button>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Star className="w-14 h-14 text-gs-border" />
            <p className="font-nunito font-black text-gs-text-light text-lg">Chưa có điểm</p>
            <p className="text-sm text-gs-text-light">
              {filterMode === 'all'
                ? 'Chơi game để ghi điểm vào đây!'
                : `Chưa có ai chơi chế độ "${FILTER_MODES.find(m=>m.id===filterMode)?.label}"!`
              }
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {displayed.map((s, i) => {
              const ms = MODE_STYLE[s.mode];
              return (
                <motion.div key={s.id}
                  layout
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-center gap-4 px-4 py-3 rounded-2xl border-2 ${
                    i === 0 ? 'bg-yellow-50 border-yellow-200' :
                    i === 1 ? 'bg-gray-50 border-gray-200' :
                    i === 2 ? 'bg-orange-50 border-orange-200' :
                    'bg-white border-gs-border'
                  }`}
                >
                  {/* Rank */}
                  <div className="w-10 flex justify-center items-center flex-shrink-0">
                    {rankIcon(i)}
                  </div>

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full flex-shrink-0 bg-gs-green/20 border-2 border-gs-border
                    flex items-center justify-center font-black text-gs-green text-lg">
                    {s.username?.[0]?.toUpperCase() || '?'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-nunito font-black text-gs-text truncate">{s.username}</div>
                    <div className="text-xs text-gs-text-light">{timeAgo(s.createdAt)}</div>
                  </div>

                  {/* Mode badge (always visible when in 'all' tab) */}
                  {filterMode === 'all' && ms && (
                    <span className="flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full hidden sm:inline-block"
                      style={{ background: ms.bg, color: ms.text }}>
                      {ms.label}
                    </span>
                  )}

                  {/* Score */}
                  <div className="font-nunito font-black text-2xl text-gs-green flex-shrink-0">
                    {s.score}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Footer: total count */}
      {!loading && !error && (
        <div className="mt-4 text-center text-xs text-gs-text-light font-semibold">
          {filterMode === 'all'
            ? `Hiển thị top 10 / ${allScores.length} lượt chơi`
            : `${displayed.length} kết quả cho chế độ ${FILTER_MODES.find(m=>m.id===filterMode)?.label}`
          }
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
