import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Users, Zap, Copy, Check } from 'lucide-react';
import { rtdb, db } from '../firebase';
import { ref, onValue, set, push, onDisconnect, update, get, serverTimestamp } from 'firebase/database';
import { collection, addDoc, serverTimestamp as firestoreTimestamp } from 'firebase/firestore';
import { playEatSound, playGameOverSound } from '../utils/audio';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

const INITIAL_SNAKE_P1 = [{ x: 5, y: 10 }, { x: 4, y: 10 }, { x: 3, y: 10 }];
const INITIAL_SNAKE_P2 = [{ x: 15, y: 10 }, { x: 16, y: 10 }, { x: 17, y: 10 }];

const MultiplayerGame = ({ onBack, currentUser, firebaseUser }) => {
  const canvasRef = useRef(null);
  const [roomId, setRoomId] = useState(null);
  const [playerRole, setPlayerRole] = useState(null);
  const [roomStatus, setRoomStatus] = useState('menu');
  const [winner, setWinner] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(null);

  const [gameState, setGameState] = useState({
    player1: { snake: INITIAL_SNAKE_P1, direction: { x: 1, y: 0 }, score: 0 },
    player2: { snake: INITIAL_SNAKE_P2, direction: { x: -1, y: 0 }, score: 0 },
    food: { x: 10, y: 10 }
  });

  const directionRef  = useRef({ x: 0, y: 0 });
  const gameLoopRef   = useRef(null);
  const lastUpdateRef = useRef(0);
  const roomRef       = useRef(null);

  // Local prediction refs to fix network latency rubber-banding
  const mySnakeRef = useRef(null);
  const myScoreRef = useRef(0);
  const foodRef    = useRef(null);

  // ── Copy room ID ──────────────────────────────────────────────
  const copyRoomId = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Create Room ───────────────────────────────────────────────
  const createRoom = async () => {
    if (!firebaseUser) return;
    setRoomStatus('matchmaking');
    const newRoomRef = push(ref(rtdb, 'rooms'));
    await set(newRoomRef, {
      status: 'waiting',
      player1: { uid: firebaseUser.uid, username: currentUser, snake: INITIAL_SNAKE_P1, direction: { x: 1, y: 0 }, score: 0, ready: true },
      food: { x: 10, y: 5 },
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp()
    });
    setRoomId(newRoomRef.key);
    setPlayerRole('player1');
    directionRef.current = { x: 1, y: 0 };
  };

  // ── Join Room ─────────────────────────────────────────────────
  const joinRoom = async () => {
    if (!firebaseUser || !joinCode.trim()) return;
    setErrorMsg('');
    const code = joinCode.trim();
    const rRef = ref(rtdb, `rooms/${code}`);
    const snap = await get(rRef);
    const data = snap.val();
    if (!data)                       { setErrorMsg('Không tìm thấy phòng!'); return; }
    if (data.status !== 'waiting')   { setErrorMsg('Phòng đã bắt đầu hoặc kết thúc!'); return; }
    if (data.player1.uid === firebaseUser.uid) {
      setRoomId(code); setPlayerRole('player1'); setRoomStatus('matchmaking'); return;
    }
    setRoomStatus('matchmaking');
    const updates = {};
    updates[`rooms/${code}/player2`] = { uid: firebaseUser.uid, username: currentUser, snake: INITIAL_SNAKE_P2, direction: { x: -1, y: 0 }, score: 0, ready: true };
    updates[`rooms/${code}/status`] = 'countdown';
    updates[`rooms/${code}/countdown`] = 3;
    updates[`rooms/${code}/gameStartAt`] = Date.now() + 3000;
    updates[`rooms/${code}/lastActive`] = serverTimestamp();
    await update(ref(rtdb), updates);
    setRoomId(code); setPlayerRole('player2');
    directionRef.current = { x: -1, y: 0 };
  };

  // ── Sync room data ────────────────────────────────────────────
  useEffect(() => {
    if (!roomId) return;
    const rRef = ref(rtdb, `rooms/${roomId}`);
    roomRef.current = rRef;
    const unsub = onValue(rRef, (snap) => {
      const data = snap.val();
      if (!data) return;
      if (data.status === 'countdown') {
        setRoomStatus('countdown');
        setCountdown(data.countdown);
      }
      if (data.status === 'playing') {
        setRoomStatus('playing');
        setGameState(prev => ({ ...prev, player1: data.player1 || prev.player1, player2: data.player2 || prev.player2, food: data.food || prev.food }));
        
        // If we haven't initialized our local prediction refs yet, do it now
        if (!mySnakeRef.current) {
          mySnakeRef.current = data[playerRole]?.snake || (playerRole === 'player1' ? INITIAL_SNAKE_P1 : INITIAL_SNAKE_P2);
          myScoreRef.current = data[playerRole]?.score || 0;
        }
        
        // Always sync food from server if we didn't just eat it
        // To keep it simple, we sync food unless we locally predict it.
        // Actually, just update foodRef from server, it's safer if opponent ate it.
        if (data.food && (!foodRef.current || (foodRef.current.x !== data.food.x || foodRef.current.y !== data.food.y))) {
           foodRef.current = data.food;
        }
      }
      if (data.status === 'finished') { setRoomStatus('finished'); setWinner(data.winner); }
    });
    const pRef = ref(rtdb, `rooms/${roomId}/${playerRole}/ready`);
    onDisconnect(pRef).set(false);
    return () => unsub();
  }, [roomId, playerRole]);

  // ── Save victory ──────────────────────────────────────────────
  useEffect(() => {
    if (roomStatus === 'finished' && winner === playerRole && !roomRef.current?.scoreSaved) {
      (async () => {
        try {
          await addDoc(collection(db, 'scores'), { username: currentUser, uid: firebaseUser.uid, score: gameState[playerRole]?.score || 0, mode: 'multiplayer', createdAt: firestoreTimestamp() });
          if (roomRef.current) roomRef.current.scoreSaved = true;
        } catch (_) {}
      })();
    }
  }, [roomStatus, winner, playerRole, currentUser, firebaseUser, gameState]);

  // __countdown timer server-sync_____________________________
  useEffect(() => {
  if (
    roomStatus !== 'countdown' ||
    playerRole !== 'player1' ||
    !roomId
  ) return;

  const interval = setInterval(async () => {
    const room = await get(ref(rtdb, `rooms/${roomId}`));

    if (!room.exists()) return;

    const data = room.val();

    if (data.countdown > 1) {
      await update(
        ref(rtdb, `rooms/${roomId}`),
        {
          countdown: data.countdown - 1
        }
      );
    } else {
      await update(
        ref(rtdb, `rooms/${roomId}`),
        {
          countdown: 0,
          status: 'playing'
        }
      );
    }
  }, 1000);

  return () => clearInterval(interval);

}, [roomStatus, roomId, playerRole]);

  // ── Input ─────────────────────────────────────────────────────
  useEffect(() => {
    const down = (e) => {
      const k = e.key.toLowerCase();
      let d = null;
      if (k === 'arrowup'    || k === 'w') d = { x: 0,  y: -1 };
      if (k === 'arrowdown'  || k === 's') d = { x: 0,  y: 1  };
      if (k === 'arrowleft'  || k === 'a') d = { x: -1, y: 0  };
      if (k === 'arrowright' || k === 'd') d = { x: 1,  y: 0  };
      if (d) {
        const c = directionRef.current;
        // Prevent 180 turn
        if ((d.x === -c.x && d.x !== 0) || (d.y === -c.y && d.y !== 0)) return;
        
        // Prevent turning back on the snake's neck
        if (mySnakeRef.current && mySnakeRef.current.length > 1) {
           const head = mySnakeRef.current[0];
           const neck = mySnakeRef.current[1];
           if (head.x + d.x === neck.x && head.y + d.y === neck.y) return;
        }
        
        directionRef.current = d;
      }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, []);

  // ── Game loop ─────────────────────────────────────────────────
  useEffect(() => {
    if (
    roomStatus !== 'playing'
    || !playerRole
    || !roomId
    ) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const genFood = (s1, s2) => {
      let f;
      do { f = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) }; }
      while (s1.some(s => s.x === f.x && s.y === f.y) || s2.some(s => s.x === f.x && s.y === f.y));
      return f;
    };

    const loop = async (ts) => {
      if (!lastUpdateRef.current) lastUpdateRef.current = ts;
      const dt = ts - lastUpdateRef.current;

      if (dt > 150) {
        lastUpdateRef.current = ts;
        
        // Local Prediction State
        const myLocalSnake = mySnakeRef.current || gameState[playerRole]?.snake;
        let myLocalScore   = myScoreRef.current !== null ? myScoreRef.current : (gameState[playerRole]?.score || 0);
        
        const opRole = playerRole === 'player1' ? 'player2' : 'player1';
        const op = gameState[opRole];
        
        if (!myLocalSnake || !op || !op.snake) { gameLoopRef.current = requestAnimationFrame(loop); return; }

        const nh = { x: myLocalSnake[0].x + directionRef.current.x, y: myLocalSnake[0].y + directionRef.current.y };
        let lost = nh.x < 0 || nh.x >= GRID_SIZE || nh.y < 0 || nh.y >= GRID_SIZE
          || myLocalSnake.some(s => s.x === nh.x && s.y === nh.y)
          || op.snake.some(s => s.x === nh.x && s.y === nh.y);

        if (lost) {
          playGameOverSound();
          await update(ref(rtdb, `rooms/${roomId}`), { status: 'finished', winner: opRole });
          return;
        }

        const ns = [nh, ...myLocalSnake];
        let foodUpdate = null;
        const currentFood = foodRef.current || gameState.food;
        
        if (currentFood && nh.x === currentFood.x && nh.y === currentFood.y) {
          playEatSound(); 
          myLocalScore += 10;
          
          // Both players can generate food to fix P2 food bug
          const newFood = genFood(ns, op.snake);
          foodRef.current = newFood; // Update local food instantly
          foodUpdate = newFood;
        } else { 
          ns.pop(); 
        }

        // Apply local predictions immediately
        mySnakeRef.current = ns;
        myScoreRef.current = myLocalScore;

        const upd = {};
        upd[`rooms/${roomId}/${playerRole}/snake`] = ns;
        upd[`rooms/${roomId}/${playerRole}/score`] = myLocalScore;
        upd[`rooms/${roomId}/lastActive`] = serverTimestamp();
        if (foodUpdate) upd[`rooms/${roomId}/food`] = foodUpdate;
        update(ref(rtdb), upd);
      }

      // ── Draw ──
      // Checkerboard (Google Snake style)
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          ctx.fillStyle = (x + y) % 2 === 0 ? '#aad751' : '#a2d149';
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }
      // Food apple
      const activeFood = foodRef.current || gameState.food;
      if (activeFood) {
        const fx = activeFood.x * CELL_SIZE + CELL_SIZE / 2;
        const fy = activeFood.y * CELL_SIZE + CELL_SIZE / 2;
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath(); ctx.arc(fx, fy, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#27ae60';
        ctx.beginPath(); ctx.ellipse(fx + 2, fy - 8, 3, 1.5, Math.PI / 4, 0, Math.PI * 2); ctx.fill();
      }

      // Draw P1 & P2 Snakes
      const drawSnake = (snake, isP1) => {
        if (!snake || snake.length === 0) return;
        const headColor = isP1 ? '#1565c0' : '#e65100';
        const bodyColor = isP1 ? '#1a73e8' : '#fb8c00';
        
        snake.forEach((seg, i) => {
          ctx.fillStyle = i === 0 ? headColor : bodyColor;
          const r = i === 0 ? 6 : 4;
          ctx.beginPath(); 
          ctx.roundRect(seg.x * CELL_SIZE + 1, seg.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2, r);
          ctx.fill();

          if (i === 0) {
            // Cute simple eyes for the head
            ctx.fillStyle = 'white';
            ctx.beginPath(); ctx.arc(seg.x * CELL_SIZE + 6, seg.y * CELL_SIZE + 6, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(seg.x * CELL_SIZE + CELL_SIZE - 6, seg.y * CELL_SIZE + 6, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'black';
            ctx.beginPath(); ctx.arc(seg.x * CELL_SIZE + 6, seg.y * CELL_SIZE + 6, 1.2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(seg.x * CELL_SIZE + CELL_SIZE - 6, seg.y * CELL_SIZE + 6, 1.2, 0, Math.PI * 2); ctx.fill();
          }
        });
      };

      drawSnake(p1Snake, true);
      drawSnake(p2Snake, false);

      // Draw Floating Name Tags ("BẠN", "ĐỐI THỦ")
      const drawLabel = (snake, text, bgColor) => {
        if (!snake || snake.length === 0) return;
        const head = snake[0];
        const hx = head.x * CELL_SIZE + CELL_SIZE / 2;
        const hy = head.y * CELL_SIZE - 6;
        
        ctx.font = '900 10px "Nunito"';
        const metrics = ctx.measureText(text);
        const w = metrics.width + 10;
        
        // Tooltip box
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(hx - w/2, hy - 16, w, 14, 4);
        } else {
          ctx.rect(hx - w/2, hy - 16, w, 14);
        }
        ctx.fill();
        
        // Tooltip arrow
        ctx.beginPath();
        ctx.moveTo(hx - 4, hy - 2);
        ctx.lineTo(hx + 4, hy - 2);
        ctx.lineTo(hx, hy + 3);
        ctx.fill();
        
        // Text
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, hx, hy - 9);
      };

      if (playerRole === 'player1') {
        drawLabel(p1Snake, 'BẠN', '#1565c0');
        drawLabel(p2Snake, 'ĐỐI THỦ', '#e65100');
      } else if (playerRole === 'player2') {
        drawLabel(p2Snake, 'BẠN', '#e65100');
        drawLabel(p1Snake, 'ĐỐI THỦ', '#1565c0');
      }

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [roomStatus, playerRole, roomId, gameState]);

  // ═══════════════════ RENDER ═══════════════════
  return (
    <div className="gs-card px-6 py-7 w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="gs-back"><ChevronLeft className="w-5 h-5" /></button>
        <Users className="w-6 h-6 text-gs-orange" />
        <h2 className="font-nunito font-black text-2xl text-gs-text">1 VS 1 Online</h2>
        <span className={`ml-auto text-xs font-bold px-3 py-1 rounded-full ${
          roomStatus === 'countdown' ? 'Bắt đầu': roomStatus === 'playing'? 'Đang chơi' ? 'bg-green-100 text-green-700' :
          roomStatus === 'matchmaking' ? 'bg-yellow-100 text-yellow-700' :
          'bg-gs-bg text-gs-text-light'
        : 'bg-gs-bg text-gs-text-light'}`}>
          {roomStatus === 'menu' ? 'Chọn phòng' : roomStatus === 'matchmaking' ? 'Chờ đối thủ...' : roomStatus === 'countdown' ? '⏳ Bắt đầu' : roomStatus === 'playing' ? '🟢 Đang chơi' : '🏁 Kết thúc'}
        </span>
      </div>

      {/* Score bar (only while playing) */}
      {(roomStatus === 'playing' || roomStatus === 'finished') && (
        <div className="flex justify-between items-center mb-3 bg-gs-bg rounded-2xl px-5 py-3 border-2 border-gs-border">
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${playerRole === 'player1' ? 'bg-gs-blue' : 'bg-gs-orange'}`} />
            <span className="font-nunito font-black text-gs-text">BẠN</span>
            <span className={`font-nunito font-black text-xl ml-2 ${playerRole === 'player1' ? 'text-gs-blue' : 'text-gs-orange'}`}>
              {gameState[playerRole]?.score ?? 0}
            </span>
          </div>
          <span className="font-black text-gs-text-light">VS</span>
          <div className="flex items-center gap-2">
            <span className={`font-nunito font-black text-xl mr-2 ${playerRole === 'player1' ? 'text-gs-orange' : 'text-gs-blue'}`}>
              {gameState[playerRole === 'player1' ? 'player2' : 'player1']?.score ?? 0}
            </span>
            <span className="font-nunito font-black text-gs-text">ĐỐI THỦ</span>
            <div className={`w-4 h-4 rounded ${playerRole === 'player1' ? 'bg-gs-orange' : 'bg-gs-blue'}`} />
          </div>
        </div>
      )}

      {/* Canvas area */}
      <div className="relative rounded-2xl overflow-hidden border-4 border-gs-border shadow-card"
        style={{ width: CANVAS_SIZE, maxWidth: '100%', margin: '0 auto' }}>
        <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE}
          className={`block ${roomStatus !== 'playing' ? 'opacity-0 h-0' : ''}`}
          style={{ imageRendering: 'pixelated' }} />

        <AnimatePresence mode="wait">
          {/* ── COUNTDOWN ── */}
          {roomStatus === 'countdown' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="
                absolute
                inset-0
                bg-black/40
                flex
                items-center
                justify-center
                z-50
              "
            >
              <motion.div
                key={countdown}
                initial={{
                  scale: 0.5,
                  opacity: 0
                }}
                animate={{
                  scale: 1,
                  opacity: 1
                }}
                transition={{
                  type: 'spring',
                  stiffness: 250
                }}
                className="
                  text-white
                  text-8xl
                  font-black
                "
              >
                {countdown > 0
                  ? countdown
                  : 'GO!'
                }
              </motion.div>
            </motion.div>
          )}
          {/* ── MENU ── */}
          {roomStatus === 'menu' && (
            <motion.div key="menu"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col gap-4 p-5 bg-white/95 backdrop-blur rounded-2xl max-h-[100%] overflow-y-auto"
            >
              {/* Game Rules Card */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 text-sm text-gs-text">
                <h3 className="font-nunito font-black text-lg text-blue-800 mb-2 flex items-center gap-2">
                  <span>📜</span> Luật chơi 1 VS 1
                </h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Hai người chơi sẽ điều khiển 2 chú rắn trên cùng một bản đồ.</li>
                  <li>Ăn táo để tăng điểm và làm dài thân.</li>
                  <li>Trò chơi sẽ kết thúc và bạn sẽ <b>THUA</b> nếu:</li>
                  <ul className="list-[circle] pl-5 text-red-600 font-bold mt-1 mb-1">
                    <li>Đâm vào tường bao quanh.</li>
                    <li>Đâm vào thân của chính mình.</li>
                    <li>Đâm vào đầu hoặc thân của đối thủ.</li>
                  </ul>
                  <li>Mẹo: Hãy dùng thân của mình ép đối thủ vào đường cùng!</li>
                </ul>
              </div>

              <div className="h-px w-full bg-gs-border/50" />

              <button onClick={createRoom}
                className="gs-btn w-full flex items-center justify-center gap-3 py-4 text-lg">
                <Zap className="w-5 h-5" /> Tạo Phòng Mới
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gs-border" />
                <span className="text-gs-text-light text-xs font-bold">HOẶC NHẬP MÃ PHÒNG</span>
                <div className="flex-1 h-px bg-gs-border" />
              </div>

              <div className="flex flex-col gap-2">
                <input type="text" placeholder="Dán mã phòng vào đây..."
                  value={joinCode} onChange={e => setJoinCode(e.target.value)}
                  className="w-full bg-gs-bg border-2 border-gs-border rounded-2xl px-4 py-3.5
                    font-nunito font-bold text-gs-text outline-none focus:border-gs-green transition-all
                    text-center placeholder:text-gs-text-light"
                />
                {errorMsg && <p className="text-red-500 text-sm font-bold text-center">{errorMsg}</p>}
                <button onClick={joinRoom}
                  className="gs-btn-outline w-full py-3.5 font-bold text-gs-green border-gs-green hover:bg-green-50">
                  Vào Phòng →
                </button>
              </div>
            </motion.div>
          )}

          {/* ── MATCHMAKING ── */}
          {roomStatus === 'matchmaking' && (
            <motion.div key="mm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-5 p-8 min-h-[300px]"
            >
              <div className="text-5xl float-snake">🐍</div>
              <p className="font-nunito font-black text-xl text-gs-text">Đang chờ đối thủ...</p>

              {roomId && (
                <div className="w-full bg-gs-bg rounded-2xl border-2 border-gs-border p-4 text-center">
                  <p className="text-xs text-gs-text-light font-bold mb-2">📋 Gửi mã phòng cho bạn bè:</p>
                  <p className="font-nunito font-black text-lg text-gs-green break-all mb-3">{roomId}</p>
                  <button onClick={copyRoomId}
                    className="gs-btn-outline flex items-center justify-center gap-2 mx-auto px-5 py-2 text-sm">
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Đã sao chép!' : 'Sao chép mã'}
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <span className="gg-dot w-3 h-3 bg-gs-green" />
                <span className="gg-dot w-3 h-3 bg-gs-green-dark" />
                <span className="gg-dot w-3 h-3 bg-gs-green" />
              </div>
            </motion.div>
          )}

          {/* ── FINISHED ── */}
          {roomStatus === 'finished' && (
            <motion.div key="fin"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/90 backdrop-blur flex flex-col items-center justify-center gap-5 p-8"
            >
              <div className="winner-pop text-center">
                <div className="text-6xl mb-2">{winner === playerRole ? '🏆' : '😅'}</div>
                <h2 className={`font-nunito font-black text-4xl ${winner === playerRole ? 'text-gs-green' : 'text-orange-500'}`}>
                  {winner === playerRole ? 'Chiến Thắng!' : 'Thua Rồi!'}
                </h2>
              </div>
              <button onClick={onBack} className="gs-btn px-10 py-4">Về Menu</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      {(roomStatus === 'playing' || roomStatus === 'finished') && (
        <div className="flex justify-center gap-6 mt-4 text-sm font-bold text-gs-text-light">
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-gs-blue" /> Bạn (P1)</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-gs-orange" /> Đối thủ (P2)</div>
        </div>
      )}
    </div>
  );
};

export default MultiplayerGame;
