import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { playEatSound, playGameOverSound } from '../utils/audio';
import { saveHighScore } from '../utils/storage';

const GRID_SIZE = 20;
const CELL_SIZE = 20; // Internal canvas resolution cell size
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 }; // Moving up
const GAME_SPEED = 120; // ms per frame

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

function Game({ mode = 'classic', onBack, currentUser }) {
  const canvasRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [isShaking, setIsShaking] = useState(false);

  // Game state refs (to avoid dependency issues in loop)
  const snakeRef = useRef(INITIAL_SNAKE);
  const directionRef = useRef(INITIAL_DIRECTION);
  const dirQueueRef = useRef([]); // Buffer Command
  const foodRef = useRef(generateFood(INITIAL_SNAKE));
  const gameLoopRef = useRef(null);
  const lastRenderTimeRef = useRef(0);
  const speedRef = useRef(GAME_SPEED);

  const resetGame = useCallback(() => {
    snakeRef.current = INITIAL_SNAKE;
    directionRef.current = INITIAL_DIRECTION;
    dirQueueRef.current = [];
    setScore(0);
    scoreRef.current = 0;
    setGameOver(false);
    foodRef.current = generateFood(INITIAL_SNAKE);
    speedRef.current = GAME_SPEED;
  }, []);

  // Handle Input
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent default scrolling for arrow keys
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      if (gameOver && e.key === " ") {
        resetGame();
        return;
      }

      const key = e.key.toLowerCase();
      let newDir = null;

      if (key === 'arrowup' || key === 'w') newDir = { x: 0, y: -1 };
      if (key === 'arrowdown' || key === 's') newDir = { x: 0, y: 1 };
      if (key === 'arrowleft' || key === 'a') newDir = { x: -1, y: 0 };
      if (key === 'arrowright' || key === 'd') newDir = { x: 1, y: 0 };

      if (newDir) {
        // Determine what the current effectively planned direction is
        const currentPlannedDir = dirQueueRef.current.length > 0 
          ? dirQueueRef.current[dirQueueRef.current.length - 1] 
          : directionRef.current;
        
        // Prevent 180 degree turn
        const isOpposite = (newDir.x === -currentPlannedDir.x && newDir.x !== 0) || 
                           (newDir.y === -currentPlannedDir.y && newDir.y !== 0);
        
        if (!isOpposite && dirQueueRef.current.length < 3) {
          dirQueueRef.current.push(newDir);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, resetGame]);

  // Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const update = () => {
      if (gameOver) return;

      // Update Direction from Queue
      if (dirQueueRef.current.length > 0) {
        directionRef.current = dirQueueRef.current.shift();
      }

      const currentHead = snakeRef.current[0];
      let newHead = {
        x: currentHead.x + directionRef.current.x,
        y: currentHead.y + directionRef.current.y
      };

      // Collision with walls
      if (mode === 'survival') {
        if (newHead.x < 0) newHead.x = GRID_SIZE - 1;
        if (newHead.x >= GRID_SIZE) newHead.x = 0;
        if (newHead.y < 0) newHead.y = GRID_SIZE - 1;
        if (newHead.y >= GRID_SIZE) newHead.y = 0;
      } else {
        if (
          newHead.x < 0 || newHead.x >= GRID_SIZE ||
          newHead.y < 0 || newHead.y >= GRID_SIZE
        ) {
          playGameOverSound();
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 300);
          setGameOver(true);
          if (currentUser) saveHighScore(currentUser, scoreRef.current, mode);
          return;
        }
      }

      // Collision with self
      if (snakeRef.current.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        playGameOverSound();
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 300);
        setGameOver(true);
        if (currentUser) saveHighScore(currentUser, scoreRef.current, mode);
        return;
      }

      const newSnake = [newHead, ...snakeRef.current];

      // Check Food Collision
      if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
        setScore(s => {
          const newScore = s + 10;
          scoreRef.current = newScore;
          return newScore;
        });
        foodRef.current = generateFood(newSnake);
        playEatSound();
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 150);

        // Speed mode logic
        if (mode === 'speed' && speedRef.current > 50) {
          speedRef.current -= 4; // gradually increase speed
        }
      } else {
        newSnake.pop(); // remove tail if didn't eat
      }

      snakeRef.current = newSnake;
    };

    const draw = () => {
      // Clear canvas
      ctx.fillStyle = '#0b0c10'; // Dark bg
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Draw Grid (Optional, faint)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for(let i = 0; i <= CANVAS_SIZE; i += CELL_SIZE) {
        ctx.beginPath();
        ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i); ctx.lineTo(CANVAS_SIZE, i);
        ctx.stroke();
      }

      // Draw Food
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ff00ff';
      ctx.fillStyle = '#ff00ff';
      ctx.fillRect(
        foodRef.current.x * CELL_SIZE + 2, 
        foodRef.current.y * CELL_SIZE + 2, 
        CELL_SIZE - 4, CELL_SIZE - 4
      );

      // Draw Snake
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#39ff14';
      ctx.fillStyle = '#39ff14';
      
      snakeRef.current.forEach((segment, index) => {
        // Head slightly different color/brightness
        if (index === 0) {
          ctx.fillStyle = '#00f3ff';
          ctx.shadowColor = '#00f3ff';
        } else {
          ctx.fillStyle = '#39ff14';
          ctx.shadowColor = '#39ff14';
        }
        
        ctx.fillRect(
          segment.x * CELL_SIZE + 1, 
          segment.y * CELL_SIZE + 1, 
          CELL_SIZE - 2, CELL_SIZE - 2
        );
      });
      
      // Reset shadow
      ctx.shadowBlur = 0;
    };

    const loop = (timestamp) => {
      if (!lastRenderTimeRef.current) lastRenderTimeRef.current = timestamp;
      
      const deltaTime = timestamp - lastRenderTimeRef.current;
      
      if (deltaTime >= speedRef.current) {
        update();
        draw();
        lastRenderTimeRef.current = timestamp;
      }
      
      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameOver, currentUser, mode]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center glass-panel p-6 sm:p-8 relative"
    >
      <button 
        onClick={onBack}
        className="absolute top-4 left-4 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
        title="Back to Menu"
      >
        <ArrowLeft size={24} />
      </button>

      <div className="flex justify-between w-full max-w-[400px] mb-4 px-2 items-end">
        <div>
          <div className="text-white/50 text-xs mb-1 uppercase">{mode} MODE</div>
          <div className="text-neon-cyan font-press-start text-sm">SCORE</div>
        </div>
        <div className="text-white font-press-start text-xl text-glow-cyan">{score.toString().padStart(4, '0')}</div>
      </div>

      <motion.div 
        animate={isShaking ? { x: [-4, 4, -4, 4, 0], y: [-2, 2, -2, 2, 0] } : {}}
        transition={{ duration: 0.15 }}
        className="relative border-2 border-white/10 rounded-lg overflow-hidden shadow-[0_0_30px_rgba(57,255,20,0.15)] bg-black"
      >
        <canvas 
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="block max-w-full h-auto bg-dark-bg w-[400px] h-[400px]"
        />

        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm">
            <h2 className="text-3xl font-press-start text-neon-pink mb-4 text-glow-pink animate-pulse">
              GAME OVER
            </h2>
            <p className="text-white font-fira-code mb-8">Score: {score}</p>
            <button 
              onClick={resetGame}
              className="btn-neon border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10"
            >
              TRY AGAIN
            </button>
            <p className="text-gray-500 text-xs mt-4 font-fira-code">Press Space to restart</p>
          </div>
        )}
      </motion.div>

      {/* Mobile controls placeholder for later phases or testing */}
      <div className="mt-8 grid grid-cols-3 gap-2 sm:hidden opacity-50">
        <div />
        <button className="bg-white/10 p-4 rounded-lg" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowUp'}))}>↑</button>
        <div />
        <button className="bg-white/10 p-4 rounded-lg" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowLeft'}))}>←</button>
        <button className="bg-white/10 p-4 rounded-lg" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown'}))}>↓</button>
        <button className="bg-white/10 p-4 rounded-lg" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight'}))}>→</button>
      </div>
    </motion.div>
  );
}

export default Game;
