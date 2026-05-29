import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, RotateCcw, Volume2, VolumeX, ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';
import { playEatSound, playGameOverSound, playBGM, stopBGM } from '../utils/audio';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { translations } from '../utils/translations';
import { Pause, Play } from 'lucide-react';

const GRID_SIZE = 20;
const CELL_SIZE = 30; 
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 }; 
const GAME_SPEED = 120; 

const MAZE_WALLS = [
  { x: 5, y: 5 }, { x: 5, y: 6 }, { x: 5, y: 7 },
  { x: 14, y: 5 }, { x: 14, y: 6 }, { x: 14, y: 7 },
  { x: 5, y: 14 }, { x: 5, y: 13 }, { x: 5, y: 12 },
  { x: 14, y: 14 }, { x: 14, y: 13 }, { x: 14, y: 12 },
];

// Initialize food
const generateFood = (snake) => {
  let newFood;
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    // Ensure food doesn't spawn on the snake
    const isOnSnake = snake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
    if (!isOnSnake) break;
  }
  return newFood;
};

// Save score to Firestore
const saveScoreToFirestore = async (user, score, mode) => {
  if (!user) return;
  try {
    await addDoc(collection(db, 'scores'), {
      username: user.displayName || user.email?.split('@')[0] || 'Anonymous',
      uid: user.uid,
      score,
      mode,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to save score:', err);
  }
};

function Game({ mode = 'classic', onBack, currentUser, firebaseUser, lang = 'vi', isMuted = false, onToggleMute }) {
  const t = translations[lang];
  const canvasRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isCountingDown, setIsCountingDown] = useState(true);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const scoreRef = useRef(0);
  const [isShaking, setIsShaking] = useState(false);
  const scoreSavedRef = useRef(false);
  const setIsMuted = onToggleMute || (() => {}); // use parent toggle if provided

  // Game state refs (to avoid dependency issues in loop)
  const snakeRef = useRef(INITIAL_SNAKE);
  const prevSnakeRef = useRef(INITIAL_SNAKE);
  const directionRef = useRef(INITIAL_DIRECTION);
  const dirQueueRef = useRef([]);
  const foodRef = useRef(generateFood(INITIAL_SNAKE));
  const gameLoopRef = useRef(null);
  const lastRenderTimeRef = useRef(0);
  const lastStepTimeRef = useRef(0);
  const speedRef = useRef(GAME_SPEED);
  
  const [foodType, setFoodType] = useState('normal');
  const [foodStyle, setFoodStyle] = useState({ 
    color: '#ff5252', 
    pattern: 'plain' 
  });
  const [isGhost, setIsGhost] = useState(false);
  const ghostTimerRef = useRef(null);

  // High-performance refs for animation
  const particlesRef = useRef([]);
  const trailsRef = useRef([]);
  const leavesRef = useRef([]);
  const bulgesRef = useRef([]); 
  const [isBiting, setIsBiting] = useState(false); // To trigger the snap animation

  const triggerGameOver = useCallback(() => {
    playGameOverSound();
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 300);
    setGameOver(true);
    if (firebaseUser && !scoreSavedRef.current) {
      scoreSavedRef.current = true;
      saveScoreToFirestore(firebaseUser, scoreRef.current, mode);
    }
  }, [firebaseUser, mode]);

  const resetGame = useCallback(() => {
    snakeRef.current = INITIAL_SNAKE;
    directionRef.current = INITIAL_DIRECTION;
    dirQueueRef.current = [];
    setScore(0);
    scoreRef.current = 0;
    setGameOver(false);
    setCountdown(3);
    setIsCountingDown(true);
    bulgesRef.current = [];
    scoreSavedRef.current = false;
    foodRef.current = generateFood(INITIAL_SNAKE);
    speedRef.current = GAME_SPEED;
    setFoodType('normal');
    setIsGhost(false);
    // Reset animation refs
    particlesRef.current = [];
    trailsRef.current = [];
  }, []);

  const togglePause = useCallback(() => {
    if (!gameOver) {
      setIsPaused(prev => !prev);
    }
  }, [gameOver]);

  // Weather init (run once)
  useEffect(() => {
    leavesRef.current = Array.from({ length: 20 }).map(() => ({
      x: Math.random() * CANVAS_SIZE,
      y: Math.random() * CANVAS_SIZE,
      v: 0.5 + Math.random() * 1.5,
      s: 0.5 + Math.random(),
      r: Math.random() * Math.PI * 2
    }));
  }, []);

  useEffect(() => {
    if (!isCountingDown) return;

    if (countdown <= 0) {
      setIsCountingDown(false);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, isCountingDown]);

  const handleDirectionInput = useCallback((newDir) => {
    if (!newDir) return;
    const currentPlannedDir = dirQueueRef.current.length > 0
      ? dirQueueRef.current[dirQueueRef.current.length - 1]
      : directionRef.current;

    // Prevent 180 degree turn
    const isOpposite = (newDir.x === -currentPlannedDir.x && newDir.x !== 0) ||
                       (newDir.y === -currentPlannedDir.y && newDir.y !== 0);

    if (!isOpposite && dirQueueRef.current.length < 3) {
      dirQueueRef.current.push(newDir);
    }
  }, []);

  const [touchStart, setTouchStart] = useState(null);

  const handleTouchStart = (e) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;

    const touchEnd = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };

    const dx = touchEnd.x - touchStart.x;
    const dy = touchEnd.y - touchStart.y;
    
    // Ignore small movements
    if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) handleDirectionInput({ x: 1, y: 0 }); // Right
      else handleDirectionInput({ x: -1, y: 0 }); // Left
    } else {
      if (dy > 0) handleDirectionInput({ x: 0, y: 1 }); // Down
      else handleDirectionInput({ x: 0, y: -1 }); // Up
    }

    setTouchStart(null);
  };

  // Handle Input
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent default scrolling for arrow keys
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      if (isPaused) return;

      if (gameOver && e.key === " ") {
        resetGame();
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'p' || key === 'escape') {
        togglePause();
        return;
      }
      let newDir = null;

      if (key === 'arrowup' || key === 'w') newDir = { x: 0, y: -1 };
      if (key === 'arrowdown' || key === 's') newDir = { x: 0, y: 1 };
      if (key === 'arrowleft' || key === 'a') newDir = { x: -1, y: 0 };
      if (key === 'arrowright' || key === 'd') newDir = { x: 1, y: 0 };

      handleDirectionInput(newDir);
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, resetGame, handleDirectionInput]);

  // 1. Game Physics / Update Loop
  useEffect(() => {
    if (gameOver || isPaused || isCountingDown) return;

    const gameTick = () => {
      // Track previous state for interpolation
      prevSnakeRef.current = [...snakeRef.current];
      lastStepTimeRef.current = performance.now();

      // Add to trails
      const head = snakeRef.current[0];
      if (head) {
        trailsRef.current = [{ x: head.x, y: head.y, life: 1.0 }, ...trailsRef.current].slice(0, 45);
      }

      // Update Direction from Queue
      if (dirQueueRef.current.length > 0) {
        directionRef.current = dirQueueRef.current.shift();
      }

      const currentHead = snakeRef.current[0];
      if (!currentHead) return;

      let newHead = {
        x: currentHead.x + directionRef.current.x,
        y: currentHead.y + directionRef.current.y
      };

      // Brick logic
      if (mode === 'brick') {
        if (MAZE_WALLS.some(w => w.x === newHead.x && w.y === newHead.y)) {
          triggerGameOver(); return;
        }
      }

      // Collision logic
      if (mode !== 'borderless') {
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
          triggerGameOver(); return;
        }
      } else {
        if (newHead.x < 0) newHead.x = GRID_SIZE - 1;
        if (newHead.x >= GRID_SIZE) newHead.x = 0;
        if (newHead.y < 0) newHead.y = GRID_SIZE - 1;
        if (newHead.y >= GRID_SIZE) newHead.y = 0;
      }

      if (!isGhost && snakeRef.current.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
        triggerGameOver(); return;
      }

      const newSnake = [newHead, ...snakeRef.current];

      // Food Collision
      if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
        const points = foodType === 'golden' ? 50 : 10;
        
        if (foodType === 'ghost') {
          setIsGhost(true);
          if (ghostTimerRef.current) clearTimeout(ghostTimerRef.current);
          ghostTimerRef.current = setTimeout(() => setIsGhost(false), 5000);
        }

        setScore(s => {
          const ns = s + points;
          scoreRef.current = ns;
          if (ns > highScore) setHighScore(ns);
          return ns;
        });
        
        // Burst particles
        const burst = Array.from({ length: 12 }).map(() => ({
          x: newHead.x * CELL_SIZE + CELL_SIZE/2,
          y: newHead.y * CELL_SIZE + CELL_SIZE/2,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          life: 1.0,
          color: foodType === 'golden' ? '#f1c40f' : '#e74c3c'
        }));
        particlesRef.current = [...particlesRef.current, ...burst];

        foodRef.current = generateFood(newSnake);
        
        // Randomize Apple Style
        const colors = ['#ff7675', '#fdcb6e', '#a29bfe', '#e84393', '#00cec9', '#fab1a0'];
        const patterns = ['plain', 'dots', 'stripes_h', 'stripes_v'];
        setFoodStyle({
          color: colors[Math.floor(Math.random() * colors.length)],
          pattern: patterns[Math.floor(Math.random() * patterns.length)]
        });

        const rand = Math.random();
        if (rand > 0.95) setFoodType('ghost');
        else if (rand > 0.85) setFoodType('golden');
        else setFoodType('normal');
        
        playEatSound();
        setIsShaking(true);
        setIsBiting(true);
        setTimeout(() => {
          setIsShaking(false);
          setIsBiting(false);
        }, 150);
        
        // Add a new swallow bulge
        bulgesRef.current.push({ segmentIndex: 0 });

        if (mode === 'classic' && speedRef.current > 50) speedRef.current -= 4;
      } else {
        newSnake.pop();
      }
      snakeRef.current = newSnake;
    };

    gameLoopRef.current = setInterval(gameTick, speedRef.current);
    return () => clearInterval(gameLoopRef.current);
  }, [gameOver, isPaused, isGhost, foodType, mode, triggerGameOver]);

  // 2. Render Loop (using requestAnimationFrame)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = (timestamp) => {
      const elapsed = timestamp - lastStepTimeRef.current;
      const progress = Math.max(0, Math.min(elapsed / speedRef.current, 1));

      // Update Bulges (move them down the body)
      bulgesRef.current = bulgesRef.current.map(b => ({
        ...b,
        segmentIndex: b.segmentIndex + 0.1 // Slowly travel down
      })).filter(b => b.segmentIndex < snakeRef.current.length);

      // 1. Authentic Google Checkerboard
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          ctx.fillStyle = (x + y) % 2 === 0 ? '#aad751' : '#a2d149';
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }

      if (mode === 'brick') {
        MAZE_WALLS.forEach(w => {
          const wx = w.x * CELL_SIZE, wy = w.y * CELL_SIZE;
          // Base brick color
          ctx.fillStyle = '#c0392b';
          ctx.beginPath(); ctx.roundRect(wx + 1, wy + 1, CELL_SIZE - 2, CELL_SIZE - 2, 3); ctx.fill();
          // Brick mortar lines
          ctx.strokeStyle = '#922b21';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(wx + 4, wy + CELL_SIZE/2); ctx.lineTo(wx + CELL_SIZE - 4, wy + CELL_SIZE/2); // horizontal
          ctx.moveTo(wx + CELL_SIZE/2, wy + 2); ctx.lineTo(wx + CELL_SIZE/2, wy + CELL_SIZE/2 - 1); // top vertical
          ctx.moveTo(wx + CELL_SIZE/4, wy + CELL_SIZE/2 + 1); ctx.lineTo(wx + CELL_SIZE/4, wy + CELL_SIZE - 2); // bottom-left vertical
          ctx.moveTo(wx + CELL_SIZE*3/4, wy + CELL_SIZE/2 + 1); ctx.lineTo(wx + CELL_SIZE*3/4, wy + CELL_SIZE - 2); // bottom-right vertical
          ctx.stroke();
          // Highlight edge
          ctx.fillStyle = 'rgba(255,255,255,0.12)';
          ctx.beginPath(); ctx.moveTo(wx+1,wy+1); ctx.lineTo(wx+CELL_SIZE-1,wy+1); ctx.lineTo(wx+CELL_SIZE-1,wy+4); ctx.lineTo(wx+1,wy+4); ctx.fill();
        });
      }

      // Weather / Leaves animation (Google Meadow feel)
      leavesRef.current.forEach(l => {
        l.y += l.v;
        l.r += 0.01;
        if (l.y > CANVAS_SIZE) {
          l.y = -10;
          l.x = Math.random() * CANVAS_SIZE;
        }
        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.r);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.beginPath(); ctx.ellipse(0, 0, 8*l.s, 4*l.s, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });

      // ── 2. APPLE (Flat Design) ───────────
      const food = foodRef.current;
      const fx = food.x * CELL_SIZE + CELL_SIZE / 2;
      const fy = food.y * CELL_SIZE + CELL_SIZE / 2;
      const fr = 12; // fruit radius

      const appleColor = foodType === 'golden' ? '#f1c40f' : foodType === 'ghost' ? '#a29bfe' : '#ff4757';
      const leafColor  = foodType === 'ghost' ? '#a29bfe' : '#2ed573';

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath(); ctx.arc(fx, fy + 4, fr, 0, Math.PI * 2); ctx.fill();

      // Body
      ctx.fillStyle = appleColor;
      ctx.beginPath(); ctx.arc(fx, fy, fr, 0, Math.PI * 2); ctx.fill();

      // Flat Shine Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath(); ctx.ellipse(fx - 4, fy - 4, 4, 3, -Math.PI/4, 0, Math.PI * 2); ctx.fill();

      // Stem
      ctx.strokeStyle = '#574b90'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(fx, fy - fr + 1); ctx.quadraticCurveTo(fx + 2, fy - fr - 4, fx + 2, fy - fr - 6); ctx.stroke();

      // Leaf
      ctx.fillStyle = leafColor;
      ctx.beginPath(); ctx.ellipse(fx + 6, fy - fr - 2, 5, 2.5, -Math.PI / 4, 0, Math.PI * 2); ctx.fill();

      // ── 3. SNAKE BODY (Apple Worm Style) ──
      const snakeLen = snakeRef.current.length;

      const getInterpPos = (seg, prevSeg) => {
        let diffX = seg.x - prevSeg.x;
        let diffY = seg.y - prevSeg.y;
        if (Math.abs(diffX) > 1 || Math.abs(diffY) > 1) {
          return {
            x: seg.x * CELL_SIZE + CELL_SIZE / 2,
            y: seg.y * CELL_SIZE + CELL_SIZE / 2
          };
        }
        return {
          x: (prevSeg.x + diffX * progress) * CELL_SIZE + CELL_SIZE / 2,
          y: (prevSeg.y + diffY * progress) * CELL_SIZE + CELL_SIZE / 2
        };
      };

      const points = [];
      for (let i = 0; i < snakeLen; i++) {
        const seg = snakeRef.current[i];
        const prevSeg = prevSnakeRef.current[i] || seg;
        points.push(getInterpPos(seg, prevSeg));
      }

      const bodyColor = isGhost ? 'rgba(69,119,235,0.45)' : '#00b100';
      const strokeColor = '#000000';
      const baseLineWidth = 26;

      // Draw thick black outline for the entire body
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = baseLineWidth + 6; 
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        const curr = points[i];
        if (i === 0) {
          ctx.moveTo(curr.x, curr.y);
        } else {
          const prev = points[i - 1];
          if (Math.hypot(curr.x - prev.x, curr.y - prev.y) > CELL_SIZE * 1.5) {
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(curr.x, curr.y);
          } else {
            ctx.lineTo(curr.x, curr.y);
          }
        }
      }
      ctx.stroke();

      // Draw inner body color (Solid Green)
      ctx.strokeStyle = bodyColor;
      ctx.lineWidth = baseLineWidth;
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        const curr = points[i];
        if (i === 0) {
          ctx.moveTo(curr.x, curr.y);
        } else {
          const prev = points[i - 1];
          if (Math.hypot(curr.x - prev.x, curr.y - prev.y) > CELL_SIZE * 1.5) {
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(curr.x, curr.y);
          } else {
            ctx.lineTo(curr.x, curr.y);
          }
        }
      }
      ctx.stroke();

      // ── 4. HEAD (Apple Worm Style) ───────────────────────────────────────────
      if (points.length > 0) {
        const headPt = points[0];
        ctx.save();
        ctx.translate(headPt.x, headPt.y);
        const angle = Math.atan2(directionRef.current.y, directionRef.current.x);
        ctx.rotate(angle);

        const R = baseLineWidth / 2; // 13

        // Big thick purple/pink lips sticking out front and bottom
        ctx.fillStyle = '#b52989'; // deep pink/purple
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(R - 6, 0, 20, 14, 7);
        } else {
          ctx.rect(R - 6, 0, 20, 14);
        }
        ctx.fill();
        ctx.stroke();

        // Mouth opening (straight black line across the lips)
        const distToFood = Math.hypot(snakeRef.current[0].x - foodRef.current.x, snakeRef.current[0].y - foodRef.current.y);
        const isMouthOpen = distToFood < 2 || isBiting;
        
        ctx.beginPath();
        if (isMouthOpen) {
          ctx.fillStyle = '#4a0e1c';
          if (ctx.roundRect) {
            ctx.roundRect(R - 1, 3, 10, 8, 4);
          } else {
            ctx.rect(R - 1, 3, 10, 8);
          }
          ctx.fill();
        } else {
          ctx.moveTo(R - 4, 7);
          ctx.lineTo(R + 12, 7);
          ctx.stroke();
        }

        // Eyes (Huge white overlapping circles sticking out on top)
        const drawEye = (ex, ey, radius) => {
          // Sclera
          ctx.fillStyle = 'white';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(ex, ey, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          // Pupil (big black dot looking at food)
          const angleToFood = Math.atan2(foodRef.current.y * CELL_SIZE + CELL_SIZE/2 - headPt.y, foodRef.current.x * CELL_SIZE + CELL_SIZE/2 - headPt.x) - angle;
          const px = ex + Math.cos(angleToFood) * (radius * 0.4);
          const py = ey + Math.sin(angleToFood) * (radius * 0.4);
          ctx.fillStyle = 'black';
          ctx.beginPath();
          ctx.arc(px, py, radius * 0.35, 0, Math.PI * 2);
          ctx.fill();
        };

        // Draw Far/Back Eye
        drawEye(0, -R, 6); 
        // Draw Near/Front Eye (larger and overlapping)
        drawEye(R - 2, -R, 7.5);

        ctx.restore();
      }

      // ── 5. PARTICLES (confetti circles) ────────────────────────────
      particlesRef.current = particlesRef.current
        .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy * 0.95 + 0.1, life: p.life - 0.025, vy: p.vy * 0.96 }))
        .filter(p => p.life > 0);
      particlesRef.current.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, 4 * p.life, 0, Math.PI * 2); ctx.fill();
        // Tiny star shape
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.5 * p.life, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
    };

    let animationFrameId;
    const renderLoop = (timestamp) => {
      if (isPaused) {
        animationFrameId = requestAnimationFrame(renderLoop);
        return;
      }
      draw(timestamp);
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameOver, mode, foodType, isGhost, isPaused]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center relative"
    >
      {/* ── HUD: bright Google-Snake style bar ── */}
      <div className="w-full mb-3 flex items-center justify-between px-1">
        <button onClick={onBack}
          className="flex items-center gap-1.5 bg-white/80 hover:bg-white border-2 border-gs-border
            text-gs-text font-bold text-sm px-4 py-2 rounded-2xl shadow-card transition-all hover:-translate-y-0.5"
        >
          <ArrowLeft className="w-4 h-4" /> Menu
        </button>

        {/* Score pills */}
        <div className="flex items-center gap-3">
          <div className="bg-white/80 border-2 border-gs-border rounded-2xl px-4 py-2 flex items-center gap-2 shadow-card">
            <span className="text-base">🍎</span>
            <span className="font-nunito font-black text-xl text-gs-text">{score}</span>
          </div>
          <div className="bg-white/80 border-2 border-gs-border rounded-2xl px-4 py-2 flex items-center gap-2 shadow-card">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="font-nunito font-black text-xl text-yellow-600">{highScore}</span>
          </div>
        </div>
        <button
          onClick={togglePause}
          className="bg-white/80 hover:bg-white border-2 border-gs-border rounded-2xl p-2.5 shadow-card transition-all hover:-translate-y-0.5"
        >
          {isPaused ? (
            <Play className="w-5 h-5 text-gs-green" />
          ) : (
            <Pause className="w-5 h-5 text-gs-text" />
          )}
        </button>

        <button onClick={setIsMuted}
          className="bg-white/80 hover:bg-white border-2 border-gs-border rounded-2xl p-2.5 shadow-card transition-all hover:-translate-y-0.5"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-gs-text-light" /> : <Volume2 className="w-5 h-5 text-gs-green" />}
        </button>
      </div>

      {/* Mode label */}
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-bold bg-white/60 border border-gs-border px-3 py-1 rounded-full text-gs-text-light uppercase tracking-wide">
          {mode === 'classic' ? '🐍 Cổ điển' : mode === 'borderless' ? '🌀 Xuyên biên giới' : '🧱 Tường gạch'}
        </span>
      </div>

      {/* Main Canvas */}
      <motion.div
        animate={isShaking ? { x: [-5, 5, -5, 5, 0], y: [-3, 3, -3, 3, 0] } : {}}
        transition={{ duration: 0.2 }}
        className="relative rounded-3xl overflow-hidden border-4 border-white shadow-card touch-none"
        style={{ boxShadow: '0 8px 32px rgba(76,175,80,0.25), 0 2px 8px rgba(0,0,0,0.10)' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="block cursor-none"
          style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, maxWidth: '90vmin', maxHeight: '90vmin' }}
        />

        {/* Pause Overlay */}
        {isPaused && !gameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="bg-white rounded-3xl border-4 border-gs-border px-10 py-6 shadow-2xl text-center"
              >
                <div className="text-5xl mb-3">⏸</div>

                <h2 className="font-nunito font-black text-4xl text-gs-text mb-2">
                  Tạm dừng
                </h2>

                <p className="text-gs-text-light font-bold">
                  Nhấn P hoặc ESC để tiếp tục
                </p>
              </motion.div>
            </motion.div>
          )}
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="block cursor-none"
          style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, maxWidth: '90vmin', maxHeight: '90vmin' }}

        {/* Countdown Overlay */}
          {isCountingDown && !gameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-40"
            >
              <motion.div
                key={countdown}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 10
                }}
                className="text-white font-black text-8xl drop-shadow-2xl"
              >
                {countdown > 0 ? countdown : 'GO!'}
              </motion.div>
            </motion.div>
          )}
        {/* Game Over overlay */}
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-5"
          >
            <motion.div
              initial={{ scale: 0.6, y: 20 }}
              animate={{ scale: 1,   y: 0 }}
              transition={{ type: 'spring', damping: 12 }}
              className="flex flex-col items-center"
            >
              <div className="text-6xl mb-3">😵</div>
              <h2 className="font-nunito font-black text-4xl text-gs-text mb-6">{t.gameOver}</h2>

              <div className="flex gap-8 mb-8">
                <div className="bg-gs-bg border-2 border-gs-border rounded-2xl px-6 py-4 text-center">
                  <p className="text-xs font-bold text-gs-text-light mb-1">ĐIỂM</p>
                  <p className="font-nunito font-black text-4xl text-gs-green">{score}</p>
                </div>
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl px-6 py-4 text-center">
                  <p className="text-xs font-bold text-yellow-600 mb-1">KỶ LỤC</p>
                  <p className="font-nunito font-black text-4xl text-yellow-600">{highScore}</p>
                </div>
              </div>

              <button onClick={resetGame}
                className="gs-btn flex items-center gap-3 px-10 py-4 text-lg">
                <RotateCcw className="w-5 h-5" />
                {t.tryAgain}
              </button>
              <p className="text-gs-text-light text-xs font-bold mt-4 animate-pulse">{t.pressSpace}</p>
            </motion.div>
          </motion.div>
        )}
      </motion.div>

      {/* Mobile D-Pad Controls */}
      <div className="md:hidden mt-6 grid grid-cols-3 gap-2 p-3 bg-white/40 backdrop-blur-md rounded-3xl border border-white/40 shadow-card">
        <div />
        <button 
          className="bg-white/90 active:bg-gs-border/20 p-4 rounded-xl shadow-sm flex items-center justify-center border-b-4 border-gs-border active:border-b-0 active:translate-y-1 transition-all touch-manipulation"
          onClick={(e) => { e.preventDefault(); handleDirectionInput({ x: 0, y: -1 }); }}
        >
          <ArrowUp className="w-8 h-8 text-gs-text" />
        </button>
        <div />
        
        <button 
          className="bg-white/90 active:bg-gs-border/20 p-4 rounded-xl shadow-sm flex items-center justify-center border-b-4 border-gs-border active:border-b-0 active:translate-y-1 transition-all touch-manipulation"
          onClick={(e) => { e.preventDefault(); handleDirectionInput({ x: -1, y: 0 }); }}
        >
          <ArrowLeft className="w-8 h-8 text-gs-text" />
        </button>
        <button 
          className="bg-white/90 active:bg-gs-border/20 p-4 rounded-xl shadow-sm flex items-center justify-center border-b-4 border-gs-border active:border-b-0 active:translate-y-1 transition-all touch-manipulation"
          onClick={(e) => { e.preventDefault(); handleDirectionInput({ x: 0, y: 1 }); }}
        >
          <ArrowDown className="w-8 h-8 text-gs-text" />
        </button>
        <button 
          className="bg-white/90 active:bg-gs-border/20 p-4 rounded-xl shadow-sm flex items-center justify-center border-b-4 border-gs-border active:border-b-0 active:translate-y-1 transition-all touch-manipulation"
          onClick={(e) => { e.preventDefault(); handleDirectionInput({ x: 1, y: 0 }); }}
        >
          <ArrowRight className="w-8 h-8 text-gs-text" />
        </button>
      </div>
    </motion.div>
  );
}

export default Game;
