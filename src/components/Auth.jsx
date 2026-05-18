import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ChevronLeft } from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';

const GoogleIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const inputClass = `w-full bg-gs-bg border-2 border-gs-border rounded-2xl py-3.5 pl-11 pr-4
  font-nunito font-semibold text-gs-text outline-none transition-all
  focus:border-gs-green focus:bg-white placeholder:text-gs-text-light`;

const errMsg = (code) => {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Email hoặc mật khẩu không đúng.';
    case 'auth/email-already-in-use':  return 'Email đã được đăng ký.';
    case 'auth/invalid-email':         return 'Email không hợp lệ.';
    case 'auth/weak-password':         return 'Mật khẩu phải có ít nhất 6 ký tự.';
    case 'auth/too-many-requests':     return 'Quá nhiều lần thử. Vui lòng thử lại sau.';
    case 'auth/popup-closed-by-user':  return 'Đăng nhập Google bị hủy.';
    default:                           return 'Đã có lỗi xảy ra. Thử lại nhé!';
  }
};

const Auth = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    if (!email || !password) { setError('Vui lòng điền đầy đủ thông tin.'); setLoading(false); return; }
    try {
      if (isLogin) {
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', user.uid), { lastLogin: serverTimestamp() }, { merge: true });
        onLoginSuccess(user.displayName || email.split('@')[0], user);
      } else {
        if (!username || username.length < 3) { setError('Tên người chơi phải có ít nhất 3 ký tự.'); setLoading(false); return; }
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(user, { displayName: username });
        await setDoc(doc(db, 'users', user.uid), { username, email, createdAt: serverTimestamp(), lastLogin: serverTimestamp() });
        onLoginSuccess(username, user);
      }
    } catch (err) {
      setError(errMsg(err.code));
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setError(''); setLoading(true);
    try {
      const { user } = await signInWithPopup(auth, googleProvider);
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, { username: user.displayName || user.email.split('@')[0], email: user.email, photoURL: user.photoURL, provider: 'google', createdAt: serverTimestamp(), lastLogin: serverTimestamp() });
      } else {
        await setDoc(ref, { lastLogin: serverTimestamp() }, { merge: true });
      }
      onLoginSuccess(user.displayName || user.email.split('@')[0], user);
    } catch (err) {
      setError(errMsg(err.code));
    } finally { setLoading(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 16 }}
      className="z-10 w-full max-w-sm mx-4"
    >
      <div className="gs-card px-8 py-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-7">
          <div className="text-5xl mb-3 float-snake">🐍</div>
          <h1 className="font-nunito font-black text-3xl text-gs-text">Rắn Săn Mồi</h1>
          <p className="text-gs-text-light font-semibold text-sm mt-1">Đăng nhập để lưu điểm của bạn</p>
        </div>

        {/* Google sign-in — primary CTA */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gs-border
            hover:border-gs-green rounded-2xl py-3.5 font-nunito font-bold text-gs-text shadow-card
            transition-all duration-200 hover:-translate-y-0.5 hover:shadow-btn disabled:opacity-60 mb-5"
        >
          <GoogleIcon />
          <span>Đăng nhập với Google</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-gs-border" />
          <span className="text-gs-text-light text-xs font-bold">HOẶC</span>
          <div className="flex-1 h-px bg-gs-border" />
        </div>

        {/* Tab switcher */}
        <div className="flex bg-gs-bg rounded-2xl p-1 mb-5 border-2 border-gs-border">
          {[{ val: true, label: 'Đăng Nhập' }, { val: false, label: 'Đăng Ký' }].map(({ val, label }) => (
            <button key={String(val)}
              onClick={() => { setIsLogin(val); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl font-nunito font-bold text-sm transition-all ${
                isLogin === val
                  ? 'bg-gs-green text-white shadow-btn'
                  : 'text-gs-text-light hover:text-gs-text'
              }`}
            >{label}</button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <AnimatePresence>
            {!isLogin && (
              <motion.div key="uname"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="relative overflow-hidden"
              >
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gs-text-light" />
                <input type="text" placeholder="Tên người chơi" value={username}
                  onChange={e => setUsername(e.target.value)} maxLength={15}
                  className={inputClass} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gs-text-light" />
            <input type="email" placeholder="Email" value={email}
              onChange={e => setEmail(e.target.value)} className={inputClass} />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gs-text-light" />
            <input type="password" placeholder="Mật khẩu" value={password}
              onChange={e => setPassword(e.target.value)} className={inputClass} />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div key="err"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-red-50 border-2 border-red-200 rounded-2xl px-4 py-3 text-red-600 text-sm font-semibold text-center"
              >{error}</motion.div>
            )}
          </AnimatePresence>

          <button type="submit" disabled={loading}
            className="gs-btn w-full mt-1 py-4 text-base disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? '...' : isLogin ? 'Đăng Nhập →' : 'Tạo Tài Khoản →'}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default Auth;
