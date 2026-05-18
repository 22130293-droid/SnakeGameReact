export const playEatSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch {
    console.warn("Audio not supported");
  }
};

export const playGameOverSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.4);

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    console.warn("Audio not supported");
  }
};
let bgm = null;

export const playBGM = () => {
  if (bgm && !bgm.paused) return;
  
  if (!bgm) {
    // Ưu tiên chạy file nội bộ bạn vừa copy vào
    bgm = new Audio('/assets/audio/bgm.mp3');
    bgm.loop = true;
    bgm.volume = 0.4;
    
    // Xử lý lỗi nếu bạn chưa kịp copy file vào thư mục
    bgm.onerror = () => {
      console.warn("Local bgm.mp3 not found. Falling back to online source...");
      bgm.src = 'https://ia800905.us.archive.org/21/items/PiratesOfTheCaribbeanThemeSong/Pirates%20of%20the%20Caribbean%20Theme%20Song.mp3';
      bgm.play();
    };
  }
  
  bgm.play().catch(e => console.log("Interaction needed to play music"));
};

export const stopBGM = () => {
  if (bgm) {
    bgm.pause();
    bgm.currentTime = 0;
  }
};

export const setBGMVolume = (vol) => {
  if (bgm) bgm.volume = vol;
};
