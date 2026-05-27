// Utilities cho LocalStorage
export const getUsers = () => {
  const users = localStorage.getItem('snake_users');
  return users ? JSON.parse(users) : [];
};

export const saveUser = (username, password) => {
  const users = getUsers();
  const existingUser = users.find(u => u.username === username);
  if (existingUser) {
    return { success: false, message: 'Username already exists' };
  }
  users.push({ username, password });
  localStorage.setItem('snake_users', JSON.stringify(users));
  return { success: true };
};

export const loginUser = (username, password) => {
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    localStorage.setItem('snake_currentUser', username);
    return { success: true };
  }
  return { success: false, message: 'Invalid username or password' };
};

export const getCurrentUser = () => {
  return localStorage.getItem('snake_currentUser');
};

export const logoutUser = () => {
  localStorage.removeItem('snake_currentUser');
};

export const getHighScores = () => {
  const scores = localStorage.getItem('snake_highScores');
  return scores ? JSON.parse(scores) : [];
};

export const saveHighScore = (username, score, mode) => {
  if (!username) return; // Nếu chưa đăng nhập thì không lưu hoặc lưu dưới tên Guest tuỳ logic
  
  const scores = getHighScores();
  const newScore = {
    username,
    score,
    mode,
    date: new Date().toISOString()
  };
  
  scores.push(newScore);
  // Sắp xếp giảm dần theo điểm
  scores.sort((a, b) => b.score - a.score);
  
  // Chỉ giữ lại top 50
  const topScores = scores.slice(0, 50);
  
  localStorage.setItem('snake_highScores', JSON.stringify(topScores));
};
